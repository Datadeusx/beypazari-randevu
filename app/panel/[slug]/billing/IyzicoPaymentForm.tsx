'use client';

import { useState } from 'react';
import { processIyzicoPayment } from './actions';

interface IyzicoPaymentFormProps {
  subscriptionId: string;
  planPrice: number;
  salonId: string;
  userEmail: string;
  userPhone: string;
}

export default function IyzicoPaymentForm({
  subscriptionId,
  planPrice,
  salonId,
  userEmail,
  userPhone,
}: IyzicoPaymentFormProps) {
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expireMonth, setExpireMonth] = useState('');
  const [expireYear, setExpireYear] = useState('');
  const [cvc, setCvc] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerSurname, setBuyerSurname] = useState('');
  const [identityNumber, setIdentityNumber] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\s/g, '');
    if (value.length <= 16 && /^\d*$/.test(value)) {
      setCardNumber(value);
    }
  };

  const handleExpireMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 2 && /^\d*$/.test(value)) {
      setExpireMonth(value);
    }
  };

  const handleExpireYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 4 && /^\d*$/.test(value)) {
      setExpireYear(value);
    }
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 3 && /^\d*$/.test(value)) {
      setCvc(value);
    }
  };

  const handleIdentityNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 11 && /^\d*$/.test(value)) {
      setIdentityNumber(value);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsSuccess(false);

    // Validation
    if (cardNumber.length !== 16) {
      setMessage('Geçerli bir kart numarası girin');
      setLoading(false);
      return;
    }

    if (expireMonth.length !== 2 || parseInt(expireMonth) < 1 || parseInt(expireMonth) > 12) {
      setMessage('Geçerli bir ay girin (01-12)');
      setLoading(false);
      return;
    }

    if (expireYear.length !== 4) {
      setMessage('Geçerli bir yıl girin (YYYY formatında)');
      setLoading(false);
      return;
    }

    if (cvc.length !== 3) {
      setMessage('Geçerli bir CVC girin');
      setLoading(false);
      return;
    }

    if (identityNumber.length !== 11) {
      setMessage('Geçerli bir TC kimlik numarası girin');
      setLoading(false);
      return;
    }

    const result = await processIyzicoPayment({
      subscriptionId,
      salonId,
      amount: planPrice,
      cardHolderName,
      cardNumber,
      expireMonth,
      expireYear,
      cvc,
      buyerName,
      buyerSurname,
      buyerEmail: userEmail,
      buyerPhone: userPhone,
      identityNumber,
      city,
      address,
    });

    setLoading(false);

    if (result.success) {
      setIsSuccess(true);
      setMessage('Ödemeniz başarıyla tamamlandı! Aboneliğiniz aktif edildi.');
      // Clear form
      setCardHolderName('');
      setCardNumber('');
      setExpireMonth('');
      setExpireYear('');
      setCvc('');
      setBuyerName('');
      setBuyerSurname('');
      setIdentityNumber('');
      setCity('');
      setAddress('');
      // Refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } else {
      setIsSuccess(false);
      setMessage(result.error || 'Ödeme işlemi başarısız oldu');
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20 }}>
      <div
        style={{
          background: '#f9fafb',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #e5e7eb',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>
          KART BİLGİLERİ
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
            Kart Üzerindeki İsim *
          </label>
          <input
            type="text"
            value={cardHolderName}
            onChange={(e) => setCardHolderName(e.target.value)}
            placeholder="AHMET YILMAZ"
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
            Kart Numarası *
          </label>
          <input
            type="text"
            value={formatCardNumber(cardNumber)}
            onChange={handleCardNumberChange}
            placeholder="1234 5678 9012 3456"
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
              fontFamily: 'monospace',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Ay *
            </label>
            <input
              type="text"
              value={expireMonth}
              onChange={handleExpireMonthChange}
              placeholder="12"
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Yıl *
            </label>
            <input
              type="text"
              value={expireYear}
              onChange={handleExpireYearChange}
              placeholder="2026"
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              CVC *
            </label>
            <input
              type="text"
              value={cvc}
              onChange={handleCvcChange}
              placeholder="123"
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
        </div>
      </div>

      <div
        style={{
          background: '#f9fafb',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #e5e7eb',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280', marginBottom: 12 }}>
          FATURA BİLGİLERİ
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Ad *
            </label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              placeholder="Ahmet"
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

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
              }}
            >
              Soyad *
            </label>
            <input
              type="text"
              value={buyerSurname}
              onChange={(e) => setBuyerSurname(e.target.value)}
              placeholder="Yılmaz"
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
            TC Kimlik No *
          </label>
          <input
            type="text"
            value={identityNumber}
            onChange={handleIdentityNumberChange}
            placeholder="12345678901"
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
              fontFamily: 'monospace',
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
            Şehir *
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ankara"
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
            Adres *
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Fatura adresi"
            required
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
      </div>

      <div
        style={{
          background: '#f9fafb',
          borderRadius: 16,
          padding: 20,
          border: '1px solid #e5e7eb',
          marginBottom: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#6b7280' }}>TOPLAM TUTAR</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#111827' }}>
            {planPrice} TL
          </div>
        </div>
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
          padding: '16px',
          background: '#111827',
          color: '#ffffff',
          border: 'none',
          borderRadius: 14,
          fontSize: 16,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'İşlem Gerçekleştiriliyor...' : `${planPrice} TL Öde`}
      </button>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: 12,
          fontSize: 12,
          color: '#0c4a6e',
          textAlign: 'center',
        }}
      >
        🔒 Ödemeniz iyzico güvencesiyle korunmaktadır. Kart bilgileriniz saklanmaz.
      </div>
    </form>
  );
}
