/**
 * Minimal particle-based phrasal verb matcher.
 * If the clicked word is immediately followed by exactly one particle from the fixed set,
 * it captures the 2-word verb-particle unit (e.g. "hand over", "give up", "break down").
 */

export const PHRASAL_VERB_PARTICLES = new Set([
  'over', 'up', 'out', 'off', 'down', 'away', 'back',
  'in', 'on', 'through', 'along', 'around', 'into', 'together', 'apart'
]);

export interface DynamicPhraseMatch {
  phrase: string;
  startIndex: number;
  endIndex: number;
  contextSentence: string;
}

/**
 * Checks if the clicked token is immediately followed by a phrasal verb particle.
 */
export function detectDynamicGrammaticalPhrase(
  contextSentence: string,
  _contextStartInFull: number,
  tokenStartIndex: number,
  tokenEndIndex: number,
  fullText: string
): DynamicPhraseMatch | null {
  if (!fullText || tokenStartIndex < 0 || tokenEndIndex > fullText.length) return null;

  // Look ahead immediately following the clicked word for exactly one particle
  const remaining = fullText.slice(tokenEndIndex);
  const match = /^\s+([a-zA-Z]+)\b/.exec(remaining);
  if (!match) return null;

  const nextWord = match[1].toLowerCase();
  if (PHRASAL_VERB_PARTICLES.has(nextWord)) {
    const startChar = tokenStartIndex;
    const endChar = tokenEndIndex + match[0].length;
    return {
      phrase: fullText.slice(startChar, endChar).trim(),
      startIndex: startChar,
      endIndex: endChar,
      contextSentence,
    };
  }

  return null;
}

