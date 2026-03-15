/**
 * SMS System - Main Export File
 * Centralized exports for the SMS infrastructure
 */

// Provider exports
export {
  sendSMS,
  checkDeliveryStatus,
  validatePhoneNumber,
  calculateSMSCost,
  getSMSInfo,
  type NetgsmConfig,
  type SendSMSResponse,
  type DeliveryStatusResponse,
} from './providers/netgsm';

// Retry system exports
export {
  sendSMSWithRetry,
  retrySMS,
  getSMSStats,
  type SendSMSOptions,
  type SendSMSResult,
} from './send-with-retry';

// Quota management exports
export {
  checkSMSQuota,
  incrementSMSUsage,
  resetMonthlyQuota,
  getSMSUsageStats,
  updateSMSLimit,
  getSalonsWithLowQuota,
  type QuotaCheckResult,
} from './quota';

// Template system exports
export {
  SMS_TEMPLATES,
  renderTemplate,
  validateTemplateVariables,
  getAllTemplates,
  getTemplate,
  previewTemplate,
  renderCustomTemplate,
  type SMSTemplate,
  type TemplateVariables,
  type TemplateKey,
} from './templates';

// Test utilities (for development only)
export {
  default as testUtils,
} from './test-sms';
