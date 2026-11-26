export const schema = `
CREATE TABLE IF NOT EXISTS locations (
  id serial PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60)
);
CREATE UNIQUE INDEX IF NOT EXISTS locations_name_ci ON locations (lower(name));

CREATE TABLE IF NOT EXISTS categories (
  id serial PRIMARY KEY,
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 60)
);
CREATE UNIQUE INDEX IF NOT EXISTS categories_name_ci ON categories (lower(name));

CREATE TABLE IF NOT EXISTS books (
  id serial PRIMARY KEY,
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  author text CHECK (author IS NULL OR length(author) BETWEEN 1 AND 120),
  location_id integer NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  copies integer NOT NULL DEFAULT 1 CHECK (copies >= 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_categories (
  book_id integer NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (book_id, category_id)
);

CREATE TABLE IF NOT EXISTS loans (
  id serial PRIMARY KEY,
  book_id integer NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  borrower_name text NOT NULL CHECK (length(borrower_name) BETWEEN 1 AND 80),
  borrowed_at timestamptz NOT NULL DEFAULT now(),
  returned_at timestamptz
);
CREATE INDEX IF NOT EXISTS loans_open ON loans (book_id) WHERE returned_at IS NULL;

CREATE TABLE IF NOT EXISTS encargadas (
  email text PRIMARY KEY,
  added_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`
