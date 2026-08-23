# Chinese Reader GU

An interactive, brutalist-styled Chinese-English contextual reader with offline dictionary support, intelligent multi-character hover detection, Pinyin breakdowns, flashcard deck manager, and SRS (Spaced Repetition System) review.

---

## 📚 Text File Library (`texts/`)

The application includes an automated **Text File Library**:

1. Place any valid `.txt` file inside the `texts/` folder.
2. Open or refresh the application. All `.txt` files in `texts/` are scanned and listed in the reading material selector.
3. Select any text file to load it directly into the reader.
4. You can also import or add `.txt` files directly via the **"Add .txt File"** button in the reader toolbar, which automatically saves them to `texts/`.

---

## 🎯 Click-to-Translate Interaction Model

- **Hover**: Moving your cursor over text identifies and highlights the target character or word with an interaction preview. Mouse movement **never** triggers translation requests or network calls.
- **Click**: Clicking any highlighted word triggers the phrase detection system (resolving multi-character Chinese compounds/idioms like `解决`/`塞翁失马` or English phrasal verbs like `take care of`), extracts the surrounding sentence context, and displays the in-context definition, Pinyin, and breakdown.
- **Flashcard Saving**: Press `[S]` (or your configured shortcut key) to immediately save the selected word, Pinyin, and context sentence to your flashcard deck.

---

## 🚀 Installation & Setup via GitHub

### 1. Clone the Repository

Open your terminal or command prompt and clone the repository to your local machine:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git
cd YOUR_REPOSITORY_NAME
```

*(Replace `YOUR_USERNAME/YOUR_REPOSITORY_NAME` with your actual GitHub repository URL).*

---

### 2. Prerequisites

Ensure you have **Node.js** (version 18 or higher) and **npm** installed on your system:

```bash
node -v
npm -v
```

If Node.js is not installed, download the LTS release from [nodejs.org](https://nodejs.org/).

---

### 3. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
```

---

### 4. Configure Environment Variables (Optional)

The application includes a fully functional **offline lexical engine** that requires no API keys.

If you wish to enable the optional server-side **Gemini AI translation & grammar breakdown**:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` in your text editor and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

*(You can obtain a free API key from [Google AI Studio](https://aistudio.google.com/).)*

---

### 5. One-Click Launch (Auto-Open in Browser)

Once dependencies are installed via `npm install`, you can run the launcher script which boots the server and automatically pops open the app in your default browser:

- **macOS / Linux / WSL**:
  ```bash
  ./start.sh
  ```
  *(or double-click `start.sh`)*

- **Windows**:
  Double-click `start.bat` or run:
  ```cmd
  start.bat
  ```

---

### 6. Standard Manual Run (Optional)

Alternatively, start the server directly via npm and navigate manually to `http://localhost:3000`:

```bash
npm run dev
```

---

### 7. Production Build & Deployment

To generate an optimized production build and start the standalone server:

```bash
# Build the client bundle & server executable
npm run build

# Start the production server
npm start
```

---

## 🛠 Features

- **Intelligent Offline Detection**: Automatically identifies single-character words, 2-character words, 3-character compounds, and 4-character idioms on hover with zero layout shift.
- **Contextual Translation**: Provides accurate translations for selected words alongside whole-sentence context translation.
- **Zero Configuration Required**: Instant translation and Pinyin without external network calls or cloud dependencies.
- **SRS Flashcards**: Save vocabulary and review using an SM-2 spaced repetition algorithm.
- **Bi-directional Support**: Supports both Chinese-to-English and English-to-Chinese reading modes.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the full-stack server with Vite middleware on port 3000 |
| `npm run build` | Compiles the frontend to `dist/` and backend bundle to `dist/server.cjs` |
| `npm run start` | Launches the compiled production application |
| `npm run lint` | Runs TypeScript type checking without emitting files |
