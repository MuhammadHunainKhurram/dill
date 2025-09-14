// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DILL",
  description: "Decks & Data Agent",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="
          min-h-screen antialiased
          bg-[#0f1f1b] text-[#e8f3ee]
          selection:bg-emerald-500/30 selection:text-emerald-50
        "
      >
        {children}
      </body>
    </html>
  );
}
