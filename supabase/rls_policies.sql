-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_bottle_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE outings ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone if public or self"
  ON profiles FOR SELECT
  USING (is_private = false OR id = auth.uid());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Venues policies
CREATE POLICY "Venues are viewable by everyone"
  ON venues FOR SELECT
  USING (true);

CREATE POLICY "Only admins can create venues"
  ON venues FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can update any venue"
  ON venues FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Bottles policies
CREATE POLICY "Bottles are viewable by everyone"
  ON bottles FOR SELECT
  USING (true);

CREATE POLICY "Only service role can insert bottles"
  ON bottles FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update bottles"
  ON bottles FOR UPDATE
  USING (false);

-- Venue bottle prices policies
CREATE POLICY "Approved prices are viewable by everyone"
  ON venue_bottle_prices FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Users can view their own price submissions"
  ON venue_bottle_prices FOR SELECT
  USING (submitted_by = auth.uid());

CREATE POLICY "Authenticated users can submit prices"
  ON venue_bottle_prices FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND submitted_by = auth.uid());

CREATE POLICY "Only service role can update price status"
  ON venue_bottle_prices FOR UPDATE
  USING (false);

-- Outings policies
CREATE POLICY "Outings are viewable by owner, participants, or if public"
  ON outings FOR SELECT
  USING (
    owner_id = auth.uid()
    OR is_private = false
    OR EXISTS (
      SELECT 1 FROM outing_participants
      WHERE outing_id = outings.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create outings"
  ON outings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

CREATE POLICY "Outing owners can update their outings"
  ON outings FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Outing owners can delete their outings"
  ON outings FOR DELETE
  USING (owner_id = auth.uid());

-- Outing bottles policies
CREATE POLICY "Outing bottles follow outing visibility"
  ON outing_bottles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outings
      WHERE outings.id = outing_bottles.outing_id
      AND (
        owner_id = auth.uid()
        OR is_private = false
        OR EXISTS (
          SELECT 1 FROM outing_participants
          WHERE outing_id = outings.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Outing owners can manage outing bottles"
  ON outing_bottles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM outings
      WHERE outings.id = outing_bottles.outing_id AND owner_id = auth.uid()
    )
  );

-- Outing participants policies
CREATE POLICY "Outing participants follow outing visibility"
  ON outing_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM outings
      WHERE outings.id = outing_participants.outing_id
      AND (
        owner_id = auth.uid()
        OR is_private = false
        OR EXISTS (
          SELECT 1 FROM outing_participants op
          WHERE op.outing_id = outings.id AND op.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Outing owners can add participants"
  ON outing_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM outings
      WHERE outings.id = outing_participants.outing_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Outing owners can remove participants"
  ON outing_participants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM outings
      WHERE outings.id = outing_participants.outing_id AND owner_id = auth.uid()
    )
  );

-- Friendships policies
CREATE POLICY "Friendships are viewable by both parties"
  ON friendships FOR SELECT
  USING (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can create friendship requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "Users can update friendships they're involved in"
  ON friendships FOR UPDATE
  USING (user_id = auth.uid() OR friend_id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR friend_id = auth.uid());

CREATE POLICY "Users can delete friendships they're involved in"
  ON friendships FOR DELETE
  USING (user_id = auth.uid() OR friend_id = auth.uid());

-- Cards policies
CREATE POLICY "Cards are viewable by owner and friends"
  ON cards FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() AND friend_id = cards.user_id AND status = 'accepted')
      OR (friend_id = auth.uid() AND user_id = cards.user_id AND status = 'accepted')
    )
  );

CREATE POLICY "Only service role can insert cards"
  ON cards FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update cards"
  ON cards FOR UPDATE
  USING (false);

-- Purchases policies
CREATE POLICY "Purchases are viewable only by owner"
  ON purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only service role can insert purchases"
  ON purchases FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update purchases"
  ON purchases FOR UPDATE
  USING (false);

CREATE POLICY "Only service role can delete purchases"
  ON purchases FOR DELETE
  USING (false);

-- Subscriptions policies
CREATE POLICY "Subscriptions are viewable only by owner"
  ON subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Only service role can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service role can update subscriptions"
  ON subscriptions FOR UPDATE
  USING (false);
