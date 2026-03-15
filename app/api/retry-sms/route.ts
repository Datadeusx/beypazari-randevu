import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrySMS } from "@/lib/sms/send-with-retry";

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
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { logId } = body;

    if (!logId) {
      return NextResponse.json(
        {
          success: false,
          error: "Log ID is required",
        },
        { status: 400 }
      );
    }

    // Retry the SMS
    const result = await retrySMS(logId);

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      attempts: result.attempts,
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
