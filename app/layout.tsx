import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-jakarta",
});

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
      <body className={jakarta.className}>{children}</body>
    </html>
  );
}