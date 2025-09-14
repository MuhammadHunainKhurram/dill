import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-16">
        <section className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">What do you want to build?</h1>
          <p className="mt-3 text-gray-600">Choose a workspace to get started</p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Link
              href="/education"
              className="rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <h2 className="text-2xl font-medium">Education</h2>
              <p className="mt-2 text-sm text-gray-600">
                Upload a PDF, pick slide count, choose a theme, and generate previewable Google Slides.
              </p>
              <span className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                Get started
              </span>
            </Link>

            <Link
              href="/business"
              className="rounded-2xl border border-gray-200 bg-white p-8 text-left shadow-sm transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <h2 className="text-2xl font-medium">Business</h2>
              <p className="mt-2 text-sm text-gray-600">
                Upload a PDF or CSV, analyze trends and discrepancies, and turn the results into slides.
              </p>
              <span className="mt-6 inline-block rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                Get started
              </span>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200/70">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 text-xs text-gray-500">
        <p>© {new Date().getFullYear()} Dill</p>
        <p>Built with Next.js</p>
      </div>
    </footer>
  );
}
