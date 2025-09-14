'use client';

import React, { useMemo, useRef, useState } from 'react';

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

type Slide = {
  layout?: string;
  title?: string | null;
  subtitle?: string | null;
  bullets?: string[];
  paragraph?: string | null;
  quote?: string | null;
  notes?: string | null;
  titleStyle?: TextStyleSpec;
  bodyStyle?: TextStyleSpec;
};

type Deck = {
  presentationTitle: string;
  slidesCount: number;
  theme: {
    backgroundColor: string | null;
    textColor: string | null;
    accentColor: string | null;
    backgroundImageUrl: string | null;
  };
  slides: Slide[];
};

type Props = {
  deck: Deck | null;
  setDeck: (d: Deck) => void;
  disabled?: boolean;
};

const layoutMap: Record<string, string> = {
  'title_and_body': 'TITLE_AND_BODY',
  'title and body': 'TITLE_AND_BODY',
  'paragraph': 'PARAGRAPH',
  'two_column': 'TWO_COLUMN',
  'two column': 'TWO_COLUMN',
  'section_header': 'SECTION_HEADER',
  'section header': 'SECTION_HEADER',
  'quote': 'QUOTE',
  'title_only': 'TITLE_ONLY',
  'title only': 'TITLE_ONLY',
  'one column text': 'ONE_COLUMN_TEXT',
  'main point': 'MAIN_POINT',
  'section and description': 'SECTION_AND_DESC',
  'caption': 'CAPTION',
  'big number': 'BIG_NUMBER',
};

function speak(text: string) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.05;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch {}
}

