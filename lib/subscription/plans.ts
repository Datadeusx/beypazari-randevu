/**
 * Subscription Plans Configuration
 * Defines all available subscription plans for the Beypazarı Randevu SaaS
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  priceMonthly: number;
  features: string[];
  maxAppointments: number; // -1 means unlimited
  maxServices: number; // -1 means unlimited
  smsCredits: number; // Monthly SMS credits
  isPopular?: boolean;
  sortOrder: number;
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  BASIC: {
    id: 'basic',
    name: 'Temel Paket',
    slug: 'basic',
    priceMonthly: 800,
    features: [
      'Online randevu sistemi',
      'Müşteri yönetimi',
      'SMS hatırlatma (100 SMS/ay)',
      'Temel raporlama',
      'E-posta desteği',
    ],
    maxAppointments: -1, // unlimited
    maxServices: 10,
    smsCredits: 100,
    isPopular: true,
    sortOrder: 1,
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium Paket',
    slug: 'premium',
    priceMonthly: 1500,
    features: [
      'Tüm Temel Paket özellikleri',
      'Sınırsız hizmet ekleme',
      '500 SMS/ay',
      'Gelişmiş raporlama',
      'Kampanya yönetimi',
      'WhatsApp entegrasyonu',
      'Öncelikli destek',
    ],
    maxAppointments: -1, // unlimited
    maxServices: -1, // unlimited
    smsCredits: 500,
    isPopular: false,
    sortOrder: 2,
  },
};

/**
 * Get plan by slug
 */
export function getPlanBySlug(slug: string): SubscriptionPlan | null {
  const plan = Object.values(SUBSCRIPTION_PLANS).find((p) => p.slug === slug);
  return plan || null;
}

/**
 * Get all plans sorted by sort order
 */
export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS).sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Default plan for new signups (14-day trial)
 */
export const DEFAULT_TRIAL_PLAN = SUBSCRIPTION_PLANS.BASIC;
export const TRIAL_DAYS = 14;

/**
 * Bank transfer details for payments
 */
export const BANK_TRANSFER_INFO = {
  bankName: 'Türkiye İş Bankası',
  accountHolder: 'Beypazarı Randevu SaaS',
  iban: 'TR00 0000 0000 0000 0000 0000 00', // Replace with actual IBAN
  currency: 'TRY',
  description: 'Hesap numaranızı açıklama kısmına yazınız',
};
