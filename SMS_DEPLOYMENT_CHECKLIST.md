# SMS System Deployment Checklist

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run migration: `supabase/migrations/002_sms_system.sql`
- [ ] Verify tables exist: `sms_logs`, `sms_templates`, `sms_usage`
- [ ] Verify functions exist: `increment_sms_usage`, `check_sms_quota`, `reset_monthly_quota`
- [ ] Check indexes are created
- [ ] Verify default templates are inserted (8 templates)

**Verification:**
```bash
curl http://localhost:3000/api/setup-sms
```

### 2. Netgsm Account Setup
- [ ] Create Netgsm account at https://www.netgsm.com.tr
- [ ] Get username (usercode)
- [ ] Get password
- [ ] Request SMS header approval (company name, max 11 chars)
- [ ] Wait for header approval (1-2 business days)
- [ ] Add credits to account
- [ ] Test credentials with test phone

### 3. Environment Variables
- [ ] Set `NETGSM_USERNAME` in production `.env`
- [ ] Set `NETGSM_PASSWORD` in production `.env`
- [ ] Set `NETGSM_HEADER` (approved header name)
- [ ] Verify `ADMIN_EMAIL` is set
- [ ] Verify `CRON_SECRET` is set

**File:** `.env.local` (development) or `.env` (production)
```bash
NETGSM_USERNAME=your_username
NETGSM_PASSWORD=your_password
NETGSM_HEADER=BEYPAZRAN
```

### 4. Testing

#### Test 1: Setup Verification
- [ ] Visit `/api/setup-sms`
- [ ] Verify `database.status: "ready"`
- [ ] Verify `netgsm.status: "configured"`

#### Test 2: Phone Validation
- [ ] Test valid number: `5551234567`
- [ ] Test invalid number: `1234567`
- [ ] Test formatted number: `0555 123 4567`

#### Test 3: SMS Sending (use your phone!)
- [ ] Send test SMS via `/api/test-sms`
- [ ] Verify SMS received on phone
- [ ] Check `sms_logs` table for entry
- [ ] Verify message ID recorded

#### Test 4: Template Rendering
- [ ] Test all 8 templates
- [ ] Verify variable substitution works
- [ ] Check Turkish character encoding

#### Test 5: Quota System
- [ ] Check quota for test salon
- [ ] Send SMS and verify counter increments
- [ ] Test quota limit enforcement

#### Test 6: Retry Logic
- [ ] Simulate network error (disconnect internet)
- [ ] Verify retry attempts logged
- [ ] Check exponential backoff timing

#### Test 7: Dashboards
- [ ] Access salon dashboard: `/panel/[slug]/sms-usage`
- [ ] Verify usage stats display
- [ ] Check SMS logs appear
- [ ] Access admin dashboard: `/admin/sms`
- [ ] Verify all salons visible
- [ ] Test manual retry button

### 5. Cron Jobs Setup

#### Reminder Cron (Daily)
- [ ] Configure cron to call `/api/send-reminders`
- [ ] Set schedule: Daily at desired time (e.g., 10:00 AM)
- [ ] Add `Authorization: Bearer CRON_SECRET` header
- [ ] Test manual trigger
- [ ] Verify SMS sent for next-day appointments

**Vercel Cron Config:**
```json
{
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}
```

#### Monthly Quota Reset (TODO - Optional)
- [ ] Create `/api/reset-sms-quota` endpoint
- [ ] Configure cron: 1st day of month at 00:00
- [ ] Test on staging first

### 6. Initial Salon Setup
- [ ] Set SMS limits for each salon in `sms_usage` table
- [ ] Default is 1000/month - adjust if needed
- [ ] Notify salon owners about SMS feature
- [ ] Provide dashboard URL
- [ ] Explain quota system

**SQL to set custom limit:**
```sql
INSERT INTO sms_usage (salon_id, month_year, sms_limit, sms_sent)
VALUES ('salon-uuid', '2026-03', 2000, 0)
ON CONFLICT (salon_id, month_year)
DO UPDATE SET sms_limit = 2000;
```

### 7. Monitoring Setup
- [ ] Set up alerts for failed SMS (> 5%)
- [ ] Monitor delivery rate daily (target > 95%)
- [ ] Track quota usage (alert at 80%)
- [ ] Set up cost tracking
- [ ] Create weekly SMS report

**Key Metrics:**
- Total SMS sent
- Delivery rate
- Failed SMS count
- Average cost per salon
- Salons near quota limit

### 8. Documentation
- [ ] Share `SMS_QUICK_START.md` with team
- [ ] Document Netgsm credentials location (secure)
- [ ] Create incident response plan for SMS failures
- [ ] Document escalation path for quota issues

