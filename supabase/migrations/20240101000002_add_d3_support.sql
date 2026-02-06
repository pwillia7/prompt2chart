-- Add D3 support to charts table
ALTER TABLE charts ADD COLUMN IF NOT EXISTS chart_library TEXT DEFAULT 'vega-lite';
ALTER TABLE charts ADD COLUMN IF NOT EXISTS d3_code TEXT;

-- Make vega_spec_json nullable (since D3 charts won't have it)
ALTER TABLE charts ALTER COLUMN vega_spec_json DROP NOT NULL;

-- Add check constraint
ALTER TABLE charts ADD CONSTRAINT valid_chart_data CHECK (
  (chart_library = 'vega-lite' AND vega_spec_json IS NOT NULL) OR
  (chart_library = 'd3' AND d3_code IS NOT NULL)
);
