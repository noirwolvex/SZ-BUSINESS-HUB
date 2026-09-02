/*
# Add user_id to file_records and switch to owner-scoped RLS

## Summary
The app is transitioning from a single-tenant (no-auth) model to a multi-user model
with sign-in. This migration adds a `user_id` column to `file_records` so each user
only sees their own processed files, and replaces the open anon-accessible policies
with owner-scoped policies for authenticated users.

## Changes

### 1. New column
- `file_records.user_id` (uuid, references `auth.users(id)`, ON DELETE CASCADE)
  - Nullable during transition (existing rows have no owner), but new inserts from
    authenticated users will get `auth.uid()` via the DEFAULT clause.
  - DEFAULT `auth.uid()` so client inserts that omit `user_id` still satisfy RLS.

### 2. Index
- Index on `user_id` for per-user file listing queries.

### 3. RLS policy changes
- Drop all existing anon-accessible policies (select/insert/update/delete).
- Create new owner-scoped policies scoped to `TO authenticated` using `auth.uid() = user_id`.
- This means:
  - Each user can only SELECT, INSERT, UPDATE, DELETE their own file_records.
  - Anonymous (not-signed-in) users can no longer read or write any file_records.

### Important notes
1. Existing rows with NULL `user_id` will become invisible to all users after this
   migration. This is acceptable — the app was single-tenant before and those rows
   were shared/test data.
2. The frontend must build the sign-in/sign-up flow in the same task, otherwise
   the anon-key client has `auth.uid() = null` and every write will fail RLS.
*/

-- Add user_id column with DEFAULT auth.uid()
ALTER TABLE file_records
  ADD COLUMN IF NOT EXISTS user_id uuid
  DEFAULT auth.uid()
  REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for per-user queries
CREATE INDEX IF NOT EXISTS idx_file_records_user_id
  ON file_records (user_id);

-- Drop old anon-accessible policies
DROP POLICY IF EXISTS "anon_select_file_records" ON file_records;
DROP POLICY IF EXISTS "anon_insert_file_records" ON file_records;
DROP POLICY IF EXISTS "anon_update_file_records" ON file_records;
DROP POLICY IF EXISTS "anon_delete_file_records" ON file_records;

-- Create new owner-scoped policies (authenticated only)
DROP POLICY IF EXISTS "select_own_file_records" ON file_records;
CREATE POLICY "select_own_file_records" ON file_records FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_file_records" ON file_records;
CREATE POLICY "insert_own_file_records" ON file_records FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_file_records" ON file_records;
CREATE POLICY "update_own_file_records" ON file_records FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_file_records" ON file_records;
CREATE POLICY "delete_own_file_records" ON file_records FOR DELETE
  TO authenticated USING (auth.uid() = user_id);