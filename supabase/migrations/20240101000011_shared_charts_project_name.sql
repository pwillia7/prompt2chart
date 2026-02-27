-- Rename dataset_name → project_name (000010 was applied with wrong column name)
ALTER TABLE shared_charts ADD COLUMN IF NOT EXISTS project_name TEXT;
ALTER TABLE shared_charts DROP COLUMN IF EXISTS dataset_name;
