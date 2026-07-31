-- Idempotent: safe to rerun any time to regenerate fresh data.
BEGIN;

TRUNCATE outbox, order_items, orders, inventory, products, customers, categories
  RESTART IDENTITY CASCADE;

-- ============================================================
-- categories (~30 rows, small hand-authored hierarchy)
-- ============================================================
INSERT INTO categories (id, name, slug) VALUES
  (uuidv7(), 'Electronics', 'electronics'),
  (uuidv7(), 'Home & Garden', 'home-garden'),
  (uuidv7(), 'Apparel', 'apparel'),
  (uuidv7(), 'Sports & Outdoors', 'sports-outdoors'),
  (uuidv7(), 'Toys & Games', 'toys-games');

INSERT INTO categories (id, parent_id, name, slug)
SELECT uuidv7(), c.id, child.name, child.slug
FROM categories c
JOIN LATERAL (
  VALUES
    ('electronics', 'Phones', 'phones'),
    ('electronics', 'Laptops', 'laptops'),
    ('electronics', 'Audio', 'audio'),
    ('home-garden', 'Furniture', 'furniture'),
    ('home-garden', 'Kitchen', 'kitchen'),
    ('apparel', 'Men''s', 'mens'),
    ('apparel', 'Women''s', 'womens'),
    ('sports-outdoors', 'Camping', 'camping'),
    ('sports-outdoors', 'Fitness', 'fitness'),
    ('toys-games', 'Board Games', 'board-games')
) AS child(parent_slug, name, slug) ON child.parent_slug = c.slug
WHERE c.parent_id IS NULL;

-- ============================================================
-- products (5,000 rows; ~5% uncategorised on purpose -- NULL category_id)
-- ============================================================
WITH category_ids AS (SELECT array_agg(id) AS ids FROM categories)
INSERT INTO products (id, category_id, sku, name, price, attributes, discontinued_at, created_at)
SELECT
  uuidv7(),
  CASE WHEN random() < 0.05 THEN NULL
    ELSE ci.ids[1 + floor(random() * array_length(ci.ids, 1))::int]
  END,
  'SKU-' || lpad(n::text, 6, '0'),
  'Product ' || n,
  round((5 + random() * 495)::numeric, 2),
  jsonb_build_object(
    'color', (ARRAY['black','white','red','blue','green'])[1 + floor(random() * 5)::int],
    'weight_g', 50 + floor(random() * 5000)::int
  ),
  CASE WHEN random() < 0.03 THEN now() - (random() * interval '2 years') ELSE NULL END,
  now() - (random() * interval '3 years')
FROM generate_series(1, 5000) AS n
CROSS JOIN category_ids ci;

-- ============================================================
-- inventory (~2-4 warehouses per product, ~70% of the full cross-product)
-- ============================================================
INSERT INTO inventory (product_id, warehouse, quantity, updated_at)
SELECT p.id, w.warehouse, floor(random() * 500)::int, now() - (random() * interval '30 days')
FROM products p
CROSS JOIN (VALUES ('east'), ('west'), ('central'), ('north'), ('south')) AS w(warehouse)
WHERE random() < 0.7;

-- ============================================================
-- customers (50,000 rows; created_at spread over ~3 years)
-- ============================================================
INSERT INTO customers (id, email, full_name, country_code, created_at, deleted_at)
SELECT
  uuidv7(),
  'customer' || n || '@example.com',
  (ARRAY['Alex','Jamie','Sam','Taylor','Jordan','Morgan','Casey','Riley'])[1 + floor(random() * 8)::int]
    || ' ' ||
    (ARRAY['Smith','Johnson','Brown','Garcia','Miller','Davis','Wilson','Moore'])[1 + floor(random() * 8)::int],
  (ARRAY['US','GB','DE','FR','UA','PL','CA','AU'])[1 + floor(random() * 8)::int],
  now() - (random() * interval '3 years'),
  CASE WHEN random() < 0.02 THEN now() - (random() * interval '1 year') ELSE NULL END
FROM generate_series(1, 50000) AS n;

