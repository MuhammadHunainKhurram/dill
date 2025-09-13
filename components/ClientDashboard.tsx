"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";
import UploadPdf from "@/components/UploadPdf";
import DocumentList from "@/components/DocumentList";

export default function ClientDashboard() {
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSignedIn(!!session);
      setEmail(session?.user.email ?? null);
      setLoading(false);
    };
    init();

    // live updates on auth change
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session);
      setEmail(session?.user.email ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm text-sm text-gray-600">
          Checking session…
        </div>
      </main>
    );
  }

  if (!signedIn) {
    // Render nothing; the server-rendered hero will be visible.
    return null;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-600">
          Signed in as <span className="font-medium">{email}</span>
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UploadPdf />
        </div>
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your PDFs</h2>
          </div>
          <DocumentList />
        </div>
      </div>
    </main>
  );
}
