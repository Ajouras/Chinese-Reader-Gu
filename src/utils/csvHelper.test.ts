import { describe, it, expect } from 'vitest';
import {
  parseCSV,
  parseCSVLine,
  generateFlashcardsCSV,
  parseFlashcardsFromCSV,
} from './csvHelper';
import { Flashcard } from '../types';

describe('CSV Helper - Flashcard Export & Import', () => {
  it('parses basic and quoted CSV lines correctly', () => {
    const line = '"塞翁失马","sài wēng shī mǎ","Blessing in disguise","在古老的中国，边塞住着一位老人。","proverb,hsk6"';
    const parsed = parseCSVLine(line);
    expect(parsed).toEqual([
      '塞翁失马',
      'sài wēng shī mǎ',
      'Blessing in disguise',
      '在古老的中国，边塞住着一位老人。',
      'proverb,hsk6',
    ]);
  });

  it('handles escaped quotes inside columns', () => {
    const line = '"他说：""马丢了虽可惜""","He said: ""Losing horse is pity"""';
    const parsed = parseCSVLine(line);
    expect(parsed).toEqual([
      '他说："马丢了虽可惜"',
      'He said: "Losing horse is pity"',
    ]);
  });

  it('round-trips export to import preserving content with fresh SRS parameters', () => {
    const cards: Flashcard[] = [
      {
        id: 'card-1',
        chinese: '学习',
        pinyin: 'xué xí',
        english: 'to study, to learn',
        contextSentence: '我们要好好学习。',
        contextTranslation: 'We need to study well.',
        tags: ['hsk1', 'verb'],
        deckId: 'custom-deck',
        dateAdded: '2025-01-01T00:00:00.000Z',
        interval: 15,
        easeFactor: 2.8,
        repetitions: 5,
        state: 'mastered',
      },
    ];

    const csvContent = generateFlashcardsCSV(cards);
    expect(csvContent).toContain('Chinese,Pinyin,English');

    const result = parseFlashcardsFromCSV(csvContent, ['custom-deck', 'main']);
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(0);

    const imported = result.importedCards[0];
    expect(imported.chinese).toBe('学习');
    expect(imported.pinyin).toBe('xué xí');
    expect(imported.english).toBe('to study, to learn');
    expect(imported.contextSentence).toBe('我们要好好学习。');
    expect(imported.contextTranslation).toBe('We need to study well.');
    expect(imported.tags).toEqual(['hsk1', 'verb']);
    expect(imported.deckId).toBe('custom-deck');

    // Strict requirements verification: SRS fields must be fresh defaults
    expect(imported.interval).toBe(1);
    expect(imported.easeFactor).toBe(2.5);
    expect(imported.repetitions).toBe(0);
    expect(imported.state).toBe('new');
    expect(imported.id).not.toBe('card-1');
  });

  it('skips rows missing required Chinese or English fields', () => {
    const invalidCSV = `Chinese,Pinyin,English,ContextSentence,Tags
,xué xí,to study,我们要好好学习。,hsk1
中文,zhōng wén,,我们要说中文。,hsk1
你好,nǐ hǎo,hello,你好世界,greeting`;

    const result = parseFlashcardsFromCSV(invalidCSV, ['main']);
    expect(result.importedCount).toBe(1);
    expect(result.skippedCount).toBe(2);
    expect(result.importedCards[0].chinese).toBe('你好');
  });

  it('falls back to default "main" deck when deckId does not exist in decks list', () => {
    const csvWithOrphanDeck = `Chinese,Pinyin,English,ContextSentence,Tags,ContextTranslation,DeckId
"电脑","diàn nǎo","computer","我有电脑。","tech","I have a computer.","non-existent-deck-123"`;

    const result = parseFlashcardsFromCSV(csvWithOrphanDeck, ['main', 'deck-a']);
    expect(result.importedCount).toBe(1);
    expect(result.importedCards[0].deckId).toBe('main');
  });
});
