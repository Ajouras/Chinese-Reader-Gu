import { describe, it, expect } from 'vitest';
import { resolveWordAtIndex } from './wordResolver';
import { getCedictLexicon } from './cedictLexicon';

describe('resolveWordAtIndex (Click-to-Select-Word for Chinese Text)', () => {
  // Test 1: Multi-char word, click on first/middle/last character all resolve to the same full word
  it('1. resolves multi-character word correctly when clicking on first, middle, or last character (e.g. 图书馆)', () => {
    const text = '我在图书馆学习';
    // Indices:
    // 我=0, 在=1, 图=2, 书=3, 馆=4, 学=5, 习=6

    // Click on first character '图' (index 2)
    const resFirst = resolveWordAtIndex(text, 2);
    expect(resFirst).toEqual({
      startIndex: 2,
      endIndex: 5,
      text: '图书馆',
    });

    // Click on middle character '书' (index 3)
    const resMid = resolveWordAtIndex(text, 3);
    expect(resMid).toEqual({
      startIndex: 2,
      endIndex: 5,
      text: '图书馆',
    });

    // Click on last character '馆' (index 4)
    const resLast = resolveWordAtIndex(text, 4);
    expect(resLast).toEqual({
      startIndex: 2,
      endIndex: 5,
      text: '图书馆',
    });

    // Also verify '学习' (first char 学=5, last char 习=6)
    expect(resolveWordAtIndex(text, 5)).toEqual({
      startIndex: 5,
      endIndex: 7,
      text: '学习',
    });
    expect(resolveWordAtIndex(text, 6)).toEqual({
      startIndex: 5,
      endIndex: 7,
      text: '学习',
    });
  });

  // Test 2: A 4-character idiom resolves as one unit, not split into two 2-char words
  it('2. resolves a 4-character idiom as one unit, not split into two 2-char words (e.g. 一心一意, 塞翁失马)', () => {
    const text = '他做事情一心一意。';
    // Indices: 他=0, 做=1, 事=2, 情=3, 一=4, 心=5, 一=6, 意=7, 。=8

    for (let i = 4; i <= 7; i++) {
      const res = resolveWordAtIndex(text, i);
      expect(res).toEqual({
        startIndex: 4,
        endIndex: 8,
        text: '一心一意',
      });
    }

    const idiomText2 = '塞翁失马焉知非福';
    // 塞翁失马 is index 0..4
    for (let i = 0; i <= 3; i++) {
      const res = resolveWordAtIndex(idiomText2, i);
      expect(res.text).toBe('塞翁失马');
      expect(res.startIndex).toBe(0);
      expect(res.endIndex).toBe(4);
    }
  });

  // Test 3: A single-character word that is NOT part of any larger valid word resolves to just itself
  it('3. resolves lone grammar particle or standalone single-character word to just itself (e.g. 的, 了)', () => {
    const text1 = '这是我的书。';
    // 这=0, 是=1, 我=2, 的=3, 书=4, 。=5
    const resDe = resolveWordAtIndex(text1, 3);
    expect(resDe).toEqual({
      startIndex: 3,
      endIndex: 4,
      text: '的',
    });

    const text2 = '好，我知道了。';
    // 好=0, ，=1, 我=2, 知=3, 道=4, 了=5, 。=6
    const resLe = resolveWordAtIndex(text2, 5);
    expect(resLe).toEqual({
      startIndex: 5,
      endIndex: 6,
      text: '了',
    });
  });

  // Test 4: Overlap disambiguation (e.g. 学习 vs 习惯 sharing 习; longer word wins when both present)
  it('4. resolves overlap correctly: does not match phantom word not in text, and longer valid word wins', () => {
    // 学习 vs 习惯 sharing '习': clicking '习' in "我们在学校学习。" must give "学习", not match into "习惯"
    const text = '我们在学校学习。';
    // 我=0, 们=1, 在=2, 学=3, 校=4, 学=5, 习=6, 。=7
    const resXi = resolveWordAtIndex(text, 6);
    expect(resXi).toEqual({
      startIndex: 5,
      endIndex: 7,
      text: '学习',
    });

    // When both shorter ("图书", len 2) and longer ("图书馆", len 3) exist in the text, the longer one wins
    const textLib = '他在图书馆看书。';
    // 他=0, 在=1, 图=2, 书=3, 馆=4, 看=5, 书=6, 。=7
    const resTu = resolveWordAtIndex(textLib, 2);
    expect(resTu).toEqual({
      startIndex: 2,
      endIndex: 5,
      text: '图书馆',
    });
  });

  // Test 5: Word touching punctuation, confirming match never crosses punctuation boundary
  it('5. never crosses punctuation boundary when a word touches punctuation (e.g. ，。！？；\n)', () => {
    const text = '我在图书馆，学习中文。';
    // Indices: 我=0, 在=1, 图=2, 书=3, 馆=4, ，=5, 学=6, 习=7, 中=8, 文=9, 。=10

    // '馆' (index 4) touches comma '，' (index 5)
    const resGuan = resolveWordAtIndex(text, 4);
    expect(resGuan).toEqual({
      startIndex: 2,
      endIndex: 5,
      text: '图书馆',
    });
    // Verify it did not include comma
    expect(resGuan.endIndex).toBe(5);
    expect(text.slice(resGuan.startIndex, resGuan.endIndex)).toBe('图书馆');

    // '习' (index 7) right after comma
    const resXi = resolveWordAtIndex(text, 7);
    expect(resXi).toEqual({
      startIndex: 6,
      endIndex: 8,
      text: '学习',
    });
    expect(resXi.startIndex).toBe(6); // does not bleed into comma at index 5
  });

  // Test 6: Standalone transition/function word should NOT be merged into a neighboring multi-char word
  it('6. does not wrongly merge a standalone transition word (也, 但, 却, 就) when neighboring word forms a valid multi-char word', () => {
    // In "我也许多次想去。"
    // '也' (index 1) is followed by '许多' (valid 2-char word).
    // Naive longest match might glue '也' + '许' -> '也许', destroying '许多'.
    // The algorithm must keep '也' standing alone.
    const text1 = '我也许多次想去。';
    // 我=0, 也=1, 许=2, 多=3, 次=4, 想=5, 去=6, 。=7

    const resYe = resolveWordAtIndex(text1, 1);
    expect(resYe).toEqual({
      startIndex: 1,
      endIndex: 2,
      text: '也',
    });

    const resXu = resolveWordAtIndex(text1, 2);
    expect(resXu).toEqual({
      startIndex: 2,
      endIndex: 4,
      text: '许多',
    });

    // In contrast, when the sentence DOES support the compound (e.g. "他也许不知道。"):
    // '许' is not the start of a neighboring multi-char word, so '也许' should be chosen.
    const text2 = '他也许不知道。';
    // 他=0, 也=1, 许=2, 不=3, 知=4, 道=5, 。=6
    const resYeXu = resolveWordAtIndex(text2, 1);
    expect(resYeXu).toEqual({
      startIndex: 1,
      endIndex: 3,
      text: '也许',
    });
    const resYeXu2 = resolveWordAtIndex(text2, 2);
    expect(resYeXu2).toEqual({
      startIndex: 1,
      endIndex: 3,
      text: '也许',
    });
  });

  // Test 7: Click at very start or very end of string (boundary and off-by-one check)
  it('7. handles boundary clicks at the very start (index 0) and very end (index length - 1) seamlessly', () => {
    const text = '学习使人进步';
    // 学=0, 习=1, 使=2, 人=3, 进=4, 步=5

    // Click at very start: index 0
    const resStart = resolveWordAtIndex(text, 0);
    expect(resStart).toEqual({
      startIndex: 0,
      endIndex: 2,
      text: '学习',
    });

    // Click at very end: index 5 ('步')
    const resEnd = resolveWordAtIndex(text, 5);
    expect(resEnd).toEqual({
      startIndex: 4,
      endIndex: 6,
      text: '进步',
    });

    // Edge cases: out of bounds indices
    expect(resolveWordAtIndex(text, -1)).toEqual({ startIndex: 0, endIndex: 0, text: '' });
    expect(resolveWordAtIndex(text, 99)).toEqual({ startIndex: 0, endIndex: 0, text: '' });
    expect(resolveWordAtIndex('', 0)).toEqual({ startIndex: 0, endIndex: 0, text: '' });
  });

  it('supports custom dictionary injection for isolated tests', () => {
    const customDict = new Set(['人工智能', '测试', '是', '好']);
    const text = '人工智能是好测试';
    const res = resolveWordAtIndex(text, 2, customDict); // '智'
    expect(res).toEqual({
      startIndex: 0,
      endIndex: 4,
      text: '人工智能',
    });
  });
});
