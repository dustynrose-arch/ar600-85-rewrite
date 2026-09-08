import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AR 600-85 Rewrite — Working Copy",
  description: "Internal G-1 rewrite working group use only",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-US">
      <body>{children}</body>
    </html>
  );
}
