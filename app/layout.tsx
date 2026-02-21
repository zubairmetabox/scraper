import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GovMU Legal Scraper",
  description: "Supreme Court of Mauritius — Legal Data Scraper",
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
