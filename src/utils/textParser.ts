/**
 * Utility for parsing text into tokens (words/characters) suitable for hover and selection.
 */

import { tokenizeLexicalText, LexicalToken, WordSpan, CJK_CHAR_REGEX, CJK_PUNCT_REGEX } from './chineseSegmenter';

export interface TextToken extends LexicalToken {
  pinyinApprox?: string;
}

// Regex exports for backwards compatibility
export const CJK_REGEX = CJK_CHAR_REGEX;
export { CJK_PUNCT_REGEX };

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
