import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { reviewId, isPublished, salonId } = body;

    // Validate input
    if (!reviewId || typeof isPublished !== "boolean" || !salonId) {
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

    // Update review publication status
    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({
        is_published: isPublished,
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating review:", updateError);
      return NextResponse.json(
        { error: "Değerlendirme güncellenemedi. Lütfen tekrar deneyin." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      review: updatedReview,
      message: isPublished
        ? "Değerlendirme yayınlandı!"
        : "Değerlendirme yayından kaldırıldı.",
    });
  } catch (error) {
    console.error("Error in approve-review:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin." },
      { status: 500 }
    );
  }
}
