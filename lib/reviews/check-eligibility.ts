import { createClient } from "@/lib/supabase/server";

export type EligibilityResult = {
  eligible: boolean;
  reason?: string;
  appointmentDetails?: {
    id: string;
    salon_id: string;
    customer_name: string;
    customer_phone: string;
    appointment_time: string;
    status: string;
    completed_at: string | null;
    has_review: boolean;
    salon_name?: string;
  };
};

/**
 * Checks if a customer is eligible to leave a review for an appointment
 *
 * Requirements:
 * 1. Appointment exists
 * 2. Phone number matches appointment
 * 3. Appointment is completed
 * 4. No existing review for this appointment
 * 5. Appointment was within last 90 days (configurable)
 */
export async function checkReviewEligibility(
  appointmentId: string,
  customerPhone: string,
  options: {
    maxDaysOld?: number; // Maximum days since appointment (default: 90)
  } = {}
): Promise<EligibilityResult> {
  const { maxDaysOld = 90 } = options;

  try {
    const supabase = await createClient();

    // Fetch appointment with salon details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("*, salons(name)")
      .eq("id", appointmentId)
      .single();

    // Check 1: Appointment exists
    if (appointmentError || !appointment) {
      return {
        eligible: false,
        reason: "Randevu bulunamadı. Lütfen geçerli bir randevu bağlantısı kullanın.",
      };
    }

    // Normalize phone numbers for comparison (remove spaces, dashes, etc.)
    const normalizePhone = (phone: string) => {
      return phone.replace(/[\s\-\(\)]/g, "");
    };

    // Check 2: Phone matches appointment
    const appointmentPhone = normalizePhone(appointment.customer_phone || "");
    const providedPhone = normalizePhone(customerPhone);

    if (appointmentPhone !== providedPhone) {
      return {
        eligible: false,
        reason: "Telefon numarası randevu bilgileriyle eşleşmiyor. Lütfen randevu sırasında kullandığınız telefon numarasını girin.",
      };
    }

    // Check 3: Appointment is completed
    if (appointment.status !== "completed") {
      return {
        eligible: false,
        reason: "Sadece tamamlanmış randevular için değerlendirme yapılabilir. Randevunuz henüz tamamlanmamış görünüyor.",
      };
    }

    // Check 4: No existing review
    if (appointment.has_review) {
      return {
        eligible: false,
        reason: "Bu randevu için zaten bir değerlendirme bıraktınız. Her randevu için sadece bir değerlendirme yapılabilir.",
      };
    }

    // Double-check in reviews table
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("appointment_id", appointmentId)
      .single();

    if (existingReview) {
      // Update appointment to reflect this
      await supabase
        .from("appointments")
        .update({ has_review: true })
        .eq("id", appointmentId);

      return {
        eligible: false,
        reason: "Bu randevu için zaten bir değerlendirme bıraktınız.",
      };
    }

    // Check 5: Appointment was within allowed time window
    const appointmentDate = new Date(appointment.appointment_time);
    const now = new Date();
    const daysSinceAppointment = Math.floor(
      (now.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceAppointment > maxDaysOld) {
      return {
        eligible: false,
        reason: `Değerlendirme süresi dolmuş. Randevularınız için ${maxDaysOld} gün içinde değerlendirme yapabilirsiniz.`,
      };
    }

    // All checks passed!
    return {
      eligible: true,
      appointmentDetails: {
        id: appointment.id,
        salon_id: appointment.salon_id,
        customer_name: appointment.customer_name,
        customer_phone: appointment.customer_phone,
        appointment_time: appointment.appointment_time,
        status: appointment.status,
        completed_at: appointment.completed_at,
        has_review: appointment.has_review,
        salon_name: (appointment.salons as any)?.name || "Salon",
      },
    };
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    return {
      eligible: false,
      reason: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
    };
  }
}

/**
 * Get reviews for a specific salon (published only)
 */
export async function getSalonReviews(salonId: string, limit: number = 50) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("salon_id", salonId)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching salon reviews:", error);
    return [];
  }

  return reviews || [];
}

/**
 * Calculate average rating for a salon
 */
export async function getSalonRatingStats(salonId: string) {
  const supabase = await createClient();

  const { data: reviews, error } = await supabase
    .from("reviews")
    .select("rating")
    .eq("salon_id", salonId)
    .eq("is_published", true);

  if (error || !reviews || reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const totalReviews = reviews.length;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  const averageRating = sum / totalReviews;

  const distribution = reviews.reduce(
    (acc, review) => {
      acc[review.rating as 1 | 2 | 3 | 4 | 5]++;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  return {
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    totalReviews,
    distribution,
  };
}
