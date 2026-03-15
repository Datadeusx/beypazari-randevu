import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const salonId = body?.salonId;
    const message = (body?.message || "").trim();

    if (!salonId) {
      return NextResponse.json(
        { success: false, error: "salonId gerekli." },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Mesaj gerekli." },
        { status: 400 }
      );
    }

    const now = new Date();

    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0
    ).toISOString();

    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999
    ).toISOString();

    const days30Ago = new Date();
    days30Ago.setDate(days30Ago.getDate() - 30);

    const days60Ago = new Date();
    days60Ago.setDate(days60Ago.getDate() - 60);

    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .select(
        "id, phone, name, sms_marketing_opt_in, last_appointment_at, visit_count"
      )
      .eq("salon_id", salonId)
      .eq("sms_marketing_opt_in", true)
      .gte("last_appointment_at", days60Ago.toISOString())
      .lte("last_appointment_at", days30Ago.toISOString());

    if (customersError) {
      return NextResponse.json(
        { success: false, error: customersError.message },
        { status: 500 }
      );
    }

    const eligibleCustomers = (customers || []).filter(
      (customer: any) => customer.phone && String(customer.phone).trim() !== ""
    );

    let sentCount = 0;
    let skippedCount = 0;

    for (const customer of eligibleCustomers) {
      const phone = String(customer.phone).trim();

      const { data: existingCampaignLog, error: existingLogError } = await supabase
        .from("sms_logs")
        .select("id")
        .eq("phone", phone)
        .gte("created_at", todayStart)
        .lte("created_at", todayEnd)
        .ilike("message", "[KAMPANYA]%")
        .limit(1)
        .maybeSingle();

      if (existingLogError) {
        return NextResponse.json(
          { success: false, error: existingLogError.message },
          { status: 500 }
        );
      }

      if (existingCampaignLog) {
        skippedCount += 1;
        continue;
      }

      const finalMessage = `[KAMPANYA] ${message}`;

      const { error: logError } = await supabase.from("sms_logs").insert({
        phone,
        message: finalMessage,
        status: "sent",
      });

      if (!logError) {
        sentCount += 1;
      }
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      skipped_count: skippedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}