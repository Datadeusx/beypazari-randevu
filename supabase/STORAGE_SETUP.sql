-- ============================================================================
-- SUPABASE STORAGE SETUP FOR SALON GALLERIES
-- ============================================================================

-- Create storage bucket for salon photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'salon-galleries',
  'salon-galleries',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Policy: Anyone can view photos (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'salon-galleries');

-- Policy: Authenticated users can upload to their salon folder
CREATE POLICY "Salon owners can upload photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'salon-galleries'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE user_id = auth.uid()
  )
);

-- Policy: Salon owners can update their photos
CREATE POLICY "Salon owners can update their photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'salon-galleries'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE user_id = auth.uid()
  )
);

-- Policy: Salon owners can delete their photos
CREATE POLICY "Salon owners can delete their photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'salon-galleries'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM salons WHERE user_id = auth.uid()
  )
);

-- Policy: Service role has full access
CREATE POLICY "Service role has full access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'salon-galleries'
  AND auth.role() = 'service_role'
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the bucket was created:
-- SELECT * FROM storage.buckets WHERE id = 'salon-galleries';
-- ============================================================================
