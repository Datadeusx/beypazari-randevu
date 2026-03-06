export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <span className="inline-block rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
            Beypazarı işletmeleri için dijital randevu çözümü
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Beypazarı’nda randevu karışıklığını bitiriyoruz.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            Kuaför, güzellik salonu, klinik ve servis işletmeleri için online
            randevu, müşteri takibi ve SMS hatırlatma sistemi.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#demo"
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Demo İste
            </a>
            <a
              href="#nasil-calisir"
              className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Nasıl Çalışır
            </a>
          </div>
        </div>
      </section>

      <section id="nasil-calisir" className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">01</div>
            <h2 className="mt-3 text-xl font-semibold">Hizmetlerini ekle</h2>
            <p className="mt-3 text-slate-600">
              İşletmene özel hizmetleri ve süreleri tanımla. Kaş, cilt bakımı,
              lazer, kontrol randevusu ya da servis işlemleri fark etmez.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">02</div>
            <h2 className="mt-3 text-xl font-semibold">Müşterin randevu alsın</h2>
            <p className="mt-3 text-slate-600">
              Müşterilerin uygun gün ve saati seçsin. Çakışan saatler otomatik
              engellensin, WhatsApp karmaşası bitsin.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-500">03</div>
            <h2 className="mt-3 text-xl font-semibold">SMS hatırlatma gönder</h2>
            <p className="mt-3 text-slate-600">
              Randevu öncesi otomatik hatırlatma gönder. Unutulan randevuları ve
              son dakika iptallerini azalt.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-3xl bg-slate-50 p-8 md:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Kimler için uygun?
          </h2>
          <p className="mt-4 max-w-2xl text-slate-600">
            Beypazarı’nda randevu ile çalışan küçük ve orta ölçekli işletmeler
            için tasarlandı.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm">Kuaförler</div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">Güzellik salonları</div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">Klinikler</div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">Servis işletmeleri</div>
          </div>
        </div>
      </section>

      <section id="demo" className="mx-auto max-w-6xl px-6 pb-20">
        <div className="rounded-3xl bg-slate-900 p-8 text-white md:p-12">
          <h2 className="text-3xl font-bold tracking-tight">
            İşletmen için demoyu birlikte kuralım
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            İlk kurulumu birlikte yapalım. İşletmene uygun hizmetleri ekleyelim,
            çalışma saatlerini tanımlayalım ve randevu akışını canlı gösterelim.
          </p>

          <div className="mt-8">
            <a
              href="https://wa.me/"
              className="inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
            >
              WhatsApp ile İletişime Geç
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}