-- ============================================================
-- orders (500,000 rows)
-- Skew: 5% guest (NULL customer), 75% land on a "hot" pool of 500 repeat
-- customers, 20% spread across everyone else -- a small number of customers
-- with thousands of orders, most with one or two.
-- placed_at skewed toward recent dates via random()^2.
-- ============================================================
WITH hot_customers AS (
  SELECT array_agg(id) AS ids FROM (
    SELECT id FROM customers ORDER BY random() LIMIT 500
  ) hot
),
all_customers AS (
  SELECT array_agg(id) AS ids FROM customers
),
generated AS (
  SELECT
    n,
    random() AS bucket_roll,
    (random() * random()) AS recency_roll,  -- squared: biases toward 0 (recent)
    random() AS status_roll
  FROM generate_series(1, 500000) AS n
)
INSERT INTO orders (id, customer_id, status, total_amount, courier_id, delivery_window, placed_at, updated_at)
SELECT
  uuidv7(),
  CASE
    WHEN g.bucket_roll < 0.05 THEN NULL
    WHEN g.bucket_roll < 0.80 THEN hc.ids[1 + floor(random() * array_length(hc.ids, 1))::int]
    ELSE ac.ids[1 + floor(random() * array_length(ac.ids, 1))::int]
  END,
  CASE
    WHEN g.status_roll < 0.05 THEN 'pending'
    WHEN g.status_roll < 0.15 THEN 'paid'
    WHEN g.status_roll < 0.25 THEN 'shipped'
    WHEN g.status_roll < 0.90 THEN 'delivered'
    ELSE 'cancelled'
  END,
  0, -- filled in below once order_items exist
  CASE WHEN g.status_roll >= 0.15 THEN uuidv7() ELSE NULL END,
  CASE WHEN g.status_roll >= 0.15
    THEN tstzrange(
      now() - (g.recency_roll * interval '3 years') + interval '2 hours',
      now() - (g.recency_roll * interval '3 years') + interval '4 hours'
    )
    ELSE NULL
  END,
  now() - (g.recency_roll * interval '3 years'),
  now() - (g.recency_roll * interval '3 years')
FROM generated g
CROSS JOIN hot_customers hc
CROSS JOIN all_customers ac;

-- ============================================================
-- order_items (~1.25M rows; 1-5 items per order, skewed toward 1-2)
-- ============================================================
WITH product_ids AS (SELECT array_agg(id) AS ids FROM products),
order_item_counts AS (
  SELECT id AS order_id, (1 + floor(random() * random() * 4))::int AS item_count
  FROM orders
)
INSERT INTO order_items (order_id, product_id, quantity, unit_price)
SELECT oic.order_id, chosen.product_id, chosen.quantity, pr.price
FROM order_item_counts oic
CROSS JOIN product_ids pi
CROSS JOIN LATERAL generate_series(1, oic.item_count) AS g(n)
CROSS JOIN LATERAL (
  SELECT
    pi.ids[1 + floor(random() * array_length(pi.ids, 1))::int] AS product_id,
    (1 + floor(random() * 3))::int AS quantity
  WHERE g.n IS NOT NULL  -- forces per-row re-evaluation; see note above
) AS chosen
JOIN products pr ON pr.id = chosen.product_id
ON CONFLICT (order_id, product_id) DO NOTHING;

-- Backfill total_amount from the items just inserted (single hash join, not
-- a per-row correlated subquery).
UPDATE orders o
SET total_amount = t.total
FROM (
  SELECT order_id, sum(quantity * unit_price) AS total
  FROM order_items
  GROUP BY order_id
) t
WHERE o.id = t.order_id;

-- ============================================================
-- outbox (100,000 rows; ~30% still pending, for SKIP LOCKED exercises)
-- ============================================================
WITH order_ids AS (SELECT array_agg(id) AS ids FROM orders)
INSERT INTO outbox (id, aggregate_type, aggregate_id, event_type, payload, status, available_at, processed_at)
SELECT
  uuidv7(),
  'order',
  oi.ids[1 + floor(random() * array_length(oi.ids, 1))::int],
  (ARRAY['order.created','order.paid','order.shipped','payment.failed'])[1 + floor(random() * 4)::int],
  jsonb_build_object('source', 'seed'),
  CASE WHEN random() < 0.3 THEN 'pending' ELSE 'done' END,
  now() - (random() * interval '7 days'),
  CASE WHEN random() < 0.3 THEN NULL ELSE now() - (random() * interval '6 days') END
FROM generate_series(1, 100000) AS n
CROSS JOIN order_ids oi;

COMMIT;
