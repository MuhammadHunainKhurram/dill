"use client";


export default function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 pb-12">
      <div className="grid items-center gap-10 md:grid-cols-2">
        <div>
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200">
            Private & simple
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            Upload, store, and access your PDFs — securely.
          </h1>
          <p className="mt-4 max-w-prose text-sm text-gray-600">
            Sign in with Google, upload PDFs to your private space, and download them anytime.
          </p>

          <ul className="mt-6 grid gap-3 text-sm text-gray-700">
            <li className="flex items-start gap-2"><span>✅</span><span>Google sign-in only when you need it</span></li>
            <li className="flex items-start gap-2"><span>✅</span><span>Private bucket with access policies per account</span></li>
            <li className="flex items-start gap-2"><span>✅</span><span>Fast uploads and easy downloads</span></li>
          </ul>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-indigo-200/50 to-fuchsia-200/40 blur-2xl" />
          <div className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-xl">
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
              Drag & drop preview
              <div className="mt-3 text-xs text-gray-400">Sign in to upload for real</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="h-20 rounded-lg bg-gray-100" />
              <div className="h-20 rounded-lg bg-gray-100" />
              <div className="h-20 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
