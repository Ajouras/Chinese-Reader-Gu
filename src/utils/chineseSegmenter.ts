import { segment } from 'pinyin-pro';
import { OFFLINE_LEXICON, SINGLE_CHAR_DICT } from './offlineDictionary';

/**
 * Chinese Hover Word and Character Detection — Hybrid Offline Engine
 *
 * Implements:
 * dictionary/lexicon matching → candidate words → basic contextual scoring → best candidate
 *
 * Capable of detecting:
 * - 1 character (e.g. 我, 你, 他, 很, 太, 在, 的, 吗)
 * - 2 characters (e.g. 儿子, 学习, 中文, 喜欢, 老师, 朋友)
 * - 3 characters (e.g. 图书馆, 没关系, 不客气, 练习本, 留学生)
 * - 4+ characters (e.g. 人工智能, 塞翁失马, 很高兴认识你)
 *
 * Strictly offline, fast, deterministic.
 */

export interface WordSpan {
  word: string;
  startIndex: number;
  endIndex: number; // exclusive
  isWord: boolean;
  confidence?: 'lexicon' | 'statistical' | 'single-char';
  score?: number;
}

export interface LexicalToken {
  id: string;
  text: string;
  isWord: boolean;
  startIndex: number;
  endIndex: number;
  wordSpan: WordSpan;
}

// Set of all known multi-character words from lexicon for O(1) membership check
let LEXICON_WORD_SET: Set<string> | null = null;
const MAX_WORD_LEN = 4; // Chinese lexical words, compounds, and 4-character idioms (成语) are at most 4 characters

export function getLexiconWordSet(): Set<string> {
  if (!LEXICON_WORD_SET) {
    LEXICON_WORD_SET = new Set<string>();
    for (const entry of OFFLINE_LEXICON) {
      if (entry.zh && entry.zh.length > 0) {
        const trimmed = entry.zh.trim();
        // Only include true lexical units up to 4 characters for token segmentation (preventing whole sentences from becoming tokens)
        if (trimmed.length <= MAX_WORD_LEN) {
          LEXICON_WORD_SET.add(trimmed);
        }
      }
    }
    // Also include single-character dictionary words
    for (const char of Object.keys(SINGLE_CHAR_DICT)) {
      LEXICON_WORD_SET.add(char);
    }
  }
  return LEXICON_WORD_SET;
}

/**
 * Register additional words dynamically if needed.
 */
export function addWordsToLexicon(words: string[]) {
  const set = getLexiconWordSet();
  for (const w of words) {
    const trimmed = w.trim();
    if (trimmed && trimmed.length <= MAX_WORD_LEN) {
      set.add(trimmed);
    }
  }
}

/**
 * Regex patterns
 */
