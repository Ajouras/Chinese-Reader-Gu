import { describe, it, expect } from 'vitest';
import { tokenizeText, detectLinguisticUnitAtToken } from './textParser';

function assertPhrase(fullText: string, targetWord: string, expectedPhrase: string) {
  const tokens = tokenizeText(fullText, false);
  const targetToken = tokens.find(t => t.text.toLowerCase() === targetWord.toLowerCase());
  if (!targetToken) {
    throw new Error(`Token "${targetWord}" not found in fullText: "${fullText}"`);
  }

  const match = detectLinguisticUnitAtToken(fullText, targetToken, false);
  const actual = match ? match.phrase : targetToken.text;
  expect(actual).toBe(expectedPhrase);
}

describe('Simplified Phrase Detection Unit Tests', () => {
  it('handles phrasal verbs and proper nouns', () => {
    const s1 = "Fang Yuan, quietly hand over the Spring Autumn Cicada...";
    assertPhrase(s1, "hand", "hand over");
    assertPhrase(s1, "Spring", "Spring Autumn Cicada");
    assertPhrase(s1, "Cicada", "Spring Autumn Cicada");
    assertPhrase(s1, "quietly", "quietly");
  });

  it('restricts noun-phrase expansion to single words', () => {
    const s2 = "Beijing seamlessly blends ancient history with breathtaking modern architecture.";
    assertPhrase(s2, "history", "history");
    assertPhrase(s2, "ancient", "ancient");
  });

  it('restricts collocations to single words', () => {
    const s3 = "We need to make a decision and pay attention to details.";
    assertPhrase(s3, "decision", "decision");
    assertPhrase(s3, "attention", "attention");
  });

  it('handles 3-word phrasal verb tier', () => {
    assertPhrase("I look forward to hearing from you.", "look", "look forward to");
    assertPhrase("I run out of time.", "run", "run out of");
    assertPhrase("He can't put up with this anymore.", "put", "put up with");
  });

  it('handles hyphenated compounds and 2-word phrasal verbs', () => {
    assertPhrase("This is a state-of-the-art solution.", "state", "state-of-the-art");
    assertPhrase("Never give up when things break down.", "give", "give up");
    assertPhrase("Never give up when things break down.", "break", "break down");
  });
});

