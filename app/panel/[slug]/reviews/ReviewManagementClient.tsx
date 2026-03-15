"use client";

import { useState } from "react";

type Review = {
  id: string;
  customer_name: string;
  customer_phone: string;
  rating: number;
  comment: string | null;
  is_published: boolean;
  reply_text: string | null;
  replied_at: string | null;
  created_at: string;
};

type Props = {
  salonId: string;
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

export default function ReviewManagementClient({
  salonId,
  initialReviews,
}: Props) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [filter, setFilter] = useState<"all" | "published" | "pending">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredReviews = reviews.filter((r) => {
    if (filter === "published") return r.is_published;
    if (filter === "pending") return !r.is_published;
    return true;
  });

  const handleApprove = async (reviewId: string, approve: boolean) => {
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

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      alert("Lütfen bir yanıt yazın");
      return;
    }

    setLoading(reviewId);

    try {
      const response = await fetch("/api/reply-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          salonId,
          replyText: replyText.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Bir hata oluştu");
        return;
      }

      const data = await response.json();

      // Update local state
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                reply_text: data.review.reply_text,
                replied_at: data.review.replied_at,
              }
            : r
        )
      );

      setReplyingTo(null);
      setReplyText("");
    } catch (error) {
      console.error("Error replying to review:", error);
      alert("Bir hata oluştu");
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    if (!confirm("Yanıtı silmek istediğinize emin misiniz?")) {
      return;
    }

    setLoading(reviewId);

    try {
      const response = await fetch("/api/reply-review", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          salonId,
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
          r.id === reviewId ? { ...r, reply_text: null, replied_at: null } : r
        )
      );
    } catch (error) {
      console.error("Error deleting reply:", error);
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
      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
          borderBottom: "2px solid #e5e7eb",
          paddingBottom: 16,
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
              background: filter === tab.key ? "#0f172a" : "#f3f4f6",
              color: filter === tab.key ? "#ffffff" : "#6b7280",
              transition: "all 0.2s",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
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
            {filter === "pending"
              ? "Onay bekleyen değerlendirme yok"
              : filter === "published"
                ? "Henüz yayınlanmış değerlendirme yok"
                : "Henüz hiç değerlendirme almadınız"}
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
                      fontSize: 18,
                      fontWeight: 800,
                      color: "#111827",
                      marginBottom: 6,
                    }}
                  >
                    {review.customer_name}
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
                    Yanıtınız {review.replied_at ? `• ${formatDate(review.replied_at)}` : ""}
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

                  <button
                    onClick={() => handleDeleteReply(review.id)}
                    disabled={loading === review.id}
                    style={{
                      marginTop: 12,
                      padding: "6px 12px",
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#ffffff",
                      border: "1px solid #f87171",
                      color: "#dc2626",
                      borderRadius: 8,
                      cursor: "pointer",
                    }}
                  >
                    Yanıtı Sil
                  </button>
                </div>
              )}

              {/* Reply Form */}
              {replyingTo === review.id && (
                <div
                  style={{
                    padding: 16,
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    marginBottom: 16,
                  }}
                >
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Yanıtınızı yazın..."
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 12,
                      fontSize: 14,
                      border: "1px solid #d1d5db",
                      borderRadius: 8,
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                    }}
                  >
                    <button
                      onClick={() => handleReply(review.id)}
                      disabled={loading === review.id}
                      style={{
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 700,
                        background: "#0f172a",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      Gönder
                    </button>

                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText("");
                      }}
                      style={{
                        padding: "10px 20px",
                        fontSize: 14,
                        fontWeight: 700,
                        background: "#f3f4f6",
                        color: "#6b7280",
                        border: "none",
                        borderRadius: 10,
                        cursor: "pointer",
                      }}
                    >
                      İptal
                    </button>
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
                    onClick={() => handleApprove(review.id, true)}
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
                    onClick={() => handleApprove(review.id, false)}
                    disabled={loading === review.id}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#fef3c7",
                      border: "1px solid #fde68a",
                      color: "#92400e",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Yayından Kaldır
                  </button>
                )}

                {!review.reply_text && (
                  <button
                    onClick={() => {
                      setReplyingTo(review.id);
                      setReplyText("");
                    }}
                    disabled={loading === review.id}
                    style={{
                      padding: "10px 20px",
                      fontSize: 14,
                      fontWeight: 700,
                      background: "#dbeafe",
                      border: "1px solid #bfdbfe",
                      color: "#1e40af",
                      borderRadius: 10,
                      cursor: "pointer",
                    }}
                  >
                    Yanıtla
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
