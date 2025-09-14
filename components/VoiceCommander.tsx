'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Align = 'START' | 'CENTER' | 'END' | 'JUSTIFIED';

type TextStyleSpec = {
  fontFamily?: string | null;
  fontSize?: number | null;
  color?: string | null;
  align?: Align;
  bold?: string[];
  italic?: string[];
  underline?: string[];
};

type SlideSpec = {
  layout?:
    | 'TITLE_SLIDE'
    | 'TABLE_OF_CONTENTS'
    | 'CONCLUSION'
    | 'APPENDIX'
    | 'TITLE_AND_BODY'
    | 'PARAGRAPH'
    | 'TWO_COLUMN'
    | 'SECTION_HEADER'
    | 'QUOTE'
    | 'TITLE_ONLY'
    | 'ONE_COLUMN_TEXT'
    | 'MAIN_POINT'
    | 'SECTION_AND_DESC'
    | 'CAPTION'
    | 'BIG_NUMBER';
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
};

type Deck = {
  presentationTitle: string;
  slidesCount?: number;
  theme: {
    backgroundColor?: string | null;
    textColor?: string | null;
    accentColor?: string | null;
    backgroundImageUrl?: string | null;
  };
  slides: SlideSpec[];
};

export default function VoiceCommander({
  deck,
  setDeck,
}: {
  deck: Deck;
  setDeck: (d: Deck) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState('');
  const history = useRef<Deck[]>([]);

  // Keep active index clamped
  useEffect(() => {
    if (!deck?.slides?.length) return;
    setActiveIdx((i) => Math.min(Math.max(0, i), deck.slides.length - 1));
  }, [deck?.slides?.length]);

  // --- Speech setup (Web Speech API) ---
  const recognition = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const w = window as any;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return null;
    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.continuous = false;
    return rec;
  }, []);

  useEffect(() => {
    if (!recognition) return;
    const handleResult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ')
        .trim();
      if (transcript) runCommand(transcript);
      setListening(false);
    };
    const handleEnd = () => setListening(false);

    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('end', handleEnd);
    return () => {
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('end', handleEnd);
    };
  }, [recognition]);

  function startListening() {
    if (!recognition) return;
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
    }
  }

  // --- Helpers ---
  function pushHistory() {
    // limit history to 25 steps
    history.current.push(JSON.parse(JSON.stringify(deck)));
    if (history.current.length > 25) history.current.shift();
  }
  function undo() {
    const prev = history.current.pop();
    if (prev) setDeck(prev);
  }

  const colorMap: Record<string, string> = {
    white: '#FFFFFF',
    black: '#111827',
    gray: '#374151',
    slate: '#0F172A',
    navy: '#0B1B2B',
    red: '#EF4444',
    orange: '#F59E0B',
    amber: '#FBBF24',
    yellow: '#FACC15',
    lime: '#84CC16',
    green: '#10B981',
    emerald: '#059669',
    teal: '#14B8A6',
    cyan: '#06B6D4',
    sky: '#0EA5E9',
    blue: '#2563EB',
    indigo: '#4F46E5',
    violet: '#8B5CF6',
    purple: '#7C3AED',
    fuchsia: '#C026D3',
    pink: '#EC4899',
    rose: '#F43F5E',
  };

  function normalizeColor(word: string) {
    const w = (word || '').toLowerCase().trim();
    if (w.startsWith('#') && (w.length === 7 || w.length === 4)) return w;
    return colorMap[w] || null;
  }

  function clamp(n: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, n));
  }

  function ensureStyle(s: SlideSpec, which: 'titleStyle' | 'bodyStyle') {
    if (!s[which]) s[which] = {};
    if (!s[which]!.bold) s[which]!.bold = [];
    if (!s[which]!.italic) s[which]!.italic = [];
    if (!s[which]!.underline) s[which]!.underline = [];
  }

  function applyToDeck(mut: (copy: Deck) => void) {
    pushHistory();
    const copy = JSON.parse(JSON.stringify(deck)) as Deck;
    mut(copy);
    if (Array.isArray(copy.slides)) copy.slidesCount = copy.slides.length;
    setDeck(copy);
  }

  // --- Command parser / executor ---
  function runCommand(raw: string) {
    const cmd = (raw || '').trim();
    setLastCommand(cmd);
    if (!cmd) return;

    // Undo
    if (/^undo$/i.test(cmd)) return undo();

    // Go to slide N
    {
      const m = cmd.match(/^(go to|switch to|open)\s+slide\s+(\d+)/i);
      if (m) {
        const n = clamp(parseInt(m[2], 10) - 1, 0, deck.slides.length - 1);
        setActiveIdx(n);
        return;
      }
    }

    // Change title or subtitle
    {
      const m = cmd.match(/^change\s+(title|subtitle)\s+(of\s+slide\s+(\d+)\s+)?to\s+(.+)/i);
      if (m) {
        const field = m[1].toLowerCase() as 'title' | 'subtitle';
        const idx = m[3] ? clamp(parseInt(m[3], 10) - 1, 0, deck.slides.length - 1) : activeIdx;
        const text = m[4].trim().replace(/^"(.*)"$/, '$1');
        return applyToDeck((d) => {
          d.slides[idx][field] = text;
        });
      }
    }

    // Add bullet
    {
      const m = cmd.match(/^add\s+bullet\s+(?:to\s+slide\s+(\d+)\s+)?(.+)/i);
      if (m) {
        const idx = m[1] ? clamp(parseInt(m[1], 10) - 1, 0, deck.slides.length - 1) : activeIdx;
        const text = m[2].trim().replace(/^"(.*)"$/, '$1');
        return applyToDeck((d) => {
          const s = d.slides[idx];
          if (!s.bullets) s.bullets = [];
          s.bullets.push(text);
          // clear paragraph if transitioning to bullets
          if (s.paragraph && s.bullets.length > 0) s.paragraph = null;
        });
      }
    }

    // Replace bullets with a list (semicolon or comma separated)
    {
      const m = cmd.match(/^replace\s+bullets\s+with\s*:\s*(.+)/i);
      if (m) {
        const items = m[1]
          .split(/[;,]/)
          .map((s) => s.trim())
          .filter(Boolean);
        return applyToDeck((d) => {
          const s = d.slides[activeIdx];
          s.bullets = items;
          s.paragraph = null;
        });
      }
    }

    // Clear bullets
    if (/^clear\s+bullets$/i.test(cmd)) {
      return applyToDeck((d) => {
        d.slides[activeIdx].bullets = [];
      });
    }

    // Paragraph content
    {
      const m = cmd.match(/^set\s+paragraph\s+(?:of\s+slide\s+(\d+)\s+)?to\s+(.+)/i);
      if (m) {
        const idx = m[1] ? clamp(parseInt(m[1], 10) - 1, 0, deck.slides.length - 1) : activeIdx;
        const text = m[2].trim().replace(/^"(.*)"$/, '$1');
        return applyToDeck((d) => {
          const s = d.slides[idx];
          s.paragraph = text;
          s.bullets = [];
        });
      }
    }

    // Make quote slide
    {
      const m = cmd.match(/^make\s+(?:slide\s+(\d+)\s+)?a\s+quote\s*:\s*(.+)/i);
      if (m) {
        const idx = m[1] ? clamp(parseInt(m[1], 10) - 1, 0, deck.slides.length - 1) : activeIdx;
        const text = m[2].trim().replace(/^"(.*)"$/, '$1');
        return applyToDeck((d) => {
          const s = d.slides[idx];
          s.layout = 'QUOTE';
          s.quote = text;
          s.bullets = [];
          s.paragraph = null;
        });
      }
    }

    // Layout switch
    {
      const m = cmd.match(/^set\s+layout\s+(?:of\s+slide\s+(\d+)\s+)?to\s+(two\s*column|paragraph|quote|section\s*header|title\s*and\s*body|title\s*only)/i);
      if (m) {
        const idx = m[1] ? clamp(parseInt(m[1], 10) - 1, 0, deck.slides.length - 1) : activeIdx;
        const key = m[2].toLowerCase().replace(/\s+/g, '_');
        const map: Record<string, SlideSpec['layout']> = {
          two_column: 'TWO_COLUMN',
          paragraph: 'PARAGRAPH',
          quote: 'QUOTE',
          section_header: 'SECTION_HEADER',
          title_and_body: 'TITLE_AND_BODY',
          title_only: 'TITLE_ONLY',
        };
        const layout = map[key] || 'TITLE_AND_BODY';
        return applyToDeck((d) => {
          d.slides[idx].layout = layout;
        });
      }
    }

    // Colors: background / text / accent
    {
      const m = cmd.match(/^(switch|set)\s+(background|text|accent)\s+(?:color\s+)?to\s+([#a-z0-9]+)$/i);
      if (m) {
        const target = m[2].toLowerCase();
        const hex = normalizeColor(m[3]);
        if (!hex) return;
        return applyToDeck((d) => {
          if (target === 'background') d.theme.backgroundColor = hex;
          else if (target === 'text') d.theme.textColor = hex;
          else if (target === 'accent') d.theme.accentColor = hex;
        });
      }
    }
    if (/^switch\s+background\s+to\s+([#a-z0-9]+)$/i.test(cmd)) {
      const hex = normalizeColor(cmd.replace(/^switch\s+background\s+to\s+/i, ''));
      if (hex) {
        return applyToDeck((d) => {
          d.theme.backgroundColor = hex;
        });
      }
    }

    // Font sizes
    {
      const m = cmd.match(/^(title|body)\s+size\s+(\d{1,3})/i);
      if (m) {
        const which = m[1].toLowerCase() as 'title' | 'body';
        const size = clamp(parseInt(m[2], 10), 8, 96);
        return applyToDeck((d) => {
          const s = d.slides[activeIdx];
          ensureStyle(s, which === 'title' ? 'titleStyle' : 'bodyStyle');
          (which === 'title' ? s.titleStyle! : s.bodyStyle!).fontSize = size;
        });
      }
    }

    // Alignment
    {
      const m = cmd.match(/^align\s+(title|body)\s+(left|right|center|justified)/i);
      if (m) {
        const which = m[1].toLowerCase() as 'title' | 'body';
        const alignWord = m[2].toLowerCase();
        const map: Record<string, Align> = {
          left: 'START',
          right: 'END',
          center: 'CENTER',
          justified: 'JUSTIFIED',
        };
        return applyToDeck((d) => {
          const s = d.slides[activeIdx];
          ensureStyle(s, which === 'title' ? 'titleStyle' : 'bodyStyle');
          (which === 'title' ? s.titleStyle! : s.bodyStyle!).align = map[alignWord];
        });
      }
    }

    // Bold / italic / underline terms in title/body
    {
      const m = cmd.match(/^(make|set)\s+"([^"]+)"\s+(bold|italic|underlined)\s*(in\s+(title|body))?$/i)
        || cmd.match(/^(make|set)\s+'([^']+)'\s+(bold|italic|underlined)\s*(in\s+(title|body))?$/i)
        || cmd.match(/^(make|set)\s+(.+?)\s+(bold|italic|underlined)\s*(in\s+(title|body))?$/i);
      if (m) {
        const term = (m[2] || '').trim();
        const style = m[3].toLowerCase(); // bold | italic | underlined
        const target = (m[5]?.toLowerCase() as 'title' | 'body') || 'body';
        if (!term) return;

        return applyToDeck((d) => {
          const s = d.slides[activeIdx];
          const key = target === 'title' ? 'titleStyle' : 'bodyStyle';
          ensureStyle(s, key);
          const arr =
            style === 'bold'
              ? s[key]!.bold!
              : style === 'italic'
              ? s[key]!.italic!
              : s[key]!.underline!;
          if (!arr.includes(term)) arr.push(term);
        });
      }
    }

    // Fallback: if user said “change title to Puppies”
    {
      const m = cmd.match(/^change\s+title\s+to\s+(.+)/i);
      if (m) {
        const text = m[1].trim().replace(/^"(.*)"$/, '$1');
        return applyToDeck((d) => {
          d.slides[activeIdx].title = text;
        });
      }
    }
  }

  return (
    <div className="mb-3 flex items-center justify-between rounded-xl border border-emerald-700/40 bg-emerald-900/40 px-4 py-3 text-emerald-50">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => (listening ? recognition?.stop() : startListening())}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            listening ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
          title="Voice edit"
        >
          {listening ? 'Listening… (click to stop)' : '🎤 Voice edit'}
        </button>

        <button
          type="button"
          onClick={undo}
          className="rounded-md border border-emerald-600/60 px-3 py-1.5 text-sm hover:bg-emerald-800/40"
        >
          Undo
        </button>

        <div className="hidden text-sm md:block">
          Slide&nbsp;
          <input
            type="number"
            min={1}
            max={deck.slides.length || 1}
            value={activeIdx + 1}
            onChange={(e) =>
              setActiveIdx(clamp(parseInt(e.target.value || '1', 10) - 1, 0, deck.slides.length - 1))
            }
            className="w-16 rounded border border-emerald-700/60 bg-emerald-950/40 px-2 py-1"
          />
          &nbsp;/ {deck.slides.length}
        </div>
      </div>

      <div className="w-[60%] text-right text-xs text-emerald-200">
        {lastCommand ? <span>Last: “{lastCommand}”</span> : <span>Try: “switch background to red”, “make 'ATP' bold in body”, “title size 36”, “align body center”, “set layout to two column”, “replace bullets with: A; B; C; D”</span>}
      </div>
    </div>
  );
}
