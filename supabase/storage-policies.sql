-- =============================================================
-- Storage Bucket Policies
-- =============================================================
-- Run this in Supabase Dashboard → SQL Editor
-- Uses DROP IF EXISTS before each CREATE to be idempotent.
-- =============================================================

-- -------------------------------------------------------------
-- object-images bucket
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can upload object images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their object images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their object images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read object images" ON storage.objects;

CREATE POLICY "Authenticated users can upload object images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'object-images');

CREATE POLICY "Authenticated users can update their object images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'object-images' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their object images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'object-images' AND auth.uid() = owner);

CREATE POLICY "Public can read object images"
ON storage.objects FOR SELECT
USING (bucket_id = 'object-images');


-- -------------------------------------------------------------
-- museum-assets bucket
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can upload museum assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their museum assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their museum assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read museum assets" ON storage.objects;

CREATE POLICY "Authenticated users can upload museum assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'museum-assets');

CREATE POLICY "Authenticated users can update their museum assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'museum-assets' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their museum assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'museum-assets' AND auth.uid() = owner);

CREATE POLICY "Public can read museum assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'museum-assets');


-- -------------------------------------------------------------
-- object-documents bucket
-- -------------------------------------------------------------

DROP POLICY IF EXISTS "Authenticated users can upload object documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their object documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their object documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read object documents" ON storage.objects;

CREATE POLICY "Authenticated users can upload object documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'object-documents');

CREATE POLICY "Authenticated users can update their object documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'object-documents' AND auth.uid() = owner);

CREATE POLICY "Authenticated users can delete their object documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'object-documents' AND auth.uid() = owner);

CREATE POLICY "Public can read object documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'object-documents');
