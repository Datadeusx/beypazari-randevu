import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import ReviewManagementClient from "./ReviewManagementClient";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default async function ReviewsManagementPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Get salon
  const { data: salons, error: salonError } = await supabase
    .from("salons")
    .select("*");

  const salon =
    salons?.find((item: any) => toSlug(item.name || "") === slug) || null;

  if (salonError || !salon) {
    redirect("/giris");
  }

  // Get reviews for this salon
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("salon_id", salon.id)
    .order("created_at", { ascending: false });

  // Calculate stats
  const totalReviews = reviews?.length || 0;
  const publishedReviews =
    reviews?.filter((r) => r.is_published).length || 0;
  const pendingReviews =
    reviews?.filter((r) => !r.is_published).length || 0;

  const averageRating =
    totalReviews > 0
      ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
        padding: "24px 0 40px",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <section
          style={{
            overflow: "hidden",
            borderRadius: 32,
            background:
              "linear-gradient(135deg, #1a1d29 0%, #24273a 60%, #2e3247 100%)",
            color: "#ffffff",
            padding: 40,
            boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            marginBottom: 32,
            position: "relative",
          }}
        >
          <div
            style={{
              content: "",
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              background:
                "radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.12) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "10px 18px",
                borderRadius: 9999,
                background: "rgba(251, 191, 36, 0.15)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
                fontSize: 13,
                fontWeight: 800,
                marginBottom: 18,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                color: "#fbbf24",
              }}
            >
              Degerlendirme Yonetimi
            </div>

            <h1
              style={{
                margin: 0,
                fontSize: 48,
                fontWeight: 900,
                letterSpacing: -1.5,
              }}
            >
              {salon.name}
            </h1>

            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                color: "rgba(255,255,255,0.82)",
                fontSize: 17,
                lineHeight: 1.6,
                maxWidth: 780,
              }}
            >
              Musteri degerlendirmelerini yonetin, yanitlayin ve yayinlayin.
            </p>

            <div
              style={{
                marginTop: 24,
                display: "flex",
                gap: 12,
              }}
            >
              <Link
                href={`/panel/${slug}`}
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  borderRadius: 16,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                ← Panele Don
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {[
            {
              label: "Toplam Degerlendirme",
              value: totalReviews,
              icon: "⭐",
            },
            {
              label: "Yayinlanan",
              value: publishedReviews,
              icon: "✅",
            },
            {
              label: "Onay Bekleyen",
              value: pendingReviews,
              icon: "⏳",
            },
            {
              label: "Ortalama Puan",
              value: averageRating.toFixed(1),
              icon: "📊",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 24,
                padding: 28,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  marginBottom: 16,
                  opacity: 0.8,
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  marginTop: 12,
                  fontSize: 44,
                  fontWeight: 900,
                  color: "#1a1d29",
                  letterSpacing: -1,
                  lineHeight: 1,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Reviews Table */}
        <ReviewManagementClient
          salonId={salon.id}
          initialReviews={reviews || []}
        />
      </div>
    </main>
  );
}
