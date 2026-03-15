import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PanelSlugPage({ params }: PageProps) {
  const supabase = await createClient();
  const { slug } = await params;

  const { data: salon, error: salonError } = await supabase
    .from("salons")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (salonError || !salon) {
    redirect("/giris");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        padding: "24px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>
          {salon.name} - Panel
        </h1>

        <div style={{ background: "#fff", padding: 24, borderRadius: 16 }}>
          <p>Salon ID: {salon.id}</p>
          <p>Slug: {salon.slug}</p>

          <Link
            href="/giris"
            style={{
              display: "inline-block",
              marginTop: 16,
              padding: "12px 24px",
              background: "#111",
              color: "#fff",
              borderRadius: 8,
              textDecoration: "none"
            }}
          >
            Çıkış Yap
          </Link>
        </div>
      </div>
    </main>
  );
}
