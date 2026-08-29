import { describe, it, expect, vi } from 'vitest';
import { TranslationResult } from '../types';

describe('Translation Race Condition Protection', () => {
  it('discards stale/slow in-flight translation responses when a newer translation is requested', async () => {
    let latestRequestId = 0;
    let currentTranslation: TranslationResult | null = null;
    let isLoading = false;

    // Simulate async translation service with controllable delays
    const mockTranslateAsync = async (
      word: string,
      delayMs: number
    ): Promise<TranslationResult> => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return {
        chinese: word === '塞翁失马' ? '塞翁失马' : '这 (the)',
        pinyin: word === '塞翁失马' ? 'sài wēng shī mǎ' : 'zhè',
        english: word === '塞翁失马' ? 'The old man lost his horse (blessing in disguise)' : 'the; this',
        contextSentence: 'Sample context',
        contextTranslation: 'Sample context translation',
        breakdown: [],
        selectedText: word,
        status: 'success',
        source: 'neural',
        mode: word === '塞翁失马' ? 'zh-to-en' : 'en-to-zh',
      };
    };

    // Implementation of handleTranslate guarded with requestId
    const handleTranslateGuarded = async (word: string, delayMs: number) => {
      const requestId = ++latestRequestId;
      isLoading = true;

      try {
        const result = await mockTranslateAsync(word, delayMs);
        if (latestRequestId !== requestId) {
          // Stale request - discard!
          return;
        }
        currentTranslation = result;
      } finally {
        if (latestRequestId === requestId) {
          isLoading = false;
        }
      }
    };

    // Scenario: User clicks "塞翁失马" (slow: 100ms delay), then quickly clicks "the" (fast: 20ms delay)
    const call1 = handleTranslateGuarded('塞翁失马', 100);
    const call2 = handleTranslateGuarded('the', 20);

    // Wait for both to settle
    await Promise.all([call1, call2]);

    // Verify that the second (most recent) request for "the" won, and "塞翁失马" did not clobber it
    expect(currentTranslation).not.toBeNull();
    expect(currentTranslation?.chinese).toBe('这 (the)');
    expect(currentTranslation?.english).toBe('the; this');
    expect(isLoading).toBe(false);
  });

  it('demonstrates that unguarded async handler causes the stale slow response to clobber', async () => {
    let currentTranslation: TranslationResult | null = null;

    const mockTranslateAsync = async (
      word: string,
      delayMs: number
    ): Promise<TranslationResult> => {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return {
        chinese: word === '塞翁失马' ? '塞翁失马' : '这 (the)',
        pinyin: word === '塞翁失马' ? 'sài wēng shī mǎ' : 'zhè',
        english: word === '塞翁失马' ? 'The old man lost his horse (blessing in disguise)' : 'the; this',
        contextSentence: 'Sample context',
        contextTranslation: 'Sample context translation',
        breakdown: [],
        selectedText: word,
        status: 'success',
        source: 'neural',
        mode: word === '塞翁失马' ? 'zh-to-en' : 'en-to-zh',
      };
    };

    // Unguarded implementation (the original bug)
    const handleTranslateUnguarded = async (word: string, delayMs: number) => {
      const result = await mockTranslateAsync(word, delayMs);
      currentTranslation = result; // blindly overwrites
    };

    const call1 = handleTranslateUnguarded('塞翁失马', 100);
    const call2 = handleTranslateUnguarded('the', 20);

    await Promise.all([call1, call2]);

    // Under unguarded execution, "塞翁失马" resolved last and incorrectly clobbered "the"
    expect(currentTranslation?.chinese).toBe('塞翁失马');
  });
});
