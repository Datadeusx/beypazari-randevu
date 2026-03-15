"use client";

import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/giris";
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "8px 14px",
        borderRadius: "6px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#444",
        color: "white",
      }}
    >
      Çıkış Yap
    </button>
  );
}