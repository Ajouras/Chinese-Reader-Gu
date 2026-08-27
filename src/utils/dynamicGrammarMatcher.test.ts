import { tokenizeText, detectLinguisticUnitAtToken } from './textParser';

function assertPhrase(fullText: string, targetWord: string, expectedPhrase: string) {
  const tokens = tokenizeText(fullText, false);
  const targetToken = tokens.find(t => t.text.toLowerCase() === targetWord.toLowerCase());
  if (!targetToken) {
    throw new Error(`Token "${targetWord}" not found in fullText: "${fullText}"`);
  }

  const match = detectLinguisticUnitAtToken(fullText, targetToken, false);
  const actual = match ? match.phrase : targetToken.text;
  const passed = actual === expectedPhrase;
  console.log(`[Test] "${targetWord}" in "${fullText}"`);
  console.log(`  -> Actual:   "${actual}"`);
  console.log(`  -> Expected: "${expectedPhrase}"`);
  console.log(`  -> Status:   ${passed ? 'PASS' : 'FAIL'}\n`);
  if (!passed) {
    throw new Error(`Assertion failed: expected "${expectedPhrase}", got "${actual}"`);
  }
}

export function runTests() {
  console.log('=== Running Simplified Phrase Detection Unit Tests ===\n');

  // 1. Phrasal verb & Proper noun run test
  // "Fang Yuan, quietly hand over the Spring Autumn Cicada..."
  const s1 = "Fang Yuan, quietly hand over the Spring Autumn Cicada...";
  assertPhrase(s1, "hand", "hand over");
  assertPhrase(s1, "Spring", "Spring Autumn Cicada");
  assertPhrase(s1, "Cicada", "Spring Autumn Cicada");
  assertPhrase(s1, "quietly", "quietly");

  // 2. Former noun-phrase expansion test: should now be single word only
  const s2 = "Beijing seamlessly blends ancient history with breathtaking modern architecture.";
  assertPhrase(s2, "history", "history");
  assertPhrase(s2, "ancient", "ancient");

  // 3. Former collocations test: should now be single word only
  const s3 = "We need to make a decision and pay attention to details.";
  assertPhrase(s3, "decision", "decision");
  assertPhrase(s3, "attention", "attention");

  // 4. 3-word phrasal verb gap ("look forward to"):
  // "forward" is not in the single-particle list, so clicking "look" returns "look"
  const s4 = "I look forward to hearing from you soon.";
  assertPhrase(s4, "look", "look");

  // 5. Hyphenated compound test
  const s5 = "This is a state-of-the-art solution.";
  assertPhrase(s5, "state", "state-of-the-art");

  // 6. Common particle phrasal verb tests ("give up", "break down")
  const s6 = "Never give up when things break down.";
  assertPhrase(s6, "give", "give up");
  assertPhrase(s6, "break", "break down");

  console.log('=== All simplified phrase detection unit tests passed! ===');
}

runTests();
