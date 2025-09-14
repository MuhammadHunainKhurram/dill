"use client";

import { useEffect, useState } from "react";
import SlidesPreview from "@/components/SlidesPreview";
import VoiceCommander from '@/components/VoiceCommander';


type ApiResult = {
  ok: boolean;
  presentationTitle?: string;
  original_name?: string;
  slides?: Array<{
    title: string;
    bullets: string[];
    image?: { url: string | null; background: boolean; alt: string | null };
    notes: string | null;
  }>;
  theme?: {
    backgroundColor: string | null;
    textColor: string | null;
    accentColor: string | null;
    backgroundImageUrl: string | null;
  };
  error?: string;
};

export default function EducationPage() {
  const [authed, setAuthed] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [numSlides, setNumSlides] = useState(6);
  const [theme, setTheme] = useState("Material");

  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Check Google auth once on mount
  useEffect(() => {
    fetch("/api/google/status")
      .then((r) => r.json())
      .then((j) => setAuthed(!!j?.authed))
      .catch(() => setAuthed(false));
  }, []);

  // Generate slides JSON from PDF
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) return setError("Please choose a PDF");
    if (file.type !== "application/pdf") return setError("Only PDF files are supported");

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("numSlides", String(numSlides));
      fd.append("theme", theme);

      const res = await fetch("/api/generate-slides", { method: "POST", body: fd });
      const ct = res.headers.get("content-type") || "";
      const text = await res.text();
      if (!ct.includes("application/json")) {
        throw new Error(`${res.status} ${res.statusText}\n${text.slice(0, 400)}`);
      }
      const data: ApiResult = JSON.parse(text);
      if (!res.ok || !data.ok) throw new Error(data.error || `Request failed: ${res.status}`);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Google auth helpers
  const signInWithGoogle = async () => {
    setError(null);
    try {
      const r = await fetch("/api/google/auth-url?next=/education");
      const j = await r.json();
      if (!j?.url) throw new Error("Failed to get Google auth URL");
      window.location.href = j.url;
    } catch (e: any) {
      setError(e.message || "Google sign-in failed");
    }
  };

  const signOutGoogle = async () => {
    await fetch("/api/google/signout", { method: "POST" });
    setAuthed(false);
  };

  const createInGoogleSlides = async () => {
    if (!result?.slides?.length) return;
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/google/create-presentation", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title:
            result.presentationTitle ||
            result.original_name?.replace(/\.pdf$/i, "") ||
            "Generated Deck",
          slides: result.slides,
          theme: result.theme,
        }),
      });
      const j = await r.json();

      if (r.status === 401 && j?.needAuth) {
        const u = await fetch("/api/google/auth-url?next=/education").then((x) => x.json());
        if (u?.url) window.location.href = u.url;
        return;
      }
      if (!r.ok || !j.ok) throw new Error(j.error || "Google Slides create failed");
      window.open(j.url, "_blank");
    } catch (e: any) {
      setError(e.message || "Failed to create Slides deck");
    } finally {
      setCreating(false);
    }
  };

  // Derived bits
  const title =
    result?.presentationTitle ||
    result?.original_name ||
    (file ? file.name.replace(/\.pdf$/i, "") : "Presentation");

  const themeObj =
    result?.theme || {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#1f2937",
      backgroundImageUrl: null,
    };

  const copyJson = () =>
    result && navigator.clipboard.writeText(JSON.stringify(result, null, 2)).catch(() => {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Education</h1>
          <p className="mt-1 text-gray-600">
            Upload a PDF, generate slides, preview them, then send to Google Slides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!authed ? (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Sign in with Google
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={createInGoogleSlides}
                disabled={creating || !result?.slides?.length}
                className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                title={!result?.slides?.length ? "Generate slides first" : ""}
              >
                {creating ? "Creating…" : "Create in Google Slides"}
              </button>
              <button
                type="button"
                onClick={signOutGoogle}
                className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Generator form */}
      <form
        onSubmit={onSubmit}
        className="grid gap-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700">PDF file</label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="mt-2 block w-full text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-black">Number of slides</label>
            <input
              type="number"
              min={3}
              max={30}
              value={numSlides}
              onChange={(e) => setNumSlides(parseInt(e.target.value || "0", 10))}
              className="mt-2 w-full rounded-md border border-black text-black px-3 py-2 text-sm"
            />
          </div>


          <div>
            <label className="block text-sm font-medium text-gray-700">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="mt-2 w-full rounded-md border border-black text-black px-3 py-2 text-sm"
            >
              <option>Material</option>
              <option>Simple</option>
              <option>Dark</option>
              <option>Coral</option>
              <option>Ocean</option>
              <option>Sunset</option>
              <option>Forest</option>
              <option>Mono</option>
              <option>Slate</option>
              <option>Lavender</option>
              <option>Emerald</option>
              <option>Candy</option>

            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !file}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate slides"}
          </button>

          {result && (
            <button
              type="button"
              onClick={() => setShowJson((v) => !v)}
              className="rounded border px-3 py-2 text-sm text-black"
            >
              {showJson ? "Hide JSON" : "Show JSON"}
            </button>
          )}
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </form>

      {/* Visual preview */}
      {/* Visual preview + voice commander */}
{result?.slides?.length ? (
  <>
    <VoiceCommander
      deck={{
        presentationTitle: result.presentationTitle || 'Untitled',
        slidesCount: result.slides?.length || 0,
        theme: result.theme || {},
        slides: result.slides,
      }}
      // Keep your existing `result` shape in sync with edits
      setDeck={(d) =>
        setResult((prev: any) => ({
          ...(prev || {}),
          presentationTitle: d.presentationTitle,
          slides: d.slides,
          theme: d.theme,
        }))
      }
    />

    <SlidesPreview
      deck={{
        presentationTitle: result.presentationTitle || 'Untitled',
        slides: result.slides,
        theme: result.theme || {},
      }}
    />
  </>
) : null}



      {/* JSON view */}
      {result && showJson && (
        <section className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Raw JSON</h2>
            <button onClick={copyJson} className="rounded border px-3 py-1 text-sm hover:bg-gray-50">
              Copy
            </button>
          </div>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <pre className="max-h-[70vh] overflow-auto bg-gray-50 p-4 text-xs leading-relaxed text-gray-800">
{JSON.stringify(result, null, 2)}
            </pre>
          </div>
        </section>
      )}
    </main>
  );
}
