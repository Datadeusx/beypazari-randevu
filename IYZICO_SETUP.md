# İyzico Ödeme Entegrasyonu Kurulum Rehberi

## Yapılan Değişiklikler

### 1. İyzico Client Kütüphanesi
- `lib/iyzico/client.ts` - İyzico API entegrasyonu için client oluşturuldu
- HMAC SHA256 ile güvenli authorization header oluşturma
- Payment işlemleri için type-safe interface'ler

### 2. Ödeme Formu
- `app/panel/[slug]/billing/IyzicoPaymentForm.tsx` - Kredi kartı ödeme formu
- Kart bilgileri, fatura bilgileri ve TC kimlik doğrulama
- Form validasyonu ve kullanıcı dostu hata mesajları

### 3. Server Actions
- `app/panel/[slug]/billing/actions.ts` güncellendi
- `processIyzicoPayment` fonksiyonu eklendi
- Başarılı ödeme sonrası otomatik subscription aktivasyonu

### 4. Database Migration
- `supabase/migrations/20260316000000_add_iyzico_fields.sql`
- Payment transactions tablosuna yeni kolonlar:
  - `iyzico_payment_id`
  - `iyzico_conversation_id`
  - `error_message`

## Kurulum Adımları

### 1. İyzico Hesabı Oluştur
1. [iyzico.com](https://iyzico.com) adresinden kayıt olun
2. Merchant hesabınızı doğrulayın
3. Dashboard'dan API anahtarlarınızı alın

### 2. Environment Variables
`.env.local` dosyanıza şu değişkenleri ekleyin:

```bash
# Test Ortamı (Sandbox)
IYZICO_API_KEY=sandbox-xxxxxxxxxxxx
IYZICO_SECRET_KEY=sandbox-xxxxxxxxxxxx
IYZICO_BASE_URL=https://sandbox-api.iyzipay.com

# Canlı Ortam (Production) - Hazır olduğunuzda
# IYZICO_API_KEY=your-production-api-key
# IYZICO_SECRET_KEY=your-production-secret-key
# IYZICO_BASE_URL=https://api.iyzipay.com
```

### 3. Database Migration Çalıştır
```bash
# Supabase migration'ı uygula
npx supabase db push

# veya manuel olarak SQL'i Supabase Dashboard'da çalıştır
```

### 4. Test Kartları (Sandbox)
İyzico sandbox ortamında test için kullanabileceğiniz kartlar:

**Başarılı Ödeme:**
- Kart No: 5528790000000008
- Son Kullanma: 12/2030
- CVC: 123
- 3D Secure Şifresi: 123456

**Başarısız Ödeme:**
- Kart No: 5406670000000009
- Son Kullanma: 12/2030
- CVC: 123

### 5. Canlıya Geçiş
Sistemi canlıya almak için:

1. İyzico'dan production API anahtarlarınızı alın
2. `.env.local` dosyasında production değerlerini kullanın
3. `IYZICO_BASE_URL`'i production URL'e değiştirin
4. Gerçek kart bilgileriyle test edin

## Özellikler

✅ Güvenli kredi kartı ile ödeme
✅ iyzico 3D Secure desteği
✅ Otomatik subscription aktivasyonu
✅ Başarısız ödeme loglama
✅ Kullanıcı dostu hata mesajları
✅ PCI DSS uyumlu (kart bilgileri sunucuda saklanmaz)

## Güvenlik Notları

⚠️ **ÖNEMLİ:**
- API anahtarlarını asla git'e commit etmeyin
- `.env.local` dosyasının `.gitignore`'da olduğundan emin olun
- Production API anahtarlarını sadece production sunucuda kullanın
- HTTPS kullanmadan production'a geçmeyin

## Sorun Giderme

### "İyzico API anahtarları yapılandırılmamış" Hatası
- `.env.local` dosyasında `IYZICO_API_KEY` ve `IYZICO_SECRET_KEY` tanımlı mı kontrol edin
- Development server'ı restart edin

### "Ödeme başarılı ancak kayıt edilemedi" Hatası
- Database migration'ın düzgün çalıştığından emin olun
- Supabase permissions'ları kontrol edin
- Supabase logs'ları inceleyin

### Test Kartı Çalışmıyor
- Sandbox API anahtarlarını kullandığınızdan emin olun
- `IYZICO_BASE_URL` değeri `https://sandbox-api.iyzipay.com` olmalı
- iyzico dashboard'dan merchant hesabınızın aktif olduğunu kontrol edin

## Destek

İyzico entegrasyonu hakkında sorularınız için:
- [İyzico Dokümantasyon](https://dev.iyzipay.com/)
- [İyzico Destek](https://www.iyzico.com/destek)
