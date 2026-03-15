import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type SalonRow = {
  id: string;
  name: string | null;
  slug: string | null;
  city: string | null;
  phone: string | null;
  user_id: string | null;
  created_at?: string | null;
};

type AppointmentSalonRow = {
  salon_id: string | null;
};

const MONTHLY_PLAN_PRICE_TRY = 750;

function formatDate(dateString?: string | null) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(value);
}

function StatCard({
  title,
  value,
  text,
}: {
  title: string;
  value: string | number;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 20,
        padding: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 0.7,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 34,
          fontWeight: 900,
          color: "#111827",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginTop: 10,
          marginBottom: 0,
          color: "#4b5563",
          fontSize: 14,
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const adminEmail = process.env.ADMIN_EMAIL;

  if (!adminEmail || user.email !== adminEmail) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 560,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 28,
            boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Yetkisiz erişim
          </h1>

          <p
            style={{
              marginTop: 14,
              color: "#4b5563",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Bu sayfa sadece platform yöneticisi için açıktır.
          </p>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                textDecoration: "none",
                background: "#111827",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: 14,
                fontWeight: 800,
              }}
            >
              Ana sayfaya dön
            </Link>

            <Link
              href="/giris"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#111827",
                padding: "12px 16px",
                borderRadius: 14,
                fontWeight: 800,
                border: "1px solid #d1d5db",
              }}
            >
              Giriş sayfası
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoIso = thirtyDaysAgo.toISOString();

  const [
    { count: salonsCount },
    { count: appointmentsCount },
    { count: customersCount },
    { count: smsLogsCount },
    activeAppointmentsResult,
  ] = await Promise.all([
    supabase.from("salons").select("*", { count: "exact", head: true }),
    supabase.from("appointments").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase.from("sms_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("appointments")
      .select("salon_id")
      .gte("created_at", thirtyDaysAgoIso),
  ]);

  if (activeAppointmentsResult.error) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 24,
          }}
        >
          <h1>Admin Panel</h1>
          <p>
            Aktif salon verisi yüklenirken hata oluştu:{" "}
            {activeAppointmentsResult.error.message}
          </p>
        </div>
      </main>
    );
  }

  const activeSalonIds = new Set(
    ((activeAppointmentsResult.data || []) as AppointmentSalonRow[])
      .map((row) => row.salon_id)
      .filter(Boolean)
  );

  const monthlyActiveSalonsCount = activeSalonIds.size;
  const estimatedMonthlyRevenue =
    monthlyActiveSalonsCount * MONTHLY_PLAN_PRICE_TRY;

  const { data: salons, error: salonsError } = await supabase
    .from("salons")
    .select("id, name, slug, city, phone, user_id, created_at")
    .order("created_at", { ascending: false });

  if (salonsError) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 24,
          }}
        >
          <h1>Admin Panel</h1>
          <p>Salonlar yüklenirken hata oluştu: {salonsError.message}</p>
        </div>
      </main>
    );
  }

  const salonRows = (salons || []) as SalonRow[];

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px 16px 48px",
        }}
      >
        <section
          style={{
            background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
            borderRadius: 28,
            padding: 28,
            color: "#ffffff",
            boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.72)",
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                }}
              >
                Platform Yönetimi
              </div>

              <h1
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  fontSize: 38,
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                Admin Panel
              </h1>

              <p
                style={{
                  marginTop: 12,
                  marginBottom: 0,
                  maxWidth: 760,
                  color: "rgba(255,255,255,0.84)",
                  fontSize: 15,
                  lineHeight: 1.7,
                }}
              >
                Tüm salonları, randevu hacmini, müşteri sayısını, SMS loglarını,
                aktif salonları ve gelir tahminini tek ekrandan takip edebilirsin.
              </p>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 18,
                padding: "14px 16px",
                minWidth: 260,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.72)",
                  textTransform: "uppercase",
                  letterSpacing: 0.7,
                }}
              >
                Giriş yapan admin
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 16,
                  fontWeight: 800,
                  color: "#ffffff",
                  wordBreak: "break-word",
                }}
              >
                {user.email}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <StatCard
              title="Toplam Salon"
              value={salonsCount ?? 0}
              text="Platformda kayıtlı tüm salonların toplam sayısı."
            />
            <StatCard
              title="Toplam Randevu"
              value={appointmentsCount ?? 0}
              text="Sistemde oluşturulmuş tüm randevular."
            />
            <StatCard
              title="Toplam Müşteri"
              value={customersCount ?? 0}
              text="Salonlara bağlı müşteri kayıtlarının toplamı."
            />
            <StatCard
              title="SMS Log"
              value={smsLogsCount ?? 0}
              text="Sistemde oluşturulmuş toplam SMS log sayısı."
            />
            <StatCard
              title="Aylık Aktif Salon"
              value={monthlyActiveSalonsCount}
              text="Son 30 günde en az 1 randevusu bulunan salon sayısı."
            />
            <StatCard
              title="Aylık Gelir Tahmini"
              value={formatCurrency(estimatedMonthlyRevenue)}
              text={`Aktif salon × ${formatCurrency(
                MONTHLY_PLAN_PRICE_TRY
              )} paket ücreti varsayımı ile hesaplanır.`}
            />
          </div>
        </section>

        <section style={{ marginTop: 24 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: 22,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  Salonlar
                </h2>

                <p
                  style={{
                    marginTop: 8,
                    marginBottom: 0,
                    color: "#6b7280",
                    fontSize: 14,
                    lineHeight: 1.7,
                  }}
                >
                  En son oluşturulan salonlar üstte olacak şekilde listelenir.
                </p>
              </div>

              <div
                style={{
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 14,
                  padding: "10px 14px",
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#374151",
                }}
              >
                Kayıtlı salon: {salonRows.length}
              </div>
            </div>

            <div
              style={{
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 980,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                    }}
                  >
                    {[
                      "Salon",
                      "Slug",
                      "Şehir",
                      "Telefon",
                      "User ID",
                      "Oluşturulma",
                      "Panel",
                    ].map((item) => (
                      <th
                        key={item}
                        style={{
                          textAlign: "left",
                          padding: "14px 12px",
                          fontSize: 13,
                          fontWeight: 800,
                          color: "#6b7280",
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {salonRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          padding: 18,
                          borderBottom: "1px solid #e5e7eb",
                          color: "#6b7280",
                        }}
                      >
                        Henüz salon kaydı bulunmuyor.
                      </td>
                    </tr>
                  ) : (
                    salonRows.map((salon) => (
                      <tr key={salon.id}>
                        <td style={cellStyle}>
                          <div
                            style={{
                              fontWeight: 800,
                              color: "#111827",
                            }}
                          >
                            {salon.name || "-"}
                          </div>
                        </td>

                        <td style={cellStyle}>{salon.slug || "-"}</td>
                        <td style={cellStyle}>{salon.city || "-"}</td>
                        <td style={cellStyle}>{salon.phone || "-"}</td>
                        <td style={cellStyle}>{salon.user_id || "-"}</td>
                        <td style={cellStyle}>{formatDate(salon.created_at)}</td>
                        <td style={cellStyle}>
                          {salon.slug ? (
                            <Link
                              href={`/panel/${salon.slug}`}
                              style={{
                                textDecoration: "none",
                                background: "#111827",
                                color: "#ffffff",
                                padding: "10px 12px",
                                borderRadius: 12,
                                fontWeight: 800,
                                fontSize: 13,
                                display: "inline-block",
                              }}
                            >
                              Paneli Aç
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const cellStyle: React.CSSProperties = {
  padding: "14px 12px",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
  fontSize: 14,
  verticalAlign: "top",
};