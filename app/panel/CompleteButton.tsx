"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  appointmentId: string;
  salonId: string;
  status?: string | null;
};

export default function CompleteButton({
  appointmentId,
  salonId,
  status,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showReviewLink, setShowReviewLink] = useState(false);
  const [reviewLink, setReviewLink] = useState("");
  const router = useRouter();

  // Don't show button if already completed
  if (status === "completed") {
    return (
      <span
        style={{
          padding: "8px 14px",
          background: "#dcfce7",
          color: "#166534",
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        Tamamlandı
      </span>
    );
  }

  const handleComplete = async () => {
    if (!confirm("Randevuyu tamamlandı olarak işaretlemek istediğinize emin misiniz?")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/complete-appointment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          salonId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Bir hata oluştu");
        setLoading(false);
        return;
      }

      // Show review link
      if (data.reviewLink) {
        setReviewLink(data.reviewLink);
        setShowReviewLink(true);
      }

      // Refresh the page to update the UI
      router.refresh();
    } catch (error) {
      console.error("Error completing appointment:", error);
      alert("Bir hata oluştu. Lütfen tekrar deneyin.");
      setLoading(false);
    }
  };

  if (showReviewLink) {
    return (
      <div
        style={{
          padding: "12px 16px",
          background: "#dcfce7",
          border: "1px solid #86efac",
          borderRadius: 12,
          fontSize: 13,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: "#166534",
            marginBottom: 8,
          }}
        >
          Randevu tamamlandı!
        </div>

        <div
          style={{
            fontSize: 12,
            color: "#15803d",
            marginBottom: 8,
          }}
        >
          Değerlendirme linki:
        </div>

        <input
          type="text"
          value={reviewLink}
          readOnly
          onClick={(e) => e.currentTarget.select()}
          style={{
            width: "100%",
            padding: "6px 10px",
            fontSize: 11,
            border: "1px solid #86efac",
            borderRadius: 6,
            background: "#ffffff",
            color: "#166534",
            fontFamily: "monospace",
          }}
        />

        <div
          style={{
            fontSize: 11,
            color: "#6b7280",
            marginTop: 6,
          }}
        >
          Bu linki müşteriye göndererek değerlendirme yapmasını sağlayabilirsiniz.
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      style={{
        padding: "8px 14px",
        fontSize: 12,
        fontWeight: 700,
        background: loading ? "#9ca3af" : "#0f172a",
        color: "#ffffff",
        border: "none",
        borderRadius: 999,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "all 0.2s",
      }}
      onMouseOver={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "#1e293b";
        }
      }}
      onMouseOut={(e) => {
        if (!loading) {
          e.currentTarget.style.background = "#0f172a";
        }
      }}
    >
      {loading ? "İşleniyor..." : "Tamamlandı Olarak İşaretle"}
    </button>
  );
}
