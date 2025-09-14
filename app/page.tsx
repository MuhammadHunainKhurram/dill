// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main className="relative">
      {/* Soft radial glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-teal-400/10 blur-2xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:py-20">
        {/* Heading */}
        <div className="mb-10 text-center sm:mb-14">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">
            <span className="bg-gradient-to-b from-emerald-200 via-emerald-100 to-emerald-400/70 bg-clip-text text-transparent">
              What do you want to build?
            </span>
          </h1>
          <p className="mt-3 text-sm text-[#a8c4ba] sm:text-base">
            Choose a workspace to get started
          </p>
        </div>

        {/* Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Education */}
          <section
            className="
              group relative overflow-hidden rounded-2xl border
              border-[#133228] bg-[#0f261f]/70 backdrop-blur
              shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_20px_60px_-20px_rgba(0,0,0,0.45)]
              transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_26px_80px_-24px_rgba(0,0,0,0.6)]
            "
          >
            {/* subtle gradient edge */}
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

            <div className="p-6 sm:p-8">
              <div className="mb-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Education
              </div>

              <h2 className="text-xl font-semibold text-emerald-50 sm:text-2xl">
                Turn PDFs into polished slides
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#b5d1c7]">
                Upload a PDF, pick slide count, choose a theme, preview, and export to Google Slides.
              </p>

              <div className="mt-6">
                <Link
                  href="/education"
                  className="
                    inline-flex items-center gap-2 rounded-lg
                    bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950
                    transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                  "
                >
                  Get started
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>

          {/* Business */}
          <section
            className="
              group relative overflow-hidden rounded-2xl border
              border-[#133228] bg-[#0f261f]/70 backdrop-blur
              shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_20px_60px_-20px_rgba(0,0,0,0.45)]
              transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_26px_80px_-24px_rgba(0,0,0,0.6)]
            "
          >
            <div className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

            <div className="p-6 sm:p-8">
              <div className="mb-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                Business
              </div>

              <h2 className="text-xl font-semibold text-emerald-50 sm:text-2xl">
                Analyze messy CSV/Excel & build decks
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#b5d1c7]">
                Upload CSV/Excel, detect trends & discrepancies, preview insights, then generate slides.
              </p>

              <div className="mt-6">
                <Link
                  href="/business"
                  className="
                    inline-flex items-center gap-2 rounded-lg
                    bg-emerald-500 px-4 py-2 text-sm font-medium text-emerald-950
                    transition-colors hover:bg-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                  "
                >
                  Get started
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* Footer microcopy */}
        <div className="mt-14 flex items-center justify-between text-[13px] text-[#77a293]">
          <span>© {new Date().getFullYear()} Dill</span>
          <span className="opacity-80">Built with Next.js</span>
        </div>
      </div>
    </main>
  );
}
