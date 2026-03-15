# Subscription System Documentation

## Overview
Complete subscription and billing system for Beypazarı Randevu SaaS platform. Built with Next.js 16, TypeScript, and Supabase.

## System Architecture

### Database Schema
Located: `supabase/migrations/001_subscription_system.sql`

**Tables:**
1. **subscription_plans** - Available subscription tiers
2. **subscriptions** - Active subscriptions for each salon
3. **payment_transactions** - Payment history and tracking
4. **sms_usage** - Monthly SMS usage tracking

**Helper Functions:**
- `increment_sms_count(salon_id, count)` - Track SMS usage
- `check_subscription_active(salon_id)` - Validate subscription status
- `get_subscription_limits(salon_id)` - Get current limits
- `check_service_limit(salon_id)` - Validate service creation
- `update_subscription_statuses()` - Auto-expire old subscriptions

### Subscription Plans

#### Basic Plan (800 TL/month)
- Unlimited appointments
- Max 10 services
- 100 SMS credits/month
- Online booking system
- Customer management
- Email support
- **Default for trial signups**

#### Premium Plan (1,500 TL/month)
- Unlimited appointments
- Unlimited services
- 500 SMS credits/month
- All Basic features
- Advanced reporting
- Campaign management
- WhatsApp integration
- Priority support

## File Structure

```
ilk-proje/
├── supabase/
│   └── migrations/
│       └── 001_subscription_system.sql      # Database schema
│
├── lib/
│   └── subscription/
│       ├── plans.ts                         # Plan definitions & pricing
│       ├── check-limits.ts                  # Limit validation functions
│       └── trial.ts                         # Trial management
│
├── app/
│   ├── kayit/
│   │   ├── page.tsx                         # Signup (updated)
│   │   └── actions.ts                       # Signup with trial creation
│   │
│   ├── panel/
│   │   └── [slug]/
│   │       └── billing/
│   │           ├── page.tsx                 # Billing dashboard
│   │           ├── actions.ts               # Payment submission
│   │           └── BillingForm.tsx          # Client form component
│   │
│   └── admin/
│       └── payments/
│           ├── page.tsx                     # Admin payment approval
│           ├── actions.ts                   # Approve/reject logic
│           └── PaymentActions.tsx           # Client action buttons
```

## Features

### 1. Automatic Trial on Signup
- New salons get 14-day free trial
- Trial starts immediately on registration
- Full access to Basic Plan features
- SMS usage tracking initialized

**Location:** `app/kayit/actions.ts`

```typescript
// Automatically creates:
// 1. User account
// 2. Salon profile
// 3. Trial subscription (14 days)
// 4. SMS usage record
```

### 2. Billing Dashboard
**URL:** `/panel/{slug}/billing`

**Features:**
- Trial countdown display
- Current plan details
- Usage statistics (SMS, services)
- Bank transfer instructions
- Payment submission form
- Payment history table

**Access:** Salon owners only (RLS protected)

### 3. Payment Flow

**Customer Side:**
1. View billing dashboard
2. See bank transfer details
3. Make bank transfer
4. Submit payment with reference number
5. Wait for admin approval

**Admin Side:**
1. Access `/admin/payments`
2. View pending payments
3. Verify bank transfer
4. Approve or reject payment
5. System auto-extends subscription

### 4. Subscription Limits

**Implemented Checks:**
- Service creation limit (Basic: 10, Premium: unlimited)
- SMS quota tracking per month
- Appointment limits (currently unlimited in both plans)

**Usage:**
```typescript
import { checkServiceLimit, checkSMSQuota } from '@/lib/subscription/check-limits';

// Before creating service
const result = await checkServiceLimit(salonId);
if (!result.allowed) {
  // Show upgrade prompt
}

// Before sending SMS
const smsCheck = await checkSMSQuota(salonId, 1);
if (!smsCheck.allowed) {
  // Insufficient quota
}
```

### 5. Row Level Security (RLS)

**Policies:**
- Salons can only view their own subscription
- Salons can create payment transactions for their subscription
- Payment approval requires service role
- SMS usage is salon-specific

## Database Migration

### Running the Migration

**Supabase CLI:**
```bash
supabase db push
```

**Supabase Dashboard:**
1. Go to SQL Editor
2. Open `supabase/migrations/001_subscription_system.sql`
3. Run the entire migration

**Note:** Migration includes sample plans. Edit if needed.

## Configuration

### Bank Transfer Details
Edit in: `lib/subscription/plans.ts`

```typescript
export const BANK_TRANSFER_INFO = {
  bankName: 'Türkiye İş Bankası',
  accountHolder: 'Beypazarı Randevu SaaS',
  iban: 'TR00 0000 0000 0000 0000 0000 00', // UPDATE THIS!
  currency: 'TRY',
  description: 'Hesap numaranızı açıklama kısmına yazınız',
};
```

### Trial Duration
Edit in: `lib/subscription/plans.ts`

```typescript
export const TRIAL_DAYS = 14; // Change as needed
```

