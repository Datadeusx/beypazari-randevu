'use client';

import { useState } from 'react';
import { approvePayment, rejectPayment } from './actions';

interface PaymentActionsProps {
  paymentId: string;
}

export default function PaymentActions({ paymentId }: PaymentActionsProps) {
  const [loading, setLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [message, setMessage] = useState('');

  async function handleApprove() {
    if (!confirm('Bu ödemeyi onaylamak istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await approvePayment(paymentId);

    if (result.success) {
      alert('Ödeme onaylandı ve abonelik uzatıldı');
      window.location.reload();
    } else {
      setMessage(result.error || 'Bir hata oluştu');
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectionReason.trim()) {
      setMessage('Lütfen red sebebini yazın');
      return;
    }

    if (!confirm('Bu ödemeyi reddetmek istediğinizden emin misiniz?')) {
      return;
    }

    setLoading(true);
    setMessage('');

    const result = await rejectPayment(paymentId, rejectionReason);

    if (result.success) {
      alert('Ödeme reddedildi');
      window.location.reload();
    } else {
      setMessage(result.error || 'Bir hata oluştu');
      setLoading(false);
    }
  }

  if (showRejectForm) {
    return (
      <div style={{ minWidth: 250 }}>
        <textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Red sebebini yazın..."
          rows={3}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: 8,
            fontSize: 13,
            marginBottom: 8,
            outline: 'none',
          }}
        />
        {message && (
          <div
            style={{
              padding: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 8,
              fontSize: 12,
              color: '#b91c1c',
              marginBottom: 8,
            }}
          >
            {message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#dc2626',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Reddediliyor...' : 'Reddet'}
          </button>
          <button
            onClick={() => setShowRejectForm(false)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px 12px',
              background: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            İptal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#15803d',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'İşleniyor...' : 'Onayla'}
      </button>
      <button
        onClick={() => setShowRejectForm(true)}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#dc2626',
          color: '#ffffff',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        Reddet
      </button>
    </div>
  );
}
