import * as jieba from 'jieba-wasm';
import { FUNCTION_WORDS, getCedictLexicon } from './cedictLexicon';

export interface SegmentToken {
  word: string;
  start: number;
  end: number;
  isWord: boolean;
}

export type SegmentationTier =
  | 'server-consensus'
  | 'server-llm'
  | 'server-cached-llm'
  | 'server-heuristic-fallback'
  | 'client-fallback';

export interface SegmentationResult {
  sentence: string;
  tokens: SegmentToken[];
  tier: SegmentationTier;
  escalated: boolean;
  escalationReason?: 'disagreement' | 'function_word_boundary';
  ambiguousSpans?: { word: string; start: number; end: number }[];
}

export interface AmbiguityAnalysis {
  isAmbiguous: boolean;
  trigger: 'none' | 'disagreement' | 'function_word_boundary';
  details?: string;
  ambiguousSpans: { word: string; start: number; end: number }[];
  jiebaTokens: SegmentToken[];
  intlTokens: SegmentToken[];
}

const CJK_CHAR_REGEX = /[\u4e00-\u9fa5]/;

/**
 * Common action verbs/predicates that immediately follow temporal/modal particles
 * like '才' (e.g. '才来', '才去', '才会', '才能', '才开始', '才到', '才走', '才说', '才做', '才好').
 */
const POST_PARTICLE_VERBS = new Set([
  '来', '去', '走', '到', '说', '做', '吃', '看', '听', '写', '买', '卖',
  '会', '能', '要', '可', '想', '知', '懂', '见', '有', '是', '好', '成',
  '开', '关', '始', '完', '得', '算', '及', '够', '行', '发', '现',
]);

/**
 * Perform pure Jieba word segmentation and calculate exact start/end offsets.
 */
export function segmentWithJieba(text: string): SegmentToken[] {
  if (!text) return [];
  const words = jieba.cut(text, false);
  const tokens: SegmentToken[] = [];
  let currentOffset = 0;

  for (const word of words) {
    const start = text.indexOf(word, currentOffset);
    const actualStart = start !== -1 ? start : currentOffset;
    const end = actualStart + word.length;
    const isWord = CJK_CHAR_REGEX.test(word) || /[a-zA-Z0-9]/.test(word);

    tokens.push({
      word,
      start: actualStart,
      end,
      isWord,
    });
    currentOffset = end;
  }

  return tokens;
}

/**
 * Perform native V8 Intl.Segmenter word segmentation.
 */
export function segmentWithIntl(text: string): SegmentToken[] {
  if (!text) return [];
  const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
  const segments = Array.from(segmenter.segment(text));
  const tokens: SegmentToken[] = [];

  for (const s of segments) {
    const word = s.segment;
    const isWord = s.isWordLike || CJK_CHAR_REGEX.test(word) || /[a-zA-Z0-9]/.test(word);
    tokens.push({
      word,
      start: s.index,
      end: s.index + word.length,
      isWord,
    });
  }

  return tokens;
}

/**
 * Compare two tokenizations for exact boundary agreement.
 */
export function doBoundariesAgree(tokensA: SegmentToken[], tokensB: SegmentToken[]): boolean {
  if (tokensA.length !== tokensB.length) return false;
  for (let i = 0; i < tokensA.length; i++) {
    if (tokensA[i].start !== tokensB[i].start || tokensA[i].end !== tokensB[i].end) {
      return false;
    }
  }
  return true;
}

/**
 * Analyze a sentence for structural or boundary ambiguity.
 * 
 * Trigger 1: Segmenter Disagreement (Jieba vs Intl.Segmenter boundaries diverge).
 * Trigger 2: Function-Word Boundary Escalation Trigger (ALWAYS-ON, independent of agreement).
 *            Fires whenever a multi-character segment contains or borders a known ambiguous
 *            function word (才, 也, 还, 就, 但, etc.) adjacent to a character that can form
 *            a competing valid word (e.g. '人才' -> '人' + '才', '也许' -> '也' + '许').
 */
