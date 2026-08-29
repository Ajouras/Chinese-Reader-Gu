import { describe, it, expect } from 'vitest';
import { findEnglishLexiconMatch, translateOffline } from './offlineDictionary';

describe('English Lexicon Lookup & Tier 3 Reverse Word Index', () => {
  it('resolves direct Tier 1 exact matches', () => {
    const match = findEnglishLexiconMatch('hello');
    expect(match).not.toBeNull();
    expect(match?.zh).toBe('你好');
  });

  it('resolves Tier 2 stemmed matches', () => {
    // 'studying' -> stem 'study' -> 学习
    const match = findEnglishLexiconMatch('studying');
    expect(match).not.toBeNull();
    expect(match?.zh).toBe('学习');
  });

  it('resolves Tier 3 matches (word inside compound glosses without full entry)', () => {
    // 'mention' appears in 'you are welcome; don\'t mention it' (不客气)
    const match = findEnglishLexiconMatch('mention');
    expect(match).not.toBeNull();
    expect(match?.zh).toBe('不客气');
  });

  it('resolves Tier 3 stemmed word inside compound glosses', () => {
    // 'welcomes' -> stem 'welcome' -> in 'you are welcome' (不客气) or 欢迎
    const match = findEnglishLexiconMatch('welcomes');
    expect(match).not.toBeNull();
    expect(['欢迎', '不客气']).toContain(match?.zh);
  });

  it('returns null for non-existent words with zero overhead', () => {
    const match = findEnglishLexiconMatch('flabbergasted');
    expect(match).toBeNull();
  });

  it('integrates cleanly into translateOffline for en-to-zh mode', () => {
    const res = translateOffline('mention', 'Do not mention this.');
    expect(res.mode).toBe('en-to-zh');
    expect(res.chinese).toBe('不客气');
    expect(res.status).toBe('success');
  });
});
