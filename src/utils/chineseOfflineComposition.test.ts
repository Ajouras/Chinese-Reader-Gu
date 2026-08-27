import { describe, it, expect } from 'vitest';
import {
  translateOffline,
  segmentChineseText,
  composeEnglishTranslation,
} from './offlineDictionary';

describe('Chinese to English Offline Composition and Quality Thresholds', () => {
  it('rejects ambiguous sentences with missing compound word coverage (我们在研究生命科学。)', () => {
    const text = '我们在研究生命科学。';
    const result = translateOffline(text, text, 'zh-to-en');

    // Should NOT silently succeed with placeholder-ridden sentences like "We at term term birth term term study"
    expect(result.status).toBe('not_found');
    expect(result.english).toBe('');
    expect(result.errorMessage).toContain('No offline translation found');
  });

  it('preserves success for sentences with full offline dictionary coverage (我喜欢在图书馆看书，有时候他也去。)', () => {
    const text = '我喜欢在图书馆看书，有时候他也去。';
    const result = translateOffline(text, text, 'zh-to-en');

    expect(result.status).toBe('success');
    expect(result.english.length).toBeGreaterThan(0);
    expect(result.english).not.toContain('term');
    expect(result.english).not.toContain('character');
    // Verifies all components were resolved
    expect(result.english.toLowerCase()).toContain('library');
  });

  it('rejects short expressions (<= 3 words) if any word is unresolved', () => {
    // 2-segment expression where 1 is unknown
    const shortWithUnknown = '我们研'; // 我们 (resolved) + 研 (unresolved)
    const segments = segmentChineseText(shortWithUnknown);
    const composed = composeEnglishTranslation(segments, shortWithUnknown);

    expect(composed).toBeNull();
    const result = translateOffline(shortWithUnknown, shortWithUnknown, 'zh-to-en');
    expect(result.status).toBe('not_found');
  });

  it('evaluates partial coverage threshold on 5-segment sentences', () => {
    // Case A: 2 out of 5 words unresolved (40% unresolved > 30% limit) -> MUST FAIL
    const segments2Of5 = [
      { word: '我', mean: 'I', resolved: true },
      { word: '喜欢', mean: 'like', resolved: true },
      { word: '看', mean: 'read', resolved: true },
      { word: '某', mean: null, resolved: false },
      { word: '物', mean: null, resolved: false },
    ];
    const composedFail = composeEnglishTranslation(segments2Of5, '我喜欢看某物');
    expect(composedFail).toBeNull();

    // Case B: 1 out of 5 words unresolved (20% unresolved <= 30% limit, unresolved count = 1 <= 2) -> PASSES
    const segments1Of5 = [
      { word: '我', mean: 'I', resolved: true },
      { word: '喜欢', mean: 'like', resolved: true },
      { word: '在', mean: 'at', resolved: true },
      { word: '家', mean: 'home', resolved: true },
      { word: '某', mean: null, resolved: false },
    ];
    const composedPass = composeEnglishTranslation(segments1Of5, '我喜欢在家某');
    expect(composedPass).toBe('I like at home');
  });

  it('correctly tags segments with explicit resolved boolean and null mean', () => {
    const segments = segmentChineseText('我们在研究');
    const we = segments.find((s) => s.word === '我们');
    const yan = segments.find((s) => s.word === '研');

    expect(we?.resolved).toBe(true);
    expect(we?.mean).toBe('we');

    expect(yan?.resolved).toBe(false);
    expect(yan?.mean).toBeNull();
  });
});
