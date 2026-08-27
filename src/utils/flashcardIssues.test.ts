import { describe, it, expect } from 'vitest';
import { calculateNextReview, getPreviewInterval } from './srsAlgorithm';
import { Flashcard, Deck, TranslationResult } from '../types';

describe('Flashcard & Deck System Issue Tests', () => {
  const card1: Flashcard = {
    id: 'card-1',
    chinese: '电脑',
    pinyin: 'diàn nǎo',
    english: 'computer',
    contextSentence: '我买了一台新电脑。',
    contextTranslation: 'I bought a new computer.',
    tags: ['Tech'],
    deckId: 'main',
    dateAdded: new Date().toISOString(),
    interval: 10,
    easeFactor: 2.5,
    repetitions: 2,
    state: 'review',
  };

  it('calculates "Hard" rating interval growth and ease penalty without resetting progress', () => {
    // Grade Hard 1st time
    const afterHard1 = calculateNextReview(card1, 'hard');
    expect(afterHard1.repetitions).toBe(3);
    expect(afterHard1.interval).toBe(12);
    expect(afterHard1.easeFactor).toBe(2.35);

    // Grade Hard 2nd time in a row
    const cardAfterHard1: Flashcard = {
      ...card1,
      interval: afterHard1.interval,
      easeFactor: afterHard1.easeFactor,
      repetitions: afterHard1.repetitions,
    };
    const afterHard2 = calculateNextReview(cardAfterHard1, 'hard');
    expect(afterHard2.repetitions).toBe(4);
    expect(afterHard2.interval).toBe(14);
    expect(afterHard2.easeFactor).toBe(2.20);

    // Verify preview interval matches exact calculation
    expect(getPreviewInterval(card1, 'hard')).toBe(afterHard1.interval);
    expect(getPreviewInterval(card1, 'good')).toBe(25);
  });

  it('guards [S] shortcut save against not_found or empty translations', () => {
    function shouldAllowShortcutSave(translation: TranslationResult | null): boolean {
      return Boolean(translation && translation.status !== 'not_found' && (translation.chinese || translation.english));
    }

    const failedLookup: TranslationResult = {
      chinese: 'xyznonexistentword',
      pinyin: '',
      english: '',
      contextSentence: 'xyznonexistentword',
      contextTranslation: '',
      breakdown: [],
      mode: 'zh-to-en',
      selectedText: 'xyznonexistentword',
      status: 'not_found',
    };

    const successfulLookup: TranslationResult = {
      chinese: '学习',
      pinyin: 'xué xí',
      english: 'to study; to learn',
      contextSentence: '好好学习，天天向上。',
      contextTranslation: 'Study hard and make progress every day.',
      breakdown: [
        { char: '学', pinyin: 'xué', mean: 'learn' },
        { char: '习', pinyin: 'xí', mean: 'practice' },
      ],
      mode: 'zh-to-en',
      selectedText: '学习',
      status: 'success',
    };

    expect(shouldAllowShortcutSave(failedLookup)).toBe(false);
    expect(shouldAllowShortcutSave(successfulLookup)).toBe(true);
    expect(shouldAllowShortcutSave(null)).toBe(false);
  });

  it('maintains deck management integrity and referential safety on delete', () => {
    let testDecks: Deck[] = [
      { id: 'main', name: 'Main Deck', description: 'Default deck', createdAt: new Date().toISOString() },
      { id: 'news', name: 'News & Media', description: 'News words', createdAt: new Date().toISOString() },
    ];

    let testCards: Flashcard[] = [
      { ...card1, id: 'card-1', deckId: 'main' },
      { ...card1, id: 'card-2', deckId: 'news' },
    ];

    // 1. Create a custom deck
    const newDeckId = 'deck-custom-1';
    const newDeck: Deck = {
      id: newDeckId,
      name: 'Philosophy',
      description: 'Ancient philosophy terms',
      createdAt: new Date().toISOString(),
    };
    testDecks = [...testDecks, newDeck];
    testCards = [...testCards, { ...card1, id: 'card-3', deckId: newDeckId }];

    expect(testDecks.some((d) => d.id === newDeckId)).toBe(true);
    expect(testCards.find((c) => c.id === 'card-3')?.deckId).toBe(newDeckId);

    // 2. Rename custom deck
    testDecks = testDecks.map((d) => (d.id === newDeckId ? { ...d, name: 'Daoist Philosophy', description: 'Daoism terms' } : d));
    const renamedDeck = testDecks.find((d) => d.id === newDeckId);
    expect(renamedDeck?.name).toBe('Daoist Philosophy');
    expect(renamedDeck?.description).toBe('Daoism terms');

    // 3. Delete custom deck with referential safety
    function deleteDeckWithSafety(deckIdToDelete: string, currentDecks: Deck[], currentCards: Flashcard[]) {
      if (deckIdToDelete === 'main') {
        throw new Error('Cannot delete the default Main Deck.');
      }
      const updatedDecks = currentDecks.filter((d) => d.id !== deckIdToDelete);
      // Referential safety: Reassign cards from deleted deck to 'main'
      const updatedCards = currentCards.map((c) => (c.deckId === deckIdToDelete ? { ...c, deckId: 'main' } : c));
      return { updatedDecks, updatedCards };
    }

    const { updatedDecks, updatedCards } = deleteDeckWithSafety(newDeckId, testDecks, testCards);
    testDecks = updatedDecks;
    testCards = updatedCards;

    expect(testDecks.some((d) => d.id === newDeckId)).toBe(false);
    const reassignedCard = testCards.find((c) => c.id === 'card-3');
    expect(reassignedCard?.deckId).toBe('main');
    expect(testCards.length).toBe(3);

    // Attempt deleting 'main' deck should throw
    expect(() => deleteDeckWithSafety('main', testDecks, testCards)).toThrow('Cannot delete the default Main Deck.');
  });
});

