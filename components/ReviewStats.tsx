type ReviewStatsProps = {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export default function ReviewStats({
  averageRating,
  totalReviews,
  distribution,
}: ReviewStatsProps) {
  if (totalReviews === 0) {
    return (
      <div
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 24,
          padding: 32,
          textAlign: "center",
          boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>⭐</div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: "#111827",
            marginBottom: 8,
          }}
        >
          Henüz Değerlendirme Yok
        </h3>
        <p style={{ fontSize: 14, color: "#6b7280", margin: 0 }}>
          İlk değerlendirmeyi siz bırakın!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 32,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "#111827",
          marginBottom: 24,
        }}
      >
        Müşteri Değerlendirmeleri
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: 32,
          alignItems: "center",
        }}
      >
        {/* Average Rating */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1,
            }}
          >
            {averageRating.toFixed(1)}
          </div>

          <div
            style={{
              fontSize: 28,
              color: "#fbbf24",
              margin: "8px 0",
            }}
          >
            {"★".repeat(Math.round(averageRating))}
            {"☆".repeat(5 - Math.round(averageRating))}
          </div>

          <div
            style={{
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            {totalReviews} değerlendirme
          </div>
        </div>

        {/* Rating Distribution */}
        <div style={{ display: "grid", gap: 8 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star as 1 | 2 | 3 | 4 | 5];
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div
                key={star}
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 1fr 50px",
                  alignItems: "center",
                  gap: 12,
                  fontSize: 14,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    color: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  {star}
                  <span style={{ color: "#fbbf24" }}>★</span>
                </div>

                <div
                  style={{
                    height: 8,
                    background: "#e5e7eb",
                    borderRadius: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: "#fbbf24",
                      width: `${percentage}%`,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>

                <div
                  style={{
                    color: "#6b7280",
                    textAlign: "right",
                    fontSize: 13,
                  }}
                >
                  {percentage.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
