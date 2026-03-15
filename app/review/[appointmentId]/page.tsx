import { createClient } from "@/lib/supabase/server";
import ReviewForm from "@/components/ReviewForm";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    appointmentId: string;
  }>;
};

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ReviewPage({ params }: PageProps) {
  const { appointmentId } = await params;

  const supabase = await createClient();

  // Fetch appointment with salon details
  const { data: appointment, error } = await supabase
    .from("appointments")
    .select("*, salons(name, slug)")
    .eq("id", appointmentId)
    .single();

  // Handle errors
  if (error || !appointment) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 40,
            maxWidth: 500,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
            }}
          >
            ❌
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Randevu Bulunamadı
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#6b7280",
              marginBottom: 24,
            }}
          >
            Belirtilen randevu bulunamadı. Lütfen geçerli bir değerlendirme
            bağlantısı kullandığınızdan emin olun.
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  // Check if already reviewed
  if (appointment.has_review) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 40,
            maxWidth: 500,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
            }}
          >
            ✅
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Zaten Değerlendirdiniz
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#6b7280",
              marginBottom: 24,
            }}
          >
            Bu randevu için zaten bir değerlendirme bıraktınız. Her randevu
            için sadece bir değerlendirme yapılabilir.
          </p>

          <Link
            href={`/salon/${(appointment.salons as any)?.slug || ""}`}
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Salon Sayfasına Git
          </Link>
        </div>
      </main>
    );
  }

  // Check if appointment is completed
  if (appointment.status !== "completed") {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 40,
            maxWidth: 500,
            textAlign: "center",
            boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              fontSize: 64,
              marginBottom: 16,
            }}
          >
            ⏳
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Randevu Henüz Tamamlanmadı
          </h1>

          <p
            style={{
              fontSize: 16,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            Sadece tamamlanan randevular için değerlendirme yapılabilir.
            Randevunuz tamamlandıktan sonra bu sayfaya geri dönebilirsiniz.
          </p>

          <p
            style={{
              fontSize: 14,
              color: "#9ca3af",
              marginBottom: 24,
            }}
          >
            Randevu durumu: <strong>{appointment.status || "beklemede"}</strong>
          </p>

          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "12px 24px",
              background: "#0f172a",
              color: "#ffffff",
              borderRadius: 12,
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </main>
    );
  }

  // Show review form
  const salonName = (appointment.salons as any)?.name || "Salon";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#111827",
              marginBottom: 12,
            }}
          >
            Randevunuzu Değerlendirin
          </h1>

          <p
            style={{
              fontSize: 18,
              color: "#6b7280",
              marginBottom: 8,
            }}
          >
            {salonName}
          </p>

          <p
            style={{
              fontSize: 15,
              color: "#9ca3af",
            }}
          >
            Randevu: {formatDateTime(appointment.appointment_time)}
          </p>
        </div>

        {/* Review Form */}
        <ReviewForm appointmentId={appointmentId} salonName={salonName} />

        {/* Footer Note */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            padding: 20,
            background: "#fef3c7",
            border: "1px solid #fbbf24",
            borderRadius: 16,
          }}
        >
          <p
            style={{
              fontSize: 14,
              color: "#92400e",
              margin: 0,
            }}
          >
            <strong>Not:</strong> Değerlendirmeniz incelendikten sonra
            yayınlanacaktır. Sadece doğrulanmış randevular için değerlendirme
            yapılabilir.
          </p>
        </div>
      </div>
    </main>
  );
}
