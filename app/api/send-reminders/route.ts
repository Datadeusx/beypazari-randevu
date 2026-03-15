import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendSMSWithRetry } from "@/lib/sms/send-with-retry";
import { renderTemplate } from "@/lib/sms/templates";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatDateTR(dateString: string) {
  return new Date(dateString).toLocaleDateString("tr-TR");
}

function formatTimeTR(dateString: string) {
  return new Date(dateString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "CRON_SECRET tanimli degil.",
        },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          success: false,
          error: "Yetkisiz istek.",
        },
        { status: 401 }
      );
    }

    const supabase = await createClient();

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    const tomorrowDate = `${tomorrow.getFullYear()}-${pad(
      tomorrow.getMonth() + 1
    )}-${pad(tomorrow.getDate())}`;

    const nextDay = new Date(tomorrow);
    nextDay.setDate(tomorrow.getDate() + 1);

    const nextDayDate = `${nextDay.getFullYear()}-${pad(
      nextDay.getMonth() + 1
    )}-${pad(nextDay.getDate())}`;

    const startLocal = `${tomorrowDate}T00:00:00`;
    const endLocal = `${nextDayDate}T00:00:00`;

    const { data, error } = await supabase
      .from("appointments")
      .select(
        `
        id,
        appointment_time,
        customer_phone,
        status,
        services ( name ),
        salons ( id, name )
      `
      )
      .gte("appointment_time", startLocal)
      .lt("appointment_time", endLocal)
      .neq("status", "cancelled")
      .order("appointment_time", { ascending: true });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      );
    }

    const appointments = (data || []) as any[];
    const results: any[] = [];
    let sentCount = 0;
    let failedCount = 0;

    for (const appointment of appointments) {
      const service = Array.isArray(appointment.services)
        ? appointment.services[0]
        : appointment.services;

      const salon = Array.isArray(appointment.salons)
        ? appointment.salons[0]
        : appointment.salons;

      const phone = appointment.customer_phone?.trim();
      if (!phone) {
        results.push({
          appointment_id: appointment.id,
          status: 'skipped',
          reason: 'No phone number',
        });
        continue;
      }

      const salonId = salon?.id;
      const salonName = salon?.name || "Salon";
      const serviceName = service?.name || "Hizmet";

      // Use template system for consistent messaging
      const message = renderTemplate('APPOINTMENT_REMINDER', {
        salonName,
        date: formatDateTR(appointment.appointment_time),
        time: formatTimeTR(appointment.appointment_time),
        service: serviceName,
      });

      // Send SMS with retry logic and quota checking
      const smsResult = await sendSMSWithRetry(phone, message, {
        appointmentId: appointment.id,
        salonId,
        maxRetries: 3,
      });

      if (smsResult.success) {
        sentCount++;
        results.push({
          appointment_id: appointment.id,
          phone,
          status: 'sent',
          message_id: smsResult.messageId,
          attempts: smsResult.attempts,
        });
      } else {
        failedCount++;
        results.push({
          appointment_id: appointment.id,
          phone,
          status: 'failed',
          error: smsResult.error,
          error_category: smsResult.errorCategory,
          attempts: smsResult.attempts,
        });
      }
    }

    return NextResponse.json({
      success: true,
      total_appointments: appointments.length,
      sent_count: sentCount,
      failed_count: failedCount,
      results,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}