export function analyzeAmbiguity(
  sentence: string,
  surroundingContext?: string
): AmbiguityAnalysis {
  if (!sentence) {
    return {
      isAmbiguous: false,
      trigger: 'none',
      ambiguousSpans: [],
      jiebaTokens: [],
      intlTokens: [],
    };
  }

  const dict = getCedictLexicon();
  const jTokens = segmentWithJieba(sentence);
  const iTokens = segmentWithIntl(sentence);

  // Trigger 1: Disagreement between segmenters
  const agree = doBoundariesAgree(jTokens, iTokens);
  let trigger1Spans: { word: string; start: number; end: number }[] = [];

  if (!agree) {
    // Collect all tokens that do not match across both sets
    const bSetA = new Set(jTokens.map((t) => `${t.start}:${t.end}`));
    const bSetB = new Set(iTokens.map((t) => `${t.start}:${t.end}`));

    for (const t of jTokens) {
      if (!bSetB.has(`${t.start}:${t.end}`) && t.isWord) {
        trigger1Spans.push({ word: t.word, start: t.start, end: t.end });
      }
    }
    for (const t of iTokens) {
      if (!bSetA.has(`${t.start}:${t.end}`) && t.isWord) {
        if (!trigger1Spans.some((s) => s.start === t.start && s.end === t.end)) {
          trigger1Spans.push({ word: t.word, start: t.start, end: t.end });
        }
      }
    }
  }

  // Trigger 2: Function-Word Boundary Escalation Trigger (Independent of Agreement!)
  // Inspect every multi-character segment in the sentence.
  // If it embeds an ambiguous function word (e.g. '才' in '人才', '也' in '也许') AND
  // the remaining substring is a valid standalone word or followed by a verb/predicate,
  // this is a high-risk structural ambiguity that MUST escalate.
  const trigger2Spans: { word: string; start: number; end: number }[] = [];

  for (const token of jTokens) {
    if (!token.isWord || token.word.length < 2) continue;

    for (let i = 0; i < token.word.length; i++) {
      const char = token.word[i];
      if (FUNCTION_WORDS.has(char)) {
        // Partition candidate around function word
        const before = token.word.slice(0, i);
        const after = token.word.slice(i + 1);

        const beforeIsValid = !before || dict.has(before) || before.length === 1;
        const afterIsValid = !after || dict.has(after) || after.length === 1;

        // Check if adjacent characters form valid words or verbs
        const nextCharInSentence = token.end < sentence.length ? sentence[token.end] : '';
        const followsVerb = POST_PARTICLE_VERBS.has(nextCharInSentence);

        if (beforeIsValid && afterIsValid) {
          // Special known ambiguous combinations:
          // e.g., '人才' followed by a verb ('人才来', '人才走') -> '人' + '才'
          // e.g., '也许' followed by '多' ('我也许多次') -> '也' + '许多'
          // e.g., '他就' followed by '学' ('他就学校') -> '他' + '就' + '学校'
          trigger2Spans.push({
            word: token.word,
            start: token.start,
            end: token.end,
          });
          break;
        }
      }
    }
  }

  // Evaluate final escalation trigger
  if (trigger2Spans.length > 0) {
    return {
      isAmbiguous: true,
      trigger: 'function_word_boundary',
      details: `Function-word boundary escalation triggered on: ${trigger2Spans.map((s) => s.word).join(', ')}`,
      ambiguousSpans: trigger2Spans,
      jiebaTokens: jTokens,
      intlTokens: iTokens,
    };
  }

  if (!agree) {
    return {
      isAmbiguous: true,
      trigger: 'disagreement',
      details: `Segmenter boundary divergence between Jieba and Intl.Segmenter`,
      ambiguousSpans: trigger1Spans,
      jiebaTokens: jTokens,
      intlTokens: iTokens,
    };
  }

  return {
    isAmbiguous: false,
    trigger: 'none',
    ambiguousSpans: [],
    jiebaTokens: jTokens,
    intlTokens: iTokens,
  };
}

/**
 * Rule-based heuristic disambiguation for ambiguous spans when LLM is offline or times out.
 * Provides deterministic linguistically-sound fallback.
 */
export function disambiguateHeuristically(
  sentence: string,
  tokens: SegmentToken[],
  ambiguousSpans: { word: string; start: number; end: number }[]
): SegmentToken[] {
  const result: SegmentToken[] = [];
  const ambigStarts = new Map(ambiguousSpans.map((s) => [s.start, s]));

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const ambig = ambigStarts.get(token.start);

    if (ambig) {
      const w = ambig.word;
      const nextChar = ambig.end < sentence.length ? sentence[ambig.end] : '';

      // Case: '人才' followed by a verb (e.g. '来', '到', '走', '去', '说')
      // -> '人' (noun) + '才' (temporal adverb modifying following verb)
      if (w === '人才' && POST_PARTICLE_VERBS.has(nextChar)) {
        result.push({
          word: '人',
          start: ambig.start,
          end: ambig.start + 1,
          isWord: true,
        });
        result.push({
          word: '才',
          start: ambig.start + 1,
          end: ambig.end,
          isWord: true,
        });
        continue;
      }

      // Case: '也许' followed by '多' (e.g. '我也许多次想去') -> '也' + '许多'
      if (w === '也许' && sentence.slice(ambig.end, ambig.end + 1) === '多') {
        result.push({
          word: '也',
          start: ambig.start,
          end: ambig.start + 1,
          isWord: true,
        });
        // Note: '许多' will be picked up by following token or next iteration
        continue;
      }
    }

    result.push(token);
  }

  return result;
}

/**
 * In-memory client LRU cache of sentence segmentations (max 500 sentences).
 * Clicks within an already-viewed sentence resolve in 0ms.
 */
class LRUSentenceCache {
  private cache = new Map<string, SegmentationResult>();
  private maxEntries: number;

  constructor(maxEntries = 500) {
    this.maxEntries = maxEntries;
  }

  get(key: string): SegmentationResult | undefined {
    const val = this.cache.get(key);
    if (val) {
      // Refresh recency
      this.cache.delete(key);
      this.cache.set(key, val);
    }
    return val;
  }

