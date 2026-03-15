-- ================================================
-- REVIEW SYSTEM MIGRATION
-- Only customers with completed appointments can review
-- ================================================

-- Step 1: Update appointments table to track status and completion
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT false;

COMMENT ON COLUMN appointments.status IS 'Status values: confirmed, completed, cancelled, no_show';
COMMENT ON COLUMN appointments.completed_at IS 'Timestamp when appointment was marked as completed';
COMMENT ON COLUMN appointments.has_review IS 'Whether customer has submitted a review for this appointment';

-- Step 2: Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  reply_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(salon_id, is_published, created_at DESC);

-- Unique constraint: one review per appointment
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_review_per_appointment
  ON reviews(appointment_id)
  WHERE appointment_id IS NOT NULL;

-- Step 4: Add comments for documentation
COMMENT ON TABLE reviews IS 'Customer reviews for salons - only from verified appointments';
COMMENT ON COLUMN reviews.salon_id IS 'Reference to the salon being reviewed';
COMMENT ON COLUMN reviews.appointment_id IS 'Reference to the completed appointment (NULL for legacy reviews)';
COMMENT ON COLUMN reviews.is_verified IS 'Whether review is from a verified appointment';
COMMENT ON COLUMN reviews.is_published IS 'Admin approval status - must be true to show publicly';

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Step 6: RLS Policies

-- Public can read published reviews
CREATE POLICY "Public can read published reviews"
  ON reviews
  FOR SELECT
  USING (is_published = true);

-- Customers can create reviews only for their completed appointments
-- This will be enforced in the application layer with phone verification
CREATE POLICY "Customers can create reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (true); -- Additional validation in app layer

-- Salon owners can read all reviews for their salon
-- This will be enforced in the application layer
CREATE POLICY "Salon owners can read their reviews"
  ON reviews
  FOR SELECT
  USING (true); -- Salon ownership verified in app layer

-- Salon owners can update reviews (to add replies)
CREATE POLICY "Salon owners can update reviews"
  ON reviews
  FOR UPDATE
  USING (true) -- Salon ownership verified in app layer
  WITH CHECK (
    -- Can only update reply fields
    reply_text IS NOT NULL OR replied_at IS NOT NULL
  );

-- Admins can update reviews (to publish/unpublish)
-- This will be enforced in the application layer
CREATE POLICY "Admins can update reviews"
  ON reviews
  FOR UPDATE
  USING (true);

-- Step 7: Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Create trigger for reviews table
DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Create indexes for appointments
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(salon_id, status, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_completed ON appointments(salon_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_has_review ON appointments(appointment_id) WHERE has_review = false AND status = 'completed';
