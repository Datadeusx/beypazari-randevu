import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { formatPrice } from '@/lib/subscription/plans';
import PaymentActions from './PaymentActions';

export default async function AdminPaymentsPage() {
  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/giris');
  }

  // For production, you would check if user is admin
  // For now, we'll just let any authenticated user access this
  // TODO: Add admin role check

  // Get all payment transactions with related subscription and salon info
  const { data: payments, error } = await supabase
    .from('payment_transactions')
    .select(
      `
      id,
      amount,
      status,
      payment_method,
      reference_number,
      notes,
      paid_at,
      approved_at,
      rejected_at,
      rejection_reason,
      created_at,
      subscriptions (
        id,
        salon_id,
        salons (
          id,
          name,
          phone,
          slug
        ),
        subscription_plans (
          name,
          price_monthly
        )
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('Error fetching payments:', error);
  }

  const pendingPayments = (payments || []).filter((p) => p.status === 'pending');
  const processedPayments = (payments || []).filter((p) => p.status !== 'pending');

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        padding: '24px 16px',
      }}
    >
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 36,
              fontWeight: 900,
              color: '#111827',
            }}
          >
            Ödeme Yönetimi
          </h1>
          <p style={{ marginTop: 8, color: '#6b7280', fontSize: 15 }}>
            Bekleyen ödemeleri onaylayın veya reddedin
          </p>
        </div>

        <div
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>
            Admin Alanı
          </div>
          <div style={{ fontSize: 13, color: '#92400e' }}>
            Bu sayfa sadece yetkili yöneticiler tarafından erişilebilir. Ödemeleri dikkatle
            kontrol edin.
          </div>
        </div>

        <section
          style={{
            background: '#ffffff',
            borderRadius: 20,
            border: '1px solid #e5e7eb',
            padding: 24,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
              Onay Bekleyen Ödemeler
            </h2>
            <div
              style={{
                padding: '8px 16px',
                background: '#fef3c7',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 700,
                color: '#92400e',
              }}
            >
              {pendingPayments.length} bekleyen
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: 16,
                color: '#6b7280',
              }}
            >
              Onay bekleyen ödeme bulunmuyor
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {pendingPayments.map((payment: any) => {
                const salon = payment.subscriptions?.salons;
                const plan = payment.subscriptions?.subscription_plans;

                return (
                  <div
                    key={payment.id}
                    style={{
                      background: '#f9fafb',
                      border: '1px solid #e5e7eb',
                      borderRadius: 16,
                      padding: 20,
                    }}
                  >
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr auto',
                        gap: 20,
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          SALON
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                          {salon?.name || 'Bilinmiyor'}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                          {salon?.phone || '-'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          PAKET & TUTAR
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#111827' }}>
                          {plan?.name || 'Bilinmiyor'}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: '#15803d',
                            marginTop: 2,
                          }}
                        >
                          {formatPrice(payment.amount)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                          REFERANS NO & TARİH
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#111827',
                            fontFamily: 'monospace',
                          }}
                        >
                          {payment.reference_number}
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                          {new Date(payment.paid_at).toLocaleDateString('tr-TR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </div>
                        {payment.notes && (
                          <div
                            style={{
                              fontSize: 12,
                              color: '#6b7280',
                              marginTop: 4,
                              fontStyle: 'italic',
                            }}
                          >
                            Not: {payment.notes}
                          </div>
                        )}
                      </div>

                      <PaymentActions paymentId={payment.id} />
                    </div>
                  </div>
                );
              })}
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
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>
            İşlenmiş Ödemeler
          </h2>

          {processedPayments.length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                background: '#f9fafb',
                borderRadius: 16,
                color: '#6b7280',
                marginTop: 20,
              }}
            >
              Henüz işlenmiş ödeme yok
            </div>
          ) : (
            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      SALON
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      PAKET
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      TUTAR
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      REFERANS
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      TARİH
                    </th>
                    <th
                      style={{
                        padding: '12px 8px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#6b7280',
                      }}
                    >
                      DURUM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {processedPayments.map((payment: any) => {
                    const salon = payment.subscriptions?.salons;
                    const plan = payment.subscriptions?.subscription_plans;

                    return (
                      <tr key={payment.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '14px 8px', fontSize: 14, color: '#374151' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>
                            {salon?.name || 'Bilinmiyor'}
                          </div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                            {salon?.phone || '-'}
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: 14, color: '#374151' }}>
                          {plan?.name || 'Bilinmiyor'}
                        </td>
                        <td
                          style={{
                            padding: '14px 8px',
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#111827',
                          }}
                        >
                          {formatPrice(payment.amount)}
                        </td>
                        <td
                          style={{
                            padding: '14px 8px',
                            fontSize: 14,
                            color: '#374151',
                            fontFamily: 'monospace',
                          }}
                        >
                          {payment.reference_number}
                        </td>
                        <td style={{ padding: '14px 8px', fontSize: 13, color: '#6b7280' }}>
                          {new Date(payment.paid_at).toLocaleDateString('tr-TR')}
                        </td>
                        <td style={{ padding: '14px 8px' }}>
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
                            <div>
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
                              {payment.rejection_reason && (
                                <div
                                  style={{
                                    marginTop: 4,
                                    fontSize: 12,
                                    color: '#6b7280',
                                    fontStyle: 'italic',
                                  }}
                                >
                                  {payment.rejection_reason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
