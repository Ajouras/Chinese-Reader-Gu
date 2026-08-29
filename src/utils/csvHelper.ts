import { Flashcard } from '../types';

export interface ImportResult {
  importedCards: Flashcard[];
  importedCount: number;
  skippedCount: number;
  skippedReasons: string[];
}

/**
 * Splits a CSV line handling quotes and escaped quotes (RFC 4180).
 */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current);
  return result;
}

/**
 * Parses a full CSV text string into rows of column strings.
 * Handles multi-line quotes properly.
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  let currentRow: string[] = [];
  let buffer = '';
  let inQuotes = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    if (inQuotes) {
      buffer += '\n' + line;
    } else {
      buffer = line;
    }

    // Count non-escaped quote parity
    let quoteCount = 0;
    for (let c = 0; c < buffer.length; c++) {
      if (buffer[c] === '"') {
        quoteCount++;
      }
    }

    // If even number of quotes, row is complete
    if (quoteCount % 2 === 0) {
      if (buffer.trim().length > 0) {
        rows.push(parseCSVLine(buffer));
      }
      buffer = '';
      inQuotes = false;
    } else {
      inQuotes = true;
    }
  }

  if (buffer.trim().length > 0) {
    rows.push(parseCSVLine(buffer));
  }

  return rows;
}

/**
 * Generates CSV string matching existing export structure:
 * Headers: Chinese,Pinyin,English,ContextSentence,Tags,ContextTranslation,DeckId
 */
export function generateFlashcardsCSV(cards: Flashcard[]): string {
  const headers = ['Chinese', 'Pinyin', 'English', 'ContextSentence', 'Tags', 'ContextTranslation', 'DeckId'];
  const rows = cards.map((c) => [
    `"${(c.chinese || '').replace(/"/g, '""')}"`,
    `"${(c.pinyin || '').replace(/"/g, '""')}"`,
    `"${(c.english || '').replace(/"/g, '""')}"`,
    `"${(c.contextSentence || '').replace(/"/g, '""')}"`,
    `"${(c.tags || []).join(',')}"`,
    `"${(c.contextTranslation || '').replace(/"/g, '""')}"`,
    `"${(c.deckId || 'main').replace(/"/g, '""')}"`,
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Imports Flashcards from CSV matching the export columns:
 * Supports headers: Chinese, Pinyin, English, ContextSentence, Tags, ContextTranslation, DeckId
 * (Also case-insensitive and positional fallback if no headers).
 * 
 * Strict requirements:
 * 1. Fresh id, dateAdded, and default SRS fields (interval: 1, easeFactor: 2.5, repetitions: 0, state: 'new').
 * 2. Skips rows missing chinese or english.
 * 3. Fallback to 'main' deck if deckId not in existing deck IDs.
 */
export function parseFlashcardsFromCSV(
  csvText: string,
  existingDeckIds: string[] = ['main']
): ImportResult {
  const rows = parseCSV(csvText);
  if (rows.length === 0) {
    return {
      importedCards: [],
      importedCount: 0,
      skippedCount: 0,
      skippedReasons: ['Empty CSV file.'],
    };
  }

  const validDeckSet = new Set(existingDeckIds.length > 0 ? existingDeckIds : ['main']);
  validDeckSet.add('main');

  let headerRowIndex = -1;
  let colMap: Record<string, number> = {};

  // Check if first row contains headers
  const firstRow = rows[0].map((c) => c.trim().toLowerCase());
  const hasHeaderKeywords = firstRow.some((c) =>
    ['chinese', 'hanzi', 'english', 'pinyin', 'contextsentence', 'tags', 'deckid'].includes(c)
  );

  if (hasHeaderKeywords) {
    headerRowIndex = 0;
    firstRow.forEach((col, idx) => {
      if (col === 'chinese' || col === 'hanzi' || col === 'word') colMap['chinese'] = idx;
      else if (col === 'pinyin') colMap['pinyin'] = idx;
      else if (col === 'english' || col === 'meaning' || col === 'definition') colMap['english'] = idx;
      else if (col === 'contextsentence' || col === 'context' || col === 'sentence') colMap['contextSentence'] = idx;
      else if (col === 'tags' || col === 'tag') colMap['tags'] = idx;
      else if (col === 'contexttranslation' || col === 'translation') colMap['contextTranslation'] = idx;
      else if (col === 'deckid' || col === 'deck') colMap['deckId'] = idx;
    });
  } else {
    // Positional default matching standard export:
    // 0: Chinese, 1: Pinyin, 2: English, 3: ContextSentence, 4: Tags, 5: ContextTranslation, 6: DeckId
    colMap = {
      chinese: 0,
      pinyin: 1,
      english: 2,
      contextSentence: 3,
      tags: 4,
      contextTranslation: 5,
      deckId: 6,
    };
  }

  const importedCards: Flashcard[] = [];
  const skippedReasons: string[] = [];
  let skippedCount = 0;

  const startIndex = headerRowIndex >= 0 ? headerRowIndex + 1 : 0;

  for (let i = startIndex; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) {
      continue; // Skip blank line
    }

    const chinese = (colMap['chinese'] !== undefined ? row[colMap['chinese']] : row[0] || '').trim();
    const english = (colMap['english'] !== undefined ? row[colMap['english']] : row[2] || '').trim();
    const pinyin = (colMap['pinyin'] !== undefined ? row[colMap['pinyin']] : row[1] || '').trim();
    const contextSentence = (colMap['contextSentence'] !== undefined ? row[colMap['contextSentence']] : row[3] || '').trim();
    const tagsRaw = (colMap['tags'] !== undefined ? row[colMap['tags']] : row[4] || '').trim();
    const contextTranslation = (colMap['contextTranslation'] !== undefined ? row[colMap['contextTranslation']] : row[5] || '').trim();
    const deckIdRaw = (colMap['deckId'] !== undefined ? row[colMap['deckId']] : row[6] || '').trim();

    // Validation: Require chinese and english
    if (!chinese || !english) {
      skippedCount++;
      skippedReasons.push(`Row ${i + 1}: Skipped (missing required ${!chinese ? 'Chinese' : 'English'} field)`);
      continue;
    }

    // Deck safety check: if deckId doesn't exist, fallback to 'main'
    const finalDeckId = deckIdRaw && validDeckSet.has(deckIdRaw) ? deckIdRaw : 'main';

    // Tags parsing
    const parsedTags = tagsRaw
      ? tagsRaw
          .split(/[,;]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : ['imported'];

    const newCard: Flashcard = {
      id: `card-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-${i}`,
      chinese,
      pinyin: pinyin || chinese,
      english,
      contextSentence: contextSentence || chinese,
      contextTranslation: contextTranslation || english,
      tags: parsedTags.length > 0 ? parsedTags : ['imported'],
      deckId: finalDeckId,
      dateAdded: new Date().toISOString(),
      // SRS fields initialized fresh (do NOT trust SRS state from CSV)
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      state: 'new',
    };

    importedCards.push(newCard);
  }

  return {
    importedCards,
    importedCount: importedCards.length,
    skippedCount,
    skippedReasons,
  };
}
