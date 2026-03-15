import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export default async function PanelIndexPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/giris");
  }

  const { data: salons } = await supabase
    .from("salons")
    .select("*")
    .eq("user_id", user.id)
    .limit(1);

  if (!salons || salons.length === 0) {
    redirect("/giris");
  }

  const salon = salons[0];
  redirect(`/panel/${salon.slug}`);
}