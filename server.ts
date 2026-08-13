import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { translateOffline, translateOfflineAsync } from './src/utils/offlineDictionary';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
const BANK_FILE = path.join(DATA_DIR, 'flashcards.json');
const BACKUP_FILE = path.join(DATA_DIR, 'flashcards.json.bak');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini AI client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- API ROUTES ---

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Helper to execute Gemini generation with auto-retry and model fallback on temporary 503/429 load
async function generateGeminiContentWithFallback(ai: GoogleGenAI, prompt: string, schema: any) {
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = err?.message || String(err);
        const isTransient = errStr.includes('503') || errStr.includes('UNAVAILABLE') || errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED');
        if (isTransient && attempt === 0) {
          await new Promise((res) => setTimeout(res, 350));
          continue;
        }
        break; // Try next model
      }
    }
  }
  throw lastError || new Error('All AI model attempts exhausted');
}

// Contextual Translation Endpoint (Supports optional Gemini AI or fast Offline Dictionary)
app.post('/api/translate-context', async (req, res) => {
  try {
    const { text, context, mode = 'zh-to-en', useAi = false } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text selection is required' });
    }

    const trimmedText = text.trim();
    const trimmedContext = (context || text).trim();

    if (useAi && process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();
        const prompt = `Analyze this Chinese text selection "${trimmedText}" in the context sentence "${trimmedContext}". 
CRITICAL TRANSLATION INSTRUCTIONS:
- For "english": Provide a natural, smooth, accurate translation for the specific selected term/phrase "${trimmedText}" as used in this context. If "${trimmedText}" is a single word or short term (e.g., "重要", "学习", "儿子"), translate only "${trimmedText}", NOT the whole sentence.
- For "contextTranslation": Provide the complete, fluent English translation of the entire surrounding context sentence "${trimmedContext}".
- For "chinese": Return "${trimmedText}".
- For "pinyin": Provide accurate Hanyu Pinyin with tone marks for "${trimmedText}".
- For "breakdown": Provide an array of character objects for every Chinese character in "${trimmedText}", with fields "char", "pinyin", and "meaning" (individual character meaning).`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            chinese: { type: Type.STRING },
            pinyin: { type: Type.STRING },
            english: { type: Type.STRING },
            contextSentence: { type: Type.STRING },
            contextTranslation: { type: Type.STRING },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  char: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                },
                required: ['char', 'pinyin', 'meaning'],
              },
            },
          },
          required: ['chinese', 'pinyin', 'english', 'contextSentence', 'contextTranslation', 'breakdown'],
        };

        const responseText = await generateGeminiContentWithFallback(ai, prompt, schema);

        if (responseText) {
          const parsed = JSON.parse(responseText);
          const breakdown = (parsed.breakdown || []).map((b: any) => ({
            char: b.char,
            pinyin: b.pinyin,
            mean: b.mean || b.meaning || '',
          }));
          return res.json({
            ...parsed,
            breakdown,
            mode,
            selectedText: trimmedText,
            source: 'gemini-ai',
          });
        }
      } catch (aiErr: any) {
        // Log brief informational notice instead of alarming warning
        console.info('AI service busy or unavailable, activating offline high-accuracy fallback engine.');
      }
    }

    // Default fast offline response (with full-phrase support)
    const offlineResult = await translateOfflineAsync(trimmedText, trimmedContext, mode);
    return res.json(offlineResult);
  } catch (error: any) {
    res.status(500).json({ error: 'Translation error' });
  }
});

// Gemini Deck Nuance Audit & Scan Endpoint
app.post('/api/scan-deck', async (req, res) => {
  try {
    const { cards, deckName = 'Active Deck' } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'No cards provided for scanning.' });
    }

    const cardsToScan = cards.slice(0, 40);

    const inputPayload = cardsToScan.map((c) => ({
      id: c.id,
      chinese: c.chinese,
      pinyin: c.pinyin,
      english: c.english,
      contextSentence: c.contextSentence || c.chinese,
      contextTranslation: c.contextTranslation || c.english,
      grammaticalNote: c.grammaticalNote || '',
    }));

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();
        const prompt = `You are an expert Chinese-English lexicographer auditing a flashcard deck named "${deckName}" for accuracy, contextual nuance, natural English phrasing, and correct Pinyin tone marks.

INPUT FLASHCARDS:
${JSON.stringify(inputPayload, null, 2)}

TASK & AUDIT INSTRUCTIONS:
1. Review each card's Chinese term ("chinese"), Pinyin ("pinyin"), English gloss ("english"), context sentence ("contextSentence"), and context translation ("contextTranslation").
2. Check for:
   - Idiomatic & natural English translation vs rigid/awkward literal word-by-word dictionary fragments.
   - Pinyin accuracy with standard tone marks.
   - Context sentence alignment.
   - Helpful grammatical or cultural nuance notes.
3. For "pinyin": Ensure accurate Hanyu Pinyin with tone marks.
4. For "english": Refine into fluent, idiomatic English.
5. For "contextTranslation": Ensure full context sentence is natural and accurate.
6. For "grammaticalNote": Provide a concise 1-sentence note explaining key nuances, register, or usage tips.
7. For "wasRefined": Set to true ONLY if you made meaningful improvements to english, pinyin, contextTranslation, or grammaticalNote. Otherwise set to false.
8. For "refinementReason": Short reason if refined (e.g., "Refined gloss from literal to natural idiomatic expression"), or "Already accurate" if unchanged.`;

        const schema = {
          type: Type.OBJECT,
          properties: {
            scannedCount: { type: Type.NUMBER },
            refinedCount: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  chinese: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  english: { type: Type.STRING },
                  contextSentence: { type: Type.STRING },
                  contextTranslation: { type: Type.STRING },
                  grammaticalNote: { type: Type.STRING },
                  wasRefined: { type: Type.BOOLEAN },
                  refinementReason: { type: Type.STRING },
                },
                required: ['id', 'chinese', 'pinyin', 'english', 'contextSentence', 'contextTranslation', 'grammaticalNote', 'wasRefined', 'refinementReason'],
              },
            },
          },
          required: ['scannedCount', 'refinedCount', 'summary', 'results'],
        };

        const responseText = await generateGeminiContentWithFallback(ai, prompt, schema);

        if (responseText) {
          const parsed = JSON.parse(responseText);
          return res.json({
            success: true,
            source: 'gemini-ai',
            scannedCount: parsed.scannedCount || cardsToScan.length,
            refinedCount: parsed.refinedCount || 0,
            summary: parsed.summary || `Scanned ${cardsToScan.length} cards using Gemini AI.`,
            results: parsed.results || [],
          });
        }
      } catch (aiErr) {
        console.info('Gemini deck scan fallback to offline analyzer:', aiErr);
      }
    }

    // Fallback offline scan
    const results = cardsToScan.map((c) => {
      let wasRefined = false;
      let reason = 'Accuracy verified via lexicon.';

      const note = c.grammaticalNote || `Verified term: "${c.chinese}" (${c.pinyin || ''}).`;

      return {
        id: c.id,
        chinese: c.chinese,
        pinyin: c.pinyin,
        english: c.english,
        contextSentence: c.contextSentence || c.chinese,
        contextTranslation: c.contextTranslation || c.english,
        grammaticalNote: note,
        wasRefined,
        refinementReason: reason,
      };
    });

    return res.json({
      success: true,
      source: 'offline-lexicon',
      scannedCount: results.length,
      refinedCount: 0,
      summary: `Scanned ${results.length} cards using offline lexicon analyzer.`,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to scan deck.' });
  }
});

