"use client";

import { useEffect, useState } from "react";

export default function ClientDashboard() {
  const [ready, setReady] = useState(true);
  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Auth is removed. Everything below should work without a session.
      </p>
    </main>
  );
}
