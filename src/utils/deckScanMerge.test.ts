import { describe, it, expect } from 'vitest';
import { applyScannedCardRefinement, mergeScannedDeckResults, ScannedCardResult } from './deckScanMerge';
import { Flashcard } from '../types';

describe('Gemini Deck Scan Merge & Rogue Field Whitelist Hardening', () => {
  const originalCard: Flashcard = {
    id: 'card-123',
    chinese: '电脑',
    pinyin: 'diàn nǎo',
    english: 'computer',
    contextSentence: '我买了一台新电脑。',
    contextTranslation: 'I bought a new computer.',
    grammaticalNote: 'Original note',
    breakdown: [
      { char: '电', pinyin: 'diàn', mean: 'electric' },
      { char: '脑', pinyin: 'nǎo', mean: 'brain' },
    ],
    tags: ['tech', 'hardware'],
    deckId: 'main-deck',
    dateAdded: '2026-01-01T00:00:00.000Z',
    lastReviewed: '2026-02-01T00:00:00.000Z',
    dueDate: '2026-03-01T00:00:00.000Z',
    interval: 6,
    easeFactor: 2.5,
    repetitions: 3,
    state: 'review',
  };

  it('strictly updates only whitelisted fields (chinese, pinyin, english, breakdown, grammaticalNote) when wasRefined is true', () => {
    const scanResultWithRogueFields: ScannedCardResult = {
      id: 'card-123',
      chinese: '电脑',
      pinyin: 'diàn nǎo',
      english: 'electronic computer; PC',
      breakdown: [
        { char: '电', pinyin: 'diàn', mean: 'electricity / lightning' },
        { char: '脑', pinyin: 'nǎo', mean: 'brain / cerebrum' },
      ],
      grammaticalNote: 'Refined nuance: Compound of electric + brain.',
      wasRefined: true,
      refinementReason: 'Enhanced character definition depth',
      // ROGUE / ATTACK / SCHEMA POLLUTION FIELDS:
      deckId: 'hacked-deck-id',
      tags: ['hacked-tag'],
      interval: 999,
      easeFactor: 1.0,
      repetitions: 99,
      dueDate: '2099-01-01T00:00:00.000Z',
      state: 'mastered',
      dateAdded: '1970-01-01T00:00:00.000Z',
      lastReviewed: '1970-01-01T00:00:00.000Z',
      contextSentence: 'Rogue context sentence overwrite',
      contextTranslation: 'Rogue context translation overwrite',
    };

    const merged = applyScannedCardRefinement(originalCard, scanResultWithRogueFields);

    // 1. Whitelisted fields MUST be refined
    expect(merged.english).toBe('electronic computer; PC');
    expect(merged.grammaticalNote).toBe('Refined nuance: Compound of electric + brain.');
    expect(merged.breakdown?.[0].mean).toBe('electricity / lightning');
    expect(merged.breakdown?.[1].mean).toBe('brain / cerebrum');

    // 2. SRS & Metadata fields MUST NOT be altered
    expect(merged.deckId).toBe('main-deck');
    expect(merged.tags).toEqual(['tech', 'hardware']);
    expect(merged.interval).toBe(6);
    expect(merged.easeFactor).toBe(2.5);
    expect(merged.repetitions).toBe(3);
    expect(merged.state).toBe('review');
    expect(merged.dueDate).toBe('2026-03-01T00:00:00.000Z');
    expect(merged.dateAdded).toBe('2026-01-01T00:00:00.000Z');
    expect(merged.lastReviewed).toBe('2026-02-01T00:00:00.000Z');

    // 3. User context fields MUST NOT be overwritten by deck scan
    expect(merged.contextSentence).toBe('我买了一台新电脑。');
    expect(merged.contextTranslation).toBe('I bought a new computer.');
  });

  it('does NOT alter the card when wasRefined is false', () => {
    const unrefinedScanResult: ScannedCardResult = {
      id: 'card-123',
      chinese: '电脑',
      pinyin: 'diàn nǎo',
      english: 'different text',
      grammaticalNote: 'different note',
      wasRefined: false,
      refinementReason: 'Already accurate',
      interval: 999,
      deckId: 'rogue-deck',
    };

    const merged = applyScannedCardRefinement(originalCard, unrefinedScanResult);
    expect(merged).toEqual(originalCard);
  });

  it('demonstrates the pre-fix gap where unrefined cards and context were mutated', () => {
    // In pre-fix code:
    // const scanned = map.get(original.id);
    // if (scanned) {
    //   return {
    //     ...original,
    //     chinese: scanned.chinese || original.chinese,
    //     pinyin: scanned.pinyin || original.pinyin,
    //     english: scanned.english || original.english,
    //     breakdown: scanned.breakdown && scanned.breakdown.length > 0 ? scanned.breakdown : original.breakdown,
    //     contextSentence: scanned.contextSentence || original.contextSentence,
    //     contextTranslation: scanned.contextTranslation || original.contextTranslation,
    //     grammaticalNote: scanned.grammaticalNote || original.grammaticalNote,
    //   };
    // }

    const preFixMerge = (original: Flashcard, scanned: any): Flashcard => {
      if (scanned) {
        return {
          ...original,
          chinese: scanned.chinese || original.chinese,
          pinyin: scanned.pinyin || original.pinyin,
          english: scanned.english || original.english,
          breakdown: scanned.breakdown && scanned.breakdown.length > 0 ? scanned.breakdown : original.breakdown,
          contextSentence: scanned.contextSentence || original.contextSentence,
          contextTranslation: scanned.contextTranslation || original.contextTranslation,
          grammaticalNote: scanned.grammaticalNote || original.grammaticalNote,
        };
      }
      return original;
    };

    const unrefinedPayload = {
      id: 'card-123',
      chinese: '电脑',
      pinyin: 'diàn nǎo',
      english: 'computer',
      contextSentence: 'Gemini generated synthetic context',
      contextTranslation: 'Gemini generated synthetic translation',
      grammaticalNote: 'Verified accurate',
      wasRefined: false,
      refinementReason: 'Already accurate',
    };

    const preFixResult = preFixMerge(originalCard, unrefinedPayload);

    // Pre-fix OVERWROTE user context even when wasRefined === false!
    expect(preFixResult.contextSentence).toBe('Gemini generated synthetic context');
    expect(preFixResult.grammaticalNote).toBe('Verified accurate');

    // Post-fix PRESERVES original untouched:
    const postFixResult = applyScannedCardRefinement(originalCard, unrefinedPayload);
    expect(postFixResult.contextSentence).toBe('我买了一台新电脑。');
    expect(postFixResult.grammaticalNote).toBe('Original note');
  });

  it('merges a batch of cards accurately, ignoring missing or unrefined cards', () => {
    const card1 = { ...originalCard, id: 'c1', chinese: '水' };
    const card2 = { ...originalCard, id: 'c2', chinese: '火' };
    const card3 = { ...originalCard, id: 'c3', chinese: '木' };

    const scanResults: ScannedCardResult[] = [
      {
        id: 'c1',
        chinese: '水',
        pinyin: 'shuǐ',
        english: 'water; river / liquid',
        wasRefined: true,
        refinementReason: 'More comprehensive definition',
        interval: 1234, // rogue
      },
      {
        id: 'c2',
        chinese: '火',
        pinyin: 'huǒ',
        english: 'fire',
        wasRefined: false,
        refinementReason: 'Already accurate',
      },
      // c3 not in scanResults
    ];

    const results = mergeScannedDeckResults([card1, card2, card3], scanResults);

    expect(results[0].english).toBe('water; river / liquid');
    expect(results[0].interval).toBe(6); // Protected!

    expect(results[1].english).toBe(card2.english); // Untouched because wasRefined = false

    expect(results[2]).toEqual(card3); // Untouched because not in scan
  });
});
