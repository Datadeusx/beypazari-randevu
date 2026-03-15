"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ServicesList({ services }: { services: any[] }) {
  const supabase = createClient();
  const router = useRouter();

  async function deleteService(id: string) {
    const confirmDelete = confirm("Bu hizmeti silmek istiyor musunuz?");

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Hizmet silinemedi");
      return;
    }

    router.refresh();
  }

  if (!services || services.length === 0) {
    return (
      <p style={{ color: "#6b7280" }}>
        Henüz hizmet eklenmemiş.
      </p>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {services.map((service) => (
        <div
          key={service.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: 14,
            border: "1px solid #e5e7eb",
            borderRadius: 14,
            background: "#f9fafb",
          }}
        >
          <div>
            <div
              style={{
                fontWeight: 700,
                color: "#111827",
              }}
            >
              {service.name}
            </div>

            <div
              style={{
                fontSize: 13,
                color: "#6b7280",
              }}
            >
              {service.duration_minutes} dakika
            </div>
          </div>

          <button
            onClick={() => deleteService(service.id)}
            style={{
              border: "none",
              background: "#ef4444",
              color: "white",
              padding: "8px 12px",
              borderRadius: 10,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sil
          </button>
        </div>
      ))}
    </div>
  );
}