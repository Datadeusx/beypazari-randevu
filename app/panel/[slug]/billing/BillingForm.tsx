'use client';

import { useState } from 'react';
import { submitPayment } from './actions';

interface BillingFormProps {
  subscriptionId: string;
  planPrice: number;
}

export default function BillingForm({ subscriptionId, planPrice }: BillingFormProps) {
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    const result = await submitPayment({
      subscriptionId,
      amount: planPrice,
      referenceNumber,
      notes,
    });

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setMessage('Ödeme kaydınız başarıyla oluşturuldu. Onay sürecine alındı.');
      setReferenceNumber('');
      setNotes('');
      // Refresh the page after 2 seconds to show the new payment
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setIsSuccess(false);
      setMessage(result.error || 'Bir hata oluştu');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Ödeme Tutarı
        </label>
        <input
          type="text"
          value={`${planPrice} TL`}
          disabled
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            fontSize: 14,
            color: '#111827',
            background: '#f9fafb',
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Dekont/Referans Numarası *
        </label>
        <input
          type="text"
          value={referenceNumber}
          onChange={(e) => setReferenceNumber(e.target.value)}
          placeholder="Ödeme dekont numaranızı girin"
          required
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 12,
            fontSize: 14,
            color: '#111827',
            background: '#ffffff',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 8,
            fontSize: 14,
            fontWeight: 600,
            color: '#374151',
          }}
        >
          Not (Opsiyonel)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ek bilgi veya açıklama"
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 12,
            fontSize: 14,
            color: '#111827',
            background: '#ffffff',
            outline: 'none',
            resize: 'vertical',
          }}
        />
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            marginBottom: 16,
            fontSize: 14,
            background: isSuccess ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${isSuccess ? '#bbf7d0' : '#fecaca'}`,
            color: isSuccess ? '#15803d' : '#b91c1c',
          }}
        >
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '14px 16px',
          background: '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          fontSize: 15,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Gönderiliyor...' : 'Ödeme Kaydını Gönder'}
      </button>
    </form>
  );
}
