-- Create datasets bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('datasets', 'datasets', false);

-- Storage policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
