"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function SlideGenerator() {
  const supabase = createBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [numSlides, setNumSlides] = useState(5);
  const [generatedSlides, setGeneratedSlides] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  const onGenerate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return alert("Not signed in");

    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF");
      inputEl.value = "";
      return;
    }

    setGenerating(true);
    setFileName(file.name);
    setGeneratedSlides(null);

    try {
      // Get current session tokens
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token ?? "";
      const refresh_token = session?.refresh_token ?? "";

      const form = new FormData();
      form.append("file", file);
      form.append("numSlides", numSlides.toString());
      form.append("access_token", access_token);
      form.append("refresh_token", refresh_token);

      const res = await fetch("/api/generate-slides", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json()
        : { ok: false, error: await res.text() };

      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to generate slides");

      if (inputRef.current) inputRef.current.value = "";
      else inputEl.value = "";

      setGeneratedSlides(data.slides);
      alert(`Generated ${data.numSlides} slides successfully!`);
      
      // Reload to update document list
      setTimeout(() => location.reload(), 1000);
    } catch (err: any) {
      alert(err.message ?? "Slide generation failed");
    } finally {
      setGenerating(false);
      setFileName(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold">Generate Slides from PDF</p>
        {generating && <span className="text-sm text-gray-500">Generating…</span>}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        Upload a PDF and we'll create presentation slides using AI.
      </p>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of slides: {numSlides}
        </label>
        <input
          type="range"
          min="3"
          max="15"
          value={numSlides}
          onChange={(e) => setNumSlides(parseInt(e.target.value))}
          disabled={generating}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>3</span>
          <span>15</span>
        </div>
      </div>

      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onGenerate}
            disabled={generating}
            className="hidden"
          />
          <span>{generating ? "Generating slides…" : "Choose PDF"}</span>
        </label>
      </div>

      {generating && (
        <div className="mt-4">
          <div className="text-xs text-gray-600">{fileName}</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease_infinite] rounded-full bg-blue-600" />
          </div>
          <style jsx>{`
            @keyframes indeterminate {
              0% { margin-left: -33%; }
              50% { margin-left: 66%; }
              100% { margin-left: -33%; }
            }
          `}</style>
        </div>
      )}

      {generatedSlides && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Preview:</h4>
          <div className="text-xs text-gray-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
            {generatedSlides.substring(0, 300)}...
          </div>
        </div>
      )}
    </div>
  );
}
