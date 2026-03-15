import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import CancelButton from "@/app/panel/CancelButton";
import CompleteButton from "@/app/panel/CompleteButton";
import LogoutButton from "@/app/panel/LogoutButton";
import AddServiceForm from "@/app/panel/AddServiceForm";
import WorkingHoursForm from "@/app/panel/WorkingHoursForm";
import ServicesList from "@/app/panel/[slug]/ServicesList";
import CampaignSection from "@/app/panel/CampaignSection";
import InactiveCustomersCampaignSection from "@/app/panel/InactiveCustomersCampaignSection";

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

function formatDateTime(dateString: string | null) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(dateString: string | null) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTimeOnly(dateString: string | null) {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusPill(status: string | null) {
  const value = (status || "").toLowerCase();

  if (value === "sent" || value === "success") {
    return {
      bg: "#dcfce7",
      color: "#166534",
      text: status || "sent",
    };
  }

  if (value === "failed" || value === "error") {
    return {
      bg: "#fee2e2",
      color: "#991b1b",
      text: status || "failed",
    };
  }

  if (value === "pending") {
    return {
      bg: "#fef3c7",
      color: "#92400e",
      text: status || "pending",
    };
  }

  return {
    bg: "#e5e7eb",
    color: "#374151",
    text: status || "-",
  };
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(value: number) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 28,
        padding: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 800,
            color: "#111827",
          }}
        >
          {title}
        </h2>

        {subtitle ? (
          <p
            style={{
              marginTop: 8,
              marginBottom: 0,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

export default async function PanelSlugPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: salons, error: salonError } = await supabase
    .from("salons")
    .select("*");

  const salon =
    salons?.find((item: any) => toSlug(item.name || "") === slug) || null;

  if (salonError || !salon) {
    redirect("/giris");
  }

  const now = new Date();

  const todayStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
    0
  );
  const todayEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999
  );

  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  );

  const days30Ago = new Date();
  days30Ago.setDate(days30Ago.getDate() - 30);

  const days60Ago = new Date();
  days60Ago.setDate(days60Ago.getDate() - 60);

  const publicBookingUrl = `/salon/${slug}`;

  const { data: upcomingAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("salon_id", salon.id)
    .gte("appointment_time", now.toISOString())
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true })
    .limit(20);

  const { data: todaysAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("salon_id", salon.id)
    .gte("appointment_time", todayStart.toISOString())
    .lte("appointment_time", todayEnd.toISOString())
    .neq("status", "cancelled")
    .order("appointment_time", { ascending: true });

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("salon_id", salon.id);

  const { data: workingHours } = await supabase
    .from("working_hours")
    .select("*")
    .eq("salon_id", salon.id)
    .order("day_of_week", { ascending: true });

  const { data: smsLogs } = await supabase
    .from("sms_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const { data: monthlyAppointments } = await supabase
    .from("appointments")
    .select("*")
    .eq("salon_id", salon.id)
    .gte("appointment_time", monthStart.toISOString())
    .lt("appointment_time", monthEnd.toISOString())
    .neq("status", "cancelled");

  const { count: eligibleCustomerCount } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salon.id)
    .eq("sms_marketing_opt_in", true);

  const { data: inactiveCustomers } = await supabase
    .from("customers")
    .select(
      "id, name, phone, last_appointment_at, visit_count, sms_marketing_opt_in"
    )
    .eq("salon_id", salon.id)
    .eq("sms_marketing_opt_in", true)
    .gte("last_appointment_at", days60Ago.toISOString())
    .lte("last_appointment_at", days30Ago.toISOString())
    .order("last_appointment_at", { ascending: true });

  const monthlyList = monthlyAppointments || [];

  const customerMap = new Map<string, number>();

  for (const appointment of monthlyList as any[]) {
    const name = (appointment.customer_name || "").trim();
    if (!name) continue;
    customerMap.set(name, (customerMap.get(name) || 0) + 1);
  }

  const topCustomerEntry =
    [...customerMap.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  const serviceMap = new Map<string, number>();

  for (const appointment of monthlyList as any[]) {
    const serviceId = appointment.service_id;
    if (!serviceId) continue;
    serviceMap.set(serviceId, (serviceMap.get(serviceId) || 0) + 1);
  }

  const topServiceEntry =
    [...serviceMap.entries()].sort((a, b) => b[1] - a[1])[0] || null;

  const topServiceName = topServiceEntry
    ? services?.find((service: any) => service.id === topServiceEntry[0])?.name ||
      "Bilinmeyen hizmet"
    : null;

  const todayDay = now.getDay();

  const todayWorkingHours =
    (workingHours || []).find(
      (item: any) => Number(item.day_of_week) === Number(todayDay)
    ) || null;

  let emptySlotsToday: string[] = [];

  if (
    todayWorkingHours &&
    todayWorkingHours.is_open &&
    todayWorkingHours.open_time &&
    todayWorkingHours.close_time
  ) {
    const openMin = timeToMinutes(todayWorkingHours.open_time.slice(0, 5));
    const closeMin = timeToMinutes(todayWorkingHours.close_time.slice(0, 5));

    const todayAppointmentsList = todaysAppointments || [];

    for (let current = openMin; current + 30 <= closeMin; current += 30) {
      const slotStart = current;
      const slotEnd = current + 30;

      const hasConflict = todayAppointmentsList.some((appointment: any) => {
        const appointmentDate = new Date(appointment.appointment_time);
        const appointmentStart =
          appointmentDate.getHours() * 60 + appointmentDate.getMinutes();

        const matchingService = (services || []).find(
          (service: any) => service.id === appointment.service_id
        );

        const appointmentDuration = matchingService?.duration_minutes || 30;
        const appointmentEnd = appointmentStart + appointmentDuration;

        return overlaps(slotStart, slotEnd, appointmentStart, appointmentEnd);
      });

      if (!hasConflict) {
        emptySlotsToday.push(minutesToTime(current));
      }
    }
  }

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
              content: '',
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
              display: "flex",
              gap: 24,
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              position: "relative",
              zIndex: 1,
            }}
          >
            <div>
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
                Salon Paneli
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
                  fontSize: 16,
                  lineHeight: 1.6,
                  maxWidth: 780,
                }}
              >
                Randevularını, çalışma saatlerini, hizmetlerini ve SMS
                hareketlerini tek yerden yönet.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <Link
                href={publicBookingUrl}
                target="_blank"
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
                Randevu Sayfasini Ac
              </Link>

              <Link
                href={`/panel/${slug}/reviews`}
                style={{
                  textDecoration: "none",
                  border: "1px solid rgba(251,191,36,0.3)",
                  background: "rgba(251,191,36,0.15)",
                  color: "#fbbf24",
                  borderRadius: 16,
                  padding: "12px 16px",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Degerlendirmeler
              </Link>

              <LogoutButton />
            </div>
          </div>
        </section>

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
              label: "Yaklasan Randevular",
              value: upcomingAppointments?.length ?? 0,
              icon: "📅",
            },
            {
              label: "Bugunun Randevulari",
              value: todaysAppointments?.length ?? 0,
              icon: "⏰",
            },
            {
              label: "Toplam Hizmet",
              value: services?.length ?? 0,
              icon: "✨",
            },
            {
              label: "SMS Log Sayisi",
              value: smsLogs?.length ?? 0,
              icon: "📱",
            },
          ].map((item, index) => (
            <div
              key={item.label}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 24,
                padding: 28,
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-6px)";
                e.currentTarget.style.boxShadow =
                  "0 25px 50px -12px rgba(0,0,0,0.25)";
                e.currentTarget.style.borderColor = "#fbbf24";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow =
                  "0 10px 15px -3px rgba(0,0,0,0.1)";
                e.currentTarget.style.borderColor = "#e2e8f0";
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

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 16,
            marginBottom: 24,
          }}
        >
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
                fontSize: 13,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Bu Ay En Cok Gelen Musteri
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              {topCustomerEntry ? topCustomerEntry[0] : "Veri yok"}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              {topCustomerEntry
                ? `${topCustomerEntry[1]} randevu`
                : "Bu ay kayıt bulunamadı"}
            </div>
          </div>

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
                fontSize: 13,
                fontWeight: 700,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              Bu Ay En Cok Yapilan Islem
            </div>

            <div
              style={{
                marginTop: 10,
                fontSize: 28,
                fontWeight: 800,
                color: "#111827",
              }}
            >
              {topServiceName || "Veri yok"}
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#6b7280",
              }}
            >
              {topServiceEntry
                ? `${topServiceEntry[1]} kez yapildi`
                : "Bu ay işlem bulunamadı"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0,1.2fr) minmax(320px,0.8fr)",
          }}
        >
          <div style={{ display: "grid", gap: 24 }}>
            <CampaignSection
              salonId={salon.id}
              eligibleCustomerCount={eligibleCustomerCount || 0}
              emptySlotsToday={emptySlotsToday}
            />

            <InactiveCustomersCampaignSection
              salonId={salon.id}
              customers={(inactiveCustomers || []) as any[]}
            />

            <SectionCard
              title="Yaklasan Randevular"
              subtitle="Ileri tarihli aktif randevular"
            >
              {!upcomingAppointments || upcomingAppointments.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #d1d5db",
                    borderRadius: 18,
                    padding: 18,
                    color: "#6b7280",
                    background: "#f9fafb",
                  }}
                >
                  Henüz yaklaşan randevu yok.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 14 }}>
                  {upcomingAppointments.map((appointment: any) => (
                    <div
                      key={appointment.id}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 22,
                        padding: 18,
                        background: "#f9fafb",
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
                              fontSize: 20,
                              fontWeight: 800,
                              color: "#111827",
                            }}
                          >
                            {appointment.customer_name || "Isimsiz musteri"}
                          </div>

                          <div
                            style={{
                              marginTop: 8,
                              display: "grid",
                              gap: 5,
                              color: "#4b5563",
                              fontSize: 14,
                            }}
                          >
                            <div>
                              Tarih:{" "}
                              {formatDateOnly(appointment.appointment_time)} -{" "}
                              {formatTimeOnly(appointment.appointment_time)}
                            </div>
                            <div>
                              Telefon: {appointment.customer_phone || "-"}
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              background: "#e5e7eb",
                              color: "#374151",
                              borderRadius: 999,
                              padding: "8px 14px",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {appointment.status || "active"}
                          </span>

                          <CompleteButton
                            appointmentId={appointment.id}
                            salonId={salon.id}
                            status={appointment.status}
                          />

                          <CancelButton appointmentId={appointment.id} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Bugunun Randevulari"
              subtitle={todayStart.toLocaleDateString("tr-TR")}
            >
              {!todaysAppointments || todaysAppointments.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #d1d5db",
                    borderRadius: 18,
                    padding: 18,
                    color: "#6b7280",
                    background: "#f9fafb",
                  }}
                >
                  Bugün için randevu yok.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 10px",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Saat", "Musteri", "Telefon", "Durum", "Islem"].map(
                          (head) => (
                            <th
                              key={head}
                              style={{
                                textAlign: "left",
                                padding: "8px 12px",
                                color: "#6b7280",
                                fontSize: 13,
                                textTransform: "uppercase",
                                letterSpacing: 0.8,
                              }}
                            >
                              {head}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {todaysAppointments.map((appointment: any) => (
                        <tr key={appointment.id}>
                          <td
                            style={{
                              background: "#f9fafb",
                              padding: 14,
                              borderTopLeftRadius: 16,
                              borderBottomLeftRadius: 16,
                              fontWeight: 700,
                            }}
                          >
                            {formatTimeOnly(appointment.appointment_time)}
                          </td>

                          <td style={{ background: "#f9fafb", padding: 14 }}>
                            {appointment.customer_name || "-"}
                          </td>

                          <td style={{ background: "#f9fafb", padding: 14 }}>
                            {appointment.customer_phone || "-"}
                          </td>

                          <td style={{ background: "#f9fafb", padding: 14 }}>
                            {appointment.status || "-"}
                          </td>

                          <td
                            style={{
                              background: "#f9fafb",
                              padding: 14,
                              borderTopRightRadius: 16,
                              borderBottomRightRadius: 16,
                            }}
                          >
                            <CancelButton appointmentId={appointment.id} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="SMS Loglari"
              subtitle="Son gonderim denemeleri"
            >
              {!smsLogs || smsLogs.length === 0 ? (
                <div
                  style={{
                    border: "1px dashed #d1d5db",
                    borderRadius: 18,
                    padding: 18,
                    color: "#6b7280",
                    background: "#f9fafb",
                  }}
                >
                  Henüz SMS logu yok.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "separate",
                      borderSpacing: "0 10px",
                    }}
                  >
                    <thead>
                      <tr>
                        {["Tarih", "Telefon", "Durum", "Mesaj"].map((head) => (
                          <th
                            key={head}
                            style={{
                              textAlign: "left",
                              padding: "8px 12px",
                              color: "#6b7280",
                              fontSize: 13,
                              textTransform: "uppercase",
                              letterSpacing: 0.8,
                            }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {smsLogs.map((log: any) => {
                        const pill = getStatusPill(log.status);

                        return (
                          <tr key={log.id}>
                            <td
                              style={{
                                background: "#f9fafb",
                                padding: 14,
                                borderTopLeftRadius: 16,
                                borderBottomLeftRadius: 16,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {formatDateTime(log.created_at)}
                            </td>

                            <td
                              style={{
                                background: "#f9fafb",
                                padding: 14,
                                whiteSpace: "nowrap",
                              }}
                            >
                              {log.phone || "-"}
                            </td>

                            <td
                              style={{
                                background: "#f9fafb",
                                padding: 14,
                              }}
                            >
                              <span
                                style={{
                                  display: "inline-block",
                                  padding: "6px 12px",
                                  borderRadius: 999,
                                  background: pill.bg,
                                  color: pill.color,
                                  fontSize: 12,
                                  fontWeight: 700,
                                }}
                              >
                                {pill.text}
                              </span>
                            </td>

                            <td
                              style={{
                                background: "#f9fafb",
                                padding: 14,
                                borderTopRightRadius: 16,
                                borderBottomRightRadius: 16,
                                lineHeight: 1.5,
                              }}
                            >
                              {log.message || "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </div>

          <div style={{ display: "grid", gap: 24 }}>
            <SectionCard
              title="Hizmet Ekle"
              subtitle="Yeni hizmet oluştur ve yayınla"
            >
              <AddServiceForm salonId={salon.id} />
            </SectionCard>

            <SectionCard title="Hizmetleri Yonet">
              <ServicesList services={services || []} />
            </SectionCard>

            <SectionCard
              title="Calisma Saatleri"
              subtitle="Acilis ve kapanis saatlerini duzenle"
            >
              <WorkingHoursForm
                salonId={salon.id}
                workingHours={workingHours || []}
              />
            </SectionCard>
          </div>
        </div>
      </div>
    </main>
  );
}