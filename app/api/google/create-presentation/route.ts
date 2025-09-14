import { NextResponse } from "next/server";
import { getAuthorizedGoogle } from "@/lib/google";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Slide/page geometry in POINTS (PT).
 * Default Google Slides page is 10in x 7.5in => 720 x 540 pt.
 */
const PAGE = { W: 720, H: 540 };
const MARGIN = { X: 40, Y: 40 };

function hexToRgb01(hex?: string) {
  if (!hex) return { red: 1, green: 1, blue: 1 };
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return { red: 1, green: 1, blue: 1 };
  return {
    red: parseInt(m[1], 16) / 255,
    green: parseInt(m[2], 16) / 255,
    blue: parseInt(m[3], 16) / 255,
  };
}

/* -------------------------- request helpers -------------------------- */

function addBackground(requests: any[], sid: string, bgHex?: string | null) {
  if (!bgHex) return;
  requests.push({
    updatePageProperties: {
      objectId: sid,
      fields: "pageBackgroundFill.solidFill.color",
      pageProperties: {
        pageBackgroundFill: {
          solidFill: { color: { rgbColor: hexToRgb01(bgHex) } },
        },
      },
    },
  });
}

function addTextBox(
  requests: any[],
  id: string,
  pageId: string,
  x: number,
  y: number,
  w: number,
  h: number
) {
  requests.push({
    createShape: {
      objectId: id,
      shapeType: "TEXT_BOX",
      elementProperties: {
        pageObjectId: pageId,
        size: {
          width: { magnitude: w, unit: "PT" },
          height: { magnitude: h, unit: "PT" },
        },
        transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: "PT" },
      },
    },
  });
}

function insertText(requests: any[], id: string, text: string) {
  requests.push({ insertText: { objectId: id, insertionIndex: 0, text } });
}

function textColor(requests: any[], id: string, hex?: string | null) {
  if (!hex) return;
  requests.push({
    updateTextStyle: {
      objectId: id,
      textRange: { type: "ALL" },
      fields: "foregroundColor",
      style: { foregroundColor: { opaqueColor: { rgbColor: hexToRgb01(hex) } } },
    },
  });
}

function textAlign(
  requests: any[],
  id: string,
  align: "CENTER" | "START" | "END" | "JUSTIFIED"
) {
  requests.push({
    updateParagraphStyle: {
      objectId: id,
      textRange: { type: "ALL" },
      fields: "alignment",
      style: { alignment: align },
    },
  });
}

function textSize(requests: any[], id: string, pt: number) {
  requests.push({
    updateTextStyle: {
      objectId: id,
      textRange: { type: "ALL" },
      fields: "fontSize",
      style: { fontSize: { magnitude: pt, unit: "PT" } },
    },
  });
}

function textBold(requests: any[], id: string, bold = true) {
  requests.push({
    updateTextStyle: {
      objectId: id,
      textRange: { type: "ALL" },
      fields: "bold",
      style: { bold },
    },
  });
}

function textItalic(requests: any[], id: string) {
  requests.push({
    updateTextStyle: {
      objectId: id,
      textRange: { type: "ALL" },
      fields: "italic",
      style: { italic: true },
    },
  });
}

function bullets(requests: any[], id: string) {
  requests.push({
    createParagraphBullets: {
      objectId: id,
      textRange: { type: "ALL" },
      bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
    },
  });
}

/* ---------------------- simple fit heuristics ---------------------- */

/**
 * Very rough text-fit heuristic so we don't overflow vertically.
 * Google wraps text for us; we just keep the line-count reasonable.
 */
