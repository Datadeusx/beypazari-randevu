"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CancelButtonProps = {
  appointmentId: string;
};

export default function CancelButton({ appointmentId }: CancelButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleCancel() {
    const confirmed = window.confirm("Bu randevuyu iptal etmek istiyor musun?");
    if (!confirmed) return;

    const supabase = createClient();

    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", appointmentId);

    if (error) {
      alert("Randevu iptal edilirken hata oluştu.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleCancel}
      disabled={isPending}
      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Iptal ediliyor..." : "Iptal Et"}
    </button>
  );
}