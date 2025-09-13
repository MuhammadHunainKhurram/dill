import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PDF Locker",
  description: "Private PDF storage with Google sign-in."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[radial-gradient(100%_100%_at_0%_0%,#f8fafc_0%,#eef2ff_50%,#ffffff_100%)] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
