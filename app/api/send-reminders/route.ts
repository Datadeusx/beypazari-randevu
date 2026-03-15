import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
        salons ( name )
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
    const reminders: any[] = [];
    let sentCount = 0;

    for (const appointment of appointments) {
      const service = Array.isArray(appointment.services)
        ? appointment.services[0]
        : appointment.services;

      const salon = Array.isArray(appointment.salons)
        ? appointment.salons[0]
        : appointment.salons;

      const phone = appointment.customer_phone?.trim();
      if (!phone) continue;

      const salonName = salon?.name || "Salon";
      const serviceName = service?.name || "Hizmet";

      const message = `${salonName} randevu hatirlatma: ${formatDateTR(
        appointment.appointment_time
      )} tarihinde saat ${formatTimeTR(
        appointment.appointment_time
      )} icin ${serviceName} randevunuz bulunmaktadir.`;

      const { error: logError } = await supabase.from("sms_logs").insert({
        appointment_id: appointment.id,
        phone: phone,
        message: message,
        status: "sent",
      });

      if (logError) {
        return NextResponse.json(
          {
            success: false,
            error: "sms_logs insert hatasi: " + logError.message,
          },
          { status: 500 }
        );
      }

      reminders.push({
        appointment_id: appointment.id,
        phone,
        message,
      });

      sentCount++;
    }

    return NextResponse.json({
      success: true,
      sent_count: sentCount,
      reminders,
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