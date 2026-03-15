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

type ReviewCardProps = {
  review: Review;
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 24,
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            fontWeight: 800,
            fontSize: 16,
            flexShrink: 0,
          }}
        >
          {getInitials(review.customer_name)}
        </div>

        {/* Name and Date */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}
          >
            <h4
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#111827",
                margin: 0,
              }}
            >
              {review.customer_name}
            </h4>

            {review.is_verified && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 10px",
                  background: "#dcfce7",
                  color: "#166534",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                ✓ Doğrulanmış
              </span>
            )}
          </div>

          <div
            style={{
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            {formatDate(review.created_at)}
          </div>
        </div>

        {/* Rating */}
        <div
          style={{
            fontSize: 20,
            color: "#fbbf24",
          }}
        >
          {"★".repeat(review.rating)}
          {"☆".repeat(5 - review.rating)}
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "#374151",
            margin: 0,
            marginBottom: review.reply_text ? 20 : 0,
          }}
        >
          {review.comment}
        </p>
      )}

      {/* Salon Reply */}
      {review.reply_text && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#0f172a",
              }}
            >
              Salon Yanıtı
            </div>

            {review.replied_at && (
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                }}
              >
                • {formatDate(review.replied_at)}
              </div>
            )}
          </div>

          <p
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              color: "#4b5563",
              margin: 0,
            }}
          >
            {review.reply_text}
          </p>
        </div>
      )}
    </div>
  );
}
