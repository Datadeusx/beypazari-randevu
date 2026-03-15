'use server';

import { createClient } from '@/lib/supabase/server';

export async function submitPayment(formData: {
  subscriptionId: string;
  amount: number;
  referenceNumber: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const { subscriptionId, amount, referenceNumber, notes } = formData;

  if (!subscriptionId || !amount || !referenceNumber) {
    return { success: false, error: 'Lütfen tüm gerekli alanları doldurun' };
  }

  const { error } = await supabase.from('payment_transactions').insert({
    subscription_id: subscriptionId,
    amount,
    reference_number: referenceNumber,
    notes: notes || null,
    status: 'pending',
    payment_method: 'bank_transfer',
    paid_at: new Date().toISOString(),
  });

  if (error) {
    return { success: false, error: 'Ödeme kaydı oluşturulamadı: ' + error.message };
  }

  return { success: true };
}
