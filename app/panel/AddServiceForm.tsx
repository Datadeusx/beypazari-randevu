"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AddServiceForm({ salonId }: { salonId: string }) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    if (!name || !duration) {
      setMessage("Lütfen tüm alanları doldurun.");
      return;
    }

    const durationNumber = Number(duration);

    if (Number.isNaN(durationNumber) || durationNumber <= 0) {
      setMessage("Süre geçerli bir sayı olmalı.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { error } = await supabase.from("services").insert([
      {
        salon_id: salonId,
        name,
        duration_minutes: durationNumber,
      },
    ]);

    if (error) {
      setMessage("Hizmet eklenirken hata oluştu: " + error.message);
    } else {
      setMessage("Hizmet başarıyla eklendi.");
      setName("");
      setDuration("");
      location.reload();
    }

    setLoading(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: "16px",
        maxWidth: "420px",
        border: "1px solid #ccc",
        borderRadius: "12px",
        padding: "16px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Yeni Hizmet Ekle</h3>

      <div style={{ marginTop: "12px" }}>
        <label>Hizmet Adı</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "6px",
            padding: "10px",
          }}
        />
      </div>

      <div style={{ marginTop: "12px" }}>
        <label>Süre (dakika)</label>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{
            display: "block",
            width: "100%",
            marginTop: "6px",
            padding: "10px",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: "16px",
          padding: "10px 14px",
          borderRadius: "8px",
          border: "none",
          cursor: "pointer",
        }}
      >
        {loading ? "Ekleniyor..." : "Hizmet Ekle"}
      </button>

      {message && <p style={{ marginTop: "12px" }}>{message}</p>}
    </form>
  );
}