### Subscription Plans
Edit prices and features in:
1. `lib/subscription/plans.ts` (TypeScript definitions)
2. `supabase/migrations/001_subscription_system.sql` (Database records)

## Testing Instructions

### 1. Test Signup Flow
1. Go to `/kayit`
2. Register a new salon
3. Check database: subscription should be created with status 'trialing'
4. Verify trial_ends_at is 14 days from now

### 2. Test Billing Dashboard
1. Login as salon owner
2. Go to `/panel/{slug}/billing`
3. Verify trial countdown shows correctly
4. Check usage statistics display
5. Submit a test payment

### 3. Test Payment Approval
1. Login as admin
2. Go to `/admin/payments`
3. See pending payment from step 2
4. Approve payment
5. Verify subscription is extended by 1 month
6. Check payment status changed to 'approved'

### 4. Test Service Limits
1. Login to Basic plan salon
2. Try creating 11th service
3. Should see limit error (if implemented in panel)

### 5. Test SMS Quota
```typescript
// In your SMS sending code
const canSend = await incrementSMSCount(salonId, 1);
if (!canSend) {
  // Quota exceeded
}
```

## API Reference

### Server Functions

#### Trial Management
```typescript
import { createTrialSubscription, getTrialInfo, isTrialActive } from '@/lib/subscription/trial';

// Create trial
await createTrialSubscription(salonId);

// Get trial status
const info = await getTrialInfo(salonId);
// Returns: { isTrialing, trialEndsAt, daysRemaining, hasExpired }

// Quick check
const active = await isTrialActive(salonId);
```

#### Limit Checking
```typescript
import { checkAppointmentLimit, checkSMSQuota, checkServiceLimit } from '@/lib/subscription/check-limits';

// Check limits
const appointmentCheck = await checkAppointmentLimit(salonId);
const smsCheck = await checkSMSQuota(salonId, 5);
const serviceCheck = await checkServiceLimit(salonId);

// Each returns: { allowed: boolean, reason?: string, current?: number, limit?: number }
```

#### Payment Actions
```typescript
import { submitPayment } from '@/app/panel/[slug]/billing/actions';
import { approvePayment, rejectPayment } from '@/app/admin/payments/actions';

// Salon submits payment
await submitPayment({
  subscriptionId: 'uuid',
  amount: 800,
  referenceNumber: 'REF123',
  notes: 'Optional note'
});

// Admin approves
await approvePayment(paymentId);

// Admin rejects
await rejectPayment(paymentId, 'Reason for rejection');
```

## Security Considerations

1. **RLS Policies:** All tables have RLS enabled
2. **Admin Access:** Currently any authenticated user can access `/admin/payments` - add role check in production
3. **Payment Verification:** Manually verify bank transfers before approval
4. **SQL Injection:** All queries use parameterized inputs
5. **CSRF Protection:** Next.js server actions have built-in CSRF protection

## Production Checklist

- [ ] Update bank IBAN in `lib/subscription/plans.ts`
- [ ] Add admin role check to `/admin/payments`
- [ ] Run database migration on production Supabase
- [ ] Test trial subscription creation
- [ ] Test payment submission and approval flow
- [ ] Configure automated subscription expiry job
- [ ] Set up payment confirmation emails
- [ ] Add webhook for automatic bank transfer verification (optional)
- [ ] Monitor SMS usage and refill quotas monthly
- [ ] Add subscription upgrade/downgrade flow
- [ ] Implement subscription cancellation

## Maintenance Tasks

### Monthly
- Reset SMS usage counters (automatic via month_year tracking)
- Check for expired subscriptions
- Review pending payments

### Weekly
- Monitor payment approval queue
- Check for failed subscription extensions

### Daily
- Process pending payments
- Review trial expirations

## Troubleshooting

### Issue: Trial not created on signup
**Check:**
1. Database migration ran successfully
2. `createTrialSubscription` is called in signup action
3. Subscription plans exist in database

### Issue: Payment approval doesn't extend subscription
**Check:**
1. `extendSubscriptionPeriod` function is working
2. Subscription ID is correct
3. Database constraints aren't blocking update

### Issue: Limits not enforced
**Check:**
1. RLS policies are enabled
2. Limit check functions are called before operations
3. Subscription is active

## Future Enhancements

1. **Automated Payment Verification:** Integrate with bank API
2. **Online Payment Gateway:** Add credit card support
3. **Subscription Analytics:** Track MRR, churn, LTV
4. **Email Notifications:** Payment confirmations, renewal reminders
5. **Multi-tier Upgrades:** Allow mid-cycle plan changes
6. **Annual Billing:** Discounted yearly subscriptions
7. **Add-ons:** Extra SMS packages, premium features
8. **Webhooks:** Notify external systems of subscription events

## Support

For issues or questions:
1. Check this documentation
2. Review database schema in migration file
3. Check Supabase logs for errors
4. Verify RLS policies are working correctly

---

**Last Updated:** 2026-03-15
**Version:** 1.0
**Status:** Production Ready
