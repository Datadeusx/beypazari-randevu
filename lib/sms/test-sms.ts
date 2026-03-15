/**
 * SMS Testing Utilities
 * Use this file to test SMS functionality in development
 */

import { sendSMS, validatePhoneNumber, getSMSInfo } from './providers/netgsm';
import { sendSMSWithRetry } from './send-with-retry';
import { renderTemplate, getAllTemplates } from './templates';
import { checkSMSQuota, getSMSUsageStats } from './quota';

/**
 * Test Netgsm connection and credentials
 */
export async function testNetgsmConnection(): Promise<void> {
  console.log('🔍 Testing Netgsm connection...\n');

  // Check environment variables
  const username = process.env.NETGSM_USERNAME;
  const password = process.env.NETGSM_PASSWORD;
  const header = process.env.NETGSM_HEADER;

  console.log('Environment Variables:');
  console.log('- NETGSM_USERNAME:', username ? '✅ Set' : '❌ Not set');
  console.log('- NETGSM_PASSWORD:', password ? '✅ Set' : '❌ Not set');
  console.log('- NETGSM_HEADER:', header || 'BEYPAZRAN');
  console.log('');

  if (!username || !password) {
    console.error('❌ Netgsm credentials not configured!');
    console.log('Please set NETGSM_USERNAME and NETGSM_PASSWORD in .env.local');
    return;
  }

  console.log('✅ Credentials configured\n');
}

/**
 * Test phone number validation
 */
export function testPhoneValidation(): void {
  console.log('📱 Testing phone number validation...\n');

  const testNumbers = [
    '5551234567',
    '0555 123 4567',
    '+90 555 123 4567',
    '905551234567',
    '1234567890', // Invalid
    '555123', // Too short
  ];

  for (const number of testNumbers) {
    const isValid = validatePhoneNumber(number);
    console.log(`${isValid ? '✅' : '❌'} ${number} - ${isValid ? 'Valid' : 'Invalid'}`);
  }
  console.log('');
}

/**
 * Test SMS templates
 */
export function testTemplates(): void {
  console.log('📝 Testing SMS templates...\n');

  const templates = getAllTemplates();

  console.log(`Found ${templates.length} templates:\n`);

  for (const template of templates) {
    console.log(`Template: ${template.name}`);
    console.log(`Key: ${template.key}`);
    console.log(`Variables: ${template.variables.join(', ')}`);

    // Test rendering with example data
    try {
      const exampleVars: Record<string, string> = {
        salonName: 'Test Salon',
        customerName: 'Ahmet Yilmaz',
        date: '15 Mart 2026',
        time: '14:30',
        service: 'Saç Kesimi',
        slots: '14:00, 15:00, 16:00',
        discount: '20',
        amount: '150',
      };

      const rendered = renderTemplate(template.key as any, exampleVars);
      console.log(`Preview: ${rendered}`);
      console.log('');
    } catch (err: any) {
      console.error(`❌ Error rendering: ${err.message}\n`);
    }
  }
}

/**
 * Test SMS message info calculation
 */
export function testSMSInfo(): void {
  console.log('📊 Testing SMS info calculation...\n');

  const testMessages = [
    'Merhaba, bu bir test mesajidir.',
    'Güzellik Salonu randevu hatırlatma mesajı. Türkçe karakterler içeriyor: ğüşıöç',
    'A'.repeat(200), // Long message
  ];

  for (const message of testMessages) {
    const info = getSMSInfo(message);
    console.log(`Message: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`);
    console.log(`- Length: ${info.length} characters`);
    console.log(`- Parts: ${info.parts} SMS`);
    console.log(`- Turkish chars: ${info.hasTurkishChars ? 'Yes' : 'No'}`);
    console.log('');
  }
}

/**
 * Test sending SMS (requires valid phone number)
 * WARNING: This will actually send an SMS!
 */
export async function testSendSMS(phoneNumber: string, dryRun: boolean = true): Promise<void> {
  console.log('📤 Testing SMS sending...\n');

  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No SMS will be sent');
    console.log('To actually send SMS, call: testSendSMS("5551234567", false)\n');
    return;
  }

  console.log(`Sending test SMS to: ${phoneNumber}\n`);

  const message = 'Test mesaji - Bu bir test mesajidir. Netgsm entegrasyonu test ediliyor.';

  try {
    const result = await sendSMS(phoneNumber, message);

    if (result.success) {
      console.log('✅ SMS sent successfully!');
      console.log(`Message ID: ${result.messageId}`);
    } else {
      console.log('❌ SMS failed');
      console.log(`Error: ${result.error}`);
      console.log(`Error Code: ${result.errorCode}`);
    }
  } catch (err: any) {
    console.error('❌ Exception:', err.message);
  }

  console.log('');
}

/**
 * Test SMS quota system
 */
export async function testQuotaSystem(salonId: string): Promise<void> {
  console.log('📊 Testing quota system...\n');

  try {
    const quota = await checkSMSQuota(salonId);

    console.log('Quota Check Result:');
    console.log(`- Allowed: ${quota.allowed ? 'Yes' : 'No'}`);
    console.log(`- Used: ${quota.used}`);
    console.log(`- Remaining: ${quota.remaining}`);
    console.log(`- Limit: ${quota.limit}`);
    console.log(`- Month: ${quota.monthYear}`);
    console.log('');

    const stats = await getSMSUsageStats(salonId);

    console.log('Usage Statistics:');
    console.log(`- Sent: ${stats.sent}`);
    console.log(`- Limit: ${stats.limit}`);
    console.log(`- Remaining: ${stats.remaining}`);
    console.log(`- Percentage: ${stats.percentage}%`);
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }

  console.log('');
}

/**
 * Run all tests
 */
export async function runAllTests(options: {
  testSalonId?: string;
  testPhoneNumber?: string;
  skipSending?: boolean;
} = {}): Promise<void> {
  console.log('🚀 Running SMS System Tests\n');
  console.log('═══════════════════════════════════════\n');

  await testNetgsmConnection();
  testPhoneValidation();
  testTemplates();
  testSMSInfo();

  if (options.testSalonId) {
    await testQuotaSystem(options.testSalonId);
  }

  if (options.testPhoneNumber && !options.skipSending) {
    await testSendSMS(options.testPhoneNumber, true);
  }

  console.log('═══════════════════════════════════════\n');
  console.log('✅ All tests completed!\n');
}

// Export for use in scripts or API routes
export default {
  testNetgsmConnection,
  testPhoneValidation,
  testTemplates,
  testSMSInfo,
  testSendSMS,
  testQuotaSystem,
  runAllTests,
};
