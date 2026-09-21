-- Monthly spending leaderboard
CREATE OR REPLACE VIEW leaderboard_spending_monthly AS
SELECT
  o.owner_id AS user_id,
  p.username,
  SUM(o.total_price) AS total_spent,
  DATE_TRUNC('month', o.created_at) AS month,
  v.region,
  v.country,
  v.city
FROM outings o
JOIN profiles p ON o.owner_id = p.id
JOIN venues v ON o.venue_id = v.id
WHERE o.is_private = false
GROUP BY o.owner_id, p.username, DATE_TRUNC('month', o.created_at), v.region, v.country, v.city
ORDER BY total_spent DESC;

-- Yearly spending leaderboard
CREATE OR REPLACE VIEW leaderboard_spending_yearly AS
SELECT
  o.owner_id AS user_id,
  p.username,
  SUM(o.total_price) AS total_spent,
  DATE_TRUNC('year', o.created_at) AS year,
  v.region,
  v.country,
  v.city
FROM outings o
JOIN profiles p ON o.owner_id = p.id
JOIN venues v ON o.venue_id = v.id
WHERE o.is_private = false
GROUP BY o.owner_id, p.username, DATE_TRUNC('year', o.created_at), v.region, v.country, v.city
ORDER BY total_spent DESC;

-- Biggest outing leaderboard
CREATE OR REPLACE VIEW leaderboard_biggest_outing AS
SELECT
  o.id AS outing_id,
  o.owner_id AS user_id,
  p.username,
  o.total_price,
  o.currency,
  v.name AS venue_name,
  v.region,
  v.country,
  v.city,
  o.created_at
FROM outings o
JOIN profiles p ON o.owner_id = p.id
JOIN venues v ON o.venue_id = v.id
WHERE o.is_private = false
ORDER BY o.total_price DESC;

-- Rarity score leaderboard
CREATE OR REPLACE VIEW leaderboard_rarity_score AS
SELECT
  c.user_id,
  p.username,
  COUNT(*) FILTER (WHERE b.rarity_tier = 'rare') AS rare_count,
  COUNT(*) FILTER (WHERE b.rarity_tier = 'epique') AS epic_count,
  COUNT(*) FILTER (WHERE b.rarity_tier = 'legendaire') AS legendary_count,
  (COUNT(*) FILTER (WHERE b.rarity_tier = 'rare') * 10 +
   COUNT(*) FILTER (WHERE b.rarity_tier = 'epique') * 50 +
   COUNT(*) FILTER (WHERE b.rarity_tier = 'legendaire') * 100) AS rarity_score
FROM cards c
JOIN profiles p ON c.user_id = p.id
JOIN bottles b ON c.bottle_id = b.id
GROUP BY c.user_id, p.username
ORDER BY rarity_score DESC;
