// src/profanityFilter.js

// 1. Expanded Dictionary
const BANNED_WORDS = [
    "fuck", "fuk", "fck", "shit", "bitch", "asshole", "crap", "damn", "dick", 
    "pussy", "slut", "whore", "bastard", "cunt", "fag", "nigger", "nigga", 
    "prick", "bullshit", "slut", "twat", "wanker", "retard", "rape"
  ];
  
  // 2. Expanded LeetMap (Catches stars, symbols, and lookalikes)
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
  
  export const containsProfanity = (text) => {
    if (!text) return false;
    const lowerText = text.toLowerCase();
  
    return BANNED_WORDS.some(word => {
      let patternStr = "";
      
      for (let char of word) {
        if (leetMap[char]) {
          // Allow substitutions and infinite repetitions
          patternStr += leetMap[char] + '+'; 
        } else {
          patternStr += char + '+'; 
        }
      }
      
      // Boundary \b ensures we only match whole words
      const regex = new RegExp(`\\b${patternStr}\\b`, 'i');
      return regex.test(lowerText);
    });
  };