import { Flashcard, CharacterBreakdown } from '../types';

export interface ScannedCardResult {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  breakdown?: CharacterBreakdown[];
  contextSentence?: string;
  contextTranslation?: string;
  grammaticalNote?: string;
  wasRefined?: boolean;
  refinementReason?: string;
  [key: string]: any; // Catch potential rogue fields
}

/**
 * Merges Gemini deck scan results into an existing flashcard with strict field whitelisting.
 *
 * STRICT REFINEMENT CONSTRAINT:
 * Only `chinese`, `pinyin`, `english`, `breakdown`, and `grammaticalNote` are permitted to be updated.
 * All other card fields (deckId, tags, dateAdded, lastReviewed, dueDate, interval, easeFactor, repetitions,
 * state, contextSentence, contextTranslation) remain strictly immutable.
 */
export function applyScannedCardRefinement(
  existingCard: Flashcard,
  result: ScannedCardResult | null | undefined
): Flashcard {
  if (!result || !result.wasRefined) {
    return existingCard;
  }

  return {
    ...existingCard,
    chinese: typeof result.chinese === 'string' && result.chinese.trim() ? result.chinese : existingCard.chinese,
    pinyin: typeof result.pinyin === 'string' ? result.pinyin : existingCard.pinyin,
    english: typeof result.english === 'string' && result.english.trim() ? result.english : existingCard.english,
    breakdown: Array.isArray(result.breakdown) && result.breakdown.length > 0 ? result.breakdown : existingCard.breakdown,
    grammaticalNote: typeof result.grammaticalNote === 'string' ? result.grammaticalNote : existingCard.grammaticalNote,
  };
}

/**
 * Merges batch scan results into the cards list, applying refinements only to cards
 * marked with `wasRefined === true` and strictly whitelisting allowed lexicographical fields.
 */
export function mergeScannedDeckResults(
  originalCards: Flashcard[],
  scanResults: ScannedCardResult[]
): Flashcard[] {
  if (!Array.isArray(scanResults) || scanResults.length === 0) {
    return originalCards;
  }

  const map = new Map<string, ScannedCardResult>(
    scanResults.map((r) => [r.id, r])
  );

  return originalCards.map((card) => {
    const scanned = map.get(card.id);
    if (!scanned) return card;
    return applyScannedCardRefinement(card, scanned);
  });
}
