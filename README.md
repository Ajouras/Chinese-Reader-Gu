# Chinese Reader GU

A high-contrast, responsive Chinese-English contextual reader featuring an integrated offline dictionary, multi-character linguistic detection, Pinyin decomposition, flashcard deck management, and Spaced Repetition System (SRS) review workflows.

---

> ### Vibecode Warning
>
> This codebase was generated and refined in collaboration with AI systems through iterative, vibe-driven prompt engineering. While fully typed in TypeScript and backed by automated regression and integration test suites, components and utilities reflect a prompt-driven development workflow. Review, test, and adapt the code as appropriate before utilizing it in mission-critical production environments.

---

## Text File Library (`texts/`)

The application includes an automated local text file ingestion pipeline:

1. Place any valid `.txt` file inside the `texts/` directory.
2. Launch or refresh the application. All `.txt` files within `texts/` are indexed and displayed in the reading material selector.
3. Select a text file to load it into the interactive reader interface.
4. Additional `.txt` files can also be imported using the **"Add .txt File"** interface control in the reader toolbar, which writes them directly to `texts/`.

---

## Interaction Model

- **Hover Inspection**: Hovering the cursor over text highlights target characters or compound words with non-disruptive visual feedback. Hover actions perform no network requests or translation calls.
- **Contextual Selection**: Clicking a highlighted word initiates phrase detection (resolving multi-character Chinese compounds, idioms, or English phrasal verbs), captures surrounding sentence context, and retrieves in-context definitions, Pinyin, and semantic breakdowns.
- **Flashcard Capture**: Pressing `[S]` (or the configured shortcut) saves the active word, pronunciation, and source sentence context directly to your flashcard collection.

---

## Installation & Setup

### 1. Clone the Repository

Clone the repository to your local system:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

### 2. Prerequisites

Ensure **Node.js** (version 18 or higher) and **npm** are installed:

```bash
node -v
npm -v
```

### 3. Install Dependencies

Install all required project dependencies:

```bash
npm install
```

### 4. Configure Environment Variables (Optional)

The application includes an embedded offline lexicon and translation pipeline that operates independently of third-party API keys.

To enable optional server-side **Gemini AI deck analysis and nuance auditing**:

1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Specify your Gemini API key in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

### 5. Automated Launcher

After installing dependencies, the provided launch script starts the server and opens the application in your default browser:

- **macOS / Linux / WSL**:
  ```bash
  ./start.sh
  ```

- **Windows**:
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

To compile and execute the production build:

```bash
# Build client assets and server bundle
npm run build

# Start production server
npm start
```

---

## Core Capabilities

- **Offline Morphological Parsing**: Identifies single characters, 2-character words, 3-character compounds, and 4-character idioms with zero layout shift.
- **Contextual Definition Engine**: Combines target word lookups with full-sentence context resolution.
- **Zero-Dependency Core**: Immediate translation, segmentation, and Pinyin generation without mandatory external services.
- **Spaced Repetition System**: SuperMemo-2 (SM-2) scheduling with interval expansion, grade adjustments, and mastery categorization.
- **Bidirectional Reading Modes**: Supports Chinese-to-English and English-to-Chinese reading environments.

---

## Command Reference

| Command | Description |
|---|---|
| `npm run dev` | Starts the Express server with Vite middleware on port 3000 |
| `npm run build` | Compiles the frontend to `dist/` and backend bundle to `dist/server.cjs` |
| `npm run start` | Launches the standalone production server |
| `npm run lint` | Runs TypeScript compilation checks across the codebase |
