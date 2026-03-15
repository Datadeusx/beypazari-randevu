"use client";

import { useState } from "react";

export default function RetryButton({ logId }: { logId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleRetry() {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/retry-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logId }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setError(data.error || "Tekrar denemesi basarisiz");
      }
    } catch (err: any) {
      setError(err.message || "Bir hata olustu");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <span className="text-green-600 text-xs font-medium">
        Basarili!
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handleRetry}
        disabled={loading}
        className="text-blue-600 hover:text-blue-800 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Gonderiliyor..." : "Tekrar Dene"}
      </button>
      {error && (
        <p className="text-red-600 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}
