import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkReviewEligibility } from "@/lib/reviews/check-eligibility";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, customerPhone, rating, comment } = body;

    // Validate input
    if (!appointmentId || !customerPhone) {
      return NextResponse.json(
        { error: "Randevu ID ve telefon numarası gereklidir." },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Geçerli bir puan seçiniz (1-5 yıldız)." },
        { status: 400 }
      );
    }

    // Check eligibility
    const eligibility = await checkReviewEligibility(
      appointmentId,
      customerPhone
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        { error: eligibility.reason },
        { status: 400 }
      );
    }

    if (!eligibility.appointmentDetails) {
      return NextResponse.json(
        { error: "Randevu bilgileri alınamadı." },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .insert({
        salon_id: eligibility.appointmentDetails.salon_id,
        appointment_id: appointmentId,
        customer_name: eligibility.appointmentDetails.customer_name,
        customer_phone: eligibility.appointmentDetails.customer_phone,
        rating: Number(rating),
        comment: comment?.trim() || null,
        is_verified: true, // Verified because it's from a completed appointment
        is_published: false, // Requires admin approval
      })
      .select()
      .single();

    if (reviewError) {
      console.error("Error creating review:", reviewError);
      return NextResponse.json(
        { error: "Değerlendirme kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    // Mark appointment as reviewed
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ has_review: true })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      // Don't fail the request, review is already created
    }

    // TODO: Send notification to salon owner (optional)
    // await notifySalonOwner(eligibility.appointmentDetails.salon_id, review);

    return NextResponse.json({
      success: true,
      review,
      message:
        "Değerlendirmeniz başarıyla kaydedildi! İncelendikten sonra yayınlanacaktır.",
    });
  } catch (error) {
    console.error("Error in submit-review:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}
