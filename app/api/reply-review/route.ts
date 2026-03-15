import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, replyText, salonId } = body;

    // Validate input
    if (!reviewId || !replyText || !salonId) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the review belongs to this salon
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("salon_id", salonId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Değerlendirme bulunamadı veya size ait değil." },
        { status: 404 }
      );
    }

    // Update review with reply
    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({
        reply_text: replyText.trim(),
        replied_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Yanıt kaydedilemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: "Yanıtınız başarıyla kaydedildi!",
    });
  } catch (error) {
    console.error("Error in reply-review:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}

// Delete reply
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, salonId } = body;

    if (!reviewId || !salonId) {
      return NextResponse.json(
        { error: "Gerekli alanlar eksik." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify the review belongs to this salon
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .eq("salon_id", salonId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "Değerlendirme bulunamadı veya size ait değil." },
        { status: 404 }
      );
    }

    // Remove reply
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        reply_text: null,
        replied_at: null,
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Error removing reply:", updateError);
      return NextResponse.json(
        { error: "Yanıt silinemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Yanıt başarıyla silindi!",
    });
  } catch (error) {
    console.error("Error in delete reply:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}
