// src/profanityFilter.js

// 1. Expanded Dictionary (English + Local Malaysian Terms)
const BANNED_WORDS = [
  "fuck", "fuk", "fck", "shit", "bitch", "asshole", "crap", "damn", "dick", 
  "pussy", "slut", "whore", "bastard", "cunt", "fag", "nigger", "nigga", 
  "prick", "bullshit", "twat", "wanker", "retard", "rape",
  // Localized terms
  "babi", "bodoh", "sial", "pukimak", "lancau", "bangsat", "gampang", "kimak", "cibai"
];

// 2. Allowlist for false positives (The "Scunthorpe" Problem)
const ALLOW_LIST = [
  "class", "glass", "pass", "compass", "assassin", "bass"
];

// 3. Expanded LeetMap (Catches stars, symbols, and lookalikes)
const leetMap = {
  a: '[a@4\\*]',
  b: '[b8]',
  c: '[ck\\(]',
  e: '[e3\\*]',
  i: '[i1!l\\*]',
  o: '[o0\\*]',
  s: '[s\\$5z]',
  t: '[t7\\+]',
  u: '[u\\*v]'
};

// 4. PRECOMPILE REGEXES (Huge performance boost)
// Runs only once when the file loads, not every time a user types
const compiledRegexes = BANNED_WORDS.map(word => {
  let patternStr = "";
  
  for (let char of word) {
    if (leetMap[char]) {
      // The [\\W_]* addition catches spaces and dots (e.g., f.u.c.k or f u c k)
      patternStr += leetMap[char] + '+[\\W_]*'; 
    } else {
      patternStr += char + '+[\\W_]*'; 
    }
  }
  
  // Remove the trailing separator catcher so the boundary works properly
  patternStr = patternStr.replace(/\[\\W_\]\*$/, '');

  // Fixed Boundary: Replaces \b to successfully catch words starting with symbols (like @ss)
  return new RegExp(`(?:^|\\s|[^a-zA-Z0-9_])(${patternStr})(?:(?=\\s|[^a-zA-Z0-9_])|$)`, 'i');
});

export const containsProfanity = (text) => {
  if (!text) return false;
  
  let sanitizedText = text.toLowerCase();

  // Remove allowlist words from the test string so "class" doesn't trigger "ass"
  ALLOW_LIST.forEach(allowedWord => {
    sanitizedText = sanitizedText.replace(new RegExp(`\\b${allowedWord}\\b`, 'g'), '');
  });

  // Test the cleaned string against our precompiled regex rules
  return compiledRegexes.some(regex => regex.test(sanitizedText));
};