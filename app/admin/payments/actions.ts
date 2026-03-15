'use server';

import { createClient } from '@/lib/supabase/server';
import { extendSubscriptionPeriod } from '@/lib/subscription/trial';

export async function approvePayment(
  paymentId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Oturum açmanız gerekiyor' };
  }

  // Get payment transaction
  const { data: payment, error: fetchError } = await supabase
    .from('payment_transactions')
    .select('id, subscription_id, status')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    return { success: false, error: 'Ödeme kaydı bulunamadı' };
  }

  if (payment.status !== 'pending') {
    return { success: false, error: 'Bu ödeme zaten işleme alınmış' };
  }

  // Update payment status to approved
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    })
    .eq('id', paymentId);

  if (updateError) {
    return { success: false, error: 'Ödeme onaylanamadı: ' + updateError.message };
  }

  // Extend subscription period by 1 month
  const extensionResult = await extendSubscriptionPeriod(payment.subscription_id);

  if (!extensionResult.success) {
    // Payment was approved but subscription extension failed
    // This is a critical error that should be logged
    console.error('Subscription extension failed:', extensionResult.error);
    return {
      success: false,
      error: 'Ödeme onaylandı ancak abonelik uzatılamadı. Lütfen manuel olarak kontrol edin.',
    };
  }

  return { success: true };
}

export async function rejectPayment(
  paymentId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Oturum açmanız gerekiyor' };
  }

  if (!reason.trim()) {
    return { success: false, error: 'Lütfen red sebebini yazın' };
  }

  // Get payment transaction
  const { data: payment, error: fetchError } = await supabase
    .from('payment_transactions')
    .select('id, status')
    .eq('id', paymentId)
    .single();

  if (fetchError || !payment) {
    return { success: false, error: 'Ödeme kaydı bulunamadı' };
  }

  if (payment.status !== 'pending') {
    return { success: false, error: 'Bu ödeme zaten işleme alınmış' };
  }

  // Update payment status to rejected
  const { error: updateError } = await supabase
    .from('payment_transactions')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
      rejection_reason: reason.trim(),
    })
    .eq('id', paymentId);

  if (updateError) {
    return { success: false, error: 'Ödeme reddedilemedi: ' + updateError.message };
  }

  return { success: true };
}