function pickFontSizeForBox(
  text: string,
  boxW: number,
  boxH: number,
  base = 18,
  min = 12
): number {
  const safeW = Math.max(1, boxW - 16); // padding fudge
  const safeH = Math.max(1, boxH - 16);

  // Estimate chars/line at base size. Empirical fudge: ~0.5pt per char.
  const charsPerLineAtBase = Math.max(8, Math.floor(safeW / (base * 0.5)));
  const linesAtBase = Math.ceil(text.length / charsPerLineAtBase);

  // Each line roughly 1.35x font size tall.
  const lineHeightFactor = 1.35;
  const maxLinesAtBase = Math.floor(safeH / (base * lineHeightFactor));

  if (linesAtBase <= maxLinesAtBase) return base;

  // Shrink stepwise until it fits or we hit min.
  let size = base;
  while (size > min) {
    size -= 2;
    const charsPerLine = Math.max(8, Math.floor(safeW / (size * 0.5)));
    const lines = Math.ceil(text.length / charsPerLine);
    const maxLines = Math.floor(safeH / (size * lineHeightFactor));
    if (lines <= maxLines) break;
  }
  return Math.max(min, size);
}

/* ---------------------------- types ---------------------------- */

type SlideLike = {
  title?: string;
  bullets?: string[];
  paragraph?: string | null;
  quote?: string | null;
  layout?: "TITLE_AND_BODY" | "SECTION_HEADER" | "PARAGRAPH" | "TWO_COLUMN" | "QUOTE";
};

function chooseLayout(s: SlideLike, i: number): Required<SlideLike>["layout"] {
  if (s.layout) return s.layout;
  const seq: Required<SlideLike>["layout"][] = [
    "TITLE_AND_BODY",
    "PARAGRAPH",
    "TWO_COLUMN",
    "SECTION_HEADER",
    "QUOTE",
  ];
  return seq[i % seq.length];
}