export const CJK_CHAR_REGEX = /[\u4e00-\u9fa5]/;
export const CJK_PUNCT_REGEX = /[\u3000-\u303f\uff01-\uff0f\uff1a-\uff20\uff3b-\uff40\uff5b-\uff65\s\n\r\t.,!?;:'"()]/;

/**
 * Check if a string is entirely CJK Chinese characters.
 */
export function isAllChinese(str: string): boolean {
  if (!str || str.length === 0) return false;
  for (let i = 0; i < str.length; i++) {
    if (!CJK_CHAR_REGEX.test(str[i])) return false;
  }
  return true;
}

/**
 * Extract the boundaries of the sentence / clause around a character index.
 */
function getClauseBounds(text: string, charIndex: number): { start: number; end: number; clause: string } {
  let start = charIndex;
  while (start > 0 && !/[。！？!?;；\n\r\t\s,，]/.test(text[start - 1])) {
    start--;
  }
  let end = charIndex + 1;
  while (end < text.length && !/[。！？!?;；\n\r\t\s,，]/.test(text[end])) {
    end++;
  }
  return {
    start,
    end,
    clause: text.slice(start, end),
  };
}

/**
 * Statistical segment consensus helper using pinyin-pro segmenter.
 */
const STATISTICAL_SEGMENT_CACHE = new Map<string, Set<string>>();

function getStatisticalSegments(clause: string): Set<string> {
  if (!clause) return new Set();
  const cached = STATISTICAL_SEGMENT_CACHE.get(clause);
  if (cached) return cached;

  const set = new Set<string>();
  try {
    const rawSeg = segment(clause) as any[];
    if (Array.isArray(rawSeg)) {
      for (const item of rawSeg) {
        const str = typeof item === 'string' ? item : item.result || item.origin || String(item);
        if (str && str.trim()) {
          set.add(str.trim());
        }
      }
    }
  } catch (_) {
    // fallback if segment fails
  }

  if (STATISTICAL_SEGMENT_CACHE.size < 500) {
    STATISTICAL_SEGMENT_CACHE.set(clause, set);
  }
  return set;
}

/**
 * Intelligent Chinese Lexical Unit Detector
 *
 * Given fullText and a hovered character index:
 * 1. Finds possible multi-character candidate words containing the hovered character.
 * 2. Checks candidates against the offline lexicon and statistical segmentation.
 * 3. Uses nearby sentence context to score candidates.
 * 4. Selects the highest-confidence candidate word.
 * 5. If no multi-character candidate is sufficiently reliable, falls back to the single hovered character.
 */
export function detectChineseLexicalUnit(fullText: string, charIndex: number): WordSpan {
  if (!fullText || charIndex < 0 || charIndex >= fullText.length) {
    return {
      word: '',
      startIndex: 0,
      endIndex: 0,
      isWord: false,
      confidence: 'single-char',
    };
  }

  const char = fullText[charIndex];
  if (!CJK_CHAR_REGEX.test(char)) {
    // Non-Chinese character (punctuation, space, English, digit)
    const isWord = /[a-zA-Z0-9]/.test(char);
    return {
      word: char,
      startIndex: charIndex,
      endIndex: charIndex + 1,
      isWord,
      confidence: 'single-char',
      score: 0,
    };
  }

  const dict = getLexiconWordSet();
  const { start: clauseStart, end: clauseEnd, clause } = getClauseBounds(fullText, charIndex);
  const statisticalSegments = getStatisticalSegments(clause);

  // Candidate generation:
  // Find all spans [start, end) within clause covering charIndex
  interface Candidate {
    word: string;
    startIndex: number;
    endIndex: number;
    score: number;
    confidence: 'lexicon' | 'statistical' | 'single-char';
  }

  const candidates: Candidate[] = [];

  // Single-character candidate (safe fallback)
  let singleScore = 20;
  if (SINGLE_CHAR_DICT[char] || dict.has(char)) {
    singleScore += 20;
  }
  candidates.push({
    word: char,
    startIndex: charIndex,
    endIndex: charIndex + 1,
    score: singleScore,
    confidence: 'single-char',
  });

  // Multi-character candidates
  const maxLen = Math.min(MAX_WORD_LEN, clauseEnd - clauseStart);
  for (let len = 2; len <= maxLen; len++) {
    // start can range from max(clauseStart, charIndex - len + 1) to min(charIndex, clauseEnd - len)
    const minStart = Math.max(clauseStart, charIndex - len + 1);
    const maxStart = Math.min(charIndex, clauseEnd - len);

    for (let s = minStart; s <= maxStart; s++) {
      const e = s + len;
      const sub = fullText.slice(s, e);

      // Candidate must be entirely Chinese characters
      if (!isAllChinese(sub)) continue;

      let score = 0;
      let confidence: 'lexicon' | 'statistical' | 'single-char' = 'single-char';

      const inDict = dict.has(sub);
      const inStat = statisticalSegments.has(sub);

      if (inDict) {
        // High confidence dictionary word
        // Longer dictionary words receive higher priority (e.g. 图书馆 > 图书, 塞翁失马 > 塞翁)
        score += 60 + len * 15;
        confidence = 'lexicon';
      }

      if (inStat) {
        // Confirmed by statistical segmenter
        score += 35 + len * 5;
        if (confidence !== 'lexicon') {
          confidence = 'statistical';
        }
      }

      // If not recognized by dictionary or statistical segmenter, do not combine randomly
      if (!inDict && !inStat) {
        continue;
      }

      // Contextual consistency bonus:
      // Check prefix before word in clause
      if (s > clauseStart) {
        const prefix = fullText.slice(clauseStart, s);
        if (dict.has(prefix) || statisticalSegments.has(prefix) || prefix.length === 1) {
          score += 10;
        }
      }
      // Check suffix after word in clause
      if (e < clauseEnd) {
        const suffix = fullText.slice(e, clauseEnd);
        if (dict.has(suffix) || statisticalSegments.has(suffix) || suffix.length === 1) {
          score += 10;
        }
      }

      candidates.push({
        word: sub,
        startIndex: s,
        endIndex: e,
        score,
        confidence,
      });
    }
  }

  // Sort candidates by score descending, then by length descending
  candidates.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.word.length - a.word.length;
  });

  const best = candidates[0];

  // If best multi-character candidate has solid confidence (score >= 60), use it
  if (best && best.word.length > 1 && best.score >= 60) {
    return {
      word: best.word,
      startIndex: best.startIndex,
      endIndex: best.endIndex,
      isWord: true,
      confidence: best.confidence,
      score: best.score,
    };
  }

  // Safe fallback to single character
  return {
    word: char,
    startIndex: charIndex,
    endIndex: charIndex + 1,
    isWord: true,
    confidence: 'single-char',
    score: singleScore,
  };
}

