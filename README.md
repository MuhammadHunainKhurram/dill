# Dill 🥒

Dill is a developer-first framework for turning messy documents into **polished, editable Google Slides decks**.
It uses **Anthropic Claude** to generate structured JSON slide specs, then applies them to Google Slides with a clean UI, modern themes, and even **voice commands** for editing.

---

## ✨ Features

* **PDF → Slides**
  Upload any PDF, and Dill parses + summarizes into a structured deck.

* **Claude-powered generation**
  Uses large-context LLMs to design slide layouts, typography, and themes.

* **JSON preview + editing**
  Inspect and tweak the full slide spec before sending to Google Slides.

* **Google Slides export**
  One click to create a fully editable Google Slides deck with layout, text, and styles.

* **Modern theming system**
  Built-in color palettes (`forest`, `ocean`, `emerald`, etc.), or define custom hex values.

* **Voice editing** 🎤
  Natural commands like:

  * “Change the title of slide 2 to Puppies”
  * “Switch background to red”
  * “Make the word ATP bold in body”
  * “Move slide 5 before slide 2”
    Fuzzy matching + Claude fallback ensures commands are applied even if phrased loosely.

* **Undo history**
  Every voice action is reversible.

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/yourname/dill.git
cd dill
npm install
```

### 2. Set environment variables

Create a `.env.local` file:

```bash
# Anthropic API (for Claude models)
ANTHROPIC_API_KEY=sk-...

# Optional: override model choice
ANTHROPIC_MODEL=claude-3-5-sonnet-latest

# Google OAuth credentials
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

### 3. Run

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

---

## 🧩 Architecture

* **Frontend**:
  Next.js + TailwindCSS + ShadCN UI.
  Components:

  * `SlidesPreview` – live slide deck rendering.
  * `VoiceCommander` – speech recognition + fuzzy/Claude intent mapping.
  * `MessyDataAgent` – agent UI for cleaning raw content.

* **Backend**:

  * `lib/pdf-slides.ts`:

    * PDF parsing (`pdf-parse`)
    * Claude prompt for JSON slide generation
    * Robust JSON sanitization/repair
  * `lib/voice/interpret.ts`:

    * Structured intent parsing via Claude

* **Google Slides Integration**:
  Batched `presentations.batchUpdate` requests to create slides, apply text, styles, and theme.

---

## 🗣️ Voice Commands

Here are supported categories:

* **Navigation**

  * “Go to slide 3”
  * “Duplicate slide 2”
  * “Swap slide 1 with slide 4”

* **Content edits**

  * “Change title of slide 5 to Final Results”
  * “Add bullet to slide 2: Market growth”
  * “Replace bullets with: A; B; C”

* **Formatting**

  * “Align body center”
  * “Title size 36”
  * “Make ‘revenue’ bold in body”

* **Theme**

  * “Set theme to forest”
  * “Switch background to #0B1B2B”
  * “Set text color to white”

---

## 🧪 Example Flow

1. Upload `world-war-2-notes.pdf`.
2. Dill → Claude: outputs JSON like:

```json
{
  "presentationTitle": "World War II",
  "slidesCount": 8,
  "theme": { "backgroundColor": "#0B1B2B", "textColor": "#FFFFFF", "accentColor": "#10B981" },
  "slides": [
    { "layout": "TITLE_SLIDE", "title": "World War II", "subtitle": "One-Page Notes", "bullets": [] },
    { "layout": "TITLE_AND_BODY", "title": "Causes", "bullets": ["Treaty of Versailles", "Rise of fascism", "Global depression"] }
  ]
}
```

3. Preview and tweak.
4. Hit **Create in Google Slides**.
5. Use voice: “Switch background to dark green.”

---

## 🛠️ Roadmap

* [ ] Image support (inline or background images)
* [ ] Export to PowerPoint / Keynote
* [ ] Collaborative editing (multi-user)
* [ ] More granular formatting (per-word styles exported to Slides API)

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/cool-thing`)
3. Commit changes (`git commit -m "Add cool thing"`)
4. Push branch and open PR

---

## 📜 License

MIT © 2025 Your Name
