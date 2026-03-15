import Link from "next/link";

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 12,
          marginBottom: 0,
          color: "#4b5563",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function StepCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "8px 12px",
          borderRadius: 999,
          background: "#eef2ff",
          color: "#3730a3",
          fontSize: 12,
          fontWeight: 800,
          marginBottom: 14,
        }}
      >
        {step}
      </div>

      <h3
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
        }}
      >
        {title}
      </h3>

      <p
        style={{
          marginTop: 12,
          marginBottom: 0,
          color: "#4b5563",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </div>
  );
}

function ContactCard({
  title,
  value,
  text,
}: {
  title: string;
  value: string;
  text: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 800,
          color: "#6b7280",
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 10,
          fontSize: 24,
          fontWeight: 900,
          color: "#111827",
        }}
      >
        {value}
      </div>

      <p
        style={{
          marginTop: 10,
          marginBottom: 0,
          color: "#4b5563",
          fontSize: 15,
          lineHeight: 1.7,
        }}
      >
        {text}
      </p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
        color: "#111827",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "24px 16px 48px",
        }}
      >
        <section
          style={{
            overflow: "hidden",
            borderRadius: 32,
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
            color: "#ffffff",
            padding: 36,
            boxShadow: "0 12px 30px rgba(0,0,0,0.14)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              padding: "8px 14px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              fontSize: 12,
              fontWeight: 800,
              marginBottom: 16,
            }}
          >
            Beypazarı için online randevu sistemi
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 56,
              lineHeight: 1.05,
              fontWeight: 900,
              maxWidth: 820,
              letterSpacing: -1,
            }}
          >
            Güzellik salonları ve kuaförler için sade, hızlı ve modern randevu sistemi
          </h1>

          <p
            style={{
              marginTop: 18,
              maxWidth: 820,
              color: "rgba(255,255,255,0.84)",
              fontSize: 18,
              lineHeight: 1.7,
            }}
          >
            Müşterileriniz online randevu alsın, siz panelden hizmetleri,
            çalışma saatlerini, SMS hatırlatmaları ve kampanya akışlarını yönetin.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginTop: 24,
            }}
          >
            <Link
              href="/salon/nurseda-guzellik-salonu"
              style={{
                textDecoration: "none",
                background: "#ffffff",
                color: "#111827",
                padding: "14px 18px",
                borderRadius: 18,
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              Demo Randevu Sayfasini Ac
            </Link>

            <Link
              href="/giris"
              style={{
                textDecoration: "none",
                background: "rgba(255,255,255,0.08)",
                color: "#ffffff",
                padding: "14px 18px",
                borderRadius: 18,
                fontWeight: 800,
                fontSize: 15,
                border: "1px solid rgba(255,255,255,0.14)",
              }}
            >
              Salon Girisi
            </Link>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              marginTop: 24,
            }}
          >
            {[
              "Online randevu",
              "SMS hatırlatma",
              "Boş saat kampanyası",
              "Salon paneli",
            ].map((item) => (
              <span
                key={item}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  borderRadius: 999,
                  padding: "8px 14px",
                  color: "rgba(255,255,255,0.92)",
                  fontSize: 14,
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            <FeatureCard
              title="Müşteri için kolay rezervasyon"
              text="Salon linkini açan müşteri, hizmet seçip uygun saatleri görür ve dakikalar içinde randevu oluşturur."
            />
            <FeatureCard
              title="Salon sahibi için tek ekran yönetim"
              text="Yaklaşan randevular, bugünün planı, çalışma saatleri, hizmetler ve SMS hareketleri tek panelde toplanır."
            />
            <FeatureCard
              title="Boş saatleri satış fırsatına çevir"
              text="İzin veren müşterilere boş saat kampanyası veya geri kazanım mesajı göndererek doluluğu artır."
            />
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 30,
              padding: 28,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 36,
                fontWeight: 900,
                color: "#111827",
              }}
            >
              Nasıl çalışır?
            </h2>

            <p
              style={{
                marginTop: 10,
                color: "#6b7280",
                fontSize: 15,
              }}
            >
              Kurulum basit, kullanım daha da basit.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 16,
                marginTop: 18,
              }}
            >
              <StepCard
                step="1. ADIM"
                title="Salon bilgilerini ayarla"
                text="Panelden hizmetlerini ve çalışma saatlerini gir. Sana özel randevu sayfan otomatik oluşsun."
              />
              <StepCard
                step="2. ADIM"
                title="Müşteriler linkten randevu alsın"
                text="Müşterilerin hizmet seçsin, uygun saatleri görsün ve online randevusunu oluştursun."
              />
              <StepCard
                step="3. ADIM"
                title="Randevuları ve kampanyaları yönet"
                text="Randevu akışını takip et, SMS hatırlatma ve boş saat kampanyalarıyla verimini artır."
              />
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: 16,
            }}
          >
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 30,
                padding: 28,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                Kimler için uygun?
              </h2>

              <div
                style={{
                  display: "grid",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                {[
                  "Güzellik salonları",
                  "Kuaförler",
                  "Cilt bakım merkezleri",
                  "Kirpik ve kaş hizmeti veren işletmeler",
                  "Butik, yerel ve hızlı yönetim isteyen salonlar",
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                      borderRadius: 18,
                      padding: 16,
                      color: "#374151",
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 30,
                padding: 28,
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                Baslangic paketi
              </h2>

              <div
                style={{
                  marginTop: 18,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  borderRadius: 22,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    color: "#6b7280",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Aylik
                </div>

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 44,
                    fontWeight: 900,
                    color: "#111827",
                  }}
                >
                  500 - 750 TL
                </div>

                <div
                  style={{
                    marginTop: 10,
                    color: "#4b5563",
                    lineHeight: 1.7,
                    fontSize: 15,
                  }}
                >
                  Online randevu sayfası, salon paneli, SMS altyapısı ve kampanya
                  yönetimi ile sade bir başlangıç paketi.
                </div>
              </div>

              <Link
                href="/giris"
                style={{
                  marginTop: 18,
                  display: "inline-block",
                  textDecoration: "none",
                  background: "#111827",
                  color: "#ffffff",
                  padding: "14px 18px",
                  borderRadius: 18,
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                Salon Paneline Gir
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
              borderRadius: 30,
              padding: 30,
              color: "#ffffff",
              boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 38,
                fontWeight: 900,
              }}
            >
              Salonunu dijitale taşı
            </h2>

            <p
              style={{
                marginTop: 14,
                marginBottom: 0,
                maxWidth: 760,
                color: "rgba(255,255,255,0.84)",
                fontSize: 16,
                lineHeight: 1.7,
              }}
            >
              Daha az telefon trafiği, daha düzenli randevu akışı, daha güçlü
              müşteri geri dönüşü. Beypazarı’ndan başlayıp büyüyen salonlar için
              sade ve güçlü bir sistem.
            </p>

            <div
              style={{
                display: "flex",
                gap: 14,
                flexWrap: "wrap",
                marginTop: 22,
              }}
            >
              <Link
                href="/salon/nurseda-guzellik-salonu"
                style={{
                  textDecoration: "none",
                  background: "#ffffff",
                  color: "#111827",
                  padding: "14px 18px",
                  borderRadius: 18,
                  fontWeight: 800,
                  fontSize: 15,
                }}
              >
                Demo Sayfayi Goster
              </Link>

              <Link
                href="/giris"
                style={{
                  textDecoration: "none",
                  background: "rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  padding: "14px 18px",
                  borderRadius: 18,
                  fontWeight: 800,
                  fontSize: 15,
                  border: "1px solid rgba(255,255,255,0.14)",
                }}
              >
                Hemen Basla
              </Link>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 16,
            }}
          >
            <ContactCard
              title="WhatsApp"
              value="+90 500 000 00 00"
              text="Demo talebi, kurulum ve detaylı bilgi için doğrudan WhatsApp üzerinden iletişime geçebilirsiniz."
            />

            <ContactCard
              title="E-posta"
              value="info@ornekdomain.com"
              text="Kurumsal kullanım, fiyatlandırma ve destek için e-posta ile bize ulaşabilirsiniz."
            />

            <ContactCard
              title="Hizmet Bolgesi"
              value="Beypazarı"
              text="İlk aşamada Beypazarı odaklı başlıyoruz. Sonrasında farklı ilçe ve şehirlere açılabilir."
            />
          </div>
        </section>

        <section style={{ marginTop: 28 }}>
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 30,
              padding: 28,
              boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 34,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                Hemen demo iste
              </h2>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "#6b7280",
                  fontSize: 15,
                  lineHeight: 1.7,
                  maxWidth: 760,
                }}
              >
                Salonuna özel kurulum, randevu sayfası ve panel yapısını birlikte
                gösterebiliriz. İstersen WhatsApp’tan yaz, sistemi canlı anlatayım.
              </p>
            </div>

            <a
              href="https://wa.me/905000000000"
              target="_blank"
              rel="noreferrer"
              style={{
                textDecoration: "none",
                background: "#25D366",
                color: "#ffffff",
                padding: "16px 22px",
                borderRadius: 18,
                fontWeight: 900,
                fontSize: 15,
                whiteSpace: "nowrap",
              }}
            >
              WhatsApp ile Iletisime Gec
            </a>
          </div>
        </section>

        <footer
          style={{
            marginTop: 28,
            background: "#111827",
            color: "#ffffff",
            borderRadius: 28,
            padding: 28,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                }}
              >
                Beypazarı Randevu Sistemi
              </div>

              <p
                style={{
                  marginTop: 10,
                  marginBottom: 0,
                  color: "rgba(255,255,255,0.72)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  maxWidth: 620,
                }}
              >
                Güzellik salonları ve kuaförler için sade, modern ve sonuç odaklı
                online randevu çözümü.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Link
                href="/"
                style={{
                  textDecoration: "none",
                  color: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Ana Sayfa
              </Link>

              <Link
                href="/giris"
                style={{
                  textDecoration: "none",
                  color: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Salon Girisi
              </Link>

              <Link
                href="/salon/nurseda-guzellik-salonu"
                style={{
                  textDecoration: "none",
                  color: "#ffffff",
                  padding: "10px 14px",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.08)",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                Demo
              </Link>
            </div>
          </div>

          <div
            style={{
              marginTop: 20,
              paddingTop: 18,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.62)",
              fontSize: 13,
            }}
          >
            © 2026 Beypazarı Randevu Sistemi. Tüm hakları saklıdır.
          </div>
        </footer>
      </div>
    </main>
  );
}