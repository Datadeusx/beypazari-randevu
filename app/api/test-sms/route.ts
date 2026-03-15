import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMS, validatePhoneNumber, getSMSInfo } from "@/lib/sms/providers/netgsm";

/**
 * Test SMS Sending Endpoint
 * For testing SMS functionality without retry logic
 *
 * Usage: POST /api/test-sms
 * Body: { phone: "5551234567", message: "Test message" }
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone and message are required",
        },
        { status: 400 }
      );
    }

    // Validate phone number
    const isValidPhone = validatePhoneNumber(phone);
    if (!isValidPhone) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid Turkish phone number. Must be 10 digits starting with 5.",
        },
        { status: 400 }
      );
    }

    // Get SMS info
    const smsInfo = getSMSInfo(message);

    // Send SMS
    const result = await sendSMS(phone, message);

    // Log the test
    await supabase.from("sms_logs").insert({
      phone,
      message,
      status: result.success ? "sent" : "failed",
      delivery_status: result.success ? "sent" : "failed",
      provider_message_id: result.messageId || null,
      error_message: result.error || null,
      attempts: 1,
    });

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      errorCode: result.errorCode,
      smsInfo: {
        length: smsInfo.length,
        parts: smsInfo.parts,
        hasTurkishChars: smsInfo.hasTurkishChars,
        estimatedCost: smsInfo.parts * 0.15,
      },
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

/**
 * Get SMS test info
 * For validating phone numbers and message info without sending
 *
 * Usage: GET /api/test-sms?phone=5551234567&message=Test
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

    const searchParams = request.nextUrl.searchParams;
    const phone = searchParams.get("phone");
    const message = searchParams.get("message");

    if (!phone || !message) {
      return NextResponse.json(
        {
          success: false,
          error: "Phone and message query parameters are required",
        },
        { status: 400 }
      );
    }

    // Validate phone number
    const isValidPhone = validatePhoneNumber(phone);

    // Get SMS info
    const smsInfo = getSMSInfo(message);

    // Check Netgsm config
    const netgsmConfigured = !!(
      process.env.NETGSM_USERNAME && process.env.NETGSM_PASSWORD
    );

    return NextResponse.json({
      success: true,
      phone: {
        input: phone,
        valid: isValidPhone,
      },
      message: {
        content: message,
        length: smsInfo.length,
        parts: smsInfo.parts,
        hasTurkishChars: smsInfo.hasTurkishChars,
      },
      cost: {
        perSMS: 0.15,
        total: smsInfo.parts * 0.15,
        currency: "TL",
      },
      netgsm: {
        configured: netgsmConfigured,
        header: process.env.NETGSM_HEADER || "BEYPAZRAN",
      },
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
