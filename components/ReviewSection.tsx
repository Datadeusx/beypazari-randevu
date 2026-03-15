"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ReviewStats from "@/components/ReviewStats";
import ReviewCard from "@/components/ReviewCard";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
  is_verified: boolean;
  reply_text: string | null;
  replied_at: string | null;
};

type ReviewSectionProps = {
  salonId: string;
};

export default function ReviewSection({ salonId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadReviews() {
      setLoading(true);

      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("salon_id", salonId)
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setReviews(data as Review[]);
      }

      setLoading(false);
    }

    loadReviews();
  }, [salonId, supabase]);

  if (loading) {
    return (
      <section
        style={{
          background: "#ffffff",
          borderRadius: 28,
          border: "1px solid #e5e7eb",
          padding: 32,
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "#6b7280",
          }}
        >
          Değerlendirmeler yükleniyor...
        </div>
      </section>
    );
  }

  // Calculate statistics
  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const distribution = reviews.reduce(
    (acc, review) => {
      acc[review.rating as 1 | 2 | 3 | 4 | 5]++;
      return acc;
    },
    { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  );

  const displayedReviews = showAll ? reviews : reviews.slice(0, 5);

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: 28,
        border: "1px solid #e5e7eb",
        padding: 32,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 32,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 24,
        }}
      >
        Müşteri Değerlendirmeleri
      </h2>

      {/* Statistics */}
      <div style={{ marginBottom: 32 }}>
        <ReviewStats
          averageRating={averageRating}
          totalReviews={totalReviews}
          distribution={distribution}
        />
      </div>

      {/* Reviews List */}
      {totalReviews > 0 && (
        <>
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            {displayedReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Show More Button */}
          {reviews.length > 5 && (
            <div
              style={{
                marginTop: 24,
                textAlign: "center",
              }}
            >
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  padding: "12px 32px",
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  background: "#ffffff",
                  border: "2px solid #e5e7eb",
                  borderRadius: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = "#f9fafb";
                  e.currentTarget.style.borderColor = "#0f172a";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                }}
              >
                {showAll
                  ? "Daha Az Göster"
                  : `Tüm Değerlendirmeleri Göster (${reviews.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
