-- Function to create a purchase atomically with server-side price calculation
-- SECURITY DEFINER ensures it runs with elevated privileges to bypass RLS
-- Verifies that p_user_id matches auth.uid() to prevent privilege escalation
-- Includes database-level rate limiting to prevent direct API bypass
CREATE OR REPLACE FUNCTION create_purchase_atomically(
  p_user_id UUID,
  p_bottle_id UUID,
  p_venue_id UUID,
  p_outing_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_user_id UUID;
  v_price DECIMAL(10, 2);
  v_currency TEXT;
  v_base_xp INTEGER;
  v_rarity_tier rarity_tier;
  v_xp_gain INTEGER;
  v_new_xp INTEGER;
  v_existing_card_id UUID;
  v_new_quantity INTEGER;
  v_result JSONB;
  v_purchase_count INTEGER;
BEGIN
  -- Get the current user ID from auth context
  v_current_user_id := auth.uid();

  -- Verify that the requested user_id matches the authenticated user
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  IF v_current_user_id != p_user_id THEN
    RAISE EXCEPTION 'User ID mismatch - cannot create purchase for another user';
  END IF;

  -- Database-level rate limiting: check purchases in the last hour
  SELECT count(*) INTO v_purchase_count
  FROM purchases
  WHERE user_id = v_current_user_id
    AND created_at > NOW() - INTERVAL '1 hour';

  IF v_purchase_count >= 20 THEN
    RAISE EXCEPTION 'Trop d''achats, réessaie plus tard';
  END IF;

  -- Get the approved price from venue_bottle_prices (never from client input)
  SELECT price, currency INTO v_price, v_currency
  FROM venue_bottle_prices
  WHERE venue_id = p_venue_id
    AND bottle_id = p_bottle_id
    AND status = 'approved'
  LIMIT 1;

  IF v_price IS NULL THEN
    RAISE EXCEPTION 'No approved price found for this bottle and venue';
  END IF;

  -- Get bottle details for XP calculation
  SELECT base_xp, rarity_tier INTO v_base_xp, v_rarity_tier
  FROM bottles
  WHERE id = p_bottle_id;

  IF v_base_xp IS NULL THEN
    RAISE EXCEPTION 'Bottle not found';
  END IF;

  -- Calculate XP gain based on rarity
  v_xp_gain := v_base_xp * CASE v_rarity_tier
    WHEN 'commune' THEN 1
    WHEN 'rare' THEN 2
    WHEN 'epique' THEN 3
    WHEN 'legendaire' THEN 5
    ELSE 1
  END;

  -- Create the purchase record
  INSERT INTO purchases (user_id, bottle_id, venue_id, outing_id, price_paid, currency)
  VALUES (p_user_id, p_bottle_id, p_venue_id, p_outing_id, v_price, v_currency)
  RETURNING id INTO v_result;

  -- Check if card already exists
  SELECT id, quantity INTO v_existing_card_id, v_new_quantity
  FROM cards
  WHERE user_id = p_user_id AND bottle_id = p_bottle_id;

  IF v_existing_card_id IS NOT NULL THEN
    -- Update existing card
    UPDATE cards
    SET quantity = quantity + 1
    WHERE id = v_existing_card_id;
  ELSE
    -- Create new card
    INSERT INTO cards (user_id, bottle_id, quantity)
    VALUES (p_user_id, p_bottle_id, 1);
    v_new_quantity := 1;
  END IF;

  -- Update user XP
  UPDATE profiles
  SET xp = xp + v_xp_gain
  WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'purchase_id', v_result,
    'price_paid', v_price,
    'currency', v_currency,
    'xp_gain', v_xp_gain,
    'new_xp', v_new_xp,
    'new_card_quantity', v_new_quantity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_purchase_atomically(UUID, UUID, UUID, UUID) TO authenticated;
