/**
 * SMS Sending with Retry Logic
 * Implements exponential backoff and comprehensive error handling
 */

import { createClient } from "@/lib/supabase/server";
import { sendSMS } from "./providers/netgsm";
import { checkSMSQuota, incrementSMSUsage } from "./quota";

export interface SendSMSOptions {
  appointmentId?: string;
  salonId?: string;
  maxRetries?: number;
  skipQuotaCheck?: boolean; // For admin override
}

export interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCategory?: 'quota' | 'validation' | 'network' | 'provider' | 'unknown';
  attempts: number;
  logId?: string;
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Categorize error type for better handling
 */
function categorizeError(error: string, errorCode?: string): SendSMSResult['errorCategory'] {
  if (!error) return 'unknown';

  const errorLower = error.toLowerCase();
  const code = errorCode?.toLowerCase() || '';

  if (errorLower.includes('quota') || errorLower.includes('limit exceeded') || code === '80' || code === '85') {
    return 'quota';
  }

  if (errorLower.includes('invalid') || errorLower.includes('format') || code === '20' || code === '50' || code === '51' || code === '70') {
    return 'validation';
  }

  if (errorLower.includes('network') || errorLower.includes('timeout') || code === 'timeout' || code === 'network_error') {
    return 'network';
  }

  if (code === '30' || code === '40' || code === '100' || code === '101') {
    return 'provider';
  }

  return 'unknown';
}

/**
 * Send SMS with automatic retry logic and exponential backoff
 */
export async function sendSMSWithRetry(
  phone: string,
  message: string,
  options: SendSMSOptions = {}
): Promise<SendSMSResult> {
  const {
    appointmentId,
    salonId,
    maxRetries = 3,
    skipQuotaCheck = false,
  } = options;

  const supabase = await createClient();
  let attempts = 0;
  let lastError = '';
  let lastErrorCode = '';
  let logId: string | undefined;

  // Step 1: Check SMS quota if salonId is provided
  if (salonId && !skipQuotaCheck) {
    const quotaCheck = await checkSMSQuota(salonId);

    if (!quotaCheck.allowed) {
      // Create failed log entry
      const { data: logData } = await supabase
        .from('sms_logs')
        .insert({
          appointment_id: appointmentId,
          salon_id: salonId,
          phone,
          message,
          status: 'failed',
          delivery_status: 'failed',
          attempts: 1,
          error_message: `SMS quota exceeded. Used: ${quotaCheck.used}/${quotaCheck.limit}`,
        })
        .select('id')
        .single();

      return {
        success: false,
        error: `SMS quota exceeded. You have used ${quotaCheck.used} of ${quotaCheck.limit} SMS this month.`,
        errorCategory: 'quota',
        attempts: 1,
        logId: logData?.id,
      };
    }
  }

  // Step 2: Create initial SMS log entry
  const { data: initialLog, error: logError } = await supabase
    .from('sms_logs')
    .insert({
      appointment_id: appointmentId,
      salon_id: salonId,
      phone,
      message,
      status: 'pending',
      delivery_status: 'pending',
      attempts: 0,
    })
    .select('id')
    .single();

  if (logError) {
    console.error('Error creating SMS log:', logError);
    return {
      success: false,
      error: 'Failed to create SMS log',
      errorCategory: 'unknown',
      attempts: 0,
    };
  }

  logId = initialLog.id;

  // Step 3: Attempt to send SMS with retries
  for (let i = 0; i < maxRetries; i++) {
    attempts++;

    try {
      // Send SMS
      const result = await sendSMS(phone, message);

      if (result.success) {
        // Success! Update log and increment usage
        await supabase
          .from('sms_logs')
          .update({
            status: 'sent',
            delivery_status: 'sent',
            provider_message_id: result.messageId,
            attempts,
            error_message: null,
          })
          .eq('id', logId);

        // Increment SMS usage counter
        if (salonId) {
          try {
            await incrementSMSUsage(salonId);
          } catch (usageError) {
            console.error('Error incrementing SMS usage:', usageError);
            // Don't fail the SMS send if usage increment fails
          }
        }

        return {
          success: true,
          messageId: result.messageId,
          attempts,
          logId,
        };
      } else {
        // Failed - store error
        lastError = result.error || 'Unknown error';
        lastErrorCode = result.errorCode || '';

        const errorCategory = categorizeError(lastError, lastErrorCode);

        // Update log with error
        await supabase
          .from('sms_logs')
          .update({
            attempts,
            error_message: lastError,
          })
          .eq('id', logId);

        // Don't retry validation or provider config errors
        if (errorCategory === 'validation' || errorCategory === 'provider') {
          break;
        }

        // If not the last attempt, wait with exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
          await sleep(delay);
        }
      }
    } catch (error: any) {
      lastError = error.message || 'Unexpected error';
      lastErrorCode = 'EXCEPTION';

      await supabase
        .from('sms_logs')
        .update({
          attempts,
          error_message: lastError,
        })
        .eq('id', logId);

      // Wait before retry
      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000;
        await sleep(delay);
      }
    }
  }

  // Step 4: All retries failed
  await supabase
    .from('sms_logs')
    .update({
      status: 'failed',
      delivery_status: 'failed',
      attempts,
      error_message: lastError,
    })
    .eq('id', logId);

  return {
    success: false,
    error: lastError,
    errorCategory: categorizeError(lastError, lastErrorCode),
    attempts,
    logId,
  };
}

/**
 * Retry a failed SMS from log
 */
export async function retrySMS(logId: string): Promise<SendSMSResult> {
  const supabase = await createClient();

  // Get the SMS log
  const { data: log, error } = await supabase
    .from('sms_logs')
    .select('*')
    .eq('id', logId)
    .single();

  if (error || !log) {
    return {
      success: false,
      error: 'SMS log not found',
      errorCategory: 'unknown',
      attempts: 0,
    };
  }

  // Retry the SMS
  return sendSMSWithRetry(log.phone, log.message, {
    appointmentId: log.appointment_id,
    salonId: log.salon_id,
    maxRetries: 3,
  });
}

/**
 * Get SMS statistics for monitoring
 */
export async function getSMSStats(salonId?: string): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
  delivered: number;
}> {
  const supabase = await createClient();

  let query = supabase
    .from('sms_logs')
    .select('delivery_status', { count: 'exact' });

  if (salonId) {
    query = query.eq('salon_id', salonId);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { total: 0, sent: 0, failed: 0, pending: 0, delivered: 0 };
  }

  const stats = {
    total: data.length,
    sent: 0,
    failed: 0,
    pending: 0,
    delivered: 0,
  };

  data.forEach((log: any) => {
    if (log.delivery_status === 'sent') stats.sent++;
    else if (log.delivery_status === 'failed') stats.failed++;
    else if (log.delivery_status === 'pending') stats.pending++;
    else if (log.delivery_status === 'delivered') stats.delivered++;
  });

  return stats;
}
