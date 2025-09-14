'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Align = 'START' | 'CENTER' | 'END' | 'JUSTIFIED';

type TextStyle = {
  fontFamily?: string | null;
  fontSize?: number | null;
  color?: string | null;
  align?: Align | null;
  bold?: string[];
  italic?: string[];
  underline?: string[];
};

type Slide = {
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
  titleStyle?: TextStyle;
  bodyStyle?: TextStyle;
};

type Deck = {
  presentationTitle: string;
  slides: Slide[];
  theme: {
    backgroundColor?: string | null;
    textColor?: string | null;
    accentColor?: string | null;
  };
};

function alignToClass(a?: Align | null) {
  switch (a) {
    case 'CENTER':
      return 'text-center';
    case 'END':
      return 'text-right';
    case 'JUSTIFIED':
      return 'text-justify';
    default:
      return 'text-left';
  }
}

function deriveTocItems(allSlides: Slide[]) {
  return allSlides
    .filter(
      (s) =>
        (s.layout || '') !== 'TITLE_SLIDE' &&
        (s.layout || '') !== 'TABLE_OF_CONTENTS' &&
        (s.title || '').trim().length > 0
    )
    .map((s) => (s.title || '').trim())
    .slice(0, 12);
}

export default function SlidesPreview({ deck }: { deck?: Deck | null }) {
  if (!deck || !Array.isArray(deck.slides) || deck.slides.length === 0) {
    return (
      <section className="mt-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
          No preview yet. Generate slides to see a live preview here.
        </div>
      </section>
    );
  }

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [deck.presentationTitle, deck.slides?.length]);

  const safeIndex = Math.min(Math.max(index, 0), deck.slides.length - 1);
  const slide = deck.slides[safeIndex];

  const bg = deck.theme?.backgroundColor || '#ffffff';
  const fg = deck.theme?.textColor || '#111827';
  const accent = deck.theme?.accentColor || '#0ea5e9';

  const next = () => setIndex((i) => Math.min(i + 1, deck.slides.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">{deck.presentationTitle}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>
            Slide {safeIndex + 1} of {deck.slides.length}
          </span>
          <button
            onClick={prev}
            className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
            disabled={safeIndex === 0}
          >
            ←
          </button>
          <button
            onClick={next}
            className="rounded border px-2 py-1 hover:bg-gray-50 disabled:opacity-50"
            disabled={safeIndex === deck.slides.length - 1}
          >
            →
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 overflow-hidden">
        <div
          className="p-6"
          style={{
            background: bg,
            color: fg,
            minHeight: 420,
            borderRadius: 12,
          }}
        >
          {renderSlide(slide, deck, accent, fg)}
        </div>
      </div>
    </section>
  );
}

