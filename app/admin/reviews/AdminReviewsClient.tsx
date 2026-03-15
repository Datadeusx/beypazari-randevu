"use client";

import { useState } from "react";

type Review = {
  id: string;
  salon_id: string;
  customer_name: string;
  customer_phone: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
  salons?: {
    name: string;
  };
};

type Props = {
  initialReviews: Review[];
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReviewsClient({ initialReviews }: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");
  const [salonFilter, setSalonFilter] = useState<string>("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "published" && !r.is_published) return false;
    if (filter === "pending" && r.is_published) return false;
    if (salonFilter !== "all" && r.salon_id !== salonFilter) return false;
    return true;
  });

  // Get unique salons
  const salons = Array.from(
    new Map(
      reviews
        .filter((r) => r.salons)
        .map((r) => [r.salon_id, r.salons!.name])
    ).entries()
  );

  const handleBulkApprove = async (approve: boolean) => {
    const pendingReviews = filteredReviews.filter((r) => !r.is_published);

    if (pendingReviews.length === 0) {
      alert("Onay bekleyen değerlendirme yok");
      return;
    }

    if (
      !confirm(
        `${pendingReviews.length} değerlendirmeyi ${approve ? "onaylamak" : "reddetmek"} istediğinize emin misiniz?`
      )
    ) {
      return;
    }

    setLoading("bulk");

    for (const review of pendingReviews) {
      try {
        await fetch("/api/approve-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviewId: review.id,
            salonId: review.salon_id,
            isPublished: approve,
          }),
        });

        // Update local state
        setReviews((prev) =>
          prev.map((r) =>
            r.id === review.id ? { ...r, is_published: approve } : r
          )
        );
      } catch (error) {
        console.error("Error approving review:", error);
      }
    }

    setLoading(null);
    alert("Toplu işlem tamamlandı!");
  };

  const handleApprove = async (reviewId: string, salonId: string, approve: boolean) => {
    setLoading(reviewId);

    try {
      const response = await fetch("/api/approve-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          salonId,
          isPublished: approve,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Bir hata oluştu");
        return;
      }

      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, is_published: approve } : r
        )
      );
    } catch (error) {
      console.error("Error approving review:", error);
      alert("Bir hata oluştu");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 28,
        padding: 32,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      {/* Filters */}
      <div
        style={{
          marginBottom: 24,
          paddingBottom: 24,
          borderBottom: "2px solid #e5e7eb",
        }}
      >
        {/* Status Filter */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#6b7280",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Durum
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            {[
              { key: "all", label: "Tümü", count: reviews.length },
              {
                key: "published",
                label: "Yayınlanan",
                count: reviews.filter((r) => r.is_published).length,
              },
              {
                key: "pending",
                label: "Onay Bekleyen",
                count: reviews.filter((r) => !r.is_published).length,
              },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                style={{
                  padding: "10px 20px",
                  fontSize: 15,
                  fontWeight: 700,
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: filter === tab.key ? "#7c3aed" : "#f3f4f6",
                  color: filter === tab.key ? "#ffffff" : "#6b7280",
                  transition: "all 0.2s",
                }}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Salon Filter */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#6b7280",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Salon
          </div>

          <select
            value={salonFilter}
            onChange={(e) => setSalonFilter(e.target.value)}
            style={{
              padding: "10px 16px",
              fontSize: 15,
              fontWeight: 600,
              borderRadius: 12,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              color: "#111827",
              cursor: "pointer",
            }}
          >
            <option value="all">Tüm Salonlar ({reviews.length})</option>
            {salons.map(([id, name]) => {
              const count = reviews.filter((r) => r.salon_id === id).length;
              return (
                <option key={id} value={id}>
                  {name} ({count})
                </option>
              );
            })}
          </select>
        </div>

        {/* Bulk Actions */}
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#6b7280",
              marginBottom: 12,
              textTransform: "uppercase",
            }}
          >
            Toplu İşlemler
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
            }}
          >
            <button
              onClick={() => handleBulkApprove(true)}
              disabled={loading === "bulk"}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 700,
                background: "#dcfce7",
                border: "1px solid #86efac",
                color: "#166534",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Tümünü Onayla
            </button>

            <button
              onClick={() => handleBulkApprove(false)}
              disabled={loading === "bulk"}
              style={{
                padding: "10px 20px",
                fontSize: 14,
                fontWeight: 700,
                background: "#fee2e2",
                border: "1px solid #fca5a5",
                color: "#991b1b",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              Tümünü Reddet
            </button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: 60,
            color: "#6b7280",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            Değerlendirme bulunamadı
          </div>
          <div style={{ fontSize: 14, marginTop: 8 }}>
            Seçili filtrelere uygun değerlendirme yok
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 20 }}>
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 20,
                padding: 24,
                background: "#f9fafb",
              }}
            >
              {/* Review Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 16,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "#111827",
                      }}
                    >
                      {review.customer_name}
                    </div>

                    <span
                      style={{
                        padding: "4px 12px",
                        background: "#e0e7ff",
                        color: "#3730a3",
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {review.salons?.name || "Unknown Salon"}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#6b7280",
                      marginBottom: 8,
                    }}
                  >
                    {review.customer_phone} • {formatDate(review.created_at)}
                  </div>

                  <div
                    style={{
                      fontSize: 24,
                      color: "#fbbf24",
                    }}
                  >
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  {review.is_published ? (
                    <span
                      style={{
                        padding: "8px 16px",
                        background: "#dcfce7",
                        color: "#166534",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Yayında
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "8px 16px",
                        background: "#fef3c7",
                        color: "#92400e",
                        borderRadius: 999,
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Onay Bekliyor
                    </span>
                  )}
                </div>
              </div>

              {/* Review Comment */}
              {review.comment && (
                <div
                  style={{
                    padding: 16,
                    background: "#ffffff",
                    borderRadius: 12,
                    marginBottom: 16,
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "#374151",
                  }}
                >
                  {review.comment}
                </div>
              )}

              {/* Salon Reply */}
              {review.reply_text && (
                <div
                  style={{
                    padding: 16,
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#1e40af",
                      marginBottom: 8,
                    }}
                  >
                    Salon Yanıtı
                    {review.replied_at ? ` • ${formatDate(review.replied_at)}` : ""}
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      lineHeight: 1.6,
                      color: "#1e3a8a",
                    }}
                  >
                    {review.reply_text}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {!review.is_published && (
                  <button
                    onClick={() => handleApprove(review.id, review.salon_id, true)}
                    disabled={loading === review.id}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#dcfce7",
                      border: "1px solid #86efac",
                      color: "#166534",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Onayla ve Yayınla
                  </button>
                )}

                {review.is_published && (
                  <button
                    onClick={() => handleApprove(review.id, review.salon_id, false)}
                    disabled={loading === review.id}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#fee2e2",
                      border: "1px solid #fca5a5",
                      color: "#991b1b",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Yayından Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
