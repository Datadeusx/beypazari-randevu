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
  const bgColor = dark ? "#111827" : "#ffffff";
  const textColor = dark ? "#111827" : "#ffffff";
  const badgeTextColor = dark ? "#ffffff" : "#111827";
  const subTextColor = dark ? "#6b7280" : "rgba(255,255,255,0.72)";

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
          width: 40,
          height: 40,
          borderRadius: 12,
          background: bgColor,
          color: badgeTextColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 900,
          fontSize: 16,
          flexShrink: 0,
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
            }}
          >
            Beypazari Randevu
          </div>

          <div
            style={{
              fontSize: 12,
              color: subTextColor,
            }}
          >
            Salonlar için online randevu sistemi
          </div>
        </div>
      )}
    </Link>
  );
}