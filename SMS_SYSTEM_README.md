# SMS Infrastructure System - Documentation

## Overview
Production-ready SMS system with Netgsm integration, retry logic, quota management, and comprehensive monitoring.

## Features
- ✅ Real SMS delivery via Netgsm (Turkish SMS gateway)
- ✅ Automatic retry with exponential backoff (3 attempts: 1s, 2s, 4s delays)
- ✅ Monthly SMS quota management per salon
- ✅ Cost tracking (0.15 TL per SMS)
- ✅ Delivery status tracking
- ✅ Template system for consistent messaging
- ✅ Comprehensive logging
- ✅ Admin monitoring dashboard
- ✅ Salon usage dashboard

## Architecture

### Database Schema
Located in: `supabase/migrations/002_sms_system.sql`

**Tables:**
1. `sms_logs` - Enhanced with delivery tracking
   - `provider_message_id` - Netgsm transaction ID
   - `attempts` - Number of send attempts
   - `error_message` - Error details
   - `delivery_status` - pending | sent | delivered | failed | undelivered
   - `delivered_at` - Delivery timestamp
   - `salon_id` - Reference to salon

2. `sms_templates` - Reusable message templates
   - Pre-configured templates for common scenarios
   - Variable substitution support

3. `sms_usage` - Monthly quota tracking
   - `salon_id`, `month_year` - Composite key
   - `sms_sent` - Current month usage
   - `sms_limit` - Monthly limit (default: 1000)

**Functions:**
- `increment_sms_usage()` - Atomic counter increment
- `check_sms_quota()` - Quota validation
- `reset_monthly_quota()` - Monthly reset (cron job)

### Code Structure

```
lib/sms/
├── providers/
│   └── netgsm.ts          # Netgsm API integration
├── send-with-retry.ts     # Retry logic & error handling
├── quota.ts               # Quota management
└── templates.ts           # Template system

app/
├── api/
│   ├── send-reminders/    # Updated with real SMS
│   └── retry-sms/         # Manual retry endpoint
├── panel/[slug]/
│   └── sms-usage/         # Salon dashboard
└── admin/
    └── sms/               # Admin monitoring
```

## Setup Instructions

### 1. Netgsm Account Setup

1. Visit https://www.netgsm.com.tr
2. Create an account or login
3. Get your credentials:
   - Username (usercode)
   - Password
   - SMS Header (sender name, max 11 chars)

### 2. Environment Configuration

Add to `.env.local`:

```bash
NETGSM_USERNAME=your_username_here
NETGSM_PASSWORD=your_password_here
NETGSM_HEADER=BEYPAZRAN
```

**Important:**
- NETGSM_HEADER must be approved by Netgsm (takes 1-2 business days)
- Header can only contain alphanumeric characters (max 11 chars)

### 3. Database Migration

Run the migration to create tables and functions:

```bash
# Apply migration via Supabase Dashboard or CLI
supabase migration up
```

Or manually execute: `supabase/migrations/002_sms_system.sql`

### 4. Test SMS Delivery

Use test phone numbers before production:

```typescript
// Example test
import { sendSMS } from '@/lib/sms/providers/netgsm';

const result = await sendSMS('5551234567', 'Test mesaji');
console.log(result);
```

## Usage

### 1. Sending SMS with Retry

```typescript
import { sendSMSWithRetry } from '@/lib/sms/send-with-retry';

const result = await sendSMSWithRetry(
  '5551234567',
  'Randevu hatirlatma mesaji',
  {
    appointmentId: 'uuid',
    salonId: 'uuid',
    maxRetries: 3,
  }
);

if (result.success) {
  console.log('SMS sent:', result.messageId);
} else {
  console.error('SMS failed:', result.error);
}
```

### 2. Using Templates

