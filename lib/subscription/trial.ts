/**
 * Trial Subscription Management
 * Functions for creating and managing trial subscriptions
 */

import { createClient as createServerClient } from '@/lib/supabase/server';
import { DEFAULT_TRIAL_PLAN, TRIAL_DAYS } from './plans';

export interface TrialInfo {
  isTrialing: boolean;
  trialEndsAt: Date | null;
  daysRemaining: number;
  hasExpired: boolean;
}

/**
 * Create a trial subscription for a new salon
 */
export async function createTrialSubscription(
  salonId: string,
  planSlug: string = DEFAULT_TRIAL_PLAN.slug
): Promise<{ success: boolean; error?: string; subscriptionId?: string }> {
  const supabase = await createServerClient();

  // Get the plan ID from the database
  const { data: planData, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, sms_credits')
    .eq('slug', planSlug)
    .single();

  if (planError || !planData) {
    return {
      success: false,
      error: 'Abonelik planı bulunamadı',
    };
  }

  // Calculate trial end date
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  // Calculate current period (trial period)
  const currentPeriodStart = new Date();
  const currentPeriodEnd = new Date(trialEndsAt);

  // Create subscription
  const { data: subscriptionData, error: subscriptionError } = await supabase
    .from('subscriptions')
    .insert({
      salon_id: salonId,
      plan_id: planData.id,
      status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
    })
    .select('id')
    .single();

  if (subscriptionError || !subscriptionData) {
    return {
      success: false,
      error: 'Abonelik oluşturulamadı: ' + subscriptionError?.message,
    };
  }

  // Initialize SMS usage tracking for current month
  const monthYear = new Date().toISOString().slice(0, 7); // YYYY-MM format

  await supabase.from('sms_usage').insert({
    salon_id: salonId,
    month_year: monthYear,
    sms_sent: 0,
    sms_limit: planData.sms_credits,
  });

  return {
    success: true,
    subscriptionId: subscriptionData.id,
  };
}

/**
 * Get trial information for a salon
 */
export async function getTrialInfo(salonId: string): Promise<TrialInfo | null> {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('status, trial_ends_at')
    .eq('salon_id', salonId)
    .single();

  if (error || !data) {
    return null;
  }

  const isTrialing = data.status === 'trialing';
  const trialEndsAt = data.trial_ends_at ? new Date(data.trial_ends_at) : null;
  const now = new Date();

  let daysRemaining = 0;
  let hasExpired = false;

  if (trialEndsAt) {
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, diffDays);
    hasExpired = diffDays < 0;
  }

  return {
    isTrialing,
    trialEndsAt,
    daysRemaining,
    hasExpired,
  };
}

/**
 * Get days remaining in trial
 */
export async function getTrialDaysRemaining(salonId: string): Promise<number> {
  const trialInfo = await getTrialInfo(salonId);
  return trialInfo?.daysRemaining || 0;
}

/**
 * Check if trial is active
 */
export async function isTrialActive(salonId: string): Promise<boolean> {
  const trialInfo = await getTrialInfo(salonId);
  return trialInfo ? trialInfo.isTrialing && !trialInfo.hasExpired : false;
}

/**
 * Convert trial to paid subscription
 */
export async function convertTrialToPaid(
  salonId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  // Get current subscription
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('id, plan_id')
    .eq('salon_id', salonId)
    .single();

  if (fetchError || !subscription) {
    return {
      success: false,
      error: 'Abonelik bulunamadı',
    };
  }

  // Update subscription to active
  const now = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription period

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    })
    .eq('id', subscription.id);

  if (updateError) {
    return {
      success: false,
      error: 'Abonelik güncellenemedi: ' + updateError.message,
    };
  }

  return {
    success: true,
  };
}

/**
 * Extend subscription period by one month
 */
export async function extendSubscriptionPeriod(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  // Get current subscription
  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('current_period_end')
    .eq('id', subscriptionId)
    .single();

  if (fetchError || !subscription) {
    return {
      success: false,
      error: 'Abonelik bulunamadı',
    };
  }

  // Calculate new period end (add 1 month)
  const currentEnd = new Date(subscription.current_period_end);
  const newEnd = new Date(currentEnd);
  newEnd.setMonth(newEnd.getMonth() + 1);

  // Update subscription
  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({
      current_period_end: newEnd.toISOString(),
      status: 'active', // Ensure status is active
    })
    .eq('id', subscriptionId);

  if (updateError) {
    return {
      success: false,
      error: 'Abonelik uzatılamadı: ' + updateError.message,
    };
  }

  return {
    success: true,
  };
}
