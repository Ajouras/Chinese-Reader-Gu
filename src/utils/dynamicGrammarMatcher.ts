/**
 * Dynamic Grammatical Pattern Matcher for arbitrary English text.
 * Detects noun phrases (adjective + noun sequences), compound nouns,
 * prepositional phrases, participle phrases, and common syntactic patterns.
 */

// Common determiners/articles (boundaries of noun phrases)
const DETERMINERS = new Set([
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'every', 'each', 'some', 'any', 'all', 'both'
]);

// Common linking prepositions inside complex noun chunks (e.g., "sense of awe", "chapter of history", "cost of living")
const LINKING_PREPOSITIONS = new Set(['of', 'for', 'in', 'on', 'at', 'with', 'about', 'by', 'to', 'from', 'into']);

// Common coordinating conjunctions inside compound modifier phrases
const JOINING_CONJUNCTIONS = new Set(['and', 'or']);

// Words that are strictly structural/grammatical markers or verbs that should not expand into adjective-noun chunks
const CLAUSE_BOUNDARIES = new Set([
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must',
  'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how', 'that', 'because', 'since', 'although', 'though', 'while', 'whereas', 'if', 'unless', 'until', 'whether',
  'but', 'yet', 'so', 'then', 'also', 'therefore', 'however', 'moreover', 'furthermore'
]);

// Common adjective suffix patterns
const ADJ_SUFFIXES = [
  'able', 'ible', 'al', 'ial', 'ful', 'ic', 'ical', 'ish', 'ive', 'ative', 'itive',
  'less', 'ous', 'ious', 'eous', 'ent', 'ant', 'ary', 'ory', 'esque', 'like', 'ward', 'wise', 'y'
];

// Common adverb suffix patterns
const ADV_SUFFIXES = ['ly', 'ward', 'wards', 'wise'];

// Common noun suffix patterns
const NOUN_SUFFIXES = [
  'tion', 'sion', 'ment', 'ence', 'ance', 'ity', 'ty', 'ship', 'ness', 'ism', 'ist',
  'er', 'or', 'ant', 'ent', 'ee', 'ure', 'logy', 'graphy', 'dom', 'hood', 'age'
];

/**
 * Checks if a single word looks like an adjective or participial modifier.
 */
function isProbableAdjectiveOrModifier(word: string): boolean {
  const w = word.toLowerCase();
  if (CLAUSE_BOUNDARIES.has(w) || DETERMINERS.has(w) || LINKING_PREPOSITIONS.has(w)) return false;

  // Participial adjectives (-ing / -ed / -en)
  if (w.endsWith('ing') && w.length > 4) return true; // e.g., rolling, winding, standing, stunning, fascinating
  if (w.endsWith('ed') && w.length > 4) return true;  // e.g., snow-capped, ancient-inspired, balanced
  if (w.endsWith('en') && (w === 'green' || w === 'wooden' || w === 'golden' || w === 'frozen' || w === 'hidden')) return true;

  // Common descriptive adjectives without obvious suffixes
  const commonAdjs = new Set([
    'green', 'blue', 'red', 'yellow', 'white', 'black', 'dark', 'light', 'bright',
    'big', 'small', 'huge', 'colossal', 'massive', 'grand', 'tiny', 'tall', 'short',
    'high', 'low', 'deep', 'shallow', 'wide', 'narrow', 'broad', 'thick', 'thin',
    'great', 'good', 'bad', 'new', 'old', 'ancient', 'modern', 'young', 'fresh',
    'rich', 'poor', 'pure', 'clean', 'dirty', 'warm', 'cold', 'cool', 'hot',
    'soft', 'hard', 'sharp', 'smooth', 'rough', 'calm', 'wild', 'steep', 'gentle',
    'rolling', 'vast', 'dense', 'lush', 'grand', 'serene', 'spectacular', 'profound'
  ]);
  if (commonAdjs.has(w)) return true;

  return ADJ_SUFFIXES.some(s => w.endsWith(s) && w.length > s.length + 2);
}

/**
 * Checks if a single word looks like a noun or substantive word.
 */
function isProbableNoun(word: string): boolean {
  const w = word.toLowerCase();
  if (CLAUSE_BOUNDARIES.has(w) || DETERMINERS.has(w)) return false;

  const commonNouns = new Set([
    'mountain', 'mountains', 'hill', 'hills', 'valley', 'river', 'sea', 'ocean', 'lake',
    'wall', 'structure', 'structures', 'building', 'buildings', 'city', 'town', 'center',
    'architecture', 'view', 'views', 'scenery', 'landscape', 'horizon', 'sky', 'sun',
    'chapter', 'page', 'history', 'custom', 'customs', 'culture', 'tradition', 'traditions',
    'sense', 'feeling', 'awe', 'pride', 'wonder', 'honor', 'duty', 'responsibility',
    'stone', 'wood', 'rock', 'water', 'forest', 'tree', 'trees', 'grass', 'field', 'fields',
    'system', 'model', 'data', 'algorithm', 'intelligence', 'learning', 'network', 'process',
    'science', 'society', 'life', 'mind', 'body', 'world', 'art', 'music', 'story', 'path'
  ]);
  if (commonNouns.has(w)) return true;

  return NOUN_SUFFIXES.some(s => w.endsWith(s) && w.length > s.length + 2);
}

