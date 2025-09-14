import { createServerSupabaseReadOnly } from "@/lib/supabase-server";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import ClientDashboard from "@/components/ClientDashboard";

export default async function HomePage() {
  // optional: server-side fetch (mostly for SSR consistency)
  const supabase = createServerSupabaseReadOnly();
  await supabase.auth.getSession();

  return (
    <>
      <SiteHeader />

      {/* Marketing hero for logged-out users */}
      <Hero />

      {/* Client-side dashboard that replaces hero when logged in */}
      <ClientDashboard />

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} PDF Locker</p>
        <p>Built with Next.js + Supabase</p>
      </div>
    </footer>
  );
}
