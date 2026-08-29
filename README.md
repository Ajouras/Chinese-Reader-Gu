# Chinese Reader GU

Chinese Reader GU is a high-contrast, responsive contextual reading application for Chinese-English language study. It provides an integrated offline dictionary, multi-character linguistic detection, Pinyin decomposition, flashcard deck management, and a Spaced Repetition System (SRS) review workflow.

---

> **AI Collaboration Notice**
>
> This codebase was developed in collaboration with AI coding assistants. While it is fully typed in TypeScript and supported by automated regression and integration test suites, users are advised to independently review, test, and adapt the code as appropriate for their specific production or deployment requirements.

---

## Text File Library (`texts/`)

The application includes a local text file ingestion pipeline:

1. Place any valid `.txt` file inside the `texts/` directory.
2. Launch or refresh the application. All `.txt` files within `texts/` are automatically indexed and displayed in the reading material selector.
3. Select a text file to load it into the interactive reader interface.
4. Additional `.txt` files may also be imported using the **"Add .txt File"** control in the reader toolbar, which writes them directly to the `texts/` directory.

---

## Interaction Model

- **Hover Inspection** — Hovering over text highlights the corresponding characters or compound words with non-disruptive visual feedback. Hover actions perform no network requests or translation calls.
- **Contextual Selection** — Clicking a highlighted word initiates phrase detection (resolving multi-character Chinese compounds, idioms, or English phrasal verbs), captures the surrounding sentence context, and retrieves in-context definitions, Pinyin, and semantic breakdowns.
- **Flashcard Capture** — Pressing `[S]` (or the configured shortcut) saves the active word, its pronunciation, and the source sentence context directly to the user's flashcard collection.

---

## Installation and Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Ajouras/Chinese-Reader-Gu.git
cd Chinese-Reader-Gu
```

### 2. Prerequisites

Ensure that **Node.js** (version 18 or later) and **npm** are installed:

```bash
node -v
npm -v
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables (Optional)

The application includes an embedded offline lexicon and translation pipeline that operates independently of any third-party API key.

To enable the optional server-side **Gemini AI deck analysis and nuance auditing** feature:

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Provide a Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 5. Automated Launcher

Once dependencies are installed, the provided launch script starts the server and opens the application in the default browser:

- **macOS / Linux / WSL**
  ```bash
  ./start.sh
  ```

- **Windows**
  ```cmd
  start.bat
  ```

### 6. Development Server

To start the development server manually:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`.

### 7. Production Build

To compile and run the production build:

```bash
# Build client assets and server bundle
npm run build

# Start the production server
npm start
```

---

## Core Capabilities

- **Offline Morphological Parsing** — Identifies single characters, two-character words, three-character compounds, and four-character idioms without layout shift.
- **Contextual Definition Engine** — Combines targeted word lookups with full-sentence context resolution.
- **Zero-Dependency Core** — Provides immediate translation, segmentation, and Pinyin generation without reliance on mandatory external services.
- **Spaced Repetition System** — Implements SuperMemo-2 (SM-2) scheduling with interval expansion, grade-based adjustments, and mastery categorization.
- **Bidirectional Reading Modes** — Supports both Chinese-to-English and English-to-Chinese reading environments.

---

## Command Reference

| Command | Description |
|---|---|
| `npm run dev` | Starts the Express server with Vite middleware on port 3000. |
| `npm run build` | Compiles the frontend to `dist/` and the backend bundle to `dist/server.cjs`. |
| `npm run start` | Launches the standalone production server. |
| `npm run lint` | Runs TypeScript compilation checks across the codebase. |
