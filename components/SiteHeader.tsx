"use client";

import Link from "next/link";

export default function SiteHeader() {


  return (
    <header className="sticky top-0 z-10 border-b border-gray-200/70 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gray-900 text-white grid place-items-center text-sm font-bold">P</div>
            <span className="text-sm font-semibold tracking-tight">Dill</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Dashboard
            </Link>
            <Link href="/data-agent" className="text-sm text-gray-600 hover:text-gray-900">
              Data Agent
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}