## Deployment Steps

### Step 1: Deploy Code
```bash
# Commit all changes
git add .
git commit -m "Add production SMS infrastructure"
git push origin main

# Deploy to production (Vercel auto-deploys)
```

### Step 2: Apply Database Migration
```bash
# Option 1: Supabase Dashboard
# - Go to SQL Editor
# - Copy/paste supabase/migrations/002_sms_system.sql
# - Execute

# Option 2: Supabase CLI
supabase db push
```

### Step 3: Set Environment Variables
```bash
# Vercel Dashboard
# Project > Settings > Environment Variables
# Add:
# - NETGSM_USERNAME
# - NETGSM_PASSWORD
# - NETGSM_HEADER

# Redeploy after adding env vars
vercel --prod
```

### Step 4: Verify Production
```bash
# Check setup
curl https://your-domain.com/api/setup-sms

# Send test SMS (use real phone)
curl -X POST https://your-domain.com/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"YOUR_PHONE","message":"Production test"}'
```

### Step 5: Configure Cron
```bash
# Add to vercel.json
{
  "crons": [
    {
      "path": "/api/send-reminders",
      "schedule": "0 10 * * *"
    }
  ]
}

# Commit and deploy
git add vercel.json
git commit -m "Add SMS reminder cron job"
git push
```

## Post-Deployment Checklist

### Day 1
- [ ] Monitor first reminder batch
- [ ] Check delivery rates
- [ ] Review error logs
- [ ] Verify quota increments
- [ ] Test manual retry for failures

### Week 1
- [ ] Daily SMS report review
- [ ] Track delivery success rate
- [ ] Monitor Netgsm credits
- [ ] Check salon feedback
- [ ] Optimize templates if needed

### Month 1
- [ ] Reconcile costs with Netgsm
- [ ] Review quota usage patterns
- [ ] Adjust limits if needed
- [ ] Analyze template performance
- [ ] Plan enhancements

## Rollback Plan

If issues occur:

### 1. Disable SMS Sending
```sql
-- Stop reminder cron temporarily
-- Or set all quotas to 0
UPDATE sms_usage SET sms_limit = 0;
```

### 2. Revert Code
```bash
git revert HEAD
git push origin main
```

### 3. Keep Logs
Don't delete `sms_logs` - keep for debugging

## Cost Management

### Initial Setup
- [ ] Add credits to Netgsm account
- [ ] Estimate monthly costs (salons × limit × 0.15 TL)
- [ ] Set budget alerts
- [ ] Plan for quota adjustments

**Example Monthly Cost:**
- 10 salons × 500 SMS × 0.15 TL = 750 TL/month

### Ongoing
- [ ] Weekly credit check
- [ ] Monthly reconciliation
- [ ] Cost per salon report
- [ ] ROI analysis (appointments kept vs cost)

## Support Plan

### User Support
- [ ] Create FAQ for salons
- [ ] Document how to view SMS history
- [ ] Explain quota limits
- [ ] Provide contact for quota increases

### Technical Support
- [ ] Monitor error logs daily
- [ ] Set up alerts for system issues
- [ ] Define SLA for SMS delivery
- [ ] Create escalation process

### Netgsm Support
- [ ] Save Netgsm support contacts
- [ ] Document account details
- [ ] Know how to add credits
- [ ] Understand their SLA

## Success Metrics

### Technical Metrics
- **Delivery Rate:** > 95%
- **Failed SMS:** < 5%
- **Average Retry:** < 1.2 attempts
- **API Response Time:** < 2 seconds

### Business Metrics
- **Appointment No-Shows:** Track reduction
- **SMS ROI:** Calculate value
- **Customer Satisfaction:** Survey feedback
- **System Uptime:** > 99.5%

## Emergency Contacts

- **Netgsm Support:** info@netgsm.com.tr
- **Netgsm Docs:** https://www.netgsm.com.tr/dokuman/
- **System Admin:** [Your email]
- **Escalation:** [Manager email]

## Final Checks

- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Backup plan ready
- [ ] Success metrics defined
- [ ] Go/No-Go decision made

## Go Live Decision

**Criteria for Go-Live:**
- ✅ All deployment checklist items complete
- ✅ Test SMS successfully delivered
- ✅ Netgsm header approved
- ✅ Cron jobs configured
- ✅ Monitoring in place
- ✅ Team ready to support

**Sign-off Required:**
- [ ] Tech Lead: ________________
- [ ] Product Owner: ________________
- [ ] System Admin: ________________

---

**Date:** _____________
**Deployed By:** _____________
**Production URL:** _____________
**Status:** [ ] Not Started [ ] In Progress [ ] Complete