/**
 * Forward Maximum Matching (FMM) with length-weighted tie breaking
 */
function forwardMaxMatch(sentence: string, dict: Set<string>, maxLen: number): string[] {
  const result: string[] = [];
  let idx = 0;
  const len = sentence.length;

  while (idx < len) {
    if (!CJK_CHAR_REGEX.test(sentence[idx])) {
      result.push(sentence[idx]);
      idx++;
      continue;
    }

    let matched = false;
    const curMax = Math.min(maxLen, len - idx);
    for (let l = curMax; l >= 2; l--) {
      const candidate = sentence.slice(idx, idx + l);
      if (dict.has(candidate)) {
        result.push(candidate);
        idx += l;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.push(sentence[idx]);
      idx++;
    }
  }

  return result;
}

/**
 * Reverse Maximum Matching (RMM)
 */
function reverseMaxMatch(sentence: string, dict: Set<string>, maxLen: number): string[] {
  const result: string[] = [];
  let idx = sentence.length;

  while (idx > 0) {
    const char = sentence[idx - 1];
    if (!CJK_CHAR_REGEX.test(char)) {
      result.unshift(char);
      idx--;
      continue;
    }

    let matched = false;
    const curMax = Math.min(maxLen, idx);
    for (let l = curMax; l >= 2; l--) {
      const candidate = sentence.slice(idx - l, idx);
      if (dict.has(candidate)) {
        result.unshift(candidate);
        idx -= l;
        matched = true;
        break;
      }
    }

    if (!matched) {
      result.unshift(sentence[idx - 1]);
      idx--;
    }
  }

  return result;
}

/**
 * Score a segmentation for disambiguation
 */
function scoreSegmentation(segments: string[], dict: Set<string>): number {
  let score = 0;
  for (const seg of segments) {
    if (isAllChinese(seg)) {
      if (seg.length > 1 && dict.has(seg)) {
        score += seg.length * 15;
      } else if (seg.length === 1) {
        score += 2;
      }
    }
  }
  return score;
}

// In-memory cache for segmentation results
const SEGMENT_CACHE = new Map<string, WordSpan[]>();

/**
 * Hybrid Segmentation on a continuous text or sentence
 */
export function segmentChineseHybrid(text: string): WordSpan[] {
  if (!text) return [];
  const cached = SEGMENT_CACHE.get(text);
  if (cached) return cached;

  const dict = getLexiconWordSet();

  // Fast path for short single word
  if (text.length <= 4 && dict.has(text) && isAllChinese(text)) {
    const span: WordSpan[] = [
      {
        word: text,
        startIndex: 0,
        endIndex: text.length,
        isWord: true,
        confidence: 'lexicon',
      },
    ];
    if (SEGMENT_CACHE.size < 500) {
      SEGMENT_CACHE.set(text, span);
    }
    return span;
  }

  const fmm = forwardMaxMatch(text, dict, MAX_WORD_LEN);
  const rmm = reverseMaxMatch(text, dict, MAX_WORD_LEN);

  let chosenWords: string[];

  const fmmStr = fmm.join('/');
  const rmmStr = rmm.join('/');

  if (fmmStr === rmmStr) {
    chosenWords = fmm;
  } else {
    const fmmScore = scoreSegmentation(fmm, dict);
    const rmmScore = scoreSegmentation(rmm, dict);

    if (fmmScore > rmmScore) {
      chosenWords = fmm;
    } else if (rmmScore > fmmScore) {
      chosenWords = rmm;
    } else {
      // Score tie: Cross-check with statistical segment from pinyin-pro
      try {
        const rawPinyinSeg = segment(text) as any[];
        const pinyinWords: string[] = Array.isArray(rawPinyinSeg)
          ? rawPinyinSeg.map((s) => (typeof s === 'string' ? s : s.result || s.origin || String(s)))
          : [];
        
        if (pinyinWords.length > 0) {
          const pinyinStr = pinyinWords.join('/');
          if (pinyinStr === fmmStr) {
            chosenWords = fmm;
          } else if (pinyinStr === rmmStr) {
            chosenWords = rmm;
          } else {
            chosenWords = rmm;
          }
        } else {
          chosenWords = rmm;
        }
      } catch (_) {
        chosenWords = rmm;
      }
    }
  }

  // Convert chosenWords into WordSpan with exact character indices
  const spans: WordSpan[] = [];
  let currentPos = 0;

  for (const word of chosenWords) {
    const start = currentPos;
    const end = currentPos + word.length;
    const isWord = isAllChinese(word) || /[a-zA-Z0-9]/.test(word);

    let confidence: 'lexicon' | 'statistical' | 'single-char' = 'single-char';
    if (dict.has(word)) {
      confidence = 'lexicon';
    } else if (word.length > 1 && isAllChinese(word)) {
      confidence = 'statistical';
    }

    spans.push({
      word,
      startIndex: start,
      endIndex: end,
      isWord,
      confidence,
    });

    currentPos = end;
  }

  if (SEGMENT_CACHE.size < 500) {
    SEGMENT_CACHE.set(text, spans);
  }

  return spans;
}

/**
 * Locate the detected full word span at a given character position in the text.
 */
export function findWordAtPosition(fullText: string, charIndex: number): WordSpan {
  return detectChineseLexicalUnit(fullText, charIndex);
}

/**
 * Tokenize full text into LexicalTokens for the interactive reader.
 * Every character or multi-character word maps to its parent WordSpan so hovering
 * over any character in "学习" or "儿子" highlights and selects the whole word.
 */
export function tokenizeLexicalText(text: string, isChinese: boolean): LexicalToken[] {
  if (!text) return [];

  if (!isChinese) {
    // English tokenization: cleanly separate words (letters, digits, contractions), whitespace, and punctuation
    const tokens: LexicalToken[] = [];
    const tokenPattern = /([a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)?|\s+|[^\s\w]+)/g;
    let match: RegExpExecArray | null;
    let counter = 0;

    while ((match = tokenPattern.exec(text)) !== null) {
      const chunk = match[0];
      const start = match.index;
      const end = start + chunk.length;
      const isWord = /^[a-zA-Z0-9]+(?:['’][a-zA-Z0-9]+)?$/.test(chunk);

      const span: WordSpan = {
        word: chunk,
        startIndex: start,
        endIndex: end,
        isWord,
        confidence: isWord ? 'lexicon' : 'single-char',
      };

      tokens.push({
        id: `tok-${counter++}`,
        text: chunk,
        isWord,
        startIndex: start,
        endIndex: end,
        wordSpan: span,
      });
    }

    return tokens;
  }

  // Chinese tokenization with Hybrid Word Segmentation
  const spans = segmentChineseHybrid(text);
  const tokens: LexicalToken[] = [];
  let tokenCounter = 0;

  for (const span of spans) {
    tokens.push({
      id: `tok-${tokenCounter++}`,
      text: span.word,
      isWord: span.isWord,
      startIndex: span.startIndex,
      endIndex: span.endIndex,
      wordSpan: span,
    });
  }

  return tokens;
}
