"use client";

import { useMemo, useState } from "react";

type InactiveCustomer = {
  id: string;
  name: string;
  phone: string;
  last_appointment_at: string | null;
  visit_count: number | null;
};

type InactiveCustomersCampaignSectionProps = {
  salonId: string;
  customers: string; // JSON string
};

function formatDateTime(value: string | null) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function InactiveCustomersCampaignSection({
  salonId,
  customers: customersJson,
}: InactiveCustomersCampaignSectionProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  const customers = useMemo(() => {
    try {
      return JSON.parse(customersJson) as InactiveCustomer[];
    } catch {
      return [];
    }
  }, [customersJson]);

  const defaultMessage = useMemo(() => {
    return "Sizi tekrar salonumuzda görmek isteriz. Size özel kampanya ve uygun randevu saatlerimiz için bizimle iletişime geçebilirsiniz.";
  }, []);

  async function handleSendCampaign() {
    setResultMessage("");

    const finalMessage = (message || defaultMessage).trim();

    if (!finalMessage) {
      setResultMessage("Lütfen mesaj gir.");
      return;
    }

    if (!customers || customers.length === 0) {
      setResultMessage("30-60 gün arası gelmeyen izinli müşteri bulunmuyor.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/send-inactive-customers-campaign", {
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
        `Kampanya işlendi. Gonderilen: ${data.sent_count || 0}, Atlanan: ${
          data.skipped_count || 0
        }`
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
          Geri Kazanım Kampanyası
        </h2>

        <p
          style={{
            marginTop: 8,
            marginBottom: 0,
            color: "#6b7280",
            fontSize: 14,
          }}
        >
          Son 30-60 gün içinde gelmeyen ve kampanya izni veren müşterilere
          manuel mesaj gönder.
        </p>
      </div>

      <div style={{ display: "grid", gap: 16 }}>
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
            Filtreye Giren Musteri Sayisi
          </div>

          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            {customers.length}
          </div>

          <div
            style={{
              color: "#6b7280",
              fontSize: 14,
              marginTop: 6,
            }}
          >
            30-60 gun arasi gelmeyen, izinli musteriler
          </div>
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
              marginBottom: 12,
            }}
          >
            Musteri Listesi
          </div>

          {customers.length === 0 ? (
            <div style={{ color: "#4b5563" }}>
              Uygun müşteri bulunmuyor.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 10,
                maxHeight: 260,
                overflowY: "auto",
              }}
            >
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#111827",
                    }}
                  >
                    {customer.name || "Isimsiz musteri"}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      display: "grid",
                      gap: 4,
                      color: "#4b5563",
                      fontSize: 14,
                    }}
                  >
                    <div>Telefon: {customer.phone || "-"}</div>
                    <div>
                      Son ziyaret: {formatDateTime(customer.last_appointment_at)}
                    </div>
                    <div>Ziyaret sayisi: {customer.visit_count || 0}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
          disabled={loading || customers.length === 0}
          style={{
            border: "none",
            borderRadius: 18,
            background: "#111827",
            color: "#ffffff",
            padding: "16px 18px",
            fontSize: 15,
            fontWeight: 700,
            cursor: loading || customers.length === 0 ? "not-allowed" : "pointer",
            opacity: loading || customers.length === 0 ? 0.6 : 1,
          }}
        >
          {loading ? "Kampanya gonderiliyor..." : "Geri Kazanım Kampanyasi Gonder"}
        </button>
      </div>
    </section>
  );
}