/* ------------------------------ route ------------------------------ */

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const title: string = body?.title || "Generated Deck";
    const slides: SlideLike[] = Array.isArray(body?.slides) ? body.slides : [];
    const theme = body?.theme || {
      backgroundColor: "#ffffff",
      textColor: "#111827",
      accentColor: "#0ea5e9",
    };

    if (!slides.length) {
      return NextResponse.json({ ok: false, error: "slides array required" }, { status: 400 });
    }

    // Auth / client
    const google = await getAuthorizedGoogle().catch((e: any) => {
      if (e?.code === "NEED_AUTH") {
        return NextResponse.json(
          { ok: false, needAuth: true, error: "Google sign-in required" },
          { status: 401 }
        );
      }
      throw e;
    });
    if (google instanceof Response) return google;

    const slidesApi = google.slides("v1");

    // Create empty presentation
    const created = await slidesApi.presentations.create({ requestBody: { title } });
    const presentationId = created.data.presentationId!;
    const requests: any[] = [];

    /* -------------------- Title slide (always) -------------------- */
    {
      const sid = "slide_000";
      const bigId = `${sid}_title`;
      const subId = `${sid}_subtitle`;

      requests.push({
        createSlide: { objectId: sid, slideLayoutReference: { predefinedLayout: "BLANK" } },
      });

      addBackground(requests, sid, theme.backgroundColor);

      // Main title (centered)
      const titleBox = { x: 60, y: 160, w: PAGE.W - 120, h: 120 };
      addTextBox(requests, bigId, sid, titleBox.x, titleBox.y, titleBox.w, titleBox.h);
      insertText(requests, bigId, title);
      textColor(requests, bigId, theme.textColor);
      textAlign(requests, bigId, "CENTER");
      textSize(requests, bigId, pickFontSizeForBox(title, titleBox.w, titleBox.h, 44, 28));

      // Subtitle (date)
      const subText = new Date().toLocaleDateString();
      const subBox = { x: PAGE.W / 2 - 180, y: 300, w: 360, h: 48 };
      addTextBox(requests, subId, sid, subBox.x, subBox.y, subBox.w, subBox.h);
      insertText(requests, subId, subText);
      textColor(requests, subId, theme.accentColor || theme.textColor);
      textAlign(requests, subId, "CENTER");
      textSize(requests, subId, 18);
    }

    /* ----------------------- Content slides ----------------------- */
    slides.forEach((raw, idx) => {
      const s: SlideLike = {
        title: (raw?.title ?? "").toString(),
        bullets: Array.isArray(raw?.bullets) ? raw.bullets.filter(Boolean).map(String) : [],
        paragraph: raw?.paragraph ?? null,
        quote: raw?.quote ?? null,
        layout: raw?.layout as SlideLike["layout"],
      };

      const sid = `slide_${String(idx + 1).padStart(3, "0")}`;
      const titleId = `${sid}_title`;
      const bodyId = `${sid}_body`;
      const col1Id = `${sid}_col1`;
      const col2Id = `${sid}_col2`;

      const titleText = s.title?.trim() || "";
      const bulletsArr = s.bullets || [];
      const bulletText = bulletsArr.length
        ? bulletsArr.map((b) => (b.startsWith("- ") ? b : `- ${b}`)).join("\n")
        : "";
      const paragraphText = (s.paragraph ?? "").toString().trim();
      const quoteText = (s.quote ?? "").toString().trim() || bulletsArr[0]?.toString().trim() || "";

      requests.push({
        createSlide: { objectId: sid, slideLayoutReference: { predefinedLayout: "BLANK" } },
      });
      addBackground(requests, sid, theme.backgroundColor);

      const layout = chooseLayout(s, idx);

      if (layout === "SECTION_HEADER") {
        if (titleText) {
          const box = { x: MARGIN.X, y: PAGE.H / 2 - 60, w: PAGE.W - MARGIN.X * 2, h: 120 };
          addTextBox(requests, titleId, sid, box.x, box.y, box.w, box.h);
          insertText(requests, titleId, titleText);
          textColor(requests, titleId, theme.textColor);
          textAlign(requests, titleId, "CENTER");
          textSize(requests, titleId, pickFontSizeForBox(titleText, box.w, box.h, 40, 26));
          textBold(requests, titleId);
        }
        return;
      }

      if (layout === "PARAGRAPH") {
        if (titleText) {
          const tBox = { x: MARGIN.X, y: MARGIN.Y, w: PAGE.W - MARGIN.X * 2, h: 64 };
          addTextBox(requests, titleId, sid, tBox.x, tBox.y, tBox.w, tBox.h);
          insertText(requests, titleId, titleText);
          textColor(requests, titleId, theme.textColor);
          textSize(requests, titleId, pickFontSizeForBox(titleText, tBox.w, tBox.h, 24, 18));
          textBold(requests, titleId);
        }
        const body = paragraphText || (bulletsArr.length ? bulletsArr.join(" ") : "");
        if (body) {
          const bBox = { x: MARGIN.X, y: 120, w: PAGE.W - MARGIN.X * 2, h: PAGE.H - 160 };
          addTextBox(requests, bodyId, sid, bBox.x, bBox.y, bBox.w, bBox.h);
          insertText(requests, bodyId, body);
          textColor(requests, bodyId, theme.textColor);
          textSize(requests, bodyId, pickFontSizeForBox(body, bBox.w, bBox.h, 18, 12));
          textAlign(requests, bodyId, "JUSTIFIED");
        }
        return;
      }

      if (layout === "TWO_COLUMN") {
        if (titleText) {
          const tBox = { x: MARGIN.X, y: 22, w: PAGE.W - MARGIN.X * 2, h: 54 };
          addTextBox(requests, titleId, sid, tBox.x, tBox.y, tBox.w, tBox.h);
          insertText(requests, titleId, titleText);
          textColor(requests, titleId, theme.textColor);
          textSize(requests, titleId, pickFontSizeForBox(titleText, tBox.w, tBox.h, 24, 16));
          textBold(requests, titleId);
        }

        const half = Math.ceil(bulletsArr.length / 2);
        const left = bulletsArr.slice(0, half);
        const right = bulletsArr.slice(half);

        if (left.length) {
          const text = left.map((b) => (b.startsWith("- ") ? b : `- ${b}`)).join("\n");
          const box = { x: MARGIN.X, y: 96, w: (PAGE.W - MARGIN.X * 2) / 2 - 12, h: PAGE.H - 132 };
          addTextBox(requests, col1Id, sid, box.x, box.y, box.w, box.h);
          insertText(requests, col1Id, text);
          textColor(requests, col1Id, theme.textColor);
          textSize(requests, col1Id, pickFontSizeForBox(text, box.w, box.h, 18, 12));
          bullets(requests, col1Id);
        }

        if (right.length) {
          const text = right.map((b) => (b.startsWith("- ") ? b : `- ${b}`)).join("\n");
          const box = {
            x: MARGIN.X + (PAGE.W - MARGIN.X * 2) / 2 + 12,
            y: 96,
            w: (PAGE.W - MARGIN.X * 2) / 2 - 12,
            h: PAGE.H - 132,
          };
          addTextBox(requests, col2Id, sid, box.x, box.y, box.w, box.h);
          insertText(requests, col2Id, text);
          textColor(requests, col2Id, theme.textColor);
          textSize(requests, col2Id, pickFontSizeForBox(text, box.w, box.h, 18, 12));
          bullets(requests, col2Id);
        }
        return;
      }

      if (layout === "QUOTE") {
        if (quoteText) {
          const box = { x: 80, y: 160, w: PAGE.W - 160, h: 260 };
          addTextBox(requests, bodyId, sid, box.x, box.y, box.w, box.h);
          insertText(requests, bodyId, `“${quoteText}”`);
          textColor(requests, bodyId, theme.textColor);
          textSize(requests, bodyId, pickFontSizeForBox(quoteText, box.w, box.h, 28, 16));
          textItalic(requests, bodyId);
          textAlign(requests, bodyId, "CENTER");
        }
        if (titleText) {
          const tBox = { x: MARGIN.X, y: 40, w: PAGE.W - MARGIN.X * 2, h: 50 };
          addTextBox(requests, titleId, sid, tBox.x, tBox.y, tBox.w, tBox.h);
          insertText(requests, titleId, titleText);
          textColor(requests, titleId, theme.accentColor || theme.textColor);
          textSize(requests, titleId, pickFontSizeForBox(titleText, tBox.w, tBox.h, 20, 14));
        }
        return;
      }

      // DEFAULT: TITLE_AND_BODY
      if (titleText) {
        const tBox = { x: MARGIN.X, y: 40, w: PAGE.W - MARGIN.X * 2, h: 60 };
        addTextBox(requests, titleId, sid, tBox.x, tBox.y, tBox.w, tBox.h);
        insertText(requests, titleId, titleText);
        textColor(requests, titleId, theme.textColor);
        textSize(requests, titleId, pickFontSizeForBox(titleText, tBox.w, tBox.h, 24, 16));
        textBold(requests, titleId);
      }
      if (bulletText) {
        const bBox = { x: MARGIN.X, y: 120, w: PAGE.W - MARGIN.X * 2, h: PAGE.H - 160 };
        addTextBox(requests, bodyId, sid, bBox.x, bBox.y, bBox.w, bBox.h);
        insertText(requests, bodyId, bulletText);
        textColor(requests, bodyId, theme.textColor);
        textSize(requests, bodyId, pickFontSizeForBox(bulletText, bBox.w, bBox.h, 18, 12));
        bullets(requests, bodyId);
      }
    });

    await slidesApi.presentations.batchUpdate({
      presentationId,
      requestBody: { requests },
    });

    return NextResponse.json({
      ok: true,
      presentationId,
      url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
    });
  } catch (e: any) {
    const msg = e?.message || "";
    if (msg.includes("No refresh token") || msg.includes("invalid_grant")) {
      return NextResponse.json({ ok: false, needAuth: true, error: msg }, { status: 401 });
    }
    console.error("GOOGLE_SLIDES_CREATE_ERROR", e);
    return NextResponse.json({ ok: false, error: msg || "Google Slides create failed" }, { status: 500 });
  }
}
