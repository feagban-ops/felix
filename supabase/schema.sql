-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE region_zone AS ENUM ('france', 'europe', 'asie', 'ameriques', 'autre');
CREATE TYPE rarity_tier AS ENUM ('commune', 'rare', 'epique', 'legendaire');
CREATE TYPE price_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  age_verified BOOLEAN DEFAULT false,
  is_private BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Venues table
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  region region_zone NOT NULL DEFAULT 'autre',
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Bottles table
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  format TEXT,
  rarity_tier rarity_tier NOT NULL DEFAULT 'commune',
  base_xp INTEGER DEFAULT 10,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Venue bottle prices table
CREATE TABLE venue_bottle_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status price_status DEFAULT 'pending',
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(venue_id, bottle_id)
);

-- Outings table
CREATE TABLE outings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  photo_url TEXT,
  total_price DECIMAL(10, 2) DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Outing bottles table
CREATE TABLE outing_bottles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2),
  UNIQUE(outing_id, bottle_id)
);

-- Outing participants table
CREATE TABLE outing_participants (
  outing_id UUID NOT NULL REFERENCES outings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (outing_id, user_id)
);

-- Friendships table
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status friendship_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, friend_id)
);

-- Cards table
CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  first_obtained_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, bottle_id)
);

-- Purchases table (individual purchase history)
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bottle_id UUID NOT NULL REFERENCES bottles(id) ON DELETE CASCADE,
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  outing_id UUID REFERENCES outings(id) ON DELETE CASCADE,
  price_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  plan TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes
CREATE INDEX idx_outings_owner_id ON outings(owner_id);
CREATE INDEX idx_outings_created_at ON outings(created_at);
CREATE INDEX idx_outings_venue_id ON outings(venue_id);
CREATE INDEX idx_cards_user_id ON cards(user_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_purchased_at ON purchases(purchased_at);
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_venue_bottle_prices_venue_id ON venue_bottle_prices(venue_id);
CREATE INDEX idx_venue_bottle_prices_status ON venue_bottle_prices(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN 1 + FLOOR(SQRT(xp::FLOAT / 100));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to update level when XP changes
CREATE OR REPLACE FUNCTION update_profile_level()
RETURNS TRIGGER AS $$
BEGIN
  NEW.level = calculate_level(NEW.xp);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_level
  BEFORE UPDATE OF xp ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_level();
