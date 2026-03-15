/**
 * Supabase Storage Bucket Setup for Salon Galleries
 *
 * This module provides utilities for setting up and managing the salon-galleries storage bucket.
 *
 * Bucket Configuration:
 * - Name: 'salon-galleries'
 * - Public: true (public read access for gallery display)
 * - File size limit: 5MB per file
 * - Allowed MIME types: image/jpeg, image/png, image/webp
 * - File path structure: {salon_id}/{uuid}-{original_filename}
 *
 * Storage Policies:
 * - Public: Anyone can view/download images (for public salon pages)
 * - Authenticated: Salon owners can upload to their own folder
 * - Authenticated: Salon owners can delete from their own folder
 *
 * To set up the bucket, run this function once in your Supabase SQL editor or setup script:
 *
 * INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
 * VALUES (
 *   'salon-galleries',
 *   'salon-galleries',
 *   true,
 *   5242880, -- 5MB in bytes
 *   ARRAY['image/jpeg', 'image/png', 'image/webp']
 * )
 * ON CONFLICT (id) DO NOTHING;
 *
 * Storage Policies (create in Supabase SQL editor):
 *
 * -- Policy 1: Public read access
 * CREATE POLICY "Public can view salon gallery images"
 * ON storage.objects FOR SELECT
 * USING (bucket_id = 'salon-galleries');
 *
 * -- Policy 2: Salon owners can upload to their folder
 * CREATE POLICY "Salon owners can upload photos"
 * ON storage.objects FOR INSERT
 * WITH CHECK (
 *   bucket_id = 'salon-galleries' AND
 *   auth.uid() IN (
 *     SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
 *   )
 * );
 *
 * -- Policy 3: Salon owners can delete from their folder
 * CREATE POLICY "Salon owners can delete photos"
 * ON storage.objects FOR DELETE
 * USING (
 *   bucket_id = 'salon-galleries' AND
 *   auth.uid() IN (
 *     SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
 *   )
 * );
 *
 * -- Policy 4: Salon owners can update their photos
 * CREATE POLICY "Salon owners can update photos"
 * ON storage.objects FOR UPDATE
 * USING (
 *   bucket_id = 'salon-galleries' AND
 *   auth.uid() IN (
 *     SELECT user_id FROM salons WHERE id::text = (storage.foldername(name))[1]
 *   )
 * );
 */

export const STORAGE_BUCKET = 'salon-galleries';
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates if a file meets the storage requirements
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Dosya boyutu çok büyük. Maksimum ${MAX_FILE_SIZE / 1024 / 1024}MB olmalıdır.`
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'Sadece JPG, PNG ve WebP formatları desteklenmektedir.'
    };
  }

  return { valid: true };
}

/**
 * Generates a unique storage path for a salon photo
 */
export function generateStoragePath(salonId: string, fileName: string): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 9);
  const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${salonId}/${timestamp}-${randomId}-${cleanFileName}`;
}

