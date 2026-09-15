import { getCedictLexicon, FUNCTION_WORDS } from './cedictLexicon';

export interface ResolvedWord {
  startIndex: number;
  endIndex: number; // exclusive
  text: string;
}

const CJK_CHAR_REGEX = /[\u4e00-\u9fa5]/;
const CLAUSE_DELIM_REGEX = /[，。！？；\n,!?;:\r\t]/;

/**
 * Resolves the whole Chinese word or phrase boundary containing the clicked character
 * using dictionary-based bidirectional maximum matching (FMM / BMM) with clause restriction
 * and function/transition word disambiguation.
 *
 * @param fullText - The full text string
 * @param index - The character index clicked by the user
 * @param customDict - Optional dictionary override (Set of valid Chinese words/characters)
 * @returns ResolvedWord with { startIndex, endIndex, text }
 */
export function resolveWordAtIndex(
  fullText: string,
  index: number,
  customDict?: Set<string>
): ResolvedWord {
  if (!fullText || index < 0 || index >= fullText.length) {
    return { startIndex: 0, endIndex: 0, text: '' };
  }

  const char = fullText[index];

  // If clicked on non-Chinese character (punctuation, space, Latin), return single token
  if (!CJK_CHAR_REGEX.test(char)) {
    return {
      startIndex: index,
      endIndex: index + 1,
      text: char,
    };
  }

  const dict = customDict || getCedictLexicon();

  // 1. Restrict search to current clause: never cross punctuation or newlines
  let clauseStart = index;
  while (clauseStart > 0 && !CLAUSE_DELIM_REGEX.test(fullText[clauseStart - 1])) {
    clauseStart--;
  }

  let clauseEnd = index + 1;
  while (clauseEnd < fullText.length && !CLAUSE_DELIM_REGEX.test(fullText[clauseEnd])) {
    clauseEnd++;
  }

  // 2. Standalone function word weighting:
  // If the clicked character is a standalone transition/function word (e.g. 也, 但, 却, 就, 还, 才),
  // check if the remainder of the clause starting immediately after it (index + 1) forms a
  // complete multi-character dictionary entry. If so, preserve the neighboring word and let
  // the transition word stand alone rather than wrongly gluing it into an un-intended compound.
  if (FUNCTION_WORDS.has(char)) {
    let nextStartsMultiCharWord = false;
    const maxNextLen = Math.min(8, clauseEnd - (index + 1));
    for (let l = maxNextLen; l >= 2; l--) {
      const nextSub = fullText.slice(index + 1, index + 1 + l);
      if (dict.has(nextSub)) {
        nextStartsMultiCharWord = true;
        break;
      }
    }

    if (nextStartsMultiCharWord) {
      return {
        startIndex: index,
        endIndex: index + 1,
        text: char,
      };
    }
  }

  // 3. Forward Maximum Matching (FMM):
  // Starting at the clicked character, test substrings of decreasing length and take
  // the longest one that exists in the dictionary and contains the clicked character.
  let fmmMatch: ResolvedWord | null = null;
  const maxFwdLen = Math.min(8, clauseEnd - index);
  for (let l = maxFwdLen; l >= 1; l--) {
    const sub = fullText.slice(index, index + l);
    if (dict.has(sub)) {
      fmmMatch = {
        startIndex: index,
        endIndex: index + l,
        text: sub,
      };
      break;
    }
  }

  // 4. Backward Maximum Matching (BMM):
  // Starting substrings that end at or after the clicked character and extend backward,
  // testing decreasing length to find the longest match containing the clicked character.
  let bmmMatch: ResolvedWord | null = null;
  const maxBmmLen = Math.min(8, clauseEnd - clauseStart);
  for (let l = maxBmmLen; l >= 1; l--) {
    const minStart = Math.max(clauseStart, index - l + 1);
    const maxStart = Math.min(index, clauseEnd - l);

    // Extend backward from latest valid starting position to earliest
    for (let s = minStart; s <= maxStart; s++) {
      const sub = fullText.slice(s, s + l);
      if (dict.has(sub)) {
        bmmMatch = {
          startIndex: s,
          endIndex: s + l,
          text: sub,
        };
        break;
      }
    }
    if (bmmMatch) break;
  }

  // 5. Fallback: if no multi-character or dictionary match exists, fall back to single character
  if (!fmmMatch && !bmmMatch) {
    return {
      startIndex: index,
      endIndex: index + 1,
      text: char,
    };
  }

  if (!fmmMatch) return bmmMatch!;
  if (!bmmMatch) return fmmMatch;

  // 6. Prefer longer match if FMM and BMM disagree in length
  if (fmmMatch.text.length > bmmMatch.text.length) {
    return fmmMatch;
  }
  if (bmmMatch.text.length > fmmMatch.text.length) {
    return bmmMatch;
  }

  // 7. If same length, prefer the one where clicked character is NOT the last character
  // (resolves most ambiguous overlap cases correctly in Chinese)
  const isLastInFMM = index === fmmMatch.endIndex - 1;
  const isLastInBMM = index === bmmMatch.endIndex - 1;

  if (!isLastInFMM && isLastInBMM) {
    return fmmMatch;
  }
  if (isLastInFMM && !isLastInBMM) {
    return bmmMatch;
  }

  return fmmMatch;
}