export interface DynamicPhraseMatch {
  phrase: string;
  startIndex: number;
  endIndex: number;
  contextSentence: string;
}

/**
 * Dynamically analyzes the surrounding words in any arbitrary sentence to capture
 * multi-word grammatical phrases (e.g. "rolling green mountains", "colossal stone structure",
 * "profound sense of awe", "timeless chapter of history", "deep learning neural network")
 * when a user clicks on any constituent word.
 */
export function detectDynamicGrammaticalPhrase(
  contextSentence: string,
  contextStartInFull: number,
  tokenStartIndex: number,
  tokenEndIndex: number,
  fullText: string
): DynamicPhraseMatch | null {
  if (!contextSentence) return null;

  // Split sentence into word tokens with offsets relative to contextSentence
  const wordRegex = /\b[a-zA-Z0-9'-]+\b/g;
  const words: { text: string; start: number; end: number; absStart: number; absEnd: number }[] = [];
  let m: RegExpExecArray | null;

  const baseOffset = contextStartInFull >= 0 ? contextStartInFull : 0;

  while ((m = wordRegex.exec(contextSentence)) !== null) {
    words.push({
      text: m[0],
      start: m.index,
      end: m.index + m[0].length,
      absStart: baseOffset + m.index,
      absEnd: baseOffset + m.index + m[0].length,
    });
  }

  // Find index of clicked token in word list
  const clickedIdx = words.findIndex(w => tokenStartIndex >= w.absStart - 1 && tokenEndIndex <= w.absEnd + 1);
  if (clickedIdx === -1) return null;

  const clickedWord = words[clickedIdx];
  const clickedLower = clickedWord.text.toLowerCase();

  // If clicked word is a clause boundary or sole determiner, do not form an unrequested large phrase
  if (CLAUSE_BOUNDARIES.has(clickedLower)) return null;

  // Dynamic Expansion Strategy:
  // Step 1: Expand to the left
  let leftIdx = clickedIdx;
  while (leftIdx > 0) {
    const prevWord = words[leftIdx - 1];
    const prevLower = prevWord.text.toLowerCase();

    // Check distance between words (must be immediate neighbors, e.g., 1 space or hyphen)
    const gap = contextSentence.slice(prevWord.end, words[leftIdx].start);
    if (/[.,!?;:]/.test(gap) || gap.length > 3) break;

    // Stop at clause boundary or standard determiner
    if (CLAUSE_BOUNDARIES.has(prevLower)) break;

    // Expand through adjectives, participles, or modifying nouns
    if (isProbableAdjectiveOrModifier(prevLower) || isProbableNoun(prevLower)) {
      leftIdx--;
    } else if (gap.includes('-')) {
      // Hyphenated compound
      leftIdx--;
    } else {
      break;
    }
  }

  // Step 2: Expand to the right
  let rightIdx = clickedIdx;
  while (rightIdx < words.length - 1) {
    const nextWord = words[rightIdx + 1];
    const nextLower = nextWord.text.toLowerCase();

    const gap = contextSentence.slice(words[rightIdx].end, nextWord.start);
    if (/[.,!?;:]/.test(gap) || gap.length > 3) break;

    if (CLAUSE_BOUNDARIES.has(nextLower) || DETERMINERS.has(nextLower)) break;

    // If next word is a compound noun or head noun
    if (isProbableNoun(nextLower)) {
      rightIdx++;
      // Check if linked by "of" or "for" (e.g. "sense of awe", "chapter of history", "cost of living")
      if (rightIdx < words.length - 2) {
        const linkWord = words[rightIdx + 1].text.toLowerCase();
        const afterLink = words[rightIdx + 2].text.toLowerCase();
        const linkGap = contextSentence.slice(words[rightIdx].end, words[rightIdx + 1].start);
        if (LINKING_PREPOSITIONS.has(linkWord) && !/[.,!?;:]/.test(linkGap) && (isProbableNoun(afterLink) || isProbableAdjectiveOrModifier(afterLink))) {
          rightIdx += 2;
          // Continue expanding if afterLink was an adjective modifying a further noun
          if (rightIdx < words.length - 1 && isProbableNoun(words[rightIdx + 1].text.toLowerCase())) {
            rightIdx++;
          }
        }
      }
    } else if (isProbableAdjectiveOrModifier(nextLower) && rightIdx < words.length - 2 && isProbableNoun(words[rightIdx + 2].text.toLowerCase())) {
      // Adjective followed by noun (e.g. "deep" in "deep neural networks")
      rightIdx += 2;
    } else if (gap.includes('-')) {
      // Hyphenated compound
      rightIdx++;
    } else {
      break;
    }
  }

  // Only return a dynamic phrase if it spans at least 2 words and contains reasonable phrase length (<= 6 words)
  const spanWordCount = rightIdx - leftIdx + 1;
  if (spanWordCount >= 2 && spanWordCount <= 6) {
    const startChar = words[leftIdx].absStart;
    const endChar = words[rightIdx].absEnd;
    const phrase = fullText.slice(startChar, endChar).trim();

    if (phrase.length > clickedWord.text.length) {
      return {
        phrase,
        startIndex: startChar,
        endIndex: endChar,
        contextSentence,
      };
    }
  }

  return null;
}
