/**
 * Subscription Limit Checking Functions
 * These functions check if a salon has reached their subscription limits
 */

import { createClient as createServerClient } from '@/lib/supabase/server';

export interface SubscriptionLimits {
  maxAppointments: number;
  maxServices: number;
  smsCredits: number;
  smsUsed: number;
  smsRemaining: number;
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

/**
 * Get subscription limits for a salon
 */
export async function getSubscriptionLimits(
  salonId: string
): Promise<SubscriptionLimits | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('get_subscription_limits', {
    p_salon_id: salonId,
  });

  if (error || !data || data.length === 0) {
    return null;
  }

  return {
    maxAppointments: data[0].max_appointments,
    maxServices: data[0].max_services,
    smsCredits: data[0].sms_credits,
    smsUsed: data[0].sms_used,
    smsRemaining: data[0].sms_remaining,
  };
}

/**
 * Check if salon can create more appointments
 * Note: Currently appointments are unlimited in both plans
 */
export async function checkAppointmentLimit(
  salonId: string
): Promise<LimitCheckResult> {
  const supabase = await createServerClient();

  // Get subscription limits
  const limits = await getSubscriptionLimits(salonId);

  if (!limits) {
    return {
      allowed: false,
      reason: 'Aktif abonelik bulunamadı',
    };
  }

  // If unlimited (-1), always allow
  if (limits.maxAppointments === -1) {
    return {
      allowed: true,
    };
  }

  // Count current month's appointments
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .gte('created_at', startOfMonth.toISOString());

  if (error) {
    return {
      allowed: false,
      reason: 'Randevu sayısı kontrol edilemedi',
    };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.maxAppointments) {
    return {
      allowed: false,
      reason: 'Aylık randevu limitinize ulaştınız',
      current: currentCount,
      limit: limits.maxAppointments,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxAppointments,
  };
}

/**
 * Check if salon can send SMS
 */
export async function checkSMSQuota(
  salonId: string,
  count: number = 1
): Promise<LimitCheckResult> {
  const limits = await getSubscriptionLimits(salonId);

  if (!limits) {
    return {
      allowed: false,
      reason: 'Aktif abonelik bulunamadı',
    };
  }

  if (limits.smsRemaining < count) {
    return {
      allowed: false,
      reason: 'SMS kotanız yetersiz',
      current: limits.smsUsed,
      limit: limits.smsCredits,
    };
  }

  return {
    allowed: true,
    current: limits.smsUsed,
    limit: limits.smsCredits,
  };
}

/**
 * Check if salon can add more services
 */
export async function checkServiceLimit(salonId: string): Promise<LimitCheckResult> {
  const supabase = await createServerClient();

  // Get subscription limits
  const limits = await getSubscriptionLimits(salonId);

  if (!limits) {
    return {
      allowed: false,
      reason: 'Aktif abonelik bulunamadı',
    };
  }

  // If unlimited (-1), always allow
  if (limits.maxServices === -1) {
    return {
      allowed: true,
    };
  }

  // Count current services
  const { count, error } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId);

  if (error) {
    return {
      allowed: false,
      reason: 'Hizmet sayısı kontrol edilemedi',
    };
  }

  const currentCount = count || 0;

  if (currentCount >= limits.maxServices) {
    return {
      allowed: false,
      reason: 'Hizmet ekleme limitinize ulaştınız',
      current: currentCount,
      limit: limits.maxServices,
    };
  }

  return {
    allowed: true,
    current: currentCount,
    limit: limits.maxServices,
  };
}

/**
 * Check if subscription is active
 */
export async function checkSubscriptionActive(salonId: string): Promise<boolean> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('check_subscription_active', {
    p_salon_id: salonId,
  });

  if (error || !data) {
    return false;
  }

  return data;
}

/**
 * Increment SMS usage count
 */
export async function incrementSMSCount(
  salonId: string,
  count: number = 1
): Promise<boolean> {
  const supabase = await createServerClient();

  const { data, error } = await supabase.rpc('increment_sms_count', {
    p_salon_id: salonId,
    p_count: count,
  });

  if (error || !data) {
    return false;
  }

  return data;
}
