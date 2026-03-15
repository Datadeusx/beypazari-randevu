import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getTrialInfo } from '@/lib/subscription/trial';
import { getSubscriptionLimits } from '@/lib/subscription/check-limits';
import { BANK_TRANSFER_INFO, formatPrice, getAllPlans } from '@/lib/subscription/plans';
import BillingForm from './BillingForm';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BillingPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/giris');
  }

  // Get salon
  const { data: salon } = await supabase
    .from('salons')
    .select('id, name, slug, user_id')
    .eq('slug', slug)
    .single();

  if (!salon || salon.user_id !== user.id) {
    redirect('/panel');
  }

  // Get subscription with plan details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(
      `
      id,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      subscription_plans (
        name,
        slug,
        price_monthly,
        features
      )
    `
    )
    .eq('salon_id', salon.id)
    .single();

  // Get trial info
  const trialInfo = await getTrialInfo(salon.id);

  // Get subscription limits
  const limits = await getSubscriptionLimits(salon.id);

  // Get payment transactions
  const { data: payments } = await supabase
    .from('payment_transactions')
    .select('id, amount, status, reference_number, paid_at, approved_at, rejected_at, rejection_reason, notes')
    .eq('subscription_id', subscription?.id || '')
    .order('created_at', { ascending: false });

  // Get all available plans
  const allPlans = getAllPlans();

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '24px 16px',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            Abonelik ve Faturalama
          </h1>
          <p style={{ marginTop: 8, color: '#6b7280', fontSize: 15 }}>
            Abonelik durumunuz, ödeme bilgileriniz ve fatura geçmişiniz
          </p>
        </div>

        {trialInfo?.isTrialing && !trialInfo.hasExpired && (
          <div
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              color: '#ffffff',
              boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    opacity: 0.9,
                  }}
                >
                  Deneme Süresi Aktif
                </div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800 }}>
                  {trialInfo.daysRemaining} gün kaldı
                </div>
                <div style={{ marginTop: 8, opacity: 0.9, fontSize: 14 }}>
                  Deneme süreniz {new Date(trialInfo.trialEndsAt!).toLocaleDateString('tr-TR')} tarihinde
                  sona eriyor
                </div>
              </div>
              <div
                style={{
                  padding: '12px 20px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                14 günlük ücretsiz deneme
              </div>
            </div>
          </div>
        )}

        {trialInfo?.hasExpired && subscription?.status === 'trialing' && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              color: '#b91c1c',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>
              Deneme süreniz sona erdi
            </div>
            <div style={{ fontSize: 14 }}>
              Hizmete devam etmek için lütfen ödeme yapın. Aboneliğiniz askıya alınmıştır.
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
          <section
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
              Mevcut Paket
            </h2>

            {subscription && (
              <div style={{ marginTop: 20 }}>
                <div
                  style={{
                    background: '#f9fafb',
                    borderRadius: 16,
                    padding: 20,
                    border: '1px solid #e5e7eb',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>
                        {(subscription.subscription_plans as any)?.name || 'Bilinmiyor'}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 14, color: '#6b7280' }}>
                        {subscription.status === 'trialing' && 'Deneme süresi'}
                        {subscription.status === 'active' && 'Aktif'}
                        {subscription.status === 'expired' && 'Süresi dolmuş'}
                        {subscription.status === 'cancelled' && 'İptal edilmiş'}
                      </div>
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#111827' }}>
                      {formatPrice((subscription.subscription_plans as any)?.price_monthly || 0)}
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#6b7280' }}>/ay</span>
                    </div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10 }}>
                      PAKET ÖZELLİKLERİ
                    </div>
                    {((subscription.subscription_plans as any)?.features || []).map(
                      (feature: string, idx: number) => (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 0',
                            color: '#374151',
                            fontSize: 14,
                          }}
                        >
                          ✓ {feature}
                        </div>
                      )
                    )}
                  </div>
                </div>

                {limits && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>
                      KULLANIM İSTATİSTİKLERİ
                    </div>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div
                        style={{
                          background: '#f9fafb',
                          borderRadius: 12,
                          padding: 14,
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>SMS Kredisi</div>
                        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: '#111827' }}>
                          {limits.smsRemaining} / {limits.smsCredits} kalan
                        </div>
                      </div>
                      <div
                        style={{
                          background: '#f9fafb',
                          borderRadius: 12,
                          padding: 14,
                          border: '1px solid #e5e7eb',
                        }}
                      >
                        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Hizmet Limiti</div>
                        <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: '#111827' }}>
                          {limits.maxServices === -1 ? 'Sınırsız' : `${limits.maxServices} hizmet`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section
            style={{
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              padding: 24,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>Ödeme Yap</h2>

            <div
              style={{
                marginTop: 20,
                background: '#f9fafb',
                borderRadius: 16,
                padding: 20,
                border: '1px solid #e5e7eb',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>
                BANKA HESAP BİLGİLERİ
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Banka</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {BANK_TRANSFER_INFO.bankName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Hesap Sahibi</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    {BANK_TRANSFER_INFO.accountHolder}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>IBAN</div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#111827',
                      fontFamily: 'monospace',
                      background: '#ffffff',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    {BANK_TRANSFER_INFO.iban}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 8,
                    padding: 12,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 12,
                    fontSize: 13,
                    color: '#92400e',
                  }}
                >
                  {BANK_TRANSFER_INFO.description}
                </div>
              </div>
            </div>

            {subscription && (
              <BillingForm
                subscriptionId={subscription.id}
                planPrice={(subscription.subscription_plans as any)?.price_monthly || 800}
              />
            )}
          </section>
        </div>

        <section
          style={{
            marginTop: 24,
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            padding: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
            Ödeme Geçmişi
          </h2>

          {!payments || payments.length === 0 ? (
            <div
              style={{
                marginTop: 20,
                padding: 20,
                background: '#f9fafb',
                borderRadius: 16,
                textAlign: 'center',
                color: '#6b7280',
              }}
            >
              Henüz ödeme kaydı bulunmuyor
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                      TARİH
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                      TUTAR
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                      REFERANS NO
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                      DURUM
                    </th>
                    <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280' }}>
                      NOT
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '14px 8px', fontSize: 14, color: '#374151' }}>
                        {new Date(payment.paid_at || '').toLocaleDateString('tr-TR')}
                      </td>
                      <td style={{ padding: '14px 8px', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                        {formatPrice(payment.amount)}
                      </td>
                      <td style={{ padding: '14px 8px', fontSize: 14, color: '#374151', fontFamily: 'monospace' }}>
                        {payment.reference_number}
                      </td>
                      <td style={{ padding: '14px 8px' }}>
                        {payment.status === 'pending' && (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#fef3c7',
                              color: '#92400e',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Onay Bekliyor
                          </span>
                        )}
                        {payment.status === 'approved' && (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#d1fae5',
                              color: '#065f46',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Onaylandı
                          </span>
                        )}
                        {payment.status === 'rejected' && (
                          <span
                            style={{
                              padding: '4px 12px',
                              background: '#fee2e2',
                              color: '#991b1b',
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Reddedildi
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 8px', fontSize: 13, color: '#6b7280' }}>
                        {payment.rejection_reason || payment.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
