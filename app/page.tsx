import Link from "next/link";
import Logo from "@/components/Logo";

function FeatureCard({
  title,
  text,
  icon,
}: {
  title: string;
  text: string;
  icon: string;
}) {
  return (
    <div className="landing-card">
      <div className="landing-cardIcon">{icon}</div>
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
                Randevularınızı dijitalleştirin, işletmenizi büyütün
              </div>

              <h1 className="landing-heroTitle">
                Kuaförler, Güzellik Salonları ve Butik İşletmeler İçin Profesyonel Online Randevu Sistemi
              </h1>

              <p className="landing-heroText">
                Telefonda randevu kaosu son bulsun. Müşterileriniz 7/24 online randevu alsın, siz işinize odaklanın. Otomatik hatırlatmalar, boş saat kampanyaları ve müşteri geri kazanım sistemleriyle doluluk oranınızı %40'a kadar artırın.
              </p>

              <div className="landing-heroActions">
                <Link
                  href="/salon/nurseda-guzellik-salonu"
                  className="landing-lightButton"
                >
                  🎯 Canlı Demo'yu Görün
                </Link>

                <Link href="/kayit" className="landing-outlineLightButton">
                  Ücretsiz Deneyin
                </Link>
              </div>

              <div className="landing-heroTags">
                {[
                  "7/24 Online Randevu",
                  "Otomatik SMS Hatırlatma",
                  "Boş Saat Kampanyaları",
                  "Müşteri Geri Kazanım",
                ].map((item) => (
                  <span key={item} className="landing-heroTag">
                    {item}
                  </span>
                ))}
              </div>

              <div className="landing-statsGrid">
                <div className="landing-statItem">
                  <div className="landing-statNumber">50+</div>
                  <div className="landing-statLabel">Aktif Salon</div>
                </div>
                <div className="landing-statItem">
                  <div className="landing-statNumber">2500+</div>
                  <div className="landing-statLabel">Tamamlanan Randevu</div>
                </div>
                <div className="landing-statItem">
                  <div className="landing-statNumber">97%</div>
                  <div className="landing-statLabel">Müşteri Memnuniyeti</div>
                </div>
              </div>
            </div>

            <div className="landing-heroInfoCard">
              <div className="landing-heroInfoTop">🎁 14 Gün Ücretsiz Deneyin</div>
              <div className="landing-heroInfoPrice">500 - 750 TL</div>
              <p className="landing-heroInfoText">
                Kredi kartı gerekmez. Anında başlayın, farkı görün. İstediğiniz zaman iptal edebilirsiniz. Kurulum ve eğitim ücretsiz!
              </p>

              <div className="landing-heroInfoList">
                <div className="landing-heroInfoItem">
                  ✅ Sınırsız randevu ve müşteri
                </div>
                <div className="landing-heroInfoItem">
                  ✅ Otomatik SMS hatırlatmaları
                </div>
                <div className="landing-heroInfoItem">
                  ✅ Boş saat kampanya sistemi
                </div>
                <div className="landing-heroInfoItem">
                  ✅ Profesyonel salon paneli
                </div>
              </div>

              <a
                href="https://wa.me/905000000000"
                target="_blank"
                rel="noreferrer"
                className="landing-whatsAppButton"
              >
                💬 WhatsApp'tan Hemen Bilgi Al
              </a>
            </div>
          </div>
        </section>

        <section id="ozellikler" className="landing-sectionSpace">
          <div className="landing-sectionHead">
            <h2 className="landing-sectionTitle">İşletmenizi Büyüten Akıllı Özellikler</h2>
            <p className="landing-sectionSubtitle">
              Sadece randevu almakla kalmayın, müşterilerinizi geri kazanın ve doluluk oranınızı maksimuma çıkarın.
            </p>
          </div>

          <div className="landing-gridThree">
            <FeatureCard
              icon="📱"
              title="7/24 Online Randevu - Hiç Kaçırmayın"
              text="Müşterileriniz gece yarısı bile randevu alabilir. Telefonla uğraşmadan, sadece linki paylaşın. Müşteriler hizmet seçer, uygun saati görür, dakikalar içinde randevu oluşturur. Telefon trafiğiniz %80 azalır."
            />
            <FeatureCard
              icon="💰"
              title="Boş Saatlerinizi Paraya Çevirin"
              text="Gün içinde boş kalan saatleriniz mi var? Sistemimiz otomatik olarak SMS ile müşterilerinize özel indirimli kampanyalar gönderir. Boş saatler dolar, geliriniz artar. Ortalama %35 doluluk artışı sağlayın."
            />
            <FeatureCard
              icon="🔄"
              title="Unutulan Müşterileri Geri Getirin"
              text="30-60 gün önce gelip bir daha dönmeyen müşterileriniz var mı? Akıllı hatırlatma sistemi onları otomatik tespit eder ve özel geri dönüş kampanyaları gönderir. Her ay kayıp müşterilerinizin %20'sini geri kazanın."
            />
          </div>
        </section>

        <section id="nasil-calisir" className="landing-sectionSpace">
          <div className="landing-whiteSection">
            <div className="landing-sectionHead">
              <h2 className="landing-sectionTitle">3 Adımda Başlayın, Hemen Kazanmaya Başlayın</h2>
              <p className="landing-sectionSubtitle">
                Karmaşık kurulum yok, teknik bilgi gerektirmez. 10 dakikada sisteminiz hazır!
              </p>
            </div>

            <div className="landing-gridThree">
              <StepCard
                step="1️⃣ 5 DAKİKA"
                title="Salonunuzu Oluşturun"
                text="İsim, telefon ve hizmetlerinizi girin. Çalışma saatlerinizi belirleyin. Sistem otomatik olarak size özel randevu sayfanızı oluşturur. Hiçbir teknik bilgi gerekmez."
              />
              <StepCard
                step="2️⃣ 2 DAKİKA"
                title="Linkinizi Paylaşın"
                text="Hazır olan randevu linkinizi WhatsApp durumunuzda, Instagram bio'nuzda ve Google profilinizde paylaşın. Müşterileriniz artık 7/24 randevu alabilir. Telefon çalmayı beklemeden."
              />
              <StepCard
                step="3️⃣ OTOMATİK"
                title="Otopilotta Kazanın"
                text="Sistem otomatik olarak randevuları yönetir, SMS hatırlatmaları gönderir, boş saatler için kampanya yapar ve eski müşterilerinizi geri kazanır. Siz sadece müşterilerinize hizmet verin."
              />
            </div>
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-gridTwoWide">
            <div className="landing-whiteSection">
              <h2 className="landing-sectionTitle">Hangi İşletmeler Kullanıyor?</h2>

              <div className="landing-stackList">
                {[
                  "💇‍♀️ Kadın Kuaförleri - Saç, manikür, pedikür randevuları",
                  "✂️ Erkek Berberleri - Saç, sakal bakım randevuları",
                  "✨ Güzellik Salonları - Cilt bakımı, makyaj, epilasyon",
                  "👁️ Kirpik & Kaş Stüdyoları - Microblading, ipek kirpik",
                  "💅 Tırnak Salonları - Protez tırnak, nail art hizmetleri",
                  "🌸 Butik İşletmeler - Randevulu çalışan her türlü hizmet",
                ].map((item) => (
                  <div key={item} className="landing-listItem">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div id="fiyat" className="landing-whiteSection">
              <h2 className="landing-sectionTitle">Şeffaf Fiyatlandırma</h2>

              <div className="landing-pricingBox">
                <div className="landing-pricingLabel">Aylık Abonelik</div>
                <div className="landing-pricingPrice">500 - 750 TL</div>
                <div className="landing-pricingText">
                  ✅ Sınırsız randevu ve müşteri
                  <br />✅ SMS kredileri dahil
                  <br />✅ Tüm özellikler açık
                  <br />✅ Ücretsiz kurulum ve eğitim
                  <br />✅ WhatsApp destek
                  <br />✅ 14 gün ücretsiz deneme
                </div>
              </div>

              <Link
                href="/kayit"
                className="landing-darkButton landing-marginTop18"
              >
                🚀 Hemen Ücretsiz Başla
              </Link>
            </div>
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-darkCtaSection">
            <div className="landing-darkLogoRow">
              <Logo dark={false} />
            </div>

            <h2 className="landing-darkCtaTitle">Yarın Değil, Bugün Dijitalleşin!</h2>

            <p className="landing-darkCtaText">
              Rakipleriniz dijitalleşirken siz geride kalmayın. Her gün kaybettiğiniz randevular, her ay geri dönmeyen müşteriler... Artık telefonda saatlerce vakit harcamayın. Sistem sizin için çalışsın, siz de işinize odaklanın. 14 gün ücretsiz deneyin, farkı görün!
            </p>

            <div className="landing-heroActions">
              <Link
                href="/salon/nurseda-guzellik-salonu"
                className="landing-lightButton"
              >
                🎯 Canlı Demo'yu İncele
              </Link>

              <Link href="/kayit" className="landing-outlineLightButton">
                🚀 Ücretsiz Başla
              </Link>
            </div>
          </div>
        </section>

        <section id="iletisim" className="landing-sectionSpace">
          <div className="landing-gridThree">
            <ContactCard
              title="💬 WhatsApp Destek"
              value="+90 500 000 00 00"
              text="Anında destek alın! Demo gösterimi, kurulum yardımı ve tüm sorularınız için WhatsApp'tan yazın. Genelde 10 dakika içinde yanıt veriyoruz."
            />

            <ContactCard
              title="📧 E-posta"
              value="info@ornekdomain.com"
              text="Detaylı bilgi, özel fiyatlandırma teklifleri ve kurumsal işbirlikleri için e-posta gönderin."
            />

            <ContactCard
              title="📍 Hizmet Bölgesi"
              value="Türkiye Geneli"
              text="Beypazarı merkezli başladık ancak şu anda Türkiye'nin her yerinden salonlara hizmet veriyoruz. Online kurulum ile hemen başlayabilirsiniz!"
            />
          </div>
        </section>

        <section className="landing-sectionSpace">
          <div className="landing-demoStrip">
            <div>
              <h2 className="landing-sectionTitle landing-noMarginBottom">
                ⚡ 5 Dakikada Sisteminiz Hazır!
              </h2>

              <p className="landing-sectionSubtitle landing-demoSubtitle">
                Hemen kayıt olun, salonunuzu oluşturun ve ilk randevunuzu almaya başlayın. Sorularınız için WhatsApp'tan yazın, ekibimiz size özel demo gösterimi yapabilir. 14 gün tamamen ücretsiz deneyin!
              </p>
            </div>

            <a
              href="https://wa.me/905000000000"
              target="_blank"
              rel="noreferrer"
              className="landing-whatsAppButton"
            >
              💬 Hemen WhatsApp'tan Yaz
            </a>
          </div>
        </section>

        <footer className="landing-footer">
          <div className="landing-footerTop">
            <div>
              <Logo dark={false} />

              <p className="landing-footerText">
                Kuaförler, güzellik salonları ve butik işletmeler için akıllı online randevu sistemi. Doluluk oranınızı artırın, müşterilerinizi geri kazanın, işinize odaklanın.
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
                🎁 Ücretsiz Başla
              </Link>
            </div>
          </div>

          <div className="landing-footerBottom">
            © 2026 Beypazari Randevu - Randevularınızı Dijitalleştirin, İşletmenizi Büyütün
          </div>
        </footer>
      </div>
    </main>
  );
}