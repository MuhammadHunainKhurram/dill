// components/DocumentList.tsx
"use client";

import { useEffect, useState } from "react";

type Parsed = {
  id: string;
  original_name: string;
  path: string;
  content_type: string; // "application/json" | "text/plain"
  page_count: number | null;
  char_count: number | null;
  created_at: string;
};

export default function DocumentList() {
  const [items, setItems] = useState<Parsed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/parsed", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load");
        const data: Parsed[] = await res.json();
        setItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const download = async (path: string, suggestedName: string) => {
    try {
      const res = await fetch(`/api/parsed/download?path=${encodeURIComponent(path)}`);
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.message || "Download failed");
    }
  };

  const del = async (row: Parsed) => {
    if (!confirm(`Delete parsed file for "${row.original_name}"?`)) return;
    try {
      const res = await fetch(`/api/parsed?id=${encodeURIComponent(row.id)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: row.path }),
      });
      if (!res.ok) throw new Error("Delete failed");
      setItems(prev => prev.filter(x => x.id !== row.id));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">
        Loading…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">
        No parsed files yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(it => (
        <div key={it.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="truncate text-sm font-semibold">{it.original_name}</div>
          <div className="mt-1 text-xs text-gray-600">
            {new Date(it.created_at).toLocaleString()} • {it.content_type.replace("application/", "")}
            {typeof it.page_count === "number" ? ` • ${it.page_count} pages` : ""}
            {typeof it.char_count === "number" ? ` • ${Math.round(it.char_count / 1000)}k chars` : ""}
          </div>

          <Preview path={it.path} contentType={it.content_type} />

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:opacity-90"
              onClick={() =>
                download(
                  it.path,
                  it.original_name + (it.content_type === "application/json" ? ".json" : ".txt")
                )
              }
            >
              Download
            </button>
            <button
              className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              onClick={() => del(it)}
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function Preview({ path, contentType }: { path: string; contentType: string }) {
  const [snippet, setSnippet] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/parsed/preview?path=${encodeURIComponent(path)}`);
        if (!res.ok) return;
        const text = await res.text();

        if (contentType === "application/json") {
          try {
            const obj = JSON.parse(text);
            const raw = typeof obj.text === "string" ? obj.text : JSON.stringify(obj);
            setSnippet(raw.slice(0, 180));
          } catch {
            setSnippet(text.slice(0, 180));
          }
        } else {
          setSnippet(text.slice(0, 180));
        }
      } catch {
        // ignore
      }
    };
    run();
  }, [path, contentType]);

  if (!snippet) return null;
  return <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">{snippet}…</div>;
}
