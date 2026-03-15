/**
 * SMS Quota Management System
 * Handles monthly SMS limits and usage tracking per salon
 */

import { createClient } from "@/lib/supabase/server";

export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  used: number;
  monthYear: string;
}

/**
 * Get current month-year string in YYYY-MM format
 */
function getCurrentMonthYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Check if salon has remaining SMS quota for current month
 */
export async function checkSMSQuota(salonId: string): Promise<QuotaCheckResult> {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  try {
    // Use the database function for atomic check
    const { data, error } = await supabase
      .rpc('check_sms_quota', {
        p_salon_id: salonId,
        p_month_year: monthYear,
      });

    if (error) {
      console.error('Error checking SMS quota:', error);
      // Default to not allowed on error
      return {
        allowed: false,
        remaining: 0,
        limit: 0,
        used: 0,
        monthYear,
      };
    }

    const result = Array.isArray(data) ? data[0] : data;

    return {
      allowed: result.allowed || false,
      remaining: result.remaining || 0,
      limit: result.limit_value || 0,
      used: (result.limit_value || 0) - (result.remaining || 0),
      monthYear,
    };
  } catch (err) {
    console.error('Exception checking SMS quota:', err);
    return {
      allowed: false,
      remaining: 0,
      limit: 0,
      used: 0,
      monthYear,
    };
  }
}

/**
 * Increment SMS usage counter for a salon (atomic operation)
 */
export async function incrementSMSUsage(salonId: string): Promise<void> {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  try {
    const { error } = await supabase.rpc('increment_sms_usage', {
      p_salon_id: salonId,
      p_month_year: monthYear,
    });

    if (error) {
      console.error('Error incrementing SMS usage:', error);
      throw new Error(`Failed to increment SMS usage: ${error.message}`);
    }
  } catch (err) {
    console.error('Exception incrementing SMS usage:', err);
    throw err;
  }
}

/**
 * Reset monthly quota for a salon (used by cron job)
 */
export async function resetMonthlyQuota(salonId: string): Promise<void> {
  const supabase = await createClient();

  try {
    const { error } = await supabase.rpc('reset_monthly_quota', {
      p_salon_id: salonId,
    });

    if (error) {
      console.error('Error resetting monthly quota:', error);
      throw new Error(`Failed to reset monthly quota: ${error.message}`);
    }
  } catch (err) {
    console.error('Exception resetting monthly quota:', err);
    throw err;
  }
}

/**
 * Get SMS usage statistics for a salon
 */
export async function getSMSUsageStats(
  salonId: string,
  monthYear?: string
): Promise<{
  sent: number;
  limit: number;
  remaining: number;
  percentage: number;
  monthYear: string;
}> {
  const supabase = await createClient();
  const targetMonth = monthYear || getCurrentMonthYear();

  try {
    const { data, error } = await supabase
      .from('sms_usage')
      .select('sms_sent, sms_limit')
      .eq('salon_id', salonId)
      .eq('month_year', targetMonth)
      .single();

    if (error || !data) {
      // No record yet, return defaults
      return {
        sent: 0,
        limit: 1000,
        remaining: 1000,
        percentage: 0,
        monthYear: targetMonth,
      };
    }

    const sent = data.sms_sent || 0;
    const limit = data.sms_limit || 1000;
    const remaining = Math.max(0, limit - sent);
    const percentage = limit > 0 ? Math.round((sent / limit) * 100) : 0;

    return {
      sent,
      limit,
      remaining,
      percentage,
      monthYear: targetMonth,
    };
  } catch (err) {
    console.error('Exception getting SMS usage stats:', err);
    return {
      sent: 0,
      limit: 1000,
      remaining: 1000,
      percentage: 0,
      monthYear: targetMonth,
    };
  }
}

/**
 * Update SMS limit for a salon
 */
export async function updateSMSLimit(
  salonId: string,
  newLimit: number
): Promise<boolean> {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  try {
    const { error } = await supabase
      .from('sms_usage')
      .upsert({
        salon_id: salonId,
        month_year: monthYear,
        sms_limit: newLimit,
      }, {
        onConflict: 'salon_id,month_year',
      });

    if (error) {
      console.error('Error updating SMS limit:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception updating SMS limit:', err);
    return false;
  }
}

/**
 * Get all salons with low SMS quota (< 10% remaining)
 */
export async function getSalonsWithLowQuota(): Promise<Array<{
  salonId: string;
  salonName: string;
  sent: number;
  limit: number;
  remaining: number;
  percentage: number;
}>> {
  const supabase = await createClient();
  const monthYear = getCurrentMonthYear();

  try {
    const { data, error } = await supabase
      .from('sms_usage')
      .select(`
        salon_id,
        sms_sent,
        sms_limit,
        salons ( name )
      `)
      .eq('month_year', monthYear);

    if (error || !data) {
      return [];
    }

    return data
      .map((record: any) => {
        const sent = record.sms_sent || 0;
        const limit = record.sms_limit || 1000;
        const remaining = Math.max(0, limit - sent);
        const percentage = limit > 0 ? (sent / limit) * 100 : 0;

        return {
          salonId: record.salon_id,
          salonName: record.salons?.name || 'Unknown',
          sent,
          limit,
          remaining,
          percentage,
        };
      })
      .filter((salon) => salon.percentage >= 90); // 90% or more used
  } catch (err) {
    console.error('Exception getting salons with low quota:', err);
    return [];
  }
}
