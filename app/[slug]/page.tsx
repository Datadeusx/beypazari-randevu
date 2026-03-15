import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ShortLinkPage({ params }: PageProps) {
  const { slug } = await params;

  const { data: salons } = await supabase
    .from("salons")
    .select("*");

  const salon = (salons ?? []).find((s: any) =>
    toSlug(s.name).startsWith(slug)
  );

  if (!salon) {
    return (
      <main style={{ padding: "40px", fontFamily: "Arial" }}>
        <h1>Salon bulunamadı</h1>
      </main>
    );
  }

  const salonSlug = toSlug(salon.name);

  redirect(`/salon/${salonSlug}`);
}