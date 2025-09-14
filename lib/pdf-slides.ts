import { Anthropic, APIError } from "@anthropic-ai/sdk";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse") as (b: Buffer) => Promise<{ text: string; numpages?: number }>;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const SCHEMA_BLOCK = `
JSON SCHEMA (shape, not formal JSON Schema):
{
  "presentationTitle": string,                       // concise, human title
  "slidesCount": integer,                            // MUST equal slides.length
  "theme": {
    "backgroundColor": string|null,                  // "#RRGGBB"
    "textColor": string|null,
    "accentColor": string|null,
    "backgroundImageUrl": string|null
  },
  "slides": [
    {
      "layout": "TITLE_SLIDE"|"TABLE_OF_CONTENTS"|"CONCLUSION"|"APPENDIX"|"TITLE_AND_BODY"|"PARAGRAPH"|"TWO_COLUMN"|"SECTION_HEADER"|"QUOTE"|"TITLE_ONLY"|"ONE_COLUMN_TEXT"|"MAIN_POINT"|"SECTION_AND_DESC"|"CAPTION"|"BIG_NUMBER",
      "title": string|null,
      "subtitle": string|null,
      "bullets": [string, ...],
      "paragraph": string|null,
      "quote": string|null,
      "notes": string|null,

      "tocItems": [string, ...] | null,              // only for TABLE_OF_CONTENTS (optional)
      "citations": [string, ...] | null,             // only for APPENDIX (MLA9 if links present)

      "titleStyle": {
        "fontFamily": string|null,                   // Inter, Arial, Helvetica, Roboto, Georgia, Garamond, "Times New Roman", Verdana, Lato, "Open Sans", "Courier New", "Comic Sans MS"
        "fontSize": number|null,                     // pt
        "color": string|null,                        // "#RRGGBB"
        "align": "START"|"CENTER"|"END"|"JUSTIFIED",
        "bold": [string, ...],
        "italic": [string, ...],
        "underline": [string, ...]
      },
      "bodyStyle": {
        "fontFamily": string|null,
        "fontSize": number|null,
        "color": string|null,
        "align": "START"|"CENTER"|"END"|"JUSTIFIED",
        "bold": [string, ...],
        "italic": [string, ...],
        "underline": [string, ...]
      }
    }
  ]
}
`.trim();

const STRICT_RULES = `
HARD JSON RULES — FOLLOW EXACTLY:
- Output ONE and only ONE JSON object, no prose, no markdown, no comments.
- Use DOUBLE quotes only. Never single quotes.
- No trailing commas.
- Do not include undefined values; use null instead.
- slidesCount MUST equal slides.length.
- If unsure about a field, set it to null or [].
`.trim();

const STYLE_GUIDE = `
FORMATTING & LAYOUT GUIDELINES (you choose intelligently):
- Include a TITLE_SLIDE yourself (title + optional subtitle).
- Add TABLE_OF_CONTENTS only if ≥ 6 slides with distinct sections.
- Add CONCLUSION if a meaningful summary exists.
- Add APPENDIX ONLY if links detected; produce MLA9 citations.
- Typography ranges:
  - Title slide: title 44–56pt, subtitle 18–28pt, centered.
  - Section headers: 36–48pt.
  - Standard titles: 24–32pt.
  - Bullet lists (≤6 items, one column): 18–20pt.
  - Long bullet lists (≥8): TWO_COLUMN at 16–18pt.
  - Paragraph slides (4–8 sentences): 16–18pt; JUSTIFIED; else START.
  - Quotes: 24–32pt; CENTER; italics true.
