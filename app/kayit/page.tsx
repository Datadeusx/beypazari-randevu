"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { registerSalon } from "./actions";

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

export default function RegisterPage() {
  const [salonName, setSalonName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const previewSlug = useMemo(() => toSlug(salonName), [salonName]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await registerSalon({
      salonName,
      phone,
      email,
      password,
    });

    if (!result.success) {
      setMessage(result.error || "Bir hata oluştu");
      setLoading(false);
      return;
    }

    window.location.href = `/panel/${result.slug}`;
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
          maxWidth: 460,
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
            Salonunu oluştur, paneline giriş yap ve online randevu sistemini hemen kullanmaya başla.
          </p>
        </div>

        <form
          onSubmit={handleRegister}
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
            Salon Kaydı
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
              Salon Adı
            </label>
            <input
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Örn: Nurseda Güzellik Salonu"
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
              Telefon
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xx xxx xx xx"
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
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
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
              placeholder="En az 6 karakter"
              style={inputStyle}
            />
          </div>

          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 14,
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: "#6b7280",
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Oluşacak panel adresi
            </div>

            <div
              style={{
                marginTop: 8,
                fontSize: 15,
                fontWeight: 800,
                color: "#111827",
                wordBreak: "break-word",
              }}
            >
              /panel/{previewSlug || "salon-slug"}
            </div>
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
            {loading ? "Salon oluşturuluyor..." : "Salon Oluştur"}
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
            Zaten hesabın var mı?{" "}
            <Link
              href="/giris"
              style={{
                color: "#111827",
                fontWeight: 800,
                textDecoration: "none",
              }}
            >
              Salon girişine git
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