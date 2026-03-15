"use client";

import { use, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type Salon = {
  id: string;
  name: string;
};

type Service = {
  id: string;
  salon_id: string;
  name: string;
  duration_minutes: number;
};

type WorkingHour = {
  id?: string;
  salon_id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

type Appointment = {
  id: string;
  salon_id: string;
  service_id: string | null;
  appointment_time: string;
  customer_name: string | null;
  customer_phone: string | null;
  status: string | null;
};

type CustomerRow = {
  id?: string;
  salon_id?: string;
  phone: string;
  name: string;
  sms_marketing_opt_in?: boolean;
  sms_marketing_opt_in_at?: string | null;
  sms_marketing_opt_out_at?: string | null;
  last_appointment_at?: string | null;
  visit_count?: number;
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function getTodayLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function formatReadableDate(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });
}

function timeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(value: number) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${pad(h)}:${pad(m)}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number) {
  return aStart < bEnd && bStart < aEnd;
}

export default function SalonBookingPage({ params }: PageProps) {
  const { slug } = use(params);
  const supabase = createClient();

  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [salon, setSalon] = useState<Salon | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [selectedTime, setSelectedTime] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [smsMarketingOptIn, setSmsMarketingOptIn] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [servicesError, setServicesError] = useState("");

  useEffect(() => {
    async function loadInitial() {
      setLoadingPage(true);
      setErrorMessage("");
      setServicesError("");

      const { data: salonsData, error: salonError } = await supabase
        .from("salons")
        .select("id, name");

      if (salonError) {
        setErrorMessage("Salon bilgileri alınamadı.");
        setLoadingPage(false);
        return;
      }

      const matchedSalon =
        (salonsData || []).find((item: Salon) => toSlug(item.name) === slug) ||
        null;

      if (!matchedSalon) {
        setErrorMessage("Salon bulunamadı.");
        setLoadingPage(false);
        return;
      }

      setSalon(matchedSalon);

      const { data: servicesData, error: servicesLoadError } = await supabase
        .from("services")
        .select("id, salon_id, name, duration_minutes")
        .eq("salon_id", matchedSalon.id);

      const { data: workingHoursData } = await supabase
        .from("working_hours")
        .select("id, salon_id, day_of_week, is_open, open_time, close_time")
        .eq("salon_id", matchedSalon.id);

      if (servicesLoadError) {
        setServicesError("Hizmetler yüklenemedi: " + servicesLoadError.message);
      }

      const cleanServices = (servicesData || []) as Service[];
      setServices(cleanServices);
      setWorkingHours((workingHoursData || []) as WorkingHour[]);

      if (cleanServices.length > 0) {
        setSelectedServiceId(cleanServices[0].id);
      }

      setLoadingPage(false);
    }

    loadInitial();
  }, [slug, supabase]);

  useEffect(() => {
    async function loadAppointmentsForDay() {
      if (!salon || !selectedDate) return;

      const start = `${selectedDate}T00:00:00`;
      const next = new Date(`${selectedDate}T00:00:00`);
      next.setDate(next.getDate() + 1);
      const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(
        next.getDate()
      )}T00:00:00`;

      const { data } = await supabase
        .from("appointments")
        .select(
          "id, salon_id, service_id, appointment_time, customer_name, customer_phone, status"
        )
        .eq("salon_id", salon.id)
        .gte("appointment_time", start)
        .lt("appointment_time", end)
        .neq("status", "cancelled");

      setAppointments((data || []) as Appointment[]);
    }

    loadAppointmentsForDay();
  }, [salon, selectedDate, supabase]);

  const selectedService = useMemo(() => {
    return services.find((s) => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const selectedWorkingDay = useMemo(() => {
    if (!selectedDate) return null;
    const jsDay = new Date(`${selectedDate}T12:00:00`).getDay();

    return (
      workingHours.find((item) => Number(item.day_of_week) === Number(jsDay)) ||
      null
    );
  }, [selectedDate, workingHours]);

  const availableSlots = useMemo(() => {
    if (!selectedService || !selectedWorkingDay) return [];
    if (!selectedWorkingDay.is_open) return [];
    if (!selectedWorkingDay.open_time || !selectedWorkingDay.close_time) {
      return [];
    }

    const serviceDuration = selectedService.duration_minutes || 30;
    const openMin = timeToMinutes(selectedWorkingDay.open_time.slice(0, 5));
    const closeMin = timeToMinutes(selectedWorkingDay.close_time.slice(0, 5));

    const result: string[] = [];

    for (
      let current = openMin;
      current + serviceDuration <= closeMin;
      current += 15
    ) {
      const slotStart = current;
      const slotEnd = current + serviceDuration;

      const hasConflict = appointments.some((appointment) => {
        const appointmentDate = new Date(appointment.appointment_time);
        const appointmentStart =
          appointmentDate.getHours() * 60 + appointmentDate.getMinutes();

        const matchingService = services.find(
          (s) => s.id === appointment.service_id
        );
        const appointmentDuration = matchingService?.duration_minutes || 30;
        const appointmentEnd = appointmentStart + appointmentDuration;

        return overlaps(slotStart, slotEnd, appointmentStart, appointmentEnd);
      });

      if (!hasConflict) {
        result.push(minutesToTime(current));
      }
    }

    return result;
  }, [appointments, selectedService, selectedWorkingDay, services]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!salon) {
      setErrorMessage("Salon bulunamadı.");
      return;
    }

    if (!selectedService) {
      setErrorMessage("Lütfen bir hizmet seç.");
      return;
    }

    if (!selectedDate) {
      setErrorMessage("Lütfen tarih seç.");
      return;
    }

    if (!selectedTime) {
      setErrorMessage("Lütfen saat seç.");
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Lütfen ad soyad gir.");
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage("Lütfen telefon numarası gir.");
      return;
    }

    setSubmitting(true);

    const appointmentTime = `${selectedDate}T${selectedTime}:00`;

    const { error: appointmentError } = await supabase.from("appointments").insert({
      salon_id: salon.id,
      service_id: selectedService.id,
      appointment_time: appointmentTime,
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      status: "pending",
    });

    if (appointmentError) {
      setSubmitting(false);
      setErrorMessage("Randevu oluşturulamadı: " + appointmentError.message);
      return;
    }

    const normalizedPhone = customerPhone.trim();
    const normalizedName = customerName.trim();
    const nowIso = new Date().toISOString();

    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id, visit_count, sms_marketing_opt_in")
      .eq("salon_id", salon.id)
      .eq("phone", normalizedPhone)
      .maybeSingle();

    const customerPayload: CustomerRow & { salon_id: string } = {
      salon_id: salon.id,
      phone: normalizedPhone,
      name: normalizedName,
      last_appointment_at: nowIso,
      visit_count: (existingCustomer?.visit_count || 0) + 1,
      sms_marketing_opt_in:
        smsMarketingOptIn || existingCustomer?.sms_marketing_opt_in || false,
      sms_marketing_opt_in_at: smsMarketingOptIn
        ? nowIso
        : existingCustomer?.sms_marketing_opt_in
        ? nowIso
        : null,
      sms_marketing_opt_out_at: null,
    };

    if (existingCustomer?.id) {
      await supabase
        .from("customers")
        .update(customerPayload)
        .eq("id", existingCustomer.id);
    } else {
      await supabase.from("customers").insert(customerPayload);
    }

    setSubmitting(false);
    setSuccessMessage("Randevunuz başarıyla oluşturuldu.");
    setSelectedTime("");
    setCustomerName("");
    setCustomerPhone("");
    setSmsMarketingOptIn(false);

    const start = `${selectedDate}T00:00:00`;
    const next = new Date(`${selectedDate}T00:00:00`);
    next.setDate(next.getDate() + 1);
    const end = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(
      next.getDate()
    )}T00:00:00`;

    const { data } = await supabase
      .from("appointments")
      .select(
        "id, salon_id, service_id, appointment_time, customer_name, customer_phone, status"
      )
      .eq("salon_id", salon.id)
      .gte("appointment_time", start)
      .lt("appointment_time", end)
      .neq("status", "cancelled");

    setAppointments((data || []) as Appointment[]);
  }

  if (loadingPage) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", color: "#111" }}>
          Yukleniyor...
        </div>
      </main>
    );
  }

  if (!salon) {
    return (
      <main style={{ minHeight: "100vh", background: "#f5f5f5", padding: 24 }}>
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 24,
            padding: 32,
            color: "#111827",
          }}
        >
          <h1 style={{ fontSize: 32, margin: 0, fontWeight: 700 }}>
            Salon bulunamadı
          </h1>
          <p style={{ marginTop: 12, color: "#4b5563" }}>
            Bu linke ait aktif bir salon bulunamadı.
          </p>
        </div>
      </main>
    );
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
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 16px" }}>
        <section
          style={{
            overflow: "hidden",
            borderRadius: 28,
            background:
              "linear-gradient(135deg, #111827 0%, #1f2937 60%, #374151 100%)",
            color: "#ffffff",
            padding: 32,
            boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Online Randevu
          </div>

          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800 }}>
            {salon.name}
          </h1>

          <p
            style={{
              marginTop: 16,
              maxWidth: 760,
              color: "rgba(255,255,255,0.82)",
              fontSize: 17,
              lineHeight: 1.6,
            }}
          >
            Hizmetinizi seçin, uygun saatlerden birini belirleyin ve
            randevunuzu saniyeler içinde oluşturun.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 20,
            }}
          >
            {["Hızlı rezervasyon", "Kolay saat seçimi", "SMS hatırlatma"].map(
              (item) => (
                <span
                  key={item}
                  style={{
                    border: "1px solid rgba(255,255,255,0.15)",
                    padding: "8px 14px",
                    borderRadius: 999,
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 14,
                  }}
                >
                  {item}
                </span>
              )
            )}
          </div>
        </section>

        <div
          style={{
            display: "grid",
            gap: 24,
            gridTemplateColumns: "minmax(0,1.15fr) minmax(320px,0.85fr)",
          }}
        >
          <section
            style={{
              background: "#ffffff",
              borderRadius: 28,
              border: "1px solid #e5e7eb",
              padding: 28,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 36,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Randevu Oluştur
              </h2>
              <p style={{ marginTop: 10, color: "#6b7280", fontSize: 15 }}>
                Önce hizmeti seç, sonra tarih ve uygun saatlerden birini belirle.
              </p>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                  color: "#6b7280",
                  marginBottom: 14,
                  textTransform: "uppercase",
                }}
              >
                Hizmetler
              </div>

              {servicesError ? (
                <div
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    borderRadius: 16,
                    padding: "14px 16px",
                  }}
                >
                  {servicesError}
                </div>
              ) : services.length === 0 ? (
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    background: "#f9fafb",
                    color: "#4b5563",
                    borderRadius: 16,
                    padding: "14px 16px",
                  }}
                >
                  Henüz hizmet eklenmemiş.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                    gap: 12,
                  }}
                >
                  {services.map((service) => {
                    const active = service.id === selectedServiceId;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(service.id);
                          setSelectedTime("");
                        }}
                        style={{
                          borderRadius: 20,
                          border: active
                            ? "1px solid #111827"
                            : "1px solid #e5e7eb",
                          background: active ? "#111827" : "#ffffff",
                          color: active ? "#ffffff" : "#111827",
                          padding: 16,
                          textAlign: "left",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700 }}>{service.name}</div>
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 14,
                                color: active
                                  ? "rgba(255,255,255,0.72)"
                                  : "#6b7280",
                              }}
                            >
                              {service.duration_minutes} dk
                            </div>
                          </div>

                          <div
                            style={{
                              borderRadius: 999,
                              padding: "6px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              background: active
                                ? "rgba(255,255,255,0.1)"
                                : "#f3f4f6",
                              color: active ? "#ffffff" : "#374151",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Süre
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Tarih
                  </label>
                  <input
                    type="date"
                    min={getTodayLocal()}
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setSelectedTime("");
                    }}
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 16,
                      padding: "14px 16px",
                      color: "#111827",
                      background: "#ffffff",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Seçilen Hizmet
                  </label>
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "14px 16px",
                      background: "#f9fafb",
                      color: "#111827",
                    }}
                  >
                    {selectedService
                      ? `${selectedService.name} • ${selectedService.duration_minutes} dk`
                      : "Önce hizmet seç"}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 10,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#374151",
                  }}
                >
                  Uygun Saatler
                </label>

                {!selectedWorkingDay || !selectedWorkingDay.is_open ? (
                  <div
                    style={{
                      border: "1px solid #fde68a",
                      borderRadius: 16,
                      padding: "14px 16px",
                      background: "#fffbeb",
                      color: "#92400e",
                    }}
                  >
                    Seçilen gün için salon kapalı görünüyor.
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 16,
                      padding: "14px 16px",
                      background: "#f9fafb",
                      color: "#4b5563",
                    }}
                  >
                    Bu gün için uygun saat bulunamadı.
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(90px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {availableSlots.map((slot) => {
                      const active = selectedTime === slot;

                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          style={{
                            borderRadius: 16,
                            border: active
                              ? "1px solid #111827"
                              : "1px solid #e5e7eb",
                            background: active ? "#111827" : "#ffffff",
                            color: active ? "#ffffff" : "#111827",
                            padding: "12px 10px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                  marginBottom: 24,
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Ad Soyad
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ad soyad"
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 16,
                      padding: "14px 16px",
                      color: "#111827",
                      background: "#ffffff",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      marginBottom: 8,
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#374151",
                    }}
                  >
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="05xx xxx xx xx"
                    style={{
                      width: "100%",
                      border: "1px solid #d1d5db",
                      borderRadius: 16,
                      padding: "14px 16px",
                      color: "#111827",
                      background: "#ffffff",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: 14,
                    color: "#374151",
                    lineHeight: 1.5,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={smsMarketingOptIn}
                    onChange={(e) => setSmsMarketingOptIn(e.target.checked)}
                    style={{ marginTop: 3 }}
                  />
                  Fırsat ve kampanya mesajları almak istiyorum.
                </label>
              </div>

              {errorMessage && (
                <div
                  style={{
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    borderRadius: 16,
                    padding: "14px 16px",
                    marginBottom: 16,
                  }}
                >
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div
                  style={{
                    border: "1px solid #bbf7d0",
                    background: "#f0fdf4",
                    color: "#15803d",
                    borderRadius: 16,
                    padding: "14px 16px",
                    marginBottom: 16,
                  }}
                >
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  border: "none",
                  borderRadius: 18,
                  background: "#111827",
                  color: "#ffffff",
                  padding: "16px 18px",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {submitting ? "Randevu oluşturuluyor..." : "Randevuyu Onayla"}
              </button>
            </form>
          </section>

          <aside style={{ display: "grid", gap: 24 }}>
            <section
              style={{
                background: "#ffffff",
                borderRadius: 28,
                border: "1px solid #e5e7eb",
                padding: 24,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Özet
              </h3>

              <div style={{ marginTop: 18, display: "grid", gap: 14 }}>
                {[
                  {
                    label: "Hizmet",
                    value: selectedService?.name || "Seçilmedi",
                  },
                  {
                    label: "Tarih",
                    value: selectedDate
                      ? formatReadableDate(selectedDate)
                      : "Seçilmedi",
                  },
                  {
                    label: "Saat",
                    value: selectedTime || "Seçilmedi",
                  },
                  {
                    label: "Süre",
                    value: selectedService
                      ? `${selectedService.duration_minutes} dk`
                      : "Belirsiz",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    style={{
                      background: "#f9fafb",
                      borderRadius: 18,
                      padding: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                      }}
                    >
                      {item.label}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        fontWeight: 700,
                        color: "#111827",
                        fontSize: 18,
                      }}
                    >
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section
              style={{
                background: "#ffffff",
                borderRadius: 28,
                border: "1px solid #e5e7eb",
                padding: 24,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#111827",
                }}
              >
                Neden online randevu?
              </h3>

              <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
                {[
                  "Telefon trafiğini azaltır.",
                  "Uygun saatleri anında gösterir.",
                  "Hatırlatma akışıyla no-show riskini azaltır.",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 18,
                      padding: 16,
                      color: "#4b5563",
                      background: "#ffffff",
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}