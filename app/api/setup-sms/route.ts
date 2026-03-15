import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Setup SMS System - Run Database Migration
 * This endpoint helps verify and setup the SMS system tables
 *
 * Usage: GET /api/setup-sms?secret=YOUR_ADMIN_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 401 }
      );
    }

    const checks: any[] = [];

    // Check if sms_logs table exists and has new columns
    const { data: smsLogsCheck, error: smsLogsError } = await supabase
      .from('sms_logs')
      .select('id, provider_message_id, attempts, delivery_status')
      .limit(1);

    checks.push({
      table: 'sms_logs',
      status: smsLogsError ? 'error' : 'ok',
      message: smsLogsError ? smsLogsError.message : 'Table exists with enhanced columns',
    });

    // Check if sms_templates table exists
    const { data: templatesCheck, error: templatesError } = await supabase
      .from('sms_templates')
      .select('id, name')
      .limit(1);

    checks.push({
      table: 'sms_templates',
      status: templatesError ? 'error' : 'ok',
      message: templatesError ? templatesError.message : 'Table exists',
      count: templatesCheck?.length || 0,
    });

    // Check if sms_usage table exists
    const { data: usageCheck, error: usageError } = await supabase
      .from('sms_usage')
      .select('id, salon_id')
      .limit(1);

    checks.push({
      table: 'sms_usage',
      status: usageError ? 'error' : 'ok',
      message: usageError ? usageError.message : 'Table exists',
      count: usageCheck?.length || 0,
    });

    // Check if RPC functions exist
    try {
      const { error: rpcError1 } = await supabase.rpc('check_sms_quota', {
        p_salon_id: '00000000-0000-0000-0000-000000000000',
        p_month_year: '2026-03',
      });

      checks.push({
        function: 'check_sms_quota',
        status: rpcError1 ? 'error' : 'ok',
        message: rpcError1 ? rpcError1.message : 'Function exists and callable',
      });
    } catch (err: any) {
      checks.push({
        function: 'check_sms_quota',
        status: 'error',
        message: err.message,
      });
    }

    try {
      const { error: rpcError2 } = await supabase.rpc('increment_sms_usage', {
        p_salon_id: '00000000-0000-0000-0000-000000000000',
        p_month_year: '2026-03',
      });

      checks.push({
        function: 'increment_sms_usage',
        status: rpcError2 ? 'error' : 'ok',
        message: rpcError2 ? rpcError2.message : 'Function exists and callable',
      });
    } catch (err: any) {
      checks.push({
        function: 'increment_sms_usage',
        status: 'error',
        message: err.message,
      });
    }

    // Check Netgsm credentials
    const netgsmChecks = {
      username: !!process.env.NETGSM_USERNAME,
      password: !!process.env.NETGSM_PASSWORD,
      header: process.env.NETGSM_HEADER || 'BEYPAZRAN',
    };

    const allChecksPass = checks.every(check => check.status === 'ok');
    const netgsmConfigured = netgsmChecks.username && netgsmChecks.password;

    return NextResponse.json({
      success: allChecksPass && netgsmConfigured,
      database: {
        status: allChecksPass ? 'ready' : 'needs_migration',
        checks,
      },
      netgsm: {
        status: netgsmConfigured ? 'configured' : 'not_configured',
        username_set: netgsmChecks.username,
        password_set: netgsmChecks.password,
        header: netgsmChecks.header,
      },
      next_steps: !allChecksPass
        ? [
            'Run the database migration: supabase/migrations/002_sms_system.sql',
            'Execute the SQL in Supabase Dashboard > SQL Editor',
            'Or use Supabase CLI: supabase db push',
          ]
        : !netgsmConfigured
        ? [
            'Set NETGSM_USERNAME in .env.local',
            'Set NETGSM_PASSWORD in .env.local',
            'Get credentials from https://www.netgsm.com.tr',
          ]
        : [
            'System is ready!',
            'Test SMS sending with: /api/test-sms',
            'Access admin dashboard: /admin/sms',
          ],
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
