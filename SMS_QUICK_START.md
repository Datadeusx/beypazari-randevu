# SMS System - Quick Start Guide

## 5-Minute Setup

### Step 1: Apply Database Migration

**Option A: Supabase Dashboard**
1. Open https://supabase.com/dashboard
2. Navigate to your project
3. Go to SQL Editor
4. Copy content from `supabase/migrations/002_sms_system.sql`
5. Paste and run

**Option B: Supabase CLI**
```bash
supabase db push
```

### Step 2: Configure Netgsm Credentials

1. Get credentials from https://www.netgsm.com.tr
2. Update `.env.local`:

```bash
NETGSM_USERNAME=your_username
NETGSM_PASSWORD=your_password
NETGSM_HEADER=BEYPAZRAN
```

3. Restart development server:
```bash
npm run dev
```

### Step 3: Verify Setup

Visit: http://localhost:3000/api/setup-sms

Should return:
```json
{
  "success": true,
  "database": { "status": "ready" },
  "netgsm": { "status": "configured" }
}
```

### Step 4: Test SMS Sending

**GET request (validation only):**
```bash
curl "http://localhost:3000/api/test-sms?phone=5551234567&message=Test"
```

**POST request (actually send SMS):**
```bash
curl -X POST http://localhost:3000/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone":"5551234567","message":"Test mesaji"}'
```

### Step 5: Access Dashboards

**Salon Dashboard:**
http://localhost:3000/panel/[your-salon-slug]/sms-usage

**Admin Dashboard:**
http://localhost:3000/admin/sms

## Common Issues

### Issue: "NETGSM credentials not configured"
**Solution:** Set NETGSM_USERNAME and NETGSM_PASSWORD in `.env.local`

### Issue: "Invalid username, password or header"
**Solution:**
- Verify credentials at https://www.netgsm.com.tr
- Ensure NETGSM_HEADER is approved (takes 1-2 days)

### Issue: "SMS quota exceeded"
**Solution:**
- Check current usage: `/panel/[slug]/sms-usage`
- Increase limit in `sms_usage` table
- Or wait for monthly reset

### Issue: Database functions not found
**Solution:** Run the migration SQL file again

## Next Steps

1. ✅ Setup complete? Test with real phone number
2. ✅ Configure cron job for `/api/send-reminders`
3. ✅ Monitor SMS logs in admin dashboard
4. ✅ Set up alerts for quota limits
5. ✅ Review cost reports monthly

## Need Help?

- Full documentation: See `SMS_SYSTEM_README.md`
- Netgsm docs: https://www.netgsm.com.tr/dokuman/
- System admin: Check `/admin/sms` dashboard

---

**Setup Time:** ~5 minutes
**Status:** Production Ready
**Last Updated:** 2026-03-15
