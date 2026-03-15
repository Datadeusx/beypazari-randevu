"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Service = {
  id: string;
  name: string;
  duration_minutes: number;
};

type AppointmentRow = {
  appointment_time: string;
  service_id: string;
};

type WorkingHour = {
  day_of_week: number;
  is_open: boolean;
  start_time: string | null;
  end_time: string | null;
};

type Props = {
  salonId: string;
  services: Service[];
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function rangesOverlap(
  start1: number,
  end1: number,
  start2: number,
  end2: number
) {
  return start1 < end2 && end1 > start2;
}

function getDayOfWeek(dateString: string) {
  return new Date(dateString).getDay();
}

function generateTimeSlotsForRange(startTime: string, endTime: string) {
  const slots: string[] = [];
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  for (let minutes = start; minutes < end; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`);
  }

  return slots;
}

export default function BookingForm({ salonId, services }: Props) {
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState<string[]>([]);

  useEffect(() => {
    async function loadSlots() {
      setMessage("");

      if (!date || !selectedServiceId) {
        setSlots([]);
        return;
      }

      const supabase = createClient();

      const selectedService = services.find(
        (service) => service.id === selectedServiceId
      );

      if (!selectedService) {
        setSlots([]);
        return;
      }

      const dayOfWeek = getDayOfWeek(date);

      const { data: workingHours, error: workingHoursError } = await supabase
        .from("working_hours")
        .select("*")
        .eq("salon_id", salonId)
        .eq("day_of_week", dayOfWeek)
        .limit(1);

      if (workingHoursError || !workingHours || workingHours.length === 0) {
        setMessage("Çalışma saatleri alınamadı.");
        setSlots([]);
        return;
      }

      const daySettings = workingHours[0] as WorkingHour;

      if (!daySettings.is_open || !daySettings.start_time || !daySettings.end_time) {
        setMessage("Seçilen gün kapalıdır.");
        setSlots([]);
        return;
      }

      const allSlots = generateTimeSlotsForRange(
        daySettings.start_time,
        daySettings.end_time
      );

      const selectedDuration = selectedService.duration_minutes;

      const start = `${date}T00:00:00`;
      const end = `${date}T23:59:59`;

      const { data, error } = await supabase
        .from("appointments")
        .select("appointment_time, service_id")
        .eq("salon_id", salonId)
        .neq("status", "cancelled")
        .gte("appointment_time", start)
        .lte("appointment_time", end);

      if (error) {
        setMessage("Saatler yüklenirken hata oluştu: " + error.message);
        setSlots([]);
        return;
      }

      const bookedAppointments = (data ?? []) as AppointmentRow[];
      const closingMinutes = timeToMinutes(daySettings.end_time);

      const available = allSlots.filter((slot) => {
        const candidateStart = timeToMinutes(slot);
        const candidateEnd = candidateStart + selectedDuration;

        if (candidateEnd > closingMinutes) {
          return false;
        }

        for (const appointment of bookedAppointments) {
          const bookedStart = timeToMinutes(
            appointment.appointment_time.slice(11, 16)
          );

          const bookedService = services.find(
            (service) => service.id === appointment.service_id
          );

          const bookedDuration = bookedService?.duration_minutes ?? 30;
          const bookedEnd = bookedStart + bookedDuration;

          if (
            rangesOverlap(candidateStart, candidateEnd, bookedStart, bookedEnd)
          ) {
            return false;
          }
        }

        return true;
      });

      setSlots(available);
    }

    loadSlots();
  }, [date, salonId, selectedServiceId, services]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!selectedServiceId || !date || !time || !customerName || !customerPhone) {
      setMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    const selectedService = services.find(
      (service) => service.id === selectedServiceId
    );

    if (!selectedService) {
      setMessage("Lütfen geçerli bir hizmet seçin.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const appointmentTime = `${date}T${time}:00`;

    const { error } = await supabase.from("appointments").insert([
      {
        salon_id: salonId,
        service_id: selectedServiceId,
        appointment_time: appointmentTime,
        customer_name: customerName,
        customer_phone: customerPhone,
        status: "pending",
      },
    ]);

    if (error) {
      setMessage("Kayıt sırasında hata oluştu: " + error.message);
    } else {
      setMessage("Randevu başarıyla oluşturuldu.");
      setSelectedServiceId("");
      setDate("");
      setTime("");
      setCustomerName("");
      setCustomerPhone("");
      setSlots([]);
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: "20px", maxWidth: "500px" }}>
      <div style={{ marginBottom: "16px" }}>
        <label>Hizmet</label>
        <select
          value={selectedServiceId}
          onChange={(e) => {
            setSelectedServiceId(e.target.value);
            setTime("");
            setMessage("");
          }}
          style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
        >
          <option value="">Hizmet seçin</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} — {service.duration_minutes} dk
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Tarih</label>
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime("");
            setMessage("");
          }}
          style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Saat</label>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
        >
          <option value="">Saat seçin</option>
          {slots.map((slot) => (
            <option key={slot} value={slot}>
              {slot}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Ad Soyad</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label>Telefon</label>
        <input
          type="tel"
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          style={{ display: "block", width: "100%", padding: "10px", marginTop: "6px" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          padding: "12px 20px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Kaydediliyor..." : "Randevu Oluştur"}
      </button>

      {message && <p style={{ marginTop: "16px" }}>{message}</p>}
    </form>
  );
}