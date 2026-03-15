-- SMS System Migration
-- This migration enhances the SMS infrastructure with delivery tracking, retry logic, and templates

-- Update sms_logs table with enhanced tracking fields
ALTER TABLE sms_logs
ADD COLUMN IF NOT EXISTS provider_message_id TEXT,
ADD COLUMN IF NOT EXISTS attempts INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'undelivered')),
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS salon_id UUID REFERENCES salons(id);

-- Add index for performance on sms_logs
CREATE INDEX IF NOT EXISTS idx_sms_logs_status_created ON sms_logs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_delivery_status ON sms_logs(delivery_status, created_at);
CREATE INDEX IF NOT EXISTS idx_sms_logs_salon_id ON sms_logs(salon_id);
CREATE INDEX IF NOT EXISTS idx_sms_logs_provider_message_id ON sms_logs(provider_message_id) WHERE provider_message_id IS NOT NULL;

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on sms_templates
CREATE INDEX IF NOT EXISTS idx_sms_templates_name ON sms_templates(name);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);

-- Create or update sms_usage table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS sms_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL, -- Format: YYYY-MM
  sms_sent INTEGER DEFAULT 0,
  sms_limit INTEGER DEFAULT 1000, -- Default monthly limit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(salon_id, month_year)
);

-- Create index for performance on sms_usage
CREATE INDEX IF NOT EXISTS idx_sms_usage_salon_month ON sms_usage(salon_id, month_year);

-- Insert default SMS templates
INSERT INTO sms_templates (name, content, variables, description) VALUES
  (
    'APPOINTMENT_REMINDER',
    '{salonName} randevu hatirlatma: {date} tarihinde saat {time} icin {service} randevunuz bulunmaktadir.',
    '["salonName", "date", "time", "service"]'::jsonb,
    'Appointment reminder sent 1 day before'
  ),
  (
    'EMPTY_SLOT_CAMPAIGN',
    '{salonName}: Bugun {slots} saatleri bos! Hemen randevu alin.',
    '["salonName", "slots"]'::jsonb,
    'Campaign message for empty appointment slots'
  ),
  (
    'INACTIVE_CUSTOMER',
    '{customerName}, sizi {salonName} da ozledik! Indirimli randevu icin hemen arayin.',
    '["customerName", "salonName"]'::jsonb,
    'Re-engagement message for inactive customers'
  ),
  (
    'APPOINTMENT_CONFIRMED',
    '{salonName} randevunuz onaylandi. {date} tarihinde saat {time} icin gorusmek uzere.',
    '["salonName", "date", "time"]'::jsonb,
    'Appointment confirmation message'
  ),
  (
    'APPOINTMENT_CANCELLED',
    '{salonName} randevunuz iptal edildi. Bilginize.',
    '["salonName"]'::jsonb,
    'Appointment cancellation notification'
  )
ON CONFLICT (name) DO NOTHING;

-- Function to increment SMS usage atomically
CREATE OR REPLACE FUNCTION increment_sms_usage(
  p_salon_id UUID,
  p_month_year TEXT
) RETURNS void AS $$
BEGIN
  INSERT INTO sms_usage (salon_id, month_year, sms_sent)
  VALUES (p_salon_id, p_month_year, 1)
  ON CONFLICT (salon_id, month_year)
  DO UPDATE SET
    sms_sent = sms_usage.sms_sent + 1,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to check SMS quota
CREATE OR REPLACE FUNCTION check_sms_quota(
  p_salon_id UUID,
  p_month_year TEXT
) RETURNS TABLE (
  allowed BOOLEAN,
  remaining INTEGER,
  limit_value INTEGER
) AS $$
DECLARE
  v_sms_sent INTEGER := 0;
  v_sms_limit INTEGER := 1000;
BEGIN
  SELECT
    COALESCE(sms_sent, 0),
    COALESCE(sms_limit, 1000)
  INTO v_sms_sent, v_sms_limit
  FROM sms_usage
  WHERE salon_id = p_salon_id AND month_year = p_month_year;

  -- If no record exists, assume 0 sent
  IF NOT FOUND THEN
    v_sms_sent := 0;
    v_sms_limit := 1000;
  END IF;

  RETURN QUERY SELECT
    (v_sms_sent < v_sms_limit) AS allowed,
    GREATEST(0, v_sms_limit - v_sms_sent) AS remaining,
    v_sms_limit AS limit_value;
END;
$$ LANGUAGE plpgsql;

-- Function to reset monthly quota (to be called via cron)
CREATE OR REPLACE FUNCTION reset_monthly_quota(p_salon_id UUID)
RETURNS void AS $$
DECLARE
  current_month TEXT;
BEGIN
  current_month := to_char(now(), 'YYYY-MM');

  INSERT INTO sms_usage (salon_id, month_year, sms_sent)
  VALUES (p_salon_id, current_month, 0)
  ON CONFLICT (salon_id, month_year)
  DO UPDATE SET
    sms_sent = 0,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger for sms_templates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sms_templates_updated_at
  BEFORE UPDATE ON sms_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sms_usage_updated_at
  BEFORE UPDATE ON sms_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE sms_logs IS 'Comprehensive SMS delivery logs with retry and delivery tracking';
COMMENT ON TABLE sms_templates IS 'Reusable SMS message templates with variable substitution';
COMMENT ON TABLE sms_usage IS 'Monthly SMS usage tracking and quota management per salon';
COMMENT ON FUNCTION increment_sms_usage IS 'Atomically increment SMS usage counter for a salon';
COMMENT ON FUNCTION check_sms_quota IS 'Check if salon has remaining SMS quota for current month';
COMMENT ON FUNCTION reset_monthly_quota IS 'Reset SMS quota for a salon (monthly cron job)';
