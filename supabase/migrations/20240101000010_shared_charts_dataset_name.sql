-- Store the dataset filename at share time for display on the share page
ALTER TABLE shared_charts ADD COLUMN dataset_name TEXT;