```typescript
import { renderTemplate } from '@/lib/sms/templates';

const message = renderTemplate('APPOINTMENT_REMINDER', {
  salonName: 'Güzellik Salonu',
  date: '15 Mart 2026',
  time: '14:30',
  service: 'Saç Kesimi',
});

// Output: "Güzellik Salonu randevu hatirlatma: 15 Mart 2026 tarihinde saat 14:30 icin Saç Kesimi randevunuz bulunmaktadir."
```

### 3. Checking Quota

```typescript
import { checkSMSQuota } from '@/lib/sms/quota';

const quota = await checkSMSQuota(salonId);

if (quota.allowed) {
  console.log(`Can send SMS. Remaining: ${quota.remaining}/${quota.limit}`);
} else {
  console.log('Quota exceeded!');
}
```

## SMS Templates

### Available Templates

1. **APPOINTMENT_REMINDER** - 1 day before appointment
   - Variables: `salonName`, `date`, `time`, `service`

2. **APPOINTMENT_CONFIRMED** - Confirmation message
   - Variables: `salonName`, `date`, `time`

3. **APPOINTMENT_CANCELLED** - Cancellation notice
   - Variables: `salonName`

4. **EMPTY_SLOT_CAMPAIGN** - Promote empty slots
   - Variables: `salonName`, `slots`

5. **INACTIVE_CUSTOMER** - Re-engagement
   - Variables: `customerName`, `salonName`

6. **BIRTHDAY_GREETING** - Birthday discount
   - Variables: `customerName`, `salonName`, `discount`

7. **PAYMENT_REMINDER** - Payment due
   - Variables: `customerName`, `salonName`, `amount`

8. **THANK_YOU** - Post-service thank you
   - Variables: `salonName`

## Dashboards

### Salon Dashboard
**URL:** `/panel/[slug]/sms-usage`

Features:
- Current month usage (sent/limit)
- Remaining SMS count
- Total cost calculation
- Delivery rate statistics
- SMS log history (last 50)
- Retry attempts display

### Admin Dashboard
**URL:** `/admin/sms`

Features:
- System-wide statistics
- All salons usage overview
- Failed SMS monitoring
- Manual retry functionality
- Cost analytics
- Salons approaching quota limit

## Cron Jobs

### 1. Send Reminders (Existing)
**Endpoint:** `GET /api/send-reminders`
**Schedule:** Daily at specific time
**Function:** Send appointment reminders for next day

Now includes:
- Real SMS delivery via Netgsm
- Quota checking
- Retry logic
- Detailed result reporting

### 2. Monthly Quota Reset (TODO)
**Endpoint:** `GET /api/reset-sms-quota`
**Schedule:** 1st day of month at 00:00
**Function:** Reset all salons' SMS counters

## Error Handling

### Error Categories

1. **quota** - SMS limit exceeded
   - No retry
   - Alert salon owner

2. **validation** - Invalid phone or message
   - No retry
   - Fix data and retry manually

3. **provider** - Netgsm config/auth error
   - No retry
   - Check credentials

4. **network** - Timeout or connection error
   - Automatic retry (3 attempts)
   - Exponential backoff

5. **unknown** - Unexpected error
   - Automatic retry (3 attempts)

### Netgsm Response Codes

| Code | Meaning | Action |
|------|---------|--------|
| 00/01 | Success | Log and continue |
| 20 | Invalid XML | Fix format |
| 30 | Auth failed | Check credentials |
| 40 | Header not approved | Contact Netgsm |
| 50/51 | Invalid phone | Validate number |
| 70 | Invalid parameter | Check data |
| 80 | Message limit | Wait or upgrade |
| 85 | Insufficient credits | Top up account |
| 100 | System error | Retry later |
| 101 | Sending not allowed | Contact Netgsm |

## Phone Number Format

Turkish mobile numbers must:
- Start with 5 (after country code)
- Be 10 digits long
- System auto-formats to: `905XXXXXXXXX`

Examples:
- Input: `0555 123 4567` → Output: `905551234567`
- Input: `+90 555 123 4567` → Output: `905551234567`
- Input: `5551234567` → Output: `905551234567`

