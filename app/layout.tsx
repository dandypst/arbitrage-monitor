import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arb Monitor",
  description: "Cross-chain and same-chain arbitrage gap monitor",
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
