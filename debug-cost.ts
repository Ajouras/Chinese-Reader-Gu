import { detectDynamicGrammaticalPhrase } from './src/utils/dynamicGrammarMatcher.ts';
import { detectLinguisticUnitAtToken, tokenizeText } from './src/utils/textParser.ts';

const sentence = "The high cost of living in the capital city affects many young workers.";
const tokens = tokenizeText(sentence, false);
console.log("Tokens for 'The high cost of living...':");
tokens.forEach(t => console.log(`[${t.startIndex}-${t.endIndex}] "${t.text}"`));

const costToken = tokens.find(t => t.text.toLowerCase() === 'cost');
console.log("\nCost token:", costToken);
if (costToken) {
  const res = detectLinguisticUnitAtToken(sentence, costToken, false);
  console.log("Result for 'cost':", res);
}
