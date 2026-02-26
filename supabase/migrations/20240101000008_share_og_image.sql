-- Public bucket for share OG images
INSERT INTO storage.buckets (id, name, public) VALUES ('share-images', 'share-images', true);

CREATE POLICY "Anyone can view share images" ON storage.objects
  FOR SELECT USING (bucket_id = 'share-images');

CREATE POLICY "Authenticated users can upload share images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'share-images' AND auth.uid() IS NOT NULL);

-- OG image URL stored at share creation time
ALTER TABLE shared_charts ADD COLUMN og_image_url TEXT;