function renderSlide(slide: Slide, deck: Deck, accent: string, defaultText: string) {
  const title = (slide.title || '').trim();
  const subtitle = (slide.subtitle || '').trim();
  const bullets = (slide.bullets || []).filter(Boolean);
  const paragraph = (slide.paragraph || '').trim();
  const quote = (slide.quote || '').trim();

  const titleClass = `font-semibold ${alignToClass(slide.titleStyle?.align)} ${
    slide.titleStyle?.fontFamily ? '' : 'font-sans'
  }`;
  const bodyClass = `${alignToClass(slide.bodyStyle?.align)} ${
    slide.bodyStyle?.fontFamily ? '' : 'font-sans'
  }`;

  const titleStyle: React.CSSProperties = useMemo(
    () => ({
      fontFamily: slide.titleStyle?.fontFamily || undefined,
      fontSize: (slide.titleStyle?.fontSize || 24) + 'pt',
      color: slide.titleStyle?.color || defaultText,
    }),
    [slide.titleStyle, defaultText]
  );

  const bodyStyle: React.CSSProperties = useMemo(
    () => ({
      fontFamily: slide.bodyStyle?.fontFamily || undefined,
      fontSize: (slide.bodyStyle?.fontSize || 18) + 'pt',
      color: slide.bodyStyle?.color || defaultText,
      whiteSpace: 'pre-wrap',
      lineHeight: 1.35,
    }),
    [slide.bodyStyle, defaultText]
  );

  const hr = <div className="h-[2px] w-44 mt-1" style={{ background: accent, opacity: 0.9 }} />;

  const layout =
    slide.layout || (bullets.length ? 'TITLE_AND_BODY' : paragraph ? 'PARAGRAPH' : 'TITLE_ONLY');

  if (layout === 'TITLE_SLIDE') {
    return (
      <div className="flex flex-col items-center justify-center h-[420px] gap-6">
        <h1 className={titleClass} style={{ ...titleStyle, fontSize: (slide.titleStyle?.fontSize || 48) + 'pt' }}>
          {title || 'Presentation'}
        </h1>
        {subtitle ? (
          <div className="text-center" style={{ color: deck.theme.accentColor || defaultText }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    );
  }

  if (layout === 'TABLE_OF_CONTENTS') {
    const toc =
      (slide.tocItems && slide.tocItems.length ? slide.tocItems : deriveTocItems(deck.slides)) || [];
    return (
      <div>
        <h3 className={titleClass} style={titleStyle}>
          {title || 'Table of Contents'}
        </h3>
        {hr}
        {toc.length ? (
          <ol className={`mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-2 ${bodyClass}`} style={bodyStyle}>
            {toc.map((t, i) => (
              <li key={i}>
                <span className="text-gray-500 mr-2">{i + 1}.</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-6 text-gray-500" style={bodyStyle}>
            (No sections detected)
          </div>
        )}
      </div>
    );
  }

  if (layout === 'QUOTE' && quote) {
    return (
      <div className={`italic ${bodyClass}`} style={{ ...bodyStyle, fontSize: (slide.bodyStyle?.fontSize || 28) + 'pt' }}>
        “{quote}”
      </div>
    );
  }

  if (layout === 'PARAGRAPH') {
    return (
      <div>
        {title ? (
          <>
            <h3 className={titleClass} style={titleStyle}>
              {title}
            </h3>
            {hr}
          </>
        ) : null}
        <div className={`mt-4 ${bodyClass}`} style={bodyStyle}>
          {paragraph || bullets.join(' ')}
        </div>
      </div>
    );
  }

  if (layout === 'TWO_COLUMN') {
    const half = Math.ceil(bullets.length / 2);
    const left = bullets.slice(0, half);
    const right = bullets.slice(half);
    return (
      <div>
        {title ? (
          <>
            <h3 className={titleClass} style={titleStyle}>
              {title}
            </h3>
            {hr}
          </>
        ) : null}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
          <ul className={bodyClass} style={bodyStyle}>
            {left.map((b, i) => (
              <li key={i} className="list-disc ml-5">
                {b}
              </li>
            ))}
          </ul>
          <ul className={bodyClass} style={bodyStyle}>
            {right.map((b, i) => (
              <li key={i} className="list-disc ml-5">
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  if (layout === 'APPENDIX') {
    const cites = (slide.citations || []).filter(Boolean);
    return (
      <div>
        <h3 className={titleClass} style={titleStyle}>
          {title || 'Appendix'}
        </h3>
        {hr}
        {cites.length ? (
          <ul className={`mt-4 ${bodyClass}`} style={bodyStyle}>
            {cites.map((c, i) => (
              <li key={i} className="list-disc ml-5">
                {c}
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 text-gray-500" style={bodyStyle}>
            (No citations)
          </div>
        )}
      </div>
    );
  }

  if (layout === 'CONCLUSION') {
    const body = paragraph || bullets.map((b) => `• ${b}`).join('\n');
    return (
      <div>
        <h3 className={titleClass} style={titleStyle}>
          {title || 'Conclusion'}
        </h3>
        {hr}
        <div className={`mt-4 ${bodyClass}`} style={bodyStyle}>
          {body}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title ? (
        <>
          <h3 className={titleClass} style={titleStyle}>
            {title}
          </h3>
          {hr}
        </>
      ) : null}
      {bullets.length ? (
        <ul className={`mt-4 ${bodyClass}`} style={bodyStyle}>
          {bullets.map((b, i) => (
            <li key={i} className="list-disc ml-5">
              {b}
            </li>
          ))}
        </ul>
      ) : paragraph ? (
        <div className={`mt-4 ${bodyClass}`} style={bodyStyle}>
          {paragraph}
        </div>
      ) : null}
    </div>
  );
}
