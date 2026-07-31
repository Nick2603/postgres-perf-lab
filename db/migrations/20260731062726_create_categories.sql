-- migrate:up
CREATE TABLE categories (
  id         uuid PRIMARY KEY DEFAULT uuidv7(),
  parent_id  uuid REFERENCES categories (id) ON DELETE RESTRICT,
  name       text NOT NULL,
  slug       text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- migrate:down
DROP TABLE categories;
