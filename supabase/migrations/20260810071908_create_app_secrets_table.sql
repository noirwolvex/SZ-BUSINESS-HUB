/*
# Create app_secrets table for storing third-party API keys

1. New Tables
- `app_secrets`
  - `key` (text, primary key) — the secret name (e.g. "GEMINI_API_KEY")
  - `value` (text, not null) — the secret value
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on `app_secrets`.
- No policies are created — the table is locked to all roles by default.
- Only the service role (which bypasses RLS) can read secrets.
- The edge function uses the service role key to read secrets.
*/

CREATE TABLE IF NOT EXISTS app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_secrets ENABLE ROW LEVEL SECURITY;
