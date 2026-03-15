-- ============================================================================
-- COMPLETE MIGRATION FOR BEYPAZARI RANDEVU SAAS
-- All migrations in one file for easy execution
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- MIGRATION 1: SUBSCRIPTION SYSTEM
-- ============================================================================

-- 1. SUBSCRIPTION PLANS TABLE
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  features JSONB DEFAULT '[]'::JSONB,
  max_appointments INTEGER DEFAULT -1,
  max_services INTEGER DEFAULT -1,
  sms_credits INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'trialing',
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id)
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_salon_id ON subscriptions(salon_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 3. PAYMENT TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'bank_transfer',
  reference_number TEXT,
  proof_url TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- 4. SMS USAGE TRACKING TABLE
CREATE TABLE IF NOT EXISTS sms_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  salon_id UUID NOT NULL REFERENCES salons(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  sms_sent INTEGER DEFAULT 0,
  sms_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_sms_usage_salon_month ON sms_usage(salon_id, month_year);

-- 5. INSERT DEFAULT SUBSCRIPTION PLANS
INSERT INTO subscription_plans (name, slug, price_monthly, features, max_appointments, max_services, sms_credits, sort_order)
VALUES
  (
    'Temel Paket',
    'basic',
    800.00,
    '["Online randevu sistemi", "Musteri yonetimi", "SMS hatirlatma (100 SMS/ay)", "Temel raporlama", "E-posta destegi"]'::JSONB,
    -1,
    10,
    100,
    1
  ),
  (
    'Premium Paket',
    'premium',
    1500.00,
    '["Tum Temel Paket ozellikleri", "Sinirsiz hizmet ekleme", "500 SMS/ay", "Gelismis raporlama", "Kampanya yonetimi", "WhatsApp entegrasyonu", "Oncelikli destek"]'::JSONB,
    -1,
    -1,
    500,
    2
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- MIGRATION 2: SMS SYSTEM ENHANCEMENTS
-- ============================================================================

-- Update sms_logs table
ALTER TABLE sms_logs
ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sms_logs_status_created ON sms_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_delivery_status ON sms_logs(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_salon_id ON sms_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_message_id ON sms_logs(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::JSONB,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(name);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);

-- Insert SMS templates
INSERT INTO sms_templates (name, content, variables, description) VALUES
  (
    'APPOINTMENT_REMINDER',
    '{salonName} randevu hatirlatma: {date} tarihinde saat {time} icin {service} randevunuz bulunmaktadir.',
    '["salonName", "date", "time", "service"]'::JSONB,
    'Appointment reminder sent 1 day before'
  ),
  (
    'EMPTY_SLOT_CAMPAIGN',
    '{salonName}: Bugun {slots} saatleri bos! Hemen randevu alin.',
    '["salonName", "slots"]'::JSONB,
    'Campaign message for empty appointment slots'
  ),
  (
    'INACTIVE_CUSTOMER',
    '{customerName}, sizi {salonName} da ozledik! Indirimli randevu icin hemen arayin.',
    '["customerName", "salonName"]'::JSONB,
    'Re-engagement message for inactive customers'
  ),
  (
    'APPOINTMENT_CONFIRMED',
    '{salonName} randevunuz onaylandi. {date} tarihinde saat {time} icin gorusmek uzere.',
    '["salonName", "date", "time"]'::JSONB,
    'Appointment confirmation message'
  ),
  (
    'APPOINTMENT_CANCELLED',
    '{salonName} randevunuz iptal edildi. Bilginize.',
    '["salonName"]'::JSONB,
    'Appointment cancellation notification'
  ),
  (
    'BIRTHDAY_GREETING',
    '{customerName}, dogum gununuz kutlu olsun! {salonName} olarak size ozel %{discount} indirim sunuyoruz.',
    '["customerName", "salonName", "discount"]'::JSONB,
    'Birthday greeting with discount offer'
  ),
  (
    'PAYMENT_REMINDER',
    '{salonName}: Sayin {customerName}, abonelik odemeniz icin son gun. Lutfen odeme yapiniz.',
    '["customerName", "salonName", "amount"]'::JSONB,
    'Payment reminder for subscription'
  ),
  (
    'THANK_YOU',
    '{salonName} ziyaretiniz icin tesekkurler! Gorusslerinizi bizimle paylasin.',
    '["salonName"]'::JSONB,
    'Thank you message after appointment'
  )
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- MIGRATION 3: PHOTO GALLERY SYSTEM
-- ============================================================================

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

CREATE INDEX IF NOT EXISTS idx_salon_photos_salon ON salon_photos(salon_id, display_order);
CREATE INDEX IF NOT EXISTS idx_salon_photos_featured ON salon_photos(salon_id, is_featured) WHERE is_featured = true;

-- ============================================================================
-- MIGRATION 4: REVIEW SYSTEM
-- ============================================================================

-- Update appointments table
ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'confirmed',
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS has_review BOOLEAN DEFAULT false;

-- Create reviews table
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_salon ON reviews(salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment ON reviews(appointment_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_review_per_appointment ON reviews(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reviews_published ON reviews(salon_id, is_published, created_at DESC);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Increment SMS count
CREATE OR REPLACE FUNCTION increment_sms_count(p_salon_id UUID, p_count INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  v_month_year TEXT;
  v_current_count INTEGER;
  v_current_limit INTEGER;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');

  INSERT INTO sms_usage (salon_id, month_year, sms_sent, sms_limit)
  SELECT p_salon_id, v_month_year, 0, COALESCE(sp.sms_credits, 1000)
  FROM subscriptions s
  LEFT JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.salon_id = p_salon_id AND s.status IN ('trialing', 'active')
  ON CONFLICT (salon_id, month_year) DO NOTHING;

  SELECT sms_sent, sms_limit INTO v_current_count, v_current_limit
  FROM sms_usage WHERE salon_id = p_salon_id AND month_year = v_month_year;

  IF v_current_count + p_count > v_current_limit THEN
    RETURN FALSE;
  END IF;

  UPDATE sms_usage SET sms_sent = sms_sent + p_count, updated_at = NOW()
  WHERE salon_id = p_salon_id AND month_year = v_month_year;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function: Check subscription active
CREATE OR REPLACE FUNCTION check_subscription_active(p_salon_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_trial_ends TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT status, trial_ends_at, current_period_end INTO v_status, v_trial_ends, v_period_end
  FROM subscriptions WHERE salon_id = p_salon_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_status = 'trialing' AND v_trial_ends > NOW() THEN RETURN TRUE; END IF;
  IF v_status = 'active' AND v_period_end > NOW() THEN RETURN TRUE; END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function: Get subscription limits
CREATE OR REPLACE FUNCTION get_subscription_limits(p_salon_id UUID)
RETURNS TABLE(max_appointments INTEGER, max_services INTEGER, sms_credits INTEGER, sms_used INTEGER, sms_remaining INTEGER) AS $$
DECLARE v_month_year TEXT;
BEGIN
  v_month_year := TO_CHAR(NOW(), 'YYYY-MM');
  RETURN QUERY
  SELECT sp.max_appointments, sp.max_services, sp.sms_credits,
         COALESCE(su.sms_sent, 0) as sms_used,
         GREATEST(0, sp.sms_credits - COALESCE(su.sms_sent, 0)) as sms_remaining
  FROM subscriptions s
  JOIN subscription_plans sp ON sp.id = s.plan_id
  LEFT JOIN sms_usage su ON su.salon_id = s.salon_id AND su.month_year = v_month_year
  WHERE s.salon_id = p_salon_id AND s.status IN ('trialing', 'active')
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Check service limit
CREATE OR REPLACE FUNCTION check_service_limit(p_salon_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_services INTEGER;
  v_current_count INTEGER;
BEGIN
  SELECT sp.max_services INTO v_max_services
  FROM subscriptions s JOIN subscription_plans sp ON sp.id = s.plan_id
  WHERE s.salon_id = p_salon_id AND s.status IN ('trialing', 'active');

  IF NOT FOUND OR v_max_services = -1 THEN RETURN TRUE; END IF;

  SELECT COUNT(*) INTO v_current_count FROM services WHERE salon_id = p_salon_id;

  RETURN v_current_count < v_max_services;
END;
$$ LANGUAGE plpgsql;

-- Function: Update subscription statuses
CREATE OR REPLACE FUNCTION update_subscription_statuses()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions SET status = 'expired', updated_at = NOW()
  WHERE status = 'trialing' AND trial_ends_at < NOW();

  UPDATE subscriptions SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND current_period_end < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function: Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_transactions_updated_at BEFORE UPDATE ON payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_usage_updated_at BEFORE UPDATE ON sms_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_templates_updated_at BEFORE UPDATE ON sms_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE salon_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Subscription Plans policies
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage subscription plans" ON subscription_plans FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions policies
CREATE POLICY "Salons can view their own subscription" ON subscriptions FOR SELECT
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all subscriptions" ON subscriptions FOR ALL USING (auth.role() = 'service_role');

-- Payment Transactions policies
CREATE POLICY "Salons can view their own payments" ON payment_transactions FOR SELECT
  USING (subscription_id IN (SELECT s.id FROM subscriptions s JOIN salons sa ON sa.id = s.salon_id WHERE sa.user_id = auth.uid()));
CREATE POLICY "Salons can create payments" ON payment_transactions FOR INSERT
  WITH CHECK (subscription_id IN (SELECT s.id FROM subscriptions s JOIN salons sa ON sa.id = s.salon_id WHERE sa.user_id = auth.uid()));
CREATE POLICY "Service role can manage all payments" ON payment_transactions FOR ALL USING (auth.role() = 'service_role');

-- SMS Usage policies
CREATE POLICY "Salons can view their SMS usage" ON sms_usage FOR SELECT
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage SMS usage" ON sms_usage FOR ALL USING (auth.role() = 'service_role');

-- SMS Templates policies
CREATE POLICY "Anyone can view active templates" ON sms_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage templates" ON sms_templates FOR ALL USING (auth.role() = 'service_role');

-- Salon Photos policies
CREATE POLICY "Anyone can view salon photos" ON salon_photos FOR SELECT USING (true);
CREATE POLICY "Salons can manage their photos" ON salon_photos FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all photos" ON salon_photos FOR ALL USING (auth.role() = 'service_role');

-- Reviews policies
CREATE POLICY "Anyone can view published reviews" ON reviews FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can create reviews" ON reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Salons can manage their reviews" ON reviews FOR ALL
  USING (salon_id IN (SELECT id FROM salons WHERE user_id = auth.uid()));
CREATE POLICY "Service role can manage all reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- All tables, functions, triggers, and policies have been created successfully
-- ============================================================================
