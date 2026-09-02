/*
# Create file_records table (single-tenant, no auth)

1. New Tables
- `file_records`
  - `id` (uuid, primary key)
  - `file_name` (text, not null) — name of the processed file
  - `tool_slug` (text, not null) — which tool was used (e.g. 'compress-pdf')
  - `tool_name` (text, not null) — display name of the tool
  - `status` (text, not null, default 'completed') — 'completed' | 'failed'
  - `file_size` (bigint, not null, default 0) — original file size in bytes
  - `output_size` (bigint, default 0) — output file size in bytes
  - `output_name` (text) — output file name
  - `metadata` (jsonb, default '{}') — extra info: pageCount, savedPercent, etc.
  - `is_favorite` (boolean, not null, default false) — user-starred records
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `file_records`.
- Allow anon + authenticated CRUD — single-tenant app, no sign-in, data is intentionally public/shared.

3. Indexes
- Index on `created_at` (descending) for history page sorting.
- Index on `is_favorite` for favorites filtering.
*/
CREATE TABLE IF NOT EXISTS file_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  tool_slug text NOT NULL,
  tool_name text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  file_size bigint NOT NULL DEFAULT 0,
  output_size bigint DEFAULT 0,
  output_name text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE file_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_file_records" ON file_records;
CREATE POLICY "anon_select_file_records" ON file_records FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_file_records" ON file_records;
CREATE POLICY "anon_insert_file_records" ON file_records FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_file_records" ON file_records;
CREATE POLICY "anon_update_file_records" ON file_records FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_file_records" ON file_records;
CREATE POLICY "anon_delete_file_records" ON file_records FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_file_records_created_at ON file_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_records_is_favorite ON file_records (is_favorite) WHERE is_favorite = true;
