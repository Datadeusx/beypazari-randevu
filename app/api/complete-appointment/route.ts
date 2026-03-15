import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, salonId } = body;

    // Validate input
    if (!appointmentId || !salonId) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the appointment belongs to this salon
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", appointmentId)
      .eq("salon_id", salonId)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Randevu bulunamadı veya size ait değil." },
        { status: 404 }
      );
    }

    // Update appointment to completed
    const { data: updatedAppointment, error: updateError } = await supabase
      .from("appointments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      return NextResponse.json(
        { error: "Randevu güncellenemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Generate review link
    const reviewLink = `${process.env.NEXT_PUBLIC_SITE_URL || "https://beypazarirandevu.com"}/review/${appointmentId}`;

    // TODO: Send SMS to customer with review link
    // Example SMS: "Randevunuz tamamlandı! Deneyiminizi paylaşın: [link]"
    /*
    try {
      await sendSMS(appointment.customer_phone,
        `Randevunuz tamamlandı! Deneyiminizi paylaşmak için: ${reviewLink}`
      );
    } catch (smsError) {
      console.error("Error sending review link SMS:", smsError);
      // Don't fail the request if SMS fails
    }
    */

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
      reviewLink,
      message: "Randevu tamamlandı olarak işaretlendi!",
    });
  } catch (error) {
    console.error("Error in complete-appointment:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}