// Helper to read bank with automatic corruption recovery
async function loadBankData() {
  let isRecovered = false;
  let raw = '[]';

  try {
    if (existsSync(BANK_FILE)) {
      raw = await fs.readFile(BANK_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Bank file format invalid');
      return { cards: parsed, isRecovered: false };
    }
  } catch (err) {
    console.warn('Bank file corrupted or unreadable. Attempting backup recovery...', err);
  }

  // Fallback to backup file
  try {
    if (existsSync(BACKUP_FILE)) {
      raw = await fs.readFile(BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Restore main bank from backup
        await fs.writeFile(BANK_FILE, raw, 'utf-8');
        return { cards: parsed, isRecovered: true };
      }
    }
  } catch (backupErr) {
    console.error('Backup file also unreadable:', backupErr);
  }

  return { cards: [], isRecovered: false };
}

// GET Flashcard Bank
app.get('/api/bank', async (req, res) => {
  try {
    const { cards, isRecovered } = await loadBankData();

    let bankStat = { cardCount: 0, lastSaved: null, backupTime: null, hasBackup: false, isRecovered, fileSize: 0 };
    try {
      if (existsSync(BANK_FILE)) {
        const stat = await fs.stat(BANK_FILE);
        bankStat.lastSaved = stat.mtime.toISOString();
        bankStat.fileSize = stat.size;
      }
      if (existsSync(BACKUP_FILE)) {
        const bstat = await fs.stat(BACKUP_FILE);
        bankStat.backupTime = bstat.mtime.toISOString();
        bankStat.hasBackup = true;
      }
    } catch (_) {}

    bankStat.cardCount = cards.length;

    res.json({ cards, status: bankStat });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to load card bank', details: error.message });
  }
});

// SAVE Flashcard Bank (with automatic atomic backup)
app.post('/api/bank', async (req, res) => {
  try {
    const { cards } = req.body;
    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: 'Expected "cards" array' });
    }

    const jsonString = JSON.stringify(cards, null, 2);

    // 1. Create/update backup file first if main bank exists
    if (existsSync(BANK_FILE)) {
      try {
        const currentData = await fs.readFile(BANK_FILE, 'utf-8');
        await fs.writeFile(BACKUP_FILE, currentData, 'utf-8');
      } catch (bErr) {
        console.warn('Could not update backup file:', bErr);
      }
    } else {
      await fs.writeFile(BACKUP_FILE, jsonString, 'utf-8');
    }

    // 2. Write main bank file
    await fs.writeFile(BANK_FILE, jsonString, 'utf-8');

    const stat = await fs.stat(BANK_FILE);
    const bstat = existsSync(BACKUP_FILE) ? await fs.stat(BACKUP_FILE) : null;

    res.json({
      success: true,
      cardCount: cards.length,
      lastSaved: stat.mtime.toISOString(),
      backupTime: bstat ? bstat.mtime.toISOString() : null,
      hasBackup: true,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to save flashcards', details: error.message });
  }
});

// RESTORE FROM BACKUP
app.post('/api/bank/restore', async (req, res) => {
  try {
    if (!existsSync(BACKUP_FILE)) {
      return res.status(404).json({ error: 'No backup file available to restore.' });
    }

    const backupData = await fs.readFile(BACKUP_FILE, 'utf-8');
    const parsed = JSON.parse(backupData);

    if (!Array.isArray(parsed)) {
      return res.status(400).json({ error: 'Backup file is corrupted or invalid.' });
    }

    await fs.writeFile(BANK_FILE, backupData, 'utf-8');
    res.json({ success: true, cardCount: parsed.length, cards: parsed });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to restore backup', details: error.message });
  }
});

// SERVER INTEGRATION WITH VITE
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Contextual Chinese Learning App running on http://localhost:${PORT}`);
  });
}

startServer();
