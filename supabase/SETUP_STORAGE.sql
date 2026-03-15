-- =====================================================
-- Supabase Storage Setup for Salon Photo Galleries
-- =====================================================
-- This file contains all SQL commands needed to set up
-- the storage bucket and policies for the photo gallery system.
--
-- Run these commands in Supabase SQL Editor after running
-- the 003_gallery_system.sql migration.
-- =====================================================

-- 1. Create storage bucket for salon galleries
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-galleries',
  'salon-galleries',
  true,                                                      -- Public read access
  5242880,                                                   -- 5MB max file size
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- Allowed types
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policy: Public SELECT (anyone can view photos)
CREATE POLICY "Public can view salon gallery images"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-galleries');

-- 3. Storage Policy: Authenticated INSERT (salon owners can upload)
CREATE POLICY "Salon owners can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'salon-galleries' AND
  auth.uid() IN (
    SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 4. Storage Policy: Authenticated DELETE (salon owners can delete)
CREATE POLICY "Salon owners can delete photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'salon-galleries' AND
  auth.uid() IN (
    SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
  )
);

-- 5. Storage Policy: Authenticated UPDATE (salon owners can update)
CREATE POLICY "Salon owners can update photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'salon-galleries' AND
  auth.uid() IN (
    SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
  )
);

-- =====================================================
-- Verification Queries
-- =====================================================
-- Run these to verify setup was successful:

-- Check if bucket was created
SELECT * FROM storage.buckets WHERE id = 'salon-galleries';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%salon%';

-- =====================================================
-- NOTES:
-- =====================================================
-- - Photos are stored in folder structure: {salon_id}/{timestamp}-{random}-{filename}
-- - Maximum file size: 5MB
-- - Allowed types: JPEG, JPG, PNG, WebP
-- - Public URL format: https://{project}.supabase.co/storage/v1/object/public/salon-galleries/{path}
-- - Each salon can only access their own folder
-- - RLS policies ensure salons can only manage their own photos
-- =====================================================