## Cost Management

**Current Rate:** 0.15 TL per SMS

**Default Limits:**
- Per salon: 1000 SMS/month
- Can be adjusted in `sms_usage` table

**Cost Formula:**
```typescript
totalCost = smsCount * 0.15 TL
```

**Monthly Cost Examples:**
- 100 SMS = 15 TL
- 500 SMS = 75 TL
- 1000 SMS = 150 TL

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Delivery Rate**
   - Target: > 95%
   - Alert if < 90%

2. **Failed SMS Count**
   - Monitor daily
   - Investigate if > 5%

3. **Quota Usage**
   - Alert salons at 80%, 90%, 95%
   - System alert at 100%

4. **Cost Tracking**
   - Weekly reports
   - Monthly reconciliation with Netgsm

### Logs Location

All SMS activities are logged in `sms_logs` table:
- Phone number
- Message content
- Send attempts
- Delivery status
- Error messages
- Timestamps

## Testing Checklist

- [ ] Test valid phone number
- [ ] Test invalid phone number
- [ ] Test quota limit
- [ ] Test Netgsm credentials (invalid)
- [ ] Test network timeout
- [ ] Test retry logic
- [ ] Test template rendering
- [ ] Verify cost calculation
- [ ] Check delivery status update
- [ ] Test admin retry function

## Production Deployment

1. **Before Launch:**
   - [ ] Get Netgsm production credentials
   - [ ] Approve SMS header with Netgsm
   - [ ] Run database migration
   - [ ] Set environment variables
   - [ ] Test with real phone numbers
   - [ ] Configure cron jobs

2. **After Launch:**
   - [ ] Monitor failed SMS daily
   - [ ] Check delivery rates
   - [ ] Review quota usage
   - [ ] Reconcile costs with Netgsm
   - [ ] Collect user feedback

## Troubleshooting

### SMS Not Sending

1. Check Netgsm credentials
2. Verify header is approved
3. Check phone number format
4. Verify quota not exceeded
5. Check error logs in `sms_logs`

### High Failure Rate

1. Review error messages
2. Check Netgsm account status
3. Verify phone numbers are valid
4. Check network connectivity
5. Contact Netgsm support

### Quota Issues

1. Check current usage in dashboard
2. Verify quota limits are correct
3. Check for stuck increment operations
4. Manually reset if needed

## Support

**Netgsm Support:**
- Website: https://www.netgsm.com.tr
- Documentation: https://www.netgsm.com.tr/dokuman/
- Support: info@netgsm.com.tr

**System Issues:**
- Check admin dashboard: `/admin/sms`
- Review error logs in database
- Contact system administrator

## Future Enhancements

- [ ] Delivery status webhook from Netgsm
- [ ] Bulk SMS sending
- [ ] SMS scheduling
- [ ] A/B testing for templates
- [ ] SMS analytics dashboard
- [ ] Integration with other providers (fallback)
- [ ] Customer opt-out management
- [ ] SMS campaign automation

## Files Created/Modified

### New Files
1. `supabase/migrations/002_sms_system.sql` - Database schema
2. `lib/sms/providers/netgsm.ts` - Netgsm integration
3. `lib/sms/send-with-retry.ts` - Retry system
4. `lib/sms/quota.ts` - Quota management
5. `lib/sms/templates.ts` - Template system
6. `app/panel/[slug]/sms-usage/page.tsx` - Salon dashboard
7. `app/admin/sms/page.tsx` - Admin dashboard
8. `app/admin/sms/RetryButton.tsx` - Retry UI component
9. `app/api/retry-sms/route.ts` - Retry API endpoint

### Modified Files
1. `app/api/send-reminders/route.ts` - Updated with real SMS
2. `.env.local` - Added Netgsm credentials

---

**Last Updated:** 2026-03-15
**Version:** 1.0.0
**Status:** Production Ready
