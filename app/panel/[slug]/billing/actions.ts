'use server';

import { createClient } from '@/lib/supabase/server';
import { createIyzicoClient } from '@/lib/iyzico/client';
import { headers } from 'next/headers';

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

export async function processIyzicoPayment(formData: {
  subscriptionId: string;
  salonId: string;
  amount: number;
  cardHolderName: string;
  cardNumber: string;
  expireMonth: string;
  expireYear: string;
  cvc: string;
  buyerName: string;
  buyerSurname: string;
  buyerEmail: string;
  buyerPhone: string;
  identityNumber: string;
  city: string;
  address: string;
}): Promise<{ success: boolean; error?: string; paymentId?: string }> {
  const supabase = await createClient();

  try {
    // Get client IP address
    const headersList = await headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '85.34.78.112';

    // Create iyzico client
    const iyzicoClient = createIyzicoClient();

    // Prepare payment request
    const conversationId = `sub-${formData.subscriptionId}-${Date.now()}`;
    const basketId = `basket-${Date.now()}`;

    const paymentRequest = {
      locale: 'tr',
      conversationId,
      price: formData.amount.toFixed(2),
      paidPrice: formData.amount.toFixed(2),
      currency: 'TRY',
      installment: '1',
      basketId,
      paymentChannel: 'WEB',
      paymentGroup: 'SUBSCRIPTION',
      paymentCard: {
        cardHolderName: formData.cardHolderName,
        cardNumber: formData.cardNumber,
        expireMonth: formData.expireMonth,
        expireYear: formData.expireYear,
        cvc: formData.cvc,
        registerCard: '0',
      },
      buyer: {
        id: formData.salonId,
        name: formData.buyerName,
        surname: formData.buyerSurname,
        gsmNumber: formData.buyerPhone,
        email: formData.buyerEmail,
        identityNumber: formData.identityNumber,
        registrationAddress: formData.address,
        ip,
        city: formData.city,
        country: 'Turkey',
      },
      shippingAddress: {
        contactName: `${formData.buyerName} ${formData.buyerSurname}`,
        city: formData.city,
        country: 'Turkey',
        address: formData.address,
      },
      billingAddress: {
        contactName: `${formData.buyerName} ${formData.buyerSurname}`,
        city: formData.city,
        country: 'Turkey',
        address: formData.address,
      },
      basketItems: [
        {
          id: 'subscription-1',
          name: 'Salon Aboneliği',
          category1: 'Abonelik',
          category2: 'SaaS',
          itemType: 'VIRTUAL',
          price: formData.amount.toFixed(2),
        },
      ],
    };

    // Process payment with iyzico
    const paymentResponse = await iyzicoClient.createPayment(paymentRequest);

    // Check payment status
    if (paymentResponse.status !== 'success') {
      // Payment failed, log the error
      await supabase.from('payment_transactions').insert({
        subscription_id: formData.subscriptionId,
        amount: formData.amount,
        status: 'failed',
        payment_method: 'iyzico',
        iyzico_payment_id: paymentResponse.paymentId || null,
        iyzico_conversation_id: conversationId,
        error_message: paymentResponse.errorMessage || 'Ödeme başarısız',
        paid_at: new Date().toISOString(),
      });

      return {
        success: false,
        error: paymentResponse.errorMessage || 'Ödeme işlemi başarısız oldu',
      };
    }

    // Payment successful, record the transaction
    const { error: insertError } = await supabase.from('payment_transactions').insert({
      subscription_id: formData.subscriptionId,
      amount: formData.amount,
      status: 'approved',
      payment_method: 'iyzico',
      iyzico_payment_id: paymentResponse.paymentId,
      iyzico_conversation_id: conversationId,
      paid_at: new Date().toISOString(),
      approved_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error('Failed to record payment transaction:', insertError);
      // Payment was successful but we failed to record it
      // This should be handled manually
      return {
        success: false,
        error: 'Ödeme başarılı ancak kayıt edilemedi. Lütfen destek ile iletişime geçin.',
      };
    }

    // Update subscription status to active
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: nextMonth.toISOString(),
      })
      .eq('id', formData.subscriptionId);

    if (updateError) {
      console.error('Failed to update subscription:', updateError);
    }

    return {
      success: true,
      paymentId: paymentResponse.paymentId,
    };
  } catch (error: any) {
    console.error('İyzico payment error:', error);
    return {
      success: false,
      error: error.message || 'Ödeme işlemi sırasında bir hata oluştu',
    };
  }
}
