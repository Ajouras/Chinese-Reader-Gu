/**
 * Utility for parsing text into tokens (words/characters) suitable for hover and selection.
 */

import { tokenizeLexicalText, LexicalToken, WordSpan, CJK_CHAR_REGEX, CJK_PUNCT_REGEX, detectChineseLexicalUnit } from './chineseSegmenter';
import { EXTENDED_ENGLISH_PHRASES } from './englishPhrases';
import { detectDynamicGrammaticalPhrase } from './dynamicGrammarMatcher';

export interface TextToken extends LexicalToken {
  pinyinApprox?: string;
}

// Regex exports for backwards compatibility
export const CJK_REGEX = CJK_CHAR_REGEX;
export { CJK_PUNCT_REGEX };

const COMMON_ENGLISH_PHRASES = EXTENDED_ENGLISH_PHRASES;

/**
 * Intelligent Phrase & Linguistic Unit Detection upon Click:
 * Given a clicked token/character position in the text:
 * - Chinese: Disambiguates and extracts the multi-character word/idiom (e.g. "解决", "解决掉", "塞翁失马", "令人叹为观止").
 * - English: Identifies multi-word phrases, proper nouns (e.g. "Great Wall of China", "city center", "take care of") or standard lexical words.
 */
export function detectLinguisticUnitAtToken(
  fullText: string,
  token: TextToken,
  isChinese: boolean
): { phrase: string; startIndex: number; endIndex: number; contextSentence: string } {
  if (!fullText) {
    return {
      phrase: token.text,
      startIndex: token.startIndex,
      endIndex: token.endIndex,
      contextSentence: token.text,
    };
  }

  const contextSentence = getSurroundingSentence(fullText, token.text, token.startIndex);

  if (isChinese) {
    const wordSpan = detectChineseLexicalUnit(fullText, token.startIndex);
    const phrase = wordSpan && wordSpan.word && wordSpan.word.length > 0 ? wordSpan.word : token.text;
    const start = wordSpan ? wordSpan.startIndex : token.startIndex;
    const end = wordSpan ? wordSpan.endIndex : token.endIndex;

    return {
      phrase,
      startIndex: start,
      endIndex: end,
      contextSentence,
    };
  }

  // English: Check if clicked token is part of a multi-word phrase, proper noun, or phrasal verb
  const lowerContext = contextSentence.toLowerCase();
  const tokenWord = token.text.toLowerCase().trim();
  const contextStartInFull = fullText.indexOf(contextSentence);

  // 1. Sort phrases by length descending to match longest phrase first
  const sortedPhrases = [...COMMON_ENGLISH_PHRASES].sort((a, b) => b.length - a.length);

  for (const phrase of sortedPhrases) {
    const phraseWords = phrase.split(/\s+/);
    if (phraseWords.includes(tokenWord)) {
      // Find phrase position in context
      const regex = new RegExp(`\\b${phrase.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      const match = regex.exec(contextSentence);
      if (match && typeof match.index === 'number') {
        const matchIdxInContext = match.index;
        const phraseLen = match[0].length;
        const actualStart = (contextStartInFull >= 0 ? contextStartInFull : 0) + matchIdxInContext;
        const actualEnd = actualStart + phraseLen;

        // Verify token falls inside this span
        if (token.startIndex >= actualStart - 1 && token.endIndex <= actualEnd + 1) {
          return {
            phrase: fullText.slice(actualStart, actualEnd),
            startIndex: actualStart,
            endIndex: actualEnd,
            contextSentence,
          };
        }
      }
    }
  }

  // 2. Capitalized Proper Noun sequence detection (e.g. "Great Wall of China", "Palace Museum")
  if (/^[A-Z]/.test(token.text.trim()) && contextStartInFull >= 0) {
    const properNounRegex = /\b([A-Z][a-zA-Z]*(?:\s+(?:of|the|and|in|on|at|for|de|la)\s+[A-Z][a-zA-Z]*|\s+[A-Z][a-zA-Z]*)+)\b/g;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = properNounRegex.exec(contextSentence)) !== null) {
      const matchStart = contextStartInFull + pMatch.index;
      const matchEnd = matchStart + pMatch[0].length;
      if (token.startIndex >= matchStart && token.endIndex <= matchEnd) {
        return {
          phrase: fullText.slice(matchStart, matchEnd),
          startIndex: matchStart,
          endIndex: matchEnd,
          contextSentence,
        };
      }
    }
  }

  // 3. Hyphenated compound word detection (e.g., "snow-capped", "cross-platform", "cutting-edge", "state-of-the-art")
  if (contextStartInFull >= 0) {
    const hyphenRegex = /\b([a-zA-Z]+(?:-[a-zA-Z]+)+)\b/g;
    let hMatch: RegExpExecArray | null;
    while ((hMatch = hyphenRegex.exec(contextSentence)) !== null) {
      const matchStart = contextStartInFull + hMatch.index;
      const matchEnd = matchStart + hMatch[0].length;
      if (token.startIndex >= matchStart && token.endIndex <= matchEnd) {
        return {
          phrase: fullText.slice(matchStart, matchEnd),
          startIndex: matchStart,
          endIndex: matchEnd,
          contextSentence,
        };
      }
    }
  }

  // 4. Dynamic Grammatical Phrase Detection for arbitrary outside text
  // Captures adjective + noun chains, compound nouns, prepositional links (e.g., "sense of awe", "timeless chapter of history")
  const dynamicMatch = detectDynamicGrammaticalPhrase(
    contextSentence,
    contextStartInFull,
    token.startIndex,
    token.endIndex,
    fullText
  );
  if (dynamicMatch) {
    return dynamicMatch;
  }

  return {
    phrase: token.text,
    startIndex: token.startIndex,
    endIndex: token.endIndex,
    contextSentence,
  };
}

/**
 * Splits Chinese or English text into full lexical units/words suitable for hover and selection.
 * Uses Option C Hybrid segmentation for Chinese text (dictionary + context disambiguation).
 */
export function tokenizeText(text: string, isChinese: boolean): TextToken[] {
  return tokenizeLexicalText(text, isChinese);
}

/**
 * Extract sentence boundary containing a given character position or word.
 */
export function getSurroundingSentence(fullText: string, targetWord: string, targetIndex?: number): string {
  if (!fullText) return targetWord;

  // If targetIndex is provided, find the sentence surrounding that index
  if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < fullText.length) {
    let start = targetIndex;
    while (start > 0 && !/[.!?。！？\n]/.test(fullText[start - 1])) {
      start--;
    }
    let end = targetIndex;
    while (end < fullText.length && !/[.!?。！？\n]/.test(fullText[end])) {
      end++;
    }
    if (end < fullText.length && /[.!?。！？]/.test(fullText[end])) {
      end++; // include punctuation mark
    }
    const foundSentence = fullText.slice(start, end).trim();
    if (foundSentence.length > 0) {
      return foundSentence;
    }
  }

  // Split into sentence chunks by common delimiters (. ! ? 。 ！ ？ \n)
  const sentences = fullText.split(/([.!?。！？\n]+)/);
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = (sentences[i] || '') + (sentences[i + 1] || '');
    if (sentence.includes(targetWord)) {
      return sentence.trim();
    }
  }

  return fullText.slice(0, 150); // fallback snippet
}

/**
 * Web Speech Synthesis helper for TTS pronunciation.
 */
export function speakText(text: string, lang: 'zh-CN' | 'en-US' = 'zh-CN') {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported on this browser/platform');
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop current speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.85; // Slightly slower for language learners

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.error('Speech error:', e);
  }
}
