import { detectDynamicGrammaticalPhrase } from './src/utils/dynamicGrammarMatcher.ts';
import { detectLinguisticUnitAtToken, tokenizeText } from './src/utils/textParser.ts';

const sentence = "Beijing seamlessly blends ancient history with breathtaking modern architecture.";

// Tokenize text
const tokens = tokenizeText(sentence, false);
console.log("Tokens in sentence:");
tokens.forEach(t => console.log(`[${t.startIndex}-${t.endIndex}] "${t.text}"`));

const historyToken = tokens.find(t => t.text.toLowerCase() === 'history');
console.log("\nHistory token:", historyToken);

if (historyToken) {
  const result = detectLinguisticUnitAtToken(sentence, historyToken, false);
  console.log("\ndetectLinguisticUnitAtToken result for 'history':", result);
}

const ancientToken = tokens.find(t => t.text.toLowerCase() === 'ancient');
if (ancientToken) {
  const result = detectLinguisticUnitAtToken(sentence, ancientToken, false);
  console.log("\ndetectLinguisticUnitAtToken result for 'ancient':", result);
}
