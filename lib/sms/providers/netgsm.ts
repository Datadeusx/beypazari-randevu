/**
 * Netgsm SMS Provider Integration
 * Turkish SMS gateway provider for sending SMS messages
 * Documentation: https://www.netgsm.com.tr/dokuman/
 */

export interface NetgsmConfig {
  username: string;
  password: string;
  header: string; // SMS sender name (max 11 chars)
}

export interface SendSMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  errorCode?: string;
}

export interface DeliveryStatusResponse {
  status: 'delivered' | 'undelivered' | 'pending' | 'failed';
  statusCode?: string;
  description?: string;
}

// Netgsm response codes
const NETGSM_CODES = {
  // Success codes
  '00': 'SMS sent successfully',
  '01': 'SMS sent successfully (alternative)',

  // Error codes
  '20': 'Invalid XML format',
  '30': 'Invalid username, password or header',
  '40': 'Message header not approved',
  '50': 'Invalid recipient number',
  '51': 'Incomplete recipient number',
  '70': 'Invalid parameter',
  '80': 'Message limit exceeded',
  '85': 'Insufficient credits',
  '100': 'System error',
  '101': 'Sending not allowed for this account',
};

/**
 * Format phone number for Turkish SMS (must have +90 or start with 5)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters
  let cleaned = phone.replace(/\D/g, '');

  // If starts with 90, remove it (we'll add it back)
  if (cleaned.startsWith('90')) {
    cleaned = cleaned.substring(2);
  }

  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  // Should start with 5 and be 10 digits for Turkish mobile
  if (!cleaned.startsWith('5') || cleaned.length !== 10) {
    throw new Error('Invalid Turkish phone number format. Must be 10 digits starting with 5.');
  }

  return '90' + cleaned; // Add country code
}

/**
 * Get Netgsm configuration from environment variables
 */
function getNetgsmConfig(): NetgsmConfig {
  const username = process.env.NETGSM_USERNAME;
  const password = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER || 'BEYPAZRAN';

  if (!username || !password) {
    throw new Error('Netgsm credentials not configured. Set NETGSM_USERNAME and NETGSM_PASSWORD in environment variables.');
  }

  return { username, password, header };
}

/**
 * Send SMS via Netgsm API
 * Uses the GET endpoint for simplicity
 */
export async function sendSMS(
  phone: string,
  message: string
): Promise<SendSMSResponse> {
  try {
    const config = getNetgsmConfig();
    const formattedPhone = formatPhoneNumber(phone);

    // Netgsm API endpoint
    const url = new URL('https://api.netgsm.com.tr/sms/send/get');

    // Add parameters
    url.searchParams.append('usercode', config.username);
    url.searchParams.append('password', config.password);
    url.searchParams.append('gsmno', formattedPhone);
    url.searchParams.append('message', message);
    url.searchParams.append('msgheader', config.header);
    url.searchParams.append('dil', 'TR'); // Turkish language

    // Make request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    const trimmedResponse = responseText.trim();

    // Response format: "00 <messageId>" for success
    // Or just error code like "30" for failure
    const parts = trimmedResponse.split(' ');
    const code = parts[0];

    if (code === '00' || code === '01') {
      // Success
      const messageId = parts[1] || trimmedResponse;
      return {
        success: true,
        messageId: messageId,
      };
    } else {
      // Error
      const errorMessage = NETGSM_CODES[code as keyof typeof NETGSM_CODES] || 'Unknown error';
      return {
        success: false,
        error: errorMessage,
        errorCode: code,
      };
    }
  } catch (error: any) {
    // Handle network errors, timeouts, etc.
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - Netgsm API did not respond in time',
        errorCode: 'TIMEOUT',
      };
    }

    return {
      success: false,
      error: error.message || 'Network error while sending SMS',
      errorCode: 'NETWORK_ERROR',
    };
  }
}

/**
 * Check delivery status of sent SMS
 * Uses Netgsm delivery report API
 */
export async function checkDeliveryStatus(
  messageId: string
): Promise<DeliveryStatusResponse> {
  try {
    const config = getNetgsmConfig();

    // Netgsm delivery report endpoint
    const url = new URL('https://api.netgsm.com.tr/sms/report');

    url.searchParams.append('usercode', config.username);
    url.searchParams.append('password', config.password);
    url.searchParams.append('bulkid', messageId);
    url.searchParams.append('type', '0'); // 0 = delivery report

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url.toString(), {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    const trimmedResponse = responseText.trim();

    // Response codes for delivery status:
    // 0 = Waiting to be sent
    // 1 = Sending
    // 2 = Sent successfully (delivered)
    // 3 = Failed
    // 4 = Waiting in queue
    // 11 = Undelivered

    if (trimmedResponse === '2') {
      return {
        status: 'delivered',
        statusCode: '2',
        description: 'Message delivered successfully',
      };
    } else if (trimmedResponse === '11' || trimmedResponse === '3') {
      return {
        status: 'undelivered',
        statusCode: trimmedResponse,
        description: 'Message not delivered',
      };
    } else if (trimmedResponse === '0' || trimmedResponse === '1' || trimmedResponse === '4') {
      return {
        status: 'pending',
        statusCode: trimmedResponse,
        description: 'Message pending delivery',
      };
    } else {
      return {
        status: 'failed',
        statusCode: trimmedResponse,
        description: 'Unable to determine delivery status',
      };
    }
  } catch (error: any) {
    return {
      status: 'failed',
      description: error.message || 'Error checking delivery status',
    };
  }
}

/**
 * Validate Turkish phone number
 */
export function validatePhoneNumber(phone: string): boolean {
  try {
    formatPhoneNumber(phone);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate SMS cost (approximate)
 * Netgsm pricing varies, but typically around 0.15 TL per SMS
 */
export function calculateSMSCost(messageCount: number): number {
  const costPerSMS = 0.15; // TL
  return messageCount * costPerSMS;
}

/**
 * Get character count and SMS parts
 * Turkish characters count as 2 in GSM encoding
 */
export function getSMSInfo(message: string): {
  length: number;
  parts: number;
  hasTurkishChars: boolean;
} {
  const turkishChars = /[çğıİöşüÇĞÖŞÜ]/g;
  const hasTurkishChars = turkishChars.test(message);

  // GSM-7 encoding: 160 chars per SMS
  // Turkish chars require GSM extended or UCS-2: 70 chars per SMS
  const maxCharsPerSMS = hasTurkishChars ? 70 : 160;
  const length = message.length;
  const parts = Math.ceil(length / maxCharsPerSMS);

  return {
    length,
    parts,
    hasTurkishChars,
  };
}
