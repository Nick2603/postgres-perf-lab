-- migrate:up
CREATE TABLE products (
  id              uuid PRIMARY KEY DEFAULT uuidv7(),
  category_id     uuid REFERENCES categories (id) ON DELETE SET NULL,
  sku             text NOT NULL UNIQUE,
  name            text NOT NULL,
  description     text,
  price           numeric(12,2) NOT NULL CHECK (price >= 0),
  attributes      jsonb NOT NULL DEFAULT '{}'::jsonb,
  discontinued_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE inventory (
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  warehouse  text NOT NULL,
  quantity   integer NOT NULL CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, warehouse)
);

-- migrate:down
DROP TABLE inventory;
DROP TABLE products;