- Choose fontFamily by tone (academic→Garamond/Times; business→Inter/Lato/Open Sans; playful→Comic Sans sparingly).
- High-contrast colors; accentColor for emphasis only.
- Convert timelines/semicolon-separated facts into bullet lists.
- Keep text safely inside the slide bounds: prefer concise text, then size selection.
`.trim();



export type Align = "START" | "CENTER" | "END" | "JUSTIFIED";

export interface TextStyleSpec {
  fontFamily?: string | null;
  fontSize?: number | null;
  color?: string | null;
  align?: Align;
  bold?: string[];
  italic?: string[];
  underline?: string[];
}

export interface SlideSpec {
  layout?:
    | "TITLE_SLIDE"
    | "TABLE_OF_CONTENTS"
    | "CONCLUSION"
    | "APPENDIX"
    | "TITLE_AND_BODY"
    | "PARAGRAPH"
    | "TWO_COLUMN"
    | "SECTION_HEADER"
    | "QUOTE"
    | "TITLE_ONLY"
    | "ONE_COLUMN_TEXT"
    | "MAIN_POINT"
    | "SECTION_AND_DESC"
    | "CAPTION"
    | "BIG_NUMBER";

  title?: string | null;
  subtitle?: string | null;
  bullets?: string[];
  paragraph?: string | null;
  quote?: string | null;
  notes?: string | null;

  tocItems?: string[] | null;
  citations?: string[] | null;

  titleStyle?: TextStyleSpec;
  bodyStyle?: TextStyleSpec;
}

export interface SlideDeck {
  presentationTitle: string;
  slidesCount: number;
  theme: {
    backgroundColor: string | null;
    textColor: string | null;
    accentColor: string | null;
    backgroundImageUrl: string | null;
  };
  slides: SlideSpec[];
}

export interface SlideGenerationResponse {
  success: boolean;
  deck?: SlideDeck;
  error?: string;
}


const MODEL_CANDIDATES: string[] = (
  process.env.ANTHROPIC_MODEL
    ? process.env.ANTHROPIC_MODEL.split(",").map(s => s.trim()).filter(Boolean)
    : []
).concat([
  "claude-3-5-sonnet-latest",
  "claude-3-haiku-20240307",
]);

const SYSTEM_JSON_ONLY = `
You are a JSON formatter. Output exactly ONE JSON object and NOTHING ELSE.
- Valid RFC 8259 JSON. No comments, no code fences, no prose.
- Start with "{" and end with "}".
`.trim();

function cleanText(s: string) {
  return s
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/-\n/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function trimToTokenBudget(s: string, tokens = 4000) {
  const charBudget = tokens * 4;
  if (s.length <= charBudget) return s;
  const head = s.slice(0, Math.floor(charBudget * 0.6));
  const tail = s.slice(-Math.floor(charBudget * 0.2));
  return `${head}\n\n[...truncated...]\n\n${tail}`;
}

async function callClaudeJSON(prompt: string) {
  const errors: Record<string, string> = {};
  for (const model of MODEL_CANDIDATES) {
    try {
      const res = await anthropic.messages.create({
        model,
        system: SYSTEM_JSON_ONLY,
        max_tokens: 4096,
        temperature: 0,
        top_p: 1,
        messages: [{ role: "user", content: prompt }],
      });
      return res;
    } catch (e: any) {
      const msg = e?.message || String(e);
      errors[model] = msg;
      continue;
    }
  }
  throw new Error(
    `No Claude model worked. Tried: ${MODEL_CANDIDATES.join(", ")}. Errors: ${JSON.stringify(errors)}`
  );
}

function getText(res: any): string {
  const block = res.content?.[0];
  return block?.type === "text" && typeof block.text === "string" ? block.text : "";
}


function parseJsonLoose(raw: string): any {
  // Strip fences
  let s = String(raw || "").trim();
  s = s.replace(/^```json\s*/i, "")
       .replace(/^```\s*/i, "")
       .replace(/```$/i, "")
       .trim();

  // Keep only outermost {...} or [...]
  const firstBrace = s.indexOf("{");
  const firstBracket = s.indexOf("[");
  const first =
    firstBrace === -1 ? firstBracket :
    firstBracket === -1 ? firstBrace :
    Math.min(firstBrace, firstBracket);

  const lastBrace = s.lastIndexOf("}");
  const lastBracket = s.lastIndexOf("]");
  const last = Math.max(lastBrace, lastBracket);

  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }

  // Normalize: curly quotes -> straight
  s = s.replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
       .replace(/[\u2018\u2019\u2032]/g, "'");

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([}\]])/g, "$1");

  // Single-quoted keys -> double-quoted keys (safe cases only)
  s = s.replace(/'([^'\\]*?)'\s*:/g, (_m, key) => `"${key.replace(/"/g, '\\"')}" :`);

  // Remove stray NULs
  s = s.replace(/\u0000/g, "");

  return JSON.parse(s);
}

async function repairJson(badOutput: string) {
  const repairPrompt = `
Fix the following into valid RFC 8259 JSON. Return ONLY the JSON object, nothing else:

${badOutput}
  `.trim();
  const res = await callClaudeJSON(repairPrompt);
  const raw = getText(res);
  return parseJsonLoose(raw);
}

async function robustParseOrRepair(raw: string) {
  try {
    return parseJsonLoose(raw);
  } catch {
    const fixed = await repairJson(raw);
    return fixed;
  }
}

/** ----- Main entry ----- */

async function askForFixedJson(lastOutput: string, reason: string, schemaBlock: string) {
  const fixPrompt = `
Your previous output was NOT valid JSON because: ${reason}

Return ONLY a single valid RFC 8259 JSON object following this schema/shape.
Do not add comments, prose, or markdown. No trailing commas. Double quotes only.

${schemaBlock}

