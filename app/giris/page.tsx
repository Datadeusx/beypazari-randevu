"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
      setMessage("Giriş hatası: " + error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (!user) {
      setMessage("Kullanıcı bulunamadı.");
      setLoading(false);
      return;
    }

    const { data: salons, error: salonError } = await supabase
      .from("salons")
      .select("*")
      .eq("user_id", user.id)
      .limit(1);

    if (salonError) {
      setMessage("Salon sorgu hatası: " + salonError.message);
      setLoading(false);
      return;
    }

    if (!salons || salons.length === 0) {
      setMessage("Bu kullanıcıya bağlı salon bulunamadı.");
      setLoading(false);
      return;
    }

    const salon = salons[0];
    let slug = salon.slug;

    // If slug doesn't exist (old data), generate it from name and update DB
    if (!slug && salon.name) {
      slug = salon.name
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

      // Update the salon with the generated slug
      await supabase
        .from("salons")
        .update({ slug })
        .eq("id", salon.id);
    }

    if (!slug) {
      setMessage("Salon bilgisi eksik. Lütfen destek ile iletişime geçin.");
      setLoading(false);
      return;
    }

    window.location.href = `/panel/${slug}`;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 18,
          }}
        >
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#111827",
              fontWeight: 900,
              fontSize: 24,
            }}
          >
            Beypazarı Randevu
          </Link>

          <p
            style={{
              marginTop: 10,
              marginBottom: 0,
              color: "#6b7280",
              fontSize: 15,
              lineHeight: 1.7,
            }}
          >
            Salon paneline giriş yap, randevularını ve hizmetlerini tek ekrandan yönet.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: 24,
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
            Salon Girişi
          </h1>

          <div style={{ marginTop: 18 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                color: "#374151",
              }}
            >
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 700,
                color: "#374151",
              }}
            >
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 20,
              width: "100%",
              border: "none",
              borderRadius: 14,
              background: "#111827",
              color: "#ffffff",
              padding: "14px 16px",
              fontWeight: 800,
              fontSize: 15,
              cursor: "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>

          {message ? (
            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                color: "#b91c1c",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {message}
            </p>
          ) : null}

          <p
            style={{
              marginTop: 18,
              marginBottom: 0,
              color: "#6b7280",
              fontSize: 14,
              lineHeight: 1.7,
              textAlign: "center",
            }}
          >
            Hesabın yok mu?{" "}
            <Link
              href="/kayit"
              style={{
                color: "#111827",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Salon kaydı oluştur
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  marginTop: 6,
  padding: "12px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 12,
  outline: "none",
  fontSize: 14,
  color: "#111827",
  background: "#ffffff",
};