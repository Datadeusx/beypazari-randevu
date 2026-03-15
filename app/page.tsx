import Link from "next/link";
import Logo from "@/components/Logo";

function FeatureCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="landing-card">
      <h3 className="landing-cardTitle">{title}</h3>
      <p className="landing-cardText">{text}</p>
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
    <div className="landing-card">
      <div className="landing-pill">{step}</div>
      <h3 className="landing-cardTitle">{title}</h3>
      <p className="landing-cardText">{text}</p>
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
    <div className="landing-card">
      <div className="landing-contactLabel">{title}</div>
      <div className="landing-contactValue">{value}</div>
      <p className="landing-cardText">{text}</p>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="landing-pageRoot">
      <header className="landing-topBar">
        <div className="landing-container landing-topBarInner">
          <Logo />

          <nav className="landing-navLinks">
            <a href="#ozellikler" className="landing-navItem">
              Özellikler
            </a>
            <a href="#nasil-calisir" className="landing-navItem">
              Nasıl Çalışır
            </a>
            <a href="#fiyat" className="landing-navItem">
              Fiyat
            </a>
            <a href="#iletisim" className="landing-navItem">
              İletişim
            </a>
          </nav>

          <div className="landing-navActions">
            <Link href="/giris" className="landing-ghostButton">
              Salon Girişi
            </Link>
            <Link href="/kayit" className="landing-darkButton">
              Salon Kaydı
            </Link>
          </div>
        </div>
      </header>

      <div className="landing-container landing-pageContent">
        <section className="landing-heroSection">
          <div className="landing-heroGrid">
            <div>
              <div className="landing-heroBadge">
                Beypazarı için sade ve güçlü randevu altyapısı
              </div>

              <h1 className="landing-heroTitle">
                Güzellik salonları ve kuaförler için modern online randevu sistemi
              </h1>

              <p className="landing-heroText">
                Müşterileriniz online randevu alsın, siz panelden hizmetleri,
                çalışma saatlerini, randevuları ve kampanyaları kolayca yönetin.
                Sade, hızlı ve kullanışlı bir sistem.
              </p>

              <div className="landing-heroActions">
                <Link
                  href="/salon/nurseda-guzellik-salonu"
                  className="landing-lightButton"
                >
                  Demo Randevu Sayfasını Aç
                </Link>

                <Link href="/kayit" className="landing-outlineLightButton">
                  Salon Kaydı
                </Link>
              </div>

              <div className="landing-heroTags">
                {[
                  "Online randevu",
                  "SMS logları",
                  "Boş saat kampanyası",
                  "Salon paneli",
                ].map((item) => (
                  <span key={item} className="landing-heroTag">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="landing-heroInfoCard">
              <div className="landing-heroInfoTop">Başlangıç Paketi</div>
              <div className="landing-heroInfoPrice">500 - 750 TL</div>
              <p className="landing-heroInfoText">
                Küçük ve orta ölçekli salonlar için hızlı kurulum, sade kullanım,
                randevu akışı ve müşteri geri kazanım odaklı yapı.
              </p>

              <div className="landing-heroInfoList">
                <div className="landing-heroInfoItem">
                  • Online randevu sayfası
                </div>
                <div className="landing-heroInfoItem">
                  • Hizmet ve saat yönetimi
                </div>
                <div className="landing-heroInfoItem">
                  • SMS ve kampanya altyapısı
                </div>
                <div className="landing-heroInfoItem">• Salon paneli</div>
              </div>

              <a
                href="https://wa.me/905000000000"
                target="_blank"
                rel="noreferrer"
                className="landing-whatsAppButton"
              >
                WhatsApp ile Demo İste
              </a>
            </div>
          </div>
        </section>

        <section id="ozellikler" className="landing-sectionSpace">
          <div className="landing-sectionHead">
            <h2 className="landing-sectionTitle">Öne çıkan özellikler</h2>
            <p className="landing-sectionSubtitle">
              Salon sahibinin işini kolaylaştıran, müşterinin ise hızlıca
              randevu alabildiği bir yapı.
            </p>
          </div>

          <div className="landing-gridThree">
            <FeatureCard
              title="Müşteri için kolay rezervasyon"
              text="Salon linkini açan müşteri, hizmet seçip uygun saatleri görür ve dakikalar içinde randevu oluşturur."
            />
            <FeatureCard
              title="Salon sahibi için tek ekran yönetim"
              text="Yaklaşan randevular, bugünün planı, çalışma saatleri, hizmetler ve kampanyalar tek panelde toplanır."
            />
            <FeatureCard
              title="Boş saatleri fırsata çevir"
              text="İzin veren müşterilere boş saat kampanyası veya geri kazanım mesajı göndererek doluluğu artır."
            />
          </div>
        </section>

        <section id="nasil-calisir" className="landing-sectionSpace">
          <div className="landing-whiteSection">
            <div className="landing-sectionHead">
              <h2 className="landing-sectionTitle">Nasıl çalışır?</h2>
              <p className="landing-sectionSubtitle">
                Kurulum basit, kullanım daha da basit.
              </p>
            </div>

            <div className="landing-gridThree">
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
                text="Randevu akışını takip et, hatırlatma ve kampanya süreçleriyle verimini artır."
              />
            </div>
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-gridTwoWide">
            <div className="landing-whiteSection">
              <h2 className="landing-sectionTitle">Kimler için uygun?</h2>

              <div className="landing-stackList">
                {[
                  "Güzellik salonları",
                  "Kuaförler",
                  "Cilt bakım merkezleri",
                  "Kirpik ve kaş hizmeti veren işletmeler",
                  "Butik ve yerel salonlar",
                ].map((item) => (
                  <div key={item} className="landing-listItem">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="fiyat" className="landing-whiteSection">
              <h2 className="landing-sectionTitle">Başlangıç paketi</h2>

              <div className="landing-pricingBox">
                <div className="landing-pricingLabel">Aylık</div>
                <div className="landing-pricingPrice">500 - 750 TL</div>
                <div className="landing-pricingText">
                  Online randevu sayfası, salon paneli, SMS altyapısı ve kampanya
                  yönetimi ile sade bir başlangıç paketi.
                </div>
              </div>

              <Link
                href="/kayit"
                className="landing-darkButton landing-marginTop18"
              >
                Salonunu Oluştur
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-darkCtaSection">
            <div className="landing-darkLogoRow">
              <Logo dark={false} />
            </div>

            <h2 className="landing-darkCtaTitle">Salonunu dijitale taşı</h2>

            <p className="landing-darkCtaText">
              Daha az telefon trafiği, daha düzenli randevu akışı, daha güçlü
              müşteri geri dönüşü. Beypazarı’ndan başlayıp büyüyen salonlar için
              sade ve güçlü bir sistem.
            </p>

            <div className="landing-heroActions">
              <Link
                href="/salon/nurseda-guzellik-salonu"
                className="landing-lightButton"
              >
                Demo Sayfayı Göster
              </Link>

              <Link href="/kayit" className="landing-outlineLightButton">
                Hemen Başla
              </Link>
            </div>
          </div>
        </section>

        <section id="iletisim" className="landing-sectionSpace">
          <div className="landing-gridThree">
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
              title="Hizmet Bölgesi"
              value="Beypazarı"
              text="İlk aşamada Beypazarı odaklı başlıyoruz. Sonrasında farklı ilçe ve şehirlere açılabilir."
            />
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-demoStrip">
            <div>
              <h2 className="landing-sectionTitle landing-noMarginBottom">
                Hemen demo iste
              </h2>

              <p className="landing-sectionSubtitle landing-demoSubtitle">
                Salonuna özel kurulum, randevu sayfası ve panel yapısını birlikte
                gösterebiliriz. İstersen WhatsApp’tan yaz, sistemi canlı anlatalım.
              </p>
            </div>

            <a
              href="https://wa.me/905000000000"
              target="_blank"
              rel="noreferrer"
              className="landing-whatsAppButton"
            >
              WhatsApp ile İletişime Geç
            </a>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footerTop">
            <div>
              <Logo dark={false} />

              <p className="landing-footerText">
                Güzellik salonları ve kuaförler için sade, modern ve sonuç odaklı
                online randevu çözümü.
              </p>
            </div>

            <div className="landing-footerLinks">
              <Link href="/" className="landing-footerLink">
                Ana Sayfa
              </Link>
              <Link href="/giris" className="landing-footerLink">
                Salon Girişi
              </Link>
              <Link href="/kayit" className="landing-footerLink">
                Salon Kaydı
              </Link>
            </div>
          </div>

          <div className="landing-footerBottom">
            © 2026 Beypazari Randevu. Tüm hakları saklıdır.
          </div>
        </footer>
      </div>
    </main>
  );
}