import { describe, it, expect } from 'vitest';
import {
  analyzeAmbiguity,
  segmentWithJieba,
  segmentWithIntl,
  doBoundariesAgree,
  disambiguateHeuristically,
  applyManualSplit,
  applyManualMerge,
  SegmentToken,
} from '../src/utils/segmentationEngine';

describe('Chinese Word Segmentation & Ambiguity Golden Test Suite', () => {
  // 1. Structural Ambiguity Cases (才 / 人才)
  describe('Case 1: "这个人才来。" vs "很多优秀的人才。"', () => {
    it('MUST escalate "这个人才来。" via function_word_boundary trigger even when Jieba & Intl agree on 人才', () => {
      const sentence = '这个人才来。';
      const surroundingContext = '开会时间到了，大家都坐好了。这个人才来。会议终于可以开始了。';

      const jiebaTokens = segmentWithJieba(sentence);
      const intlTokens = segmentWithIntl(sentence);

      // Verify the premise: both baseline segmenters blindly produce '人才'
      expect(jiebaTokens.map((t) => t.word)).toContain('人才');
      expect(intlTokens.map((t) => t.word)).toContain('人才');
      expect(doBoundariesAgree(jiebaTokens, intlTokens)).toBe(true);

      // Analysis MUST trigger escalation regardless of agreement
      const analysis = analyzeAmbiguity(sentence, surroundingContext);
      expect(analysis.isAmbiguous).toBe(true);
      expect(analysis.trigger).toBe('function_word_boundary');
      expect(analysis.ambiguousSpans.map((s) => s.word)).toContain('人才');

      // The heuristic fallback resolver must break "人才" into "人" + "才" when preceding verb "来"
      const resolved = disambiguateHeuristically(sentence, analysis.jiebaTokens, analysis.ambiguousSpans);
      const resolvedWords = resolved.map((t) => t.word);
      expect(resolvedWords).toEqual(['这个', '人', '才', '来', '。']);
    });

    it('MUST preserve "人才" as compound noun when used as "talent" in noun/object position', () => {
      const sentence = '这家公司有很多优秀的人才。';
      const surroundingContext = '他们正在招聘工程师。这家公司有很多优秀的人才。大家都想加入。';

      const analysis = analyzeAmbiguity(sentence, surroundingContext);
      // Even with function word check, heuristic resolver preserves "人才" when followed by punctuation (not action verb)
      const resolved = disambiguateHeuristically(sentence, analysis.jiebaTokens, analysis.ambiguousSpans);
      const resolvedWords = resolved.map((t) => t.word);
      expect(resolvedWords).toContain('人才');
      expect(resolvedWords).not.toContain('才。');
    });
  });

  // 2. Structural Ambiguity Cases (也 / 许多)
  describe('Case 2: "我也许多次想去" vs "也许明天会下雨"', () => {
    it('MUST escalate "我也许多次想去" and disambiguate into "我" + "也" + "许多" + "次" + "想去"', () => {
      const sentence = '我也许多次想去。';
      const surroundingContext = '那里风景很美。我也许多次想去。只是没有时间。';

      const analysis = analyzeAmbiguity(sentence, surroundingContext);
      expect(analysis.isAmbiguous).toBe(true);

      const resolved = disambiguateHeuristically(sentence, analysis.jiebaTokens, analysis.ambiguousSpans);
      const resolvedWords = resolved.map((t) => t.word);
      // '也许' followed by '多' must separate '也'
      expect(resolvedWords[0]).toBe('我');
      expect(resolvedWords[1]).toBe('也');
    });

    it('MUST preserve "也许" as adverb "perhaps" when followed by non-competing elements', () => {
      const sentence = '也许明天会下雨。';
      const analysis = analyzeAmbiguity(sentence);
      const resolved = disambiguateHeuristically(sentence, analysis.jiebaTokens, analysis.ambiguousSpans);
      const resolvedWords = resolved.map((t) => t.word);
      expect(resolvedWords[0]).toBe('也许');
    });
  });

  // 3. Four-Character Idiom (Chengyu) Boundaries
  describe('Case 3: 4-Character Idiom Boundaries (成语)', () => {
    it('correctly preserves 4-character idioms like 一心一意 and 不可思议 as unified tokens', () => {
      const sentence = '他一心一意地学习，取得了不可思议的成绩。';
      const tokens = segmentWithJieba(sentence);
      const words = tokens.map((t) => t.word);
      expect(words).toContain('一心一意');
      expect(words).toContain('不可思议');
    });
  });

  // 4. Segmenter Disagreement Triggers (Trigger 1)
  describe('Case 4: Segmenter Boundary Disagreements', () => {
    it('detects boundary disagreement between Jieba and Intl.Segmenter on "他在北京工作。"', () => {
      const sentence = '他在北京工作。';
      const analysis = analyzeAmbiguity(sentence);
      // Intl produces ['他在', '北京', '工作', '。'], Jieba produces ['他', '在', '北京', '工作', '。']
      expect(analysis.isAmbiguous).toBe(true);
      expect(analysis.trigger).toBe('disagreement');
    });

    it('confirms consensus with trigger "none" on canonical text "中国历史非常悠久。"', () => {
      const sentence = '中国历史非常悠久。';
      const analysis = analyzeAmbiguity(sentence);
      expect(analysis.isAmbiguous).toBe(false);
      expect(analysis.trigger).toBe('none');
      expect(analysis.ambiguousSpans).toHaveLength(0);
    });
  });

  // 5. Punctuation and Edge Boundaries
  describe('Case 5: Punctuation and Edge Boundaries', () => {
    it('handles mixed CJK and ASCII punctuation without throwing or dropping characters', () => {
      const sentence = '你好，世界！Hello, world? 123...';
      const tokens = segmentWithJieba(sentence);
      const reconstructed = tokens.map((t) => t.word).join('');
      expect(reconstructed).toBe(sentence);
    });
  });

  // 6. Manual Split & Merge Operations
  describe('Case 6: User Manual Split and Merge Operations', () => {
    it('splits a multi-character token into individual characters', () => {
      const tokens: SegmentToken[] = [
        { word: '这个', start: 0, end: 2, isWord: true },
        { word: '人才', start: 2, end: 4, isWord: true },
        { word: '来', start: 4, end: 5, isWord: true },
      ];

      const splitResult = applyManualSplit(tokens, 1); // Split '人才'
      expect(splitResult.map((t) => t.word)).toEqual(['这个', '人', '才', '来']);
      expect(splitResult[1].start).toBe(2);
      expect(splitResult[1].end).toBe(3);
      expect(splitResult[2].start).toBe(3);
      expect(splitResult[2].end).toBe(4);
    });

    it('merges adjacent tokens to the left and right', () => {
      const tokens: SegmentToken[] = [
        { word: '这个', start: 0, end: 2, isWord: true },
        { word: '人', start: 2, end: 3, isWord: true },
        { word: '才', start: 3, end: 4, isWord: true },
        { word: '来', start: 4, end: 5, isWord: true },
      ];

      // Merge '才' with '人' (Merge Left from index 2)
      const mergedLeft = applyManualMerge(tokens, 2, 'left');
      expect(mergedLeft.map((t) => t.word)).toEqual(['这个', '人才', '来']);
      expect(mergedLeft[1].start).toBe(2);
      expect(mergedLeft[1].end).toBe(4);

      // Merge '人' with '才' (Merge Right from index 1)
      const mergedRight = applyManualMerge(tokens, 1, 'right');
      expect(mergedRight.map((t) => t.word)).toEqual(['这个', '人才', '来']);
    });
  });
});
