/**
 * SMS Template System
 * Pre-defined templates with variable substitution
 */

export type TemplateVariables = Record<string, string>;

export interface SMSTemplate {
  key: string;
  name: string;
  content: string;
  variables: string[];
  description: string;
}

/**
 * SMS Template Definitions
 */
export const SMS_TEMPLATES = {
  APPOINTMENT_REMINDER: {
    key: 'APPOINTMENT_REMINDER',
    name: 'Randevu Hatırlatma',
    content: '{salonName} randevu hatirlatma: {date} tarihinde saat {time} icin {service} randevunuz bulunmaktadir.',
    variables: ['salonName', 'date', 'time', 'service'],
    description: 'Appointment reminder sent 1 day before',
  },

  APPOINTMENT_CONFIRMED: {
    key: 'APPOINTMENT_CONFIRMED',
    name: 'Randevu Onayı',
    content: '{salonName} randevunuz onaylandi. {date} tarihinde saat {time} icin gorusmek uzere.',
    variables: ['salonName', 'date', 'time'],
    description: 'Appointment confirmation message',
  },

  APPOINTMENT_CANCELLED: {
    key: 'APPOINTMENT_CANCELLED',
    name: 'Randevu İptali',
    content: '{salonName} randevunuz iptal edildi. Bilginize.',
    variables: ['salonName'],
    description: 'Appointment cancellation notification',
  },

  EMPTY_SLOT_CAMPAIGN: {
    key: 'EMPTY_SLOT_CAMPAIGN',
    name: 'Boş Randevu Kampanyası',
    content: '{salonName}: Bugun {slots} saatleri bos! Hemen randevu alin.',
    variables: ['salonName', 'slots'],
    description: 'Campaign message for empty appointment slots',
  },

  INACTIVE_CUSTOMER: {
    key: 'INACTIVE_CUSTOMER',
    name: 'Pasif Müşteri Aktivasyonu',
    content: '{customerName}, sizi {salonName} da ozledik! Indirimli randevu icin hemen arayin.',
    variables: ['customerName', 'salonName'],
    description: 'Re-engagement message for inactive customers',
  },

  BIRTHDAY_GREETING: {
    key: 'BIRTHDAY_GREETING',
    name: 'Doğum Günü Kutlaması',
    content: '{customerName}, dogum gununuz kutlu olsun! {salonName} olarak size ozel %{discount} indirim.',
    variables: ['customerName', 'salonName', 'discount'],
    description: 'Birthday greeting with discount offer',
  },

  PAYMENT_REMINDER: {
    key: 'PAYMENT_REMINDER',
    name: 'Ödeme Hatırlatma',
    content: '{customerName}, {salonName} randevunuz icin {amount} TL odeme beklenmektedir.',
    variables: ['customerName', 'salonName', 'amount'],
    description: 'Payment reminder for unpaid appointments',
  },

  THANK_YOU: {
    key: 'THANK_YOU',
    name: 'Teşekkür Mesajı',
    content: '{salonName} ziyaretiniz icin tesekkur ederiz! Deneyiminizi degerlendirmek isteriz.',
    variables: ['salonName'],
    description: 'Thank you message after service',
  },
} as const;

export type TemplateKey = keyof typeof SMS_TEMPLATES;

/**
 * Render a template with provided variables
 */
export function renderTemplate(
  templateKey: TemplateKey,
  variables: TemplateVariables
): string {
  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    throw new Error(`Template "${templateKey}" not found`);
  }

  let content = template.content;

  // Replace all variables
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    content = content.replace(new RegExp(placeholder, 'g'), value);
  }

  // Check for unreplaced variables
  const unreplacedVars = content.match(/\{(\w+)\}/g);
  if (unreplacedVars) {
    const missing = unreplacedVars.map((v) => v.replace(/[{}]/g, '')).join(', ');
    throw new Error(`Missing template variables: ${missing}`);
  }

  return content;
}

/**
 * Validate that all required variables are provided
 */
export function validateTemplateVariables(
  templateKey: TemplateKey,
  variables: TemplateVariables
): { valid: boolean; missing: string[] } {
  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    return { valid: false, missing: [] };
  }

  const missing: string[] = [];

  for (const requiredVar of template.variables) {
    if (!variables[requiredVar]) {
      missing.push(requiredVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Get all available templates
 */
export function getAllTemplates(): SMSTemplate[] {
  return Object.values(SMS_TEMPLATES);
}

/**
 * Get template by key
 */
export function getTemplate(templateKey: TemplateKey): SMSTemplate | null {
  return SMS_TEMPLATES[templateKey] || null;
}

/**
 * Preview template with example variables
 */
export function previewTemplate(templateKey: TemplateKey): string {
  const template = SMS_TEMPLATES[templateKey];

  if (!template) {
    return '';
  }

  // Example variables for preview
  const exampleVars: TemplateVariables = {
    salonName: 'Güzellik Salonu',
    customerName: 'Ayşe Yılmaz',
    date: '15 Mart 2026',
    time: '14:30',
    service: 'Saç Kesimi',
    slots: '14:00, 15:00, 16:00',
    discount: '20',
    amount: '150',
  };

  try {
    return renderTemplate(templateKey, exampleVars);
  } catch {
    return template.content;
  }
}

/**
 * Custom template rendering (for user-defined templates)
 */
export function renderCustomTemplate(
  content: string,
  variables: TemplateVariables
): string {
  let rendered = content;

  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
  }

  return rendered;
}