export default function VoiceCommander({ deck, setDeck, disabled }: Props) {
  const [cmd, setCmd] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  const canVoice = typeof window !== 'undefined' && (
    (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
  );

  function withDeck(mutator: (d: Deck) => string) {
    if (!deck) return 'No deck loaded.';
    const clone: Deck = JSON.parse(JSON.stringify(deck));
    const msg = mutator(clone);
    clone.slidesCount = clone.slides?.length ?? 0;
    setDeck(clone);
    return msg;
  }

  // --- Command parser / applier ---
  function run(text: string) {
    const raw = text.trim();
    if (!raw) return;

    // change the title of slide 2 to Puppies
    let m = raw.match(/change (?:the )?title of slide (\d+) to (.+)/i);
    if (m) {
      const idx = Number(m[1]) - 1;
      const newTitle = m[2].trim().replace(/^["']|["']$/g, '');
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        d.slides[idx].title = newTitle;
        d.slides[idx].titleStyle ??= {};
        return `Changed title of slide ${idx + 1} to "${newTitle}".`;
      });
      speak(msg);
      return;
    }

    // change the format/layout of slide 4 to two column
    m = raw.match(/change (?:the )?(?:format|layout) of slide (\d+) to (.+)/i);
    if (m) {
      const idx = Number(m[1]) - 1;
      const key = (m[2] || '').toLowerCase().trim();
      const layout = layoutMap[key] || layoutMap[key.replace(/-/g, ' ')] || key.toUpperCase();
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        d.slides[idx].layout = layout;
        return `Set layout of slide ${idx + 1} to ${layout}.`;
      });
      speak(msg);
      return;
    }

    // add a bullet to slide 3: This is a new point
    m = raw.match(/add (?:a )?bullet (?:to|on) slide (\d+):?\s+(.+)/i);
    if (m) {
      const idx = Number(m[1]) - 1;
      const bullet = m[2].trim().replace(/^[-•]\s*/, '');
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        d.slides[idx].bullets ??= [];
        d.slides[idx].bullets!.push(bullet);
        return `Added a bullet to slide ${idx + 1}.`;
      });
      speak(msg);
      return;
    }

    // replace bullets on slide 2 with: a; b; c
    m = raw.match(/replace bullets on slide (\d+) with:?\s+(.+)/i);
    if (m) {
      const idx = Number(m[1]) - 1;
      const items = m[2].split(/[;•\-]\s*|,\s*/).map(s => s.trim()).filter(Boolean);
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        d.slides[idx].bullets = items;
        d.slides[idx].paragraph = null;
        return `Replaced bullets on slide ${idx + 1}.`;
      });
      speak(msg);
      return;
    }

    // change paragraph on slide 5 to ...
    m = raw.match(/change paragraph on slide (\d+) to (.+)/i);
    if (m) {
      const idx = Number(m[1]) - 1;
      const para = m[2].trim().replace(/^["']|["']$/g, '');
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        d.slides[idx].paragraph = para;
        d.slides[idx].bullets = [];
        d.slides[idx].layout = 'PARAGRAPH';
        return `Updated paragraph on slide ${idx + 1}.`;
      });
      speak(msg);
      return;
    }

    // set title/body size or align on slide
    m = raw.match(/(title|body) (size|align) on slide (\d+) to ([\w\-]+)$/i);
    if (m) {
      const area = m[1].toLowerCase();
      const which = m[2].toLowerCase();
      const idx = Number(m[3]) - 1;
      const val = m[4].toLowerCase();
      const msg = withDeck(d => {
        if (!d.slides[idx]) return `Slide ${idx + 1} does not exist.`;
        const style = area === 'title'
          ? (d.slides[idx].titleStyle ??= {})
          : (d.slides[idx].bodyStyle ??= {});
        if (which === 'size') {
          const n = Number(val);
          if (!Number.isFinite(n)) return `Invalid size "${val}".`;
          style.fontSize = n;
          return `Set ${area} size on slide ${idx + 1} to ${n}pt.`;
        } else {
          const map: Record<string, Align> = {
            left: 'START', start: 'START',
            center: 'CENTER',
            right: 'END', end: 'END',
            justified: 'JUSTIFIED', justify: 'JUSTIFIED',
          };
          style.align = map[val] || 'START';
          return `Set ${area} alignment on slide ${idx + 1} to ${style.align}.`;
        }
      });
      speak(msg);
      return;
    }

    // set theme colors quickly
    m = raw.match(/set (background|text|accent) color to (#[0-9a-f]{6})/i);
    if (m) {
      const key = m[1].toLowerCase();
      const hex = m[2];
      const msg = withDeck(d => {
        if (key === 'background') d.theme.backgroundColor = hex;
        else if (key === 'text') d.theme.textColor = hex;
        else d.theme.accentColor = hex;
        return `Set ${key} color to ${hex}.`;
      });
      speak(msg);
      return;
    }

    // rename presentation
    m = raw.match(/rename (?:deck|presentation) to (.+)/i);
    if (m) {
      const title = m[1].trim().replace(/^["']|["']$/g, '');
      const msg = withDeck(d => {
        d.presentationTitle = title;
        return `Renamed presentation to "${title}".`;
      });
      speak(msg);
      return;
    }

    const fallback = `Sorry, I didn't understand: "${raw}". Try: "change the title of slide 2 to Puppies", "change the layout of slide 4 to two column", "add bullet to slide 3: New point", "title size on slide 1 to 42".`;
    speak(fallback);
  }

  // --- Speech to text (Web Speech API) ---
  function startListening() {
    if (!canVoice) return;
    if (listening) return;
    const Rec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new Rec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e: any) => {
      const t = e.results?.[0]?.[0]?.transcript || '';
      setCmd(t);
      run(t);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function stopListening() {
    try { recRef.current?.stop?.(); } catch {}
    setListening(false);
  }

  const micSupported = useMemo(() => !!canVoice, [canVoice]);

  return (
    <div className="mt-4 rounded-xl border border-[#173c32] bg-[#102420] p-3 text-emerald-100">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder='Try: “change the title of slide 2 to Puppies”'
          className="flex-1 rounded-lg border border-[#1f4a40] bg-[#0f1f1b] px-3 py-2 text-emerald-100 placeholder:text-emerald-300/50 focus:outline-none"
          disabled={disabled || !deck}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              run(cmd);
              setCmd('');
            }
          }}
        />
        <button
          onClick={() => { run(cmd); setCmd(''); }}
          disabled={disabled || !deck || !cmd.trim()}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
        >
          Run
        </button>
        {micSupported && (
          <button
            onClick={() => (listening ? stopListening() : startListening())}
            disabled={disabled || !deck}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              listening ? 'bg-rose-600 text-white' : 'bg-[#132a24] text-emerald-100 hover:bg-[#163129]'
            }`}
            title={listening ? 'Listening… click to stop' : 'Speak a command'}
          >
            {listening ? 'Listening…' : '🎤 Speak'}
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-emerald-300/70">
        Examples: “change the title of slide 2 to Puppies”, “change the layout of slide 4 to two column”,
        “add bullet to slide 3: New point”, “title size on slide 1 to 42”, “set background color to #0B1B2B”.
      </p>
    </div>
  );
}
