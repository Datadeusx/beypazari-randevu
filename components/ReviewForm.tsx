"use client";

import { useState } from "react";

type ReviewFormProps = {
  appointmentId: string;
  salonName: string;
};

export default function ReviewForm({
  appointmentId,
  salonName,
}: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!rating) {
      setMessage({
        type: "error",
        text: "Lütfen bir puan seçin.",
      });
      return;
    }

    if (!phone.trim()) {
      setMessage({
        type: "error",
        text: "Lütfen telefon numaranızı girin.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submit-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId,
          customerPhone: phone,
          rating,
          comment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Bir hata oluştu.",
        });
        return;
      }

      setMessage({
        type: "success",
        text: data.message || "Değerlendirmeniz başarıyla kaydedildi!",
      });

      // Reset form
      setRating(0);
      setComment("");
      setPhone("");
    } catch (error) {
      console.error("Error submitting review:", error);
      setMessage({
        type: "error",
        text: "Bir hata oluştu. Lütfen tekrar deneyin.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 32,
        maxWidth: 600,
        margin: "0 auto",
        boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
      }}
    >
      <h3
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 8,
        }}
      >
        Degerlendirme Birakin
      </h3>

      <p
        style={{
          fontSize: 16,
          color: "#6b7280",
          marginBottom: 32,
        }}
      >
        {salonName}
      </p>

      {/* Star Rating */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 12,
          }}
        >
          Puanınız <span style={{ color: "#ef4444" }}>*</span>
        </label>

        <div
          style={{
            display: "flex",
            gap: 8,
          }}
        >
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              style={{
                background: "transparent",
                border: "none",
                fontSize: 48,
                cursor: "pointer",
                padding: 0,
                transition: "transform 0.2s",
                color:
                  star <= (hoveredRating || rating) ? "#fbbf24" : "#d1d5db",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {star <= (hoveredRating || rating) ? "★" : "☆"}
            </button>
          ))}
        </div>

        {rating > 0 && (
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            {rating === 5 && "Harika!"}
            {rating === 4 && "Cok iyi!"}
            {rating === 3 && "Iyi"}
            {rating === 2 && "Orta"}
            {rating === 1 && "Kotü"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div style={{ marginBottom: 24 }}>
        <label
          htmlFor="comment"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 12,
          }}
        >
          Yorumunuz (opsiyonel)
        </label>

        <textarea
          id="comment"
          placeholder="Deneyiminizi paylaşın..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={500}
          style={{
            width: "100%",
            padding: 14,
            fontSize: 15,
            border: "1px solid #d1d5db",
            borderRadius: 16,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />

        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#9ca3af",
            textAlign: "right",
          }}
        >
          {comment.length}/500 karakter
        </p>
      </div>

      {/* Phone Verification */}
      <div style={{ marginBottom: 28 }}>
        <label
          htmlFor="phone"
          style={{
            display: "block",
            fontSize: 14,
            fontWeight: 700,
            color: "#374151",
            marginBottom: 12,
          }}
        >
          Telefon Numaranız <span style={{ color: "#ef4444" }}>*</span>
        </label>

        <input
          id="phone"
          type="tel"
          placeholder="Randevu sırasında kullandığınız numara"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          style={{
            width: "100%",
            padding: 14,
            fontSize: 15,
            border: "1px solid #d1d5db",
            borderRadius: 16,
            fontFamily: "inherit",
          }}
        />

        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Doğrulama için randevu sırasında kullandığınız telefon numarasını
          girin.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            padding: 14,
            borderRadius: 12,
            marginBottom: 20,
            background: message.type === "success" ? "#dcfce7" : "#fee2e2",
            color: message.type === "success" ? "#166534" : "#991b1b",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{
          width: "100%",
          padding: "16px 24px",
          fontSize: 16,
          fontWeight: 700,
          color: "#ffffff",
          background: isSubmitting ? "#9ca3af" : "#0f172a",
          border: "none",
          borderRadius: 16,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.background = "#1e293b";
          }
        }}
        onMouseOut={(e) => {
          if (!isSubmitting) {
            e.currentTarget.style.background = "#0f172a";
          }
        }}
      >
        {isSubmitting ? "Gönderiliyor..." : "Değerlendirme Gönder"}
      </button>
    </form>
  );
}
