-- Shared charts table (public snapshots for share links)
CREATE TABLE shared_charts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chart_id       UUID REFERENCES charts(id) ON DELETE CASCADE,
  created_by     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt         TEXT NOT NULL,
  chart_library  TEXT NOT NULL,
  d3_code        TEXT,
  vega_spec_json JSONB,
  explanation    TEXT,
  data_snapshot  JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shared_charts_created_by ON shared_charts(created_by);
CREATE INDEX idx_shared_charts_chart_id ON shared_charts(chart_id);

ALTER TABLE shared_charts ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can view a shared chart by ID
CREATE POLICY "Public can view shared charts" ON shared_charts
  FOR SELECT USING (true);

-- Authenticated users can create share links for their own charts
CREATE POLICY "Users can create own share links" ON shared_charts
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Authenticated users can delete their own share links
CREATE POLICY "Users can delete own share links" ON shared_charts
  FOR DELETE USING (auth.uid() = created_by);
