-- Allow owners to update their own share links (needed for og_image_url backfill after image upload)
CREATE POLICY "Users can update own share links" ON shared_charts
  FOR UPDATE USING (auth.uid() = created_by);