Here is your previous output to FIX:
${lastOutput}
  `.trim();

  const r = await callClaudeJSON(fixPrompt);
  let raw = getText(r);
  return raw;
}


export async function generateSlidesFromPDF(
  pdfBuffer: Buffer,
  _numSlides = 5,
  originalName = "document.pdf"
): Promise<SlideGenerationResponse> {
  try {
    if (!pdfBuffer?.length) return { success: false, error: "PDF buffer is required" };
    if (pdfBuffer.slice(0, 4).toString() !== "%PDF") return { success: false, error: "Invalid PDF file format" };
    if (!process.env.ANTHROPIC_API_KEY) return { success: false, error: "Anthropic API key not configured" };

    // ← rename so we don't shadow the later "parsed" JSON
    const pdfParsed = await pdfParse(pdfBuffer);
    const trimmed = trimToTokenBudget(cleanText(pdfParsed.text || ""), 3500);

    const prompt = `
${STRICT_RULES}

GOAL
Create a complete, visually balanced slide deck from the provided text.

${SCHEMA_BLOCK}

${STYLE_GUIDE}

TINY EXAMPLE (structure only; not your content):
{
  "presentationTitle": "Sample Deck",
  "slidesCount": 2,
  "theme": { "backgroundColor": "#0B1B2B", "textColor": "#FFFFFF", "accentColor": "#10B981", "backgroundImageUrl": null },
  "slides": [
    {
      "layout": "TITLE_SLIDE",
      "title": "Ocean Basics",
      "subtitle": "Key ideas in one lesson",
      "bullets": [],
      "paragraph": null,
      "quote": null,
      "notes": null,
      "tocItems": null,
      "citations": null,
      "titleStyle": { "fontFamily": "Inter", "fontSize": 52, "color": "#FFFFFF", "align": "CENTER", "bold": [], "italic": [], "underline": [] },
      "bodyStyle": { "fontFamily": "Inter", "fontSize": 22, "color": "#FFFFFF", "align": "CENTER", "bold": [], "italic": [], "underline": [] }
    },
    {
      "layout": "TITLE_AND_BODY",
      "title": "Definition",
      "subtitle": null,
      "bullets": ["The ocean covers ~71% of Earth.", "Average depth ~3.7 km."],
      "paragraph": null,
      "quote": null,
      "notes": null,
      "tocItems": null,
      "citations": null,
      "titleStyle": { "fontFamily": "Inter", "fontSize": 28, "color": "#FFFFFF", "align": "START", "bold": [], "italic": [], "underline": [] },
      "bodyStyle": { "fontFamily": "Inter", "fontSize": 18, "color": "#FFFFFF", "align": "START", "bold": [], "italic": [], "underline": [] }
    }
  ]
}

SOURCE TEXT (create the best possible deck from it):
${trimmed}
`.trim();

const res = await callClaudeJSON(prompt);
const raw = getText(res);

// DEBUG: return raw JSON directly so you can inspect it
console.log("=== RAW CLAUDE JSON START ===");
console.log(raw);
console.log("=== RAW CLAUDE JSON END ===");

// Try parsing, but if it fails, return the raw text for debugging
let parsedAny: any;
try {
  parsedAny = parseJsonLoose(raw);
} catch (e: any) {
  return {
    success: false,
    error: `Invalid JSON from Claude. Raw output:\n${raw}`,
  };
}

    // Claude sometimes returns { deck: {...} } or the object directly.
    const deckAny = parsedAny?.deck ? parsedAny.deck : parsedAny;

    if (!deckAny || !Array.isArray(deckAny.slides)) {
      throw new Error("JSON missing slides[]");
    }

    // Normalize + defaults
    const deck: SlideDeck = {
      presentationTitle: deckAny.presentationTitle || originalName.replace(/\.pdf$/i, ""),
      slidesCount: Array.isArray(deckAny.slides) ? deckAny.slides.length : 0,
      theme: deckAny.theme || {
        backgroundColor: "#0B1B2B",
        textColor: "#FFFFFF",
        accentColor: "#FFC107",
        backgroundImageUrl: null,
      },
      slides: deckAny.slides as SlideSpec[],
    };

    // Final guardrails
    if (!deck || !Array.isArray(deck.slides)) {
      return { success: false, error: "JSON missing slides[]" };
    }
    deck.slidesCount = deck.slides.length;
    if (!deck.presentationTitle) {
      deck.presentationTitle = originalName.replace(/\.pdf$/i, "");
    }
    if (!deck.theme) {
      deck.theme = {
        backgroundColor: "#0B1B2B",
        textColor: "#FFFFFF",
        accentColor: "#FFC107",
        backgroundImageUrl: null,
      };
    }

    return { success: true, deck };
  } catch (error: any) {
    return { success: false, error: error?.message || "Unknown error generating slide JSON" };
  }
}
