-- migrate:up
CREATE TABLE orders (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  customer_id     uuid REFERENCES customers (id) ON DELETE SET NULL,
  status          text NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  total_amount    numeric(12,2) NOT NULL CHECK (total_amount >= 0),
  courier_id      uuid,
  delivery_window tstzrange,
  placed_at       timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE order_items (
  order_id   uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
  quantity   integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (order_id, product_id)
);

-- migrate:down
DROP TABLE order_items;
DROP TABLE orders;
