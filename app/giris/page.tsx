"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage("Giris hatasi: " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMessage("Kullanici bulunamadi.");
      setLoading(false);
      return;
    }

    const { data: salons, error: salonError } = await supabase
      .from("salons")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (salonError) {
      setMessage("Salon sorgu hatasi: " + salonError.message);
      setLoading(false);
      return;
    }

    if (!salons || salons.length === 0) {
      setMessage("Bu kullaniciya bagli salon bulunamadi.");
      setLoading(false);
      return;
    }

    const salon = salons[0];
    const slug = toSlug(salon.name || "");

    window.location.href = `/panel/${slug}`;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial",
        padding: "20px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "400px",
          border: "1px solid #ccc",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <h1>Salon Girisi</h1>

        <div style={{ marginTop: "20px" }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: "block",
              width: "100%",
              marginTop: "6px",
              padding: "10px",
            }}
          />
        </div>

        <div style={{ marginTop: "16px" }}>
          <label>Sifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            marginTop: "20px",
            padding: "12px 16px",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }}
        >
          {loading ? "Giris yapiliyor..." : "Giris Yap"}
        </button>

        {message && <p style={{ marginTop: "16px" }}>{message}</p>}
      </form>
    </main>
  );
}