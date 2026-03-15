-- Gallery System Migration
-- Creates salon_photos table with RLS policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create salon_photos table
CREATE TABLE IF NOT EXISTS salon_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  display_order INTEGER DEFAULT 0,
  caption TEXT,
  is_featured BOOLEAN DEFAULT false,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX idx_salon_photos_salon ON salon_photos(salon_id, display_order);
CREATE INDEX idx_salon_photos_featured ON salon_photos(salon_id, is_featured) WHERE is_featured = true;

-- Enable Row Level Security
ALTER TABLE salon_photos ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can view photos (public read)
CREATE POLICY "Public can view salon photos"
  ON salon_photos
  FOR SELECT
  USING (true);

-- RLS Policy: Salon owners can insert their own photos
CREATE POLICY "Salon owners can insert photos"
  ON salon_photos
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM salons WHERE id = salon_id
    )
  );

-- RLS Policy: Salon owners can update their own photos
CREATE POLICY "Salon owners can update photos"
  ON salon_photos
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM salons WHERE id = salon_id
    )
  );

-- RLS Policy: Salon owners can delete their own photos
CREATE POLICY "Salon owners can delete photos"
  ON salon_photos
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id FROM salons WHERE id = salon_id
    )
  );

-- Add subscription plan limits (if subscription table exists)
-- This will be checked in the application layer
COMMENT ON TABLE salon_photos IS 'Stores photo gallery for salons. BASIC plan: 5 photos max, PREMIUM plan: 20 photos max';
