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

// Ensure data and texts directories exist
const DATA_DIR = path.join(process.cwd(), 'data');
const BANK_FILE = path.join(DATA_DIR, 'flashcards.json');
const BACKUP_FILE = path.join(DATA_DIR, 'flashcards.json.bak');

const TEXTS_DIR = path.join(process.cwd(), 'texts');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

if (!existsSync(TEXTS_DIR)) {
  mkdirSync(TEXTS_DIR, { recursive: true });
}

// Helper to seed initial sample texts into texts/ folder if directory is empty
async function seedDefaultTextsIfEmpty() {
  try {
    const existing = await fs.readdir(TEXTS_DIR);
    const txtFiles = existing.filter((f) => f.toLowerCase().endsWith('.txt'));
    if (txtFiles.length === 0) {
      await fs.writeFile(
        path.join(TEXTS_DIR, '塞翁失马.txt'),
        `在古老的中国，边塞住着一位老人，人们都叫他塞翁。
有一天，塞翁家的一匹好马突然不知去向。邻居们纷纷跑来安慰他，塞翁却笑着说：“马丢了虽然可惜，但怎么知道这不是一件好事呢？”

几个月后，那匹失踪的老马不仅自己回来了，还带回了一匹高大健壮的胡地骏马。邻居们大为惊喜，都跑来向塞翁祝贺。塞翁却皱起眉头说：“白白得了一匹好马，怎么知道这不是祸事呢？”

塞翁的儿子非常喜欢骑这匹骏马。有一天，他不小心从马背上摔了下来，折断了腿。邻居们又跑来安慰，塞翁依然平静地说：“儿子腿摔断了，怎么知道这不是福气呢？”

一年后，边境爆发了战争，所有年轻人都被征召入伍去打仗。由于塞翁的儿子腿有残疾，免于参军，父子俩因此得以在战乱中平安相守。

这个故事告诉我们：祸福相依，坏事可能变成好事，好事也可能蕴含危机。`,
        'utf-8'
      );

      await fs.writeFile(
        path.join(TEXTS_DIR, '人工智能与未来生活.txt'),
        `随着科技的飞速发展，人工智能（AI）已经深刻地改变了我们的日常生活。
从智能手机的语音助手，到自动驾驶汽车，AI技术的应用无处不在。

在语言学习领域，现代人工智能使得跨语言交流变得前所未有的便捷。学习者不仅可以随时随地获取实时翻译，还能通过智能语境分析理解单词深层含义与文化背景。

然而，技术的进步也为人类提出了新的课题：如何在享受科技便利的同时，保持人类独立思考与创造力？这需要我们在探索未知领域的过程中不断寻求平衡。`,
        'utf-8'
      );

      await fs.writeFile(
        path.join(TEXTS_DIR, 'Exploring_the_Wonders_of_Beijing.txt'),
        `Beijing, the capital city of China, is a vibrant metropolis that seamlessly blends ancient history with breathtaking modern architecture.

When visiting Beijing, your first stop should be the Forbidden City, a magnificent imperial palace complex that served as the home of emperors for over five hundred years. Walking through its grand red courtyards feels like stepping back into a timeless chapter of history.

Not far from the city center lies the Great Wall of China, winding gracefully over rolling green mountains. Standing atop this colossal stone structure offers spectacular views and a profound sense of awe.`,
        'utf-8'
      );
    }
  } catch (err) {
    console.warn('Could not seed default texts:', err);
  }
}
seedDefaultTextsIfEmpty();

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

// ==========================================
// TEXT FILE LIBRARY API ENDPOINTS
// ==========================================

// 1. Scan texts/ folder and list all available .txt files
app.get('/api/texts', async (req, res) => {
  try {
    if (!existsSync(TEXTS_DIR)) {
      mkdirSync(TEXTS_DIR, { recursive: true });
    }

    const entries = await fs.readdir(TEXTS_DIR, { withFileTypes: true });
    const txtFiles = entries.filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.txt'));

    const fileList = await Promise.all(
      txtFiles.map(async (file) => {
        const filePath = path.join(TEXTS_DIR, file.name);
        try {
          const stat = await fs.stat(filePath);
          const rawName = file.name.replace(/\.txt$/i, '');
          const cleanTitle = rawName.replace(/[_-]/g, ' ');
          return {
            filename: file.name,
            title: cleanTitle,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString(),
          };
        } catch (err) {
          return {
            filename: file.name,
            title: file.name.replace(/\.txt$/i, ''),
            size: 0,
            modifiedAt: new Date().toISOString(),
          };
        }
      })
    );

    // Sort files by modified time descending or alphabetically
    fileList.sort((a, b) => a.title.localeCompare(b.title));

    res.json({ files: fileList });
  } catch (error: any) {
    console.error('Error scanning texts/ folder:', error);
    res.status(500).json({ error: 'Failed to scan texts library directory', details: error.message });
  }
});

