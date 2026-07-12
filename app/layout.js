import "./globals.css";

export const metadata = {
  title: "Wallet Scanner — Robinhood Chain",
  description: "Monitoring wallet trading aktif & P&L di Robinhood Chain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
