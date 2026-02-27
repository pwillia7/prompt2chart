-- Store the full ancestor prompt chain at share time for display on the share page
-- Array of {prompt, chart_library} from oldest ancestor to current chart
ALTER TABLE shared_charts ADD COLUMN prompt_history JSONB;
