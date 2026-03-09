import { supabase } from "../lib/supabase";

export default async function Home() {
  const { data: salons, error } = await supabase.from("salons").select("*");

  return (
    <main className="min-h-screen bg-white px-6 py-20 text-slate-900">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">Supabase bağlantı testi</h1>

        <p className="mt-4 text-lg text-slate-600">
          Eğer aşağıda veri görüyorsak, site veritabanına bağlanmış demektir.
        </p>

        <div className="mt-10 rounded-2xl border border-slate-200 p-6">
          <h2 className="text-2xl font-semibold">Salonlar</h2>

          {error ? (
            <p className="mt-4 text-red-600">Hata: {error.message}</p>
          ) : salons && salons.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {salons.map((salon) => (
                <li key={salon.id} className="rounded-xl bg-slate-50 p-4">
                  <strong>{salon.name}</strong>
                  <div className="text-sm text-slate-600">{salon.city}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-slate-500">Henüz salon verisi yok.</p>
          )}
        </div>
      </div>
    </main>
  );
}
