ALTER TABLE charts ADD COLUMN IF NOT EXISTS parent_chart_id UUID REFERENCES charts(id) ON DELETE SET NULL;
CREATE INDEX idx_charts_parent_chart_id ON charts(parent_chart_id);
