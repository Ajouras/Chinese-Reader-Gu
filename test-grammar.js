import { detectDynamicGrammaticalPhrase } from './src/utils/dynamicGrammarMatcher.js';

function runGrammarMatcherTest() {
  const sentence = "Beijing seamlessly blends ancient history with breathtaking modern architecture.";
  
  // Find token start and end for "history" (index 32 to 39)
  const historyStart = sentence.indexOf("history");
  const historyEnd = historyStart + "history".length;
  
  console.log("Testing token 'history' at", historyStart, historyEnd);
  const result = detectDynamicGrammaticalPhrase(sentence, historyStart, historyEnd, sentence, 0);
  console.log("Result for 'history':", result);
  
  // Find token for "ancient"
  const ancientStart = sentence.indexOf("ancient");
  const ancientEnd = ancientStart + "ancient".length;
  const resultAncient = detectDynamicGrammaticalPhrase(sentence, ancientStart, ancientEnd, sentence, 0);
  console.log("Result for 'ancient':", resultAncient);
}

runGrammarMatcherTest();
