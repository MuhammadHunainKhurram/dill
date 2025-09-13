import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );
}

// Extract plain text from a PDF using pdfjs-dist ESM build (no worker needed)
async function extractTextFromPdf(u8: Uint8Array) {
  // Import ONLY what we need; do not touch GlobalWorkerOptions
  const { getDocument } = await import("pdfjs-dist/build/pdf.mjs");

  const loadingTask = getDocument({ data: u8 });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .filter(Boolean);
    fullText += strings.join(" ") + "\n\n";
  }

  // @ts-ignore pdf.info is optional
  const title = (pdf as any)?.info?.Title ?? null;
  return { text: fullText, numPages: pdf.numPages, title };
}

export async function POST(req: Request) {
  try {
    const supabase = getServerSupabase();

    const form = await req.formData();

    // (optional) accept tokens from client and set session
    const access_token = (form.get("access_token") as string) || "";
    const refresh_token = (form.get("refresh_token") as string) || "";
    if (access_token) {
      const { error: setErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setErr) {
        return NextResponse.json({ ok: false, error: setErr.message }, { status: 401 });
      }
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Not authenticated" }, { status: 401 });

    const file = form.get("file") as File | null;
    const saveAs = ((form.get("saveAs") as string) || "json") as "json" | "txt";
    if (!file) return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: "only PDF accepted" }, { status: 400 });
    }

    // Read bytes from uploaded File
    const ab = await file.arrayBuffer();
    const u8 = new Uint8Array(ab);

    // Parse with pdfjs
    const { text, numPages, title } = await extractTextFromPdf(u8);
    const pageCount = numPages ?? null;
    const metaTitle = title ?? null;

    // Build output
    const now = Date.now();
    const safeName = file.name.replace(/\s+/g, "_");
    const ext = saveAs === "txt" ? "txt" : "json";
    const storagePath = `${user.id}/${now}_${safeName}.${ext}`;

    let blob: Blob;
    let contentType: string;
    if (saveAs === "txt") {
      blob = new Blob([text], { type: "text/plain" });
      contentType = "text/plain";
    } else {
      const json = {
        original_name: file.name,
        title: metaTitle,
        page_count: pageCount,
        char_count: text.length,
        text,
      };
      blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      contentType = "application/json";
    }

    // Upload to storage
    const up = await supabase.storage.from("parsed").upload(storagePath, blob, {
      contentType,
      upsert: false,
    });
    if (up.error) throw up.error;

    // Insert DB row
    const ins = await supabase
      .from("parsed_documents")
      .insert({
        user_id: user.id,
        original_name: file.name,
        path: storagePath,
        content_type: contentType,
        page_count: pageCount,
        char_count: text.length,
      })
      .select("id")
      .single();
    if (ins.error) throw ins.error;

    return NextResponse.json({ ok: true, id: ins.data.id, path: storagePath, contentType });
  } catch (err: any) {
    console.error("INGEST_ERROR", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}