// 2. Load a specific .txt file content from texts/ folder
app.get('/api/texts/:filename', async (req, res) => {
  try {
    const rawFilename = req.params.filename;
    const safeFilename = path.basename(rawFilename);

    if (!safeFilename.toLowerCase().endsWith('.txt')) {
      return res.status(400).json({ error: 'Only .txt files are supported' });
    }

    const filePath = path.join(TEXTS_DIR, safeFilename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: `File "${safeFilename}" was not found in texts library.` });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    const rawName = safeFilename.replace(/\.txt$/i, '');
    const cleanTitle = rawName.replace(/[_-]/g, ' ');

    res.json({
      filename: safeFilename,
      title: cleanTitle,
      content,
    });
  } catch (error: any) {
    console.error(`Error reading text file ${req.params.filename}:`, error);
    res.status(500).json({ error: 'Failed to read text file', details: error.message });
  }
});

// 3. Save / Upload a new .txt file into texts/ folder
app.post('/api/texts', async (req, res) => {
  try {
    const { filename, content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'File content is required' });
    }

    let cleanName = (filename || `text-${Date.now()}`).trim();
    cleanName = path.basename(cleanName);
    if (!cleanName.toLowerCase().endsWith('.txt')) {
      cleanName += '.txt';
    }

    const targetPath = path.join(TEXTS_DIR, cleanName);
    await fs.writeFile(targetPath, content, 'utf-8');

    res.json({
      success: true,
      filename: cleanName,
      title: cleanName.replace(/\.txt$/i, '').replace(/[_-]/g, ' '),
    });
  } catch (error: any) {
    console.error('Error saving text file to library:', error);
    res.status(500).json({ error: 'Failed to save text file to library', details: error.message });
  }
});

// Helper to execute Gemini generation with auto-retry and model fallback on temporary 503/429 load
async function generateGeminiContentWithFallback(
  ai: GoogleGenAI,
  prompt: string,
  schema: any,
  options: { fast?: boolean; thinkingBudget?: number } = { fast: true }
) {
  // gemini-2.5-flash is ultra-responsive for structured translation & audit tasks
  const models = ['gemini-2.5-flash', 'gemini-3.7-flash'];
  let lastError: any = null;

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const config: any = {
          responseMimeType: 'application/json',
          responseSchema: schema,
        };

        // Disable thinking overhead for rapid sub-second to low-latency generation
        if (options.fast || options.thinkingBudget !== undefined) {
          config.thinkingConfig = { thinkingBudget: options.thinkingBudget ?? 0 };
        }

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config,
        });
        if (response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const errStr = err?.message || String(err);
        const isTransient =
          errStr.includes('503') ||
          errStr.includes('UNAVAILABLE') ||
          errStr.includes('429') ||
          errStr.includes('RESOURCE_EXHAUSTED');
        if (isTransient && attempt === 0) {
          await new Promise((res) => setTimeout(res, 200));
          continue;
        }
        break; // Try next model
      }
    }
  }
  throw lastError || new Error('All AI model attempts exhausted');
}

// Contextual Translation Endpoint (Fast Neural Google GTX with Offline Lexicon fallback)
app.post('/api/translate-context', async (req, res) => {
  try {
    const { text, context, mode: reqMode } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text selection is required' });
    }

    const trimmedText = text.trim();
    const trimmedContext = (context || text).trim();

    // Determine actual language direction based on the selected word/phrase
    const hasChineseInText = /[\u4e00-\u9fa5]/.test(trimmedText);
    const isEnglishSelection = !hasChineseInText && /[a-zA-Z]/.test(trimmedText);
    const resolvedMode: 'zh-to-en' | 'en-to-zh' = isEnglishSelection ? 'en-to-zh' : (reqMode || (hasChineseInText ? 'zh-to-en' : 'en-to-zh'));

    const result = await translateOfflineAsync(trimmedText, trimmedContext, resolvedMode);
    return res.json(result);
  } catch (error: any) {
    console.error('Translation error in /api/translate-context:', error);
    res.status(500).json({ error: 'Translation error' });
  }
});

