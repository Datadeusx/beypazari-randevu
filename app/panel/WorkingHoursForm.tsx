"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type WorkingHour = {
  id?: string;
  salon_id?: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string | null;
  close_time: string | null;
};

type WorkingHoursFormProps = {
  salonId: string;
  workingHours: string; // JSON string
};

const dayNames = [
  "Pazar",
  "Pazartesi",
  "Sali",
  "Carsamba",
  "Persembe",
  "Cuma",
  "Cumartesi",
];

export default function WorkingHoursForm({
  salonId,
  workingHours: workingHoursJson,
}: WorkingHoursFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const parsedWorkingHours = useMemo(() => {
    try {
      return JSON.parse(workingHoursJson) as WorkingHour[];
    } catch {
      return [];
    }
  }, [workingHoursJson]);

  const initialRows = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const existing = parsedWorkingHours.find((item) => item.day_of_week === i);

      return (
        existing || {
          day_of_week: i,
          is_open: false,
          open_time: "09:00",
          close_time: "18:00",
        }
      );
    });
  }, [parsedWorkingHours]);

  const [rows, setRows] = useState<WorkingHour[]>(initialRows);

  function updateRow(
    dayOfWeek: number,
    field: keyof WorkingHour,
    value: string | boolean | null
  ) {
    setRows((prev) =>
      prev.map((row) =>
        row.day_of_week === dayOfWeek ? { ...row, [field]: value } : row
      )
    );
  }

  async function handleSave() {
    setMessage("");

    const payload = rows.map((row) => ({
      salon_id: salonId,
      day_of_week: row.day_of_week,
      is_open: row.is_open,
      open_time: row.is_open ? row.open_time : null,
      close_time: row.is_open ? row.close_time : null,
    }));

    const { error: deleteError } = await supabase
      .from("working_hours")
      .delete()
      .eq("salon_id", salonId);

    if (deleteError) {
      setMessage("Onceki calisma saatleri silinemedi: " + deleteError.message);
      return;
    }

    const { error: insertError } = await supabase
      .from("working_hours")
      .insert(payload);

    if (insertError) {
      setMessage("Calisma saatleri kaydedilemedi: " + insertError.message);
      return;
    }

    setMessage("Calisma saatleri kaydedildi.");

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {rows.map((row) => (
        <div
          key={row.day_of_week}
          className="rounded-xl border border-neutral-200 p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-medium text-neutral-900">
              {dayNames[row.day_of_week]}
            </p>

            <label className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                checked={row.is_open}
                onChange={(e) =>
                  updateRow(row.day_of_week, "is_open", e.target.checked)
                }
              />
              Acik
            </label>
          </div>

          {row.is_open && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm text-neutral-600">
                  Acilis
                </label>
                <input
                  type="time"
                  value={row.open_time || "09:00"}
                  onChange={(e) =>
                    updateRow(row.day_of_week, "open_time", e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-neutral-600">
                  Kapanis
                </label>
                <input
                  type="time"
                  value={row.close_time || "18:00"}
                  onChange={(e) =>
                    updateRow(row.day_of_week, "close_time", e.target.value)
                  }
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {message && (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          {message}
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor..." : "Calisma Saatlerini Kaydet"}
      </button>
    </div>
  );
}