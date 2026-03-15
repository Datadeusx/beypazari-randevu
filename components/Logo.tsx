import Link from "next/link";

type LogoProps = {
  href?: string;
  dark?: boolean;
  withText?: boolean;
};

export default function Logo({
  href = "/",
  dark = true,
  withText = true,
}: LogoProps) {
  const bgColor = dark
    ? "linear-gradient(135deg, #1a1d29 0%, #2e3247 100%)"
    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";
  const textColor = dark ? "#1a1d29" : "#ffffff";
  const badgeTextColor = dark ? "#ffffff" : "#1a1d29";
  const subTextColor = dark ? "#64748b" : "rgba(255,255,255,0.75)";

  return (
    <Link
      href={href}
      style={{
        textDecoration: "none",
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          background: bgColor,
          color: badgeTextColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 18,
          flexShrink: 0,
          boxShadow: "0 10px 25px rgba(26, 29, 41, 0.25)",
        }}
      >
        BR
      </div>

      {withText && (
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: textColor,
              letterSpacing: -0.3,
            }}
          >
            Beypazari Randevu
          </div>

          <div
            style={{
              fontSize: 12,
              color: subTextColor,
              marginTop: 4,
              fontWeight: 600,
            }}
          >
            Salonlar için online randevu sistemi
          </div>
        </div>
      )}
    </Link>
  );
}