  set(key: string, value: SegmentationResult): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const clientSentenceCache = new LRUSentenceCache();

/**
 * Local manual correction record format stored in localStorage.
 */
export interface UserCorrection {
  sentence: string;
  tokens: SegmentToken[];
  timestamp: number;
}

const LOCAL_CORRECTIONS_KEY = 'gu_segmentation_corrections';

/**
 * Retrieve user manual corrections from localStorage.
 */
export function getLocalCorrections(): Record<string, UserCorrection> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = localStorage.getItem(LOCAL_CORRECTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Save user manual correction to localStorage.
 */
export function saveLocalCorrection(sentence: string, tokens: SegmentToken[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const corrections = getLocalCorrections();
    corrections[sentence] = {
      sentence,
      tokens,
      timestamp: Date.now(),
    };
    localStorage.setItem(LOCAL_CORRECTIONS_KEY, JSON.stringify(corrections));
    // Update active cache immediately
    clientSentenceCache.set(sentence, {
      sentence,
      tokens,
      tier: 'client-fallback',
      escalated: false,
    });
  } catch (err) {
    console.error('Failed to save manual segmentation correction:', err);
  }
}

/**
 * Perform sentence segmentation with Tier 1 (Server with Gemini escalation)
 * and automatic Tier 2 fallback (local Jieba/ICU) within an 800ms timeout budget.
 */
export async function segmentSentenceWithFallback(
  sentence: string,
  surroundingContext?: string,
  timeoutMs = 900
): Promise<SegmentationResult> {
  if (!sentence || !sentence.trim()) {
    return {
      sentence,
      tokens: [],
      tier: 'client-fallback',
      escalated: false,
    };
  }

  // 1. Check local manual corrections (User rules are absolute)
  const localCorrections = getLocalCorrections();
  if (localCorrections[sentence]) {
    return {
      sentence,
      tokens: localCorrections[sentence].tokens,
      tier: 'client-fallback',
      escalated: false,
    };
  }

  // 2. Check in-memory LRU cache (0ms resolution)
  const cached = clientSentenceCache.get(sentence);
  if (cached) {
    return cached;
  }

  // 3. Try Server Tier (with timeout cap)
  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch('/api/segment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence,
          surroundingContext,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (response.ok) {
        const data: SegmentationResult = await response.json();
        if (data && Array.isArray(data.tokens) && data.tokens.length > 0) {
          clientSentenceCache.set(sentence, data);
          return data;
        }
      }
    } catch {
      // Network failure or timeout -> proceed directly to Tier 2 client fallback
    }
  }

  // 4. Tier 2 Client Fallback: Run local Jieba + ICU + Disambiguation heuristics
  const ambig = analyzeAmbiguity(sentence, surroundingContext);
  const fallbackTokens = ambig.isAmbiguous
    ? disambiguateHeuristically(sentence, ambig.jiebaTokens, ambig.ambiguousSpans)
    : ambig.jiebaTokens;

  const result: SegmentationResult = {
    sentence,
    tokens: fallbackTokens,
    tier: 'client-fallback',
    escalated: ambig.isAmbiguous,
    escalationReason: ambig.trigger !== 'none' ? ambig.trigger : undefined,
    ambiguousSpans: ambig.ambiguousSpans,
  };

  clientSentenceCache.set(sentence, result);
  return result;
}

/**
 * Split or merge word boundaries based on user manual correction interaction.
 */
export function applyManualSplit(
  tokens: SegmentToken[],
  targetTokenIndex: number
): SegmentToken[] {
  if (targetTokenIndex < 0 || targetTokenIndex >= tokens.length) return tokens;
  const token = tokens[targetTokenIndex];
  if (token.word.length <= 1) return tokens; // Already single character

  const newTokens: SegmentToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === targetTokenIndex) {
      // Split into single characters
      for (let c = 0; c < token.word.length; c++) {
        const char = token.word[c];
        newTokens.push({
          word: char,
          start: token.start + c,
          end: token.start + c + 1,
          isWord: CJK_CHAR_REGEX.test(char) || /[a-zA-Z0-9]/.test(char),
        });
      }
    } else {
      newTokens.push(tokens[i]);
    }
  }
  return newTokens;
}

export function applyManualMerge(
  tokens: SegmentToken[],
  targetTokenIndex: number,
  direction: 'left' | 'right'
): SegmentToken[] {
  if (targetTokenIndex < 0 || targetTokenIndex >= tokens.length) return tokens;

  const mergeIdx = direction === 'left' ? targetTokenIndex - 1 : targetTokenIndex;
  if (mergeIdx < 0 || mergeIdx >= tokens.length - 1) return tokens;

  const first = tokens[mergeIdx];
  const second = tokens[mergeIdx + 1];

  const mergedToken: SegmentToken = {
    word: first.word + second.word,
    start: first.start,
    end: second.end,
    isWord: true,
  };

  const newTokens: SegmentToken[] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (i === mergeIdx) {
      newTokens.push(mergedToken);
      i++; // skip second
    } else {
      newTokens.push(tokens[i]);
    }
  }
  return newTokens;
}

