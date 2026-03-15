import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Beypazari Randevu",
  description: "Online appointment system for beauty salons and hairdressers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}