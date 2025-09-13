"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase-browser";

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
  const supabase = createBrowserClient();
  const [items, setItems] = useState<Parsed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from("parsed_documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) setItems(data as Parsed[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const download = async (path: string, suggestedName: string) => {
    const { data, error } = await supabase.storage.from("parsed").download(path);
    if (error) return alert(error.message);
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const del = async (row: Parsed) => {
    if (!confirm(`Delete parsed file for "${row.original_name}"?`)) return;

    const { error: sErr } = await supabase.storage.from("parsed").remove([row.path]);
    if (sErr) return alert(sErr.message);

    const { error: dErr } = await supabase.from("parsed_documents").delete().eq("id", row.id);
    if (dErr) return alert(dErr.message);

    setItems(prev => prev.filter(x => x.id !== row.id));
  };

  if (loading) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">Loading…</div>;
  }

  if (items.length === 0) {
    return <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-sm text-gray-600">No parsed files yet.</div>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(it => (
        <div key={it.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="truncate text-sm font-semibold">{it.original_name}</div>
          <div className="mt-1 text-xs text-gray-600">
            {new Date(it.created_at).toLocaleString()} • {it.content_type.replace("application/","")}
            {typeof it.page_count === "number" ? ` • ${it.page_count} pages` : ""}
            {typeof it.char_count === "number" ? ` • ${Math.round(it.char_count/1000)}k chars` : ""}
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
  const supabase = createBrowserClient();
  const [snippet, setSnippet] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const { data, error } = await supabase.storage.from("parsed").download(path);
      if (error || !data) return;

      const text = await data.text();
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
    };
    run();
  }, [path, contentType, supabase]);

  if (!snippet) return null;
  return (
    <div className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-700">
      {snippet}…
    </div>
  );
}
