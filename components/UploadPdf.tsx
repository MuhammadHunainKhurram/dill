"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

export default function UploadPdf() {
  const supabase = createBrowserClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [saveAs, setSaveAs] = useState<"json" | "txt">("json");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, [supabase]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!userId) return alert("Not signed in");

    const inputEl = e.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      alert("Please upload a PDF");
      inputEl.value = "";
      return;
    }

    setUploading(true);
    setFileName(file.name);

    try {
      // Get current session tokens
      const { data: { session } } = await supabase.auth.getSession();
      const access_token = session?.access_token ?? "";
      const refresh_token = session?.refresh_token ?? "";

      const form = new FormData();
      form.append("file", file);
      form.append("saveAs", saveAs);
      form.append("access_token", access_token);
      form.append("refresh_token", refresh_token);

      const res = await fetch("/api/ingest", {
        method: "POST",
        body: form,
        credentials: "include",
      });

      const ct = res.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await res.json()
        : { ok: false, error: await res.text() };

      if (!res.ok || !data.ok) throw new Error(data.error || "Failed to parse");

      if (inputRef.current) inputRef.current.value = "";
      else inputEl.value = "";

      alert(`Parsed and saved as ${data.contentType}`);
      location.reload();
    } catch (err: any) {
      alert(err.message ?? "Upload failed");
    } finally {
      setUploading(false);
      setFileName(null);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-base font-semibold">Upload & Parse a PDF</p>
        {uploading && <span className="text-sm text-gray-500">Parsing…</span>}
      </div>
      <p className="mt-1 text-sm text-gray-600">
        The PDF is not stored. We extract the text and save it as {saveAs.toUpperCase()}.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" name="saveAs" value="json" checked={saveAs === "json"} onChange={() => setSaveAs("json")} />
          JSON
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" name="saveAs" value="txt" checked={saveAs === "txt"} onChange={() => setSaveAs("txt")} />
          TXT
        </label>
      </div>

      <div className="mt-4">
        <label className="inline-flex cursor-pointer items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-gray-50">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={onUpload}
            disabled={uploading}
            className="hidden"
          />
          <span>{uploading ? "Uploading & parsing…" : "Choose PDF"}</span>
        </label>
      </div>

      {uploading && (
        <div className="mt-4">
          <div className="text-xs text-gray-600">{fileName}</div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full w-1/3 animate-[indeterminate_1.2s_ease_infinite] rounded-full bg-gray-900" />
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
    </div>
  );
}
