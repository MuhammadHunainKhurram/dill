import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PARSED_DIR = process.env.PARSED_DIR || path.join(process.cwd(), "parsed");

const THEMES: Record<
  string,
  { backgroundColor: string; textColor: string; accentColor: string; backgroundImageUrl: string | null }
> = {
  Material: { backgroundColor: "#ffffff", textColor: "#202124", accentColor: "#1a73e8", backgroundImageUrl: null },
  Simple:   { backgroundColor: "#ffffff", textColor: "#111827", accentColor: "#374151", backgroundImageUrl: null },
  Dark:     { backgroundColor: "#111827", textColor: "#F9FAFB", accentColor: "#10B981", backgroundImageUrl: null },
  Coral:    { backgroundColor: "#fff7ed", textColor: "#1f2937", accentColor: "#fb7185", backgroundImageUrl: null },
  Ocean:    { backgroundColor: "#0b132b", textColor: "#e0e1dd", accentColor: "#00a8e8", backgroundImageUrl: null },
  Sunset:   { backgroundColor: "#1f0a3a", textColor: "#fff7ed", accentColor: "#ff6b6b", backgroundImageUrl: null },
  Forest:   { backgroundColor: "#0b2614", textColor: "#e5f4ea", accentColor: "#34d399", backgroundImageUrl: null },
  Mono:     { backgroundColor: "#ffffff", textColor: "#0f172a", accentColor: "#0f172a", backgroundImageUrl: null },
  Slate:    { backgroundColor: "#0f172a", textColor: "#e2e8f0", accentColor: "#64748b", backgroundImageUrl: null },
  Lavender: { backgroundColor: "#f5f3ff", textColor: "#312e81", accentColor: "#8b5cf6", backgroundImageUrl: null },
  Emerald:  { backgroundColor: "#052e2b", textColor: "#d1fae5", accentColor: "#34d399", backgroundImageUrl: null },
  Candy:    { backgroundColor: "#fff1f2", textColor: "#1f2937", accentColor: "#ec4899", backgroundImageUrl: null },
};


export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/generate-slides" });
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const numSlidesRequested = parseInt((form.get("numSlides") as string) || "5", 10);
    const themeKey = (form.get("theme") as string) || "";

    if (!file) return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    if (file.type !== "application/pdf") {
      return NextResponse.json({ ok: false, error: "only PDF accepted" }, { status: 400 });
    }

    // 🔽 Defer the import so the route can mount even if pdf-slides has ESM/CJS quirks
    const { generateSlidesFromPDF } = await import("@/lib/pdf-slides");

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const result = await generateSlidesFromPDF(pdfBuffer, numSlidesRequested, file.name);
    if (!result.success || !result.deck) {
      return NextResponse.json({ ok: false, error: result.error ?? "Slide generation failed" }, { status: 500 });
    }

    const deck = result.deck;
    const slides = deck.slides;

    const payload: any = {
      original_name: file.name,
      presentationTitle: deck.presentationTitle || file.name.replace(/\.pdf$/i, ""),
      generated_at: new Date().toISOString(),
      slides,
      num_slides: slides.length,
      theme: THEMES[themeKey] ?? deck.theme,
    };

    const id = crypto.randomUUID();
    const safeName = file.name.replace(/\s+/g, "_").replace(/\.pdf$/i, "");
    const fileName = `${id}_${safeName}_slides.json`;

    await fs.mkdir(PARSED_DIR, { recursive: true });
    await fs.writeFile(path.join(PARSED_DIR, fileName), JSON.stringify(payload, null, 2), "utf8");

    return NextResponse.json({ ok: true, id, path: fileName, ...payload });
  } catch (err: any) {
    console.error("SLIDE_GENERATION_ERROR", err);
    return NextResponse.json({ ok: false, error: err?.message ?? "Unknown server error" }, { status: 500 });
  }
}