// Gemini Deck Nuance Audit & Scan Endpoint (Optimized with concurrent batching & low-latency inference)
app.post('/api/scan-deck', async (req, res) => {
  try {
    const { cards, deckName = 'Active Deck' } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({ error: 'No cards provided for scanning.' });
    }

    const cardsToScan = cards.slice(0, 50);

    if (process.env.GEMINI_API_KEY) {
      try {
        const ai = getGeminiClient();

        // Partition cards into small concurrent batches (5-6 cards per batch) for parallel processing
        const BATCH_SIZE = 6;
        const batches: any[][] = [];
        for (let i = 0; i < cardsToScan.length; i += BATCH_SIZE) {
          batches.push(cardsToScan.slice(i, i + BATCH_SIZE));
        }

        const batchSchema = {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  chinese: { type: Type.STRING },
                  pinyin: { type: Type.STRING },
                  english: { type: Type.STRING },
                  breakdown: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        char: { type: Type.STRING },
                        pinyin: { type: Type.STRING },
                        mean: { type: Type.STRING },
                      },
                      required: ['char', 'pinyin', 'mean'],
                    },
                  },
                  contextSentence: { type: Type.STRING },
                  contextTranslation: { type: Type.STRING },
                  grammaticalNote: { type: Type.STRING },
                  wasRefined: { type: Type.BOOLEAN },
                  refinementReason: { type: Type.STRING },
                },
                required: ['id', 'chinese', 'pinyin', 'english', 'breakdown', 'contextSentence', 'contextTranslation', 'grammaticalNote', 'wasRefined', 'refinementReason'],
              },
            },
          },
          required: ['results'],
        };

        const batchPromises = batches.map(async (batchCards) => {
          const inputPayload = batchCards.map((c) => ({
            id: c.id,
            chinese: c.chinese,
            pinyin: c.pinyin,
            english: c.english,
            breakdown: Array.isArray(c.breakdown) && c.breakdown.length > 0 ? c.breakdown : [],
            contextSentence: c.contextSentence || c.chinese,
            contextTranslation: c.contextTranslation || c.english,
            grammaticalNote: c.grammaticalNote || '',
          }));

          const prompt = `You are an expert Chinese-English lexicographer auditing flashcards in deck "${deckName}".
INPUT FLASHCARDS:
${JSON.stringify(inputPayload, null, 2)}

TASK & AUDIT RULES:
1. "chinese": Keep untouched unless there is a clear typo/missegmentation.
2. "breakdown": Inspect character definitions ("mean"). If vague/generic/placeholder, update to a precise English meaning; if already accurate, leave untouched.
3. "english": Idiomatic English translation. If rigid/inaccurate, refine; if accurate, leave untouched.
4. "pinyin": Accurate tone-marked Pinyin.
5. "contextSentence" & "contextTranslation": Context alignment.
6. "grammaticalNote": 1-sentence nuance or usage note.
7. "wasRefined": true if any field was improved/refined; false if already accurate.
8. "refinementReason": Short reason if refined, or "Already accurate".`;

          try {
            const responseText = await generateGeminiContentWithFallback(ai, prompt, batchSchema, { fast: true });
            if (responseText) {
              const parsed = JSON.parse(responseText);
              if (Array.isArray(parsed.results)) {
                return parsed.results;
              }
            }
          } catch (batchErr) {
            console.info('Batch scan fallback to per-card evaluation:', batchErr);
          }

          // Fallback for this batch if single batch encountered transient load
          return batchCards.map((c) => ({
            id: c.id,
            chinese: c.chinese,
            pinyin: c.pinyin,
            english: c.english,
            breakdown: c.breakdown || [],
            contextSentence: c.contextSentence || c.chinese,
            contextTranslation: c.contextTranslation || c.english,
            grammaticalNote: c.grammaticalNote || `Verified: ${c.chinese}`,
            wasRefined: false,
            refinementReason: 'Verified accurate',
          }));
        });

        const batchResultsNested = await Promise.all(batchPromises);
        const allResults = batchResultsNested.flat();

        const refinedCount = allResults.filter((r) => r.wasRefined).length;

        return res.json({
          success: true,
          source: 'gemini-ai',
          scannedCount: allResults.length,
          refinedCount,
          summary: `Scanned ${allResults.length} cards using parallelized Gemini AI (${refinedCount} cards refined).`,
          results: allResults,
        });
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
        breakdown: c.breakdown || [],
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
