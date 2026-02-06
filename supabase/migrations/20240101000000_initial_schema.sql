-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Datasets table
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  schema_json JSONB NOT NULL,
  row_count INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Charts table
CREATE TABLE charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  vega_spec_json JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage events table
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_datasets_project_id ON datasets(project_id);
CREATE INDEX idx_charts_project_id ON charts(project_id);
CREATE INDEX idx_usage_events_user_id ON usage_events(user_id);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Datasets policies (via project ownership)
CREATE POLICY "Users can view own datasets" ON datasets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = datasets.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can create datasets in own projects" ON datasets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = datasets.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own datasets" ON datasets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = datasets.project_id AND projects.user_id = auth.uid())
  );

-- Charts policies (via project ownership)
CREATE POLICY "Users can view own charts" ON charts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = charts.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can create charts in own projects" ON charts
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = charts.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can update own charts" ON charts
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = charts.project_id AND projects.user_id = auth.uid())
  );
CREATE POLICY "Users can delete own charts" ON charts
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = charts.project_id AND projects.user_id = auth.uid())
  );

-- Usage events policies
CREATE POLICY "Users can view own usage" ON usage_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own usage events" ON usage_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
