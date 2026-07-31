-- migrate:up
CREATE TABLE customers (
  id           uuid PRIMARY KEY DEFAULT uuidv7(),
  email        text NOT NULL,
  full_name    text NOT NULL,
  country_code char(2) NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- migrate:down
DROP TABLE customers;
