import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atelier ERP",
  description: "A modular, multi-tenant ERP platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
