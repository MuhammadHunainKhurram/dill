import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PixabayHit = {
  id: number;
  pageURL: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  tags: string;
  user: string;
};

export async function GET() {
  const hasKey = !!process.env.PIXABAY_KEY;
  return NextResponse.json({ ok: true, route: "/api/search-images", hasKey });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const query = (body?.query ?? "").toString().trim();
    const count = Math.min(Math.max(Number(body?.count ?? 1), 1), 4);

    if (!query) {
      return NextResponse.json({ ok: false, error: "query is required" }, { status: 400 });
    }
    const key = process.env.PIXABAY_KEY;
    if (!key) {
      return NextResponse.json(
        { ok: false, error: "PIXABAY_KEY missing. Add it to .env.local and restart." },
        { status: 500 }
      );
    }

    const url = new URL("https://pixabay.com/api/");
    url.searchParams.set("key", key);
    url.searchParams.set("q", query);
    url.searchParams.set("image_type", "photo");
    url.searchParams.set("safesearch", "true");
    url.searchParams.set("per_page", String(count));

    const r = await fetch(url.toString(), { cache: "no-store" });
    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json(
        { ok: false, error: `Pixabay ${r.status} ${r.statusText}: ${t.slice(0, 200)}` },
        { status: 502 }
      );
    }

    const json = await r.json();
    const hits: PixabayHit[] = Array.isArray(json?.hits) ? json.hits : [];
    const images = hits.map((h) => ({
      url: h.largeImageURL || h.webformatURL,
      thumb: h.previewURL,
      alt: h.tags || query,
      source: "pixabay",
      author: h.user,
      pageURL: h.pageURL,
    }));

    return NextResponse.json({ ok: true, images });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "search failed" }, { status: 500 });
  }
}
