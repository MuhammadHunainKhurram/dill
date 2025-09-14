import "./globals.css";

export const metadata = {
  title: "Dill",
  description: "For Whenever You're In A Pickle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
