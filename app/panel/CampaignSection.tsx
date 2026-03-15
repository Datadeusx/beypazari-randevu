"use client";

import { useMemo, useState } from "react";

type CampaignSectionProps = {
  salonId: string;
  eligibleCustomerCount: number;
  emptySlotsToday: string[];
};

export default function CampaignSection({
  salonId,
  eligibleCustomerCount,
  emptySlotsToday,
}: CampaignSectionProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const defaultMessage = useMemo(() => {
    if (!emptySlotsToday || emptySlotsToday.length === 0) {
      return "Bugün için uygun boş saatlerimiz bulunmaktadır. Detaylı bilgi ve randevu için bizimle iletişime geçebilirsiniz.";
    }

    const slotsText = emptySlotsToday.join(", ");

    return `Bugün için uygun boş saatlerimiz var: ${slotsText}. Randevu almak isterseniz bizimle iletişime geçebilirsiniz.`;
  }, [emptySlotsToday]);

  async function handleSendCampaign() {
    setResultMessage("");

    const finalMessage = (message || defaultMessage).trim();

    if (!finalMessage) {
      setResultMessage("Lütfen mesaj gir.");
      return;
    }

    if (eligibleCustomerCount === 0) {
      setResultMessage("Kampanya izni veren müşteri bulunmuyor.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/send-empty-slot-campaign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          salonId,
          message: finalMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResultMessage(data?.error || "Kampanya gönderilemedi.");
        setLoading(false);
        return;
      }

      setResultMessage(
        `Kampanya işlendi. Gönderim sayısı: ${data.sent_count || 0}`
      );
    } catch (error: any) {
      setResultMessage(error?.message || "Beklenmeyen hata oluştu.");
    }

    setLoading(false);
  }

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
          Bos Saat Kampanyasi
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          Bugunun bos saatlerini gor ve izin veren musterilere manuel kampanya
          gonder.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Bugunun Bos Saatleri
          </div>

          {!emptySlotsToday || emptySlotsToday.length === 0 ? (
            <div style={{ color: "#4b5563" }}>Bugun bos saat yok.</div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {emptySlotsToday.map((slot) => (
                <span
                  key={slot}
                  style={{
                    background: "#111827",
                    color: "#ffffff",
                    borderRadius: 999,
                    padding: "8px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  {slot}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 18,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "#6b7280",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 8,
            }}
          >
            Kampanya Gonderilebilecek Musteri
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            {eligibleCustomerCount}
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: 14,
              marginTop: 6,
            }}
          >
            Kampanya izni veren musteriler
          </div>
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
            Kampanya Mesaji
          </label>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={defaultMessage}
            rows={5}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: 18,
              padding: 14,
              resize: "vertical",
              color: "#111827",
              background: "#ffffff",
              fontFamily: "inherit",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          />
        </div>

        {resultMessage ? (
          <div
            style={{
              border: "1px solid #e5e7eb",
              background: "#f9fafb",
              color: "#374151",
              borderRadius: 16,
              padding: "14px 16px",
              fontSize: 14,
            }}
          >
            {resultMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSendCampaign}
          disabled={loading || eligibleCustomerCount === 0}
          style={{
            border: "none",
            borderRadius: 18,
            background: "#111827",
            color: "#ffffff",
            padding: "16px 18px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || eligibleCustomerCount === 0 ? "not-allowed" : "pointer",
            opacity: loading || eligibleCustomerCount === 0 ? 0.6 : 1,
          }}
        >
          {loading ? "Kampanya gonderiliyor..." : "Bos Saat Kampanyasi Gonder"}
        </button>
      </div>
    </section>
  );
}