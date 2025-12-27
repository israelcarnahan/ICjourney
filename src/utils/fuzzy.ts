/**
 * Fuzzy string matching utilities for pub deduplication
 */

/**
 * Normalize a string for comparison:
 * - lowercase, trim, collapse spaces
 * - strip punctuation
 * - remove common suffixes (pub, inn, bar, the, &, ltd, co, company)
 * - keep numbers
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  
  return str
    .toLowerCase()
    .trim()
    // Collapse multiple spaces to single space
    .replace(/\s+/g, ' ')
    // Remove punctuation except numbers
    .replace(/[^\w\s]/g, '')
    // Remove common suffixes
    .replace(/\b(pub|inn|bar|the|&|ltd|co|company)\b/g, '')
    .trim();
}

/**
 * Extract tokens from a string (words, numbers)
 */
export function extractTokens(str: string): string[] {
  if (!str) return [];
  return str
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 0);
}

/**
 * Calculate token overlap between two strings
 */
export function tokenOverlap(strA: string, strB: string): number {
  const tokensA = new Set(extractTokens(strA));
  const tokensB = new Set(extractTokens(strB));
  
  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      overlap++;
    }
  }
  
  return overlap;
}

/**
 * Jaro distance between two strings
 */
function jaroDistance(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  const matchWindow = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  if (matchWindow < 0) return 0.0;
  
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);
  
  let matches = 0;
  let transpositions = 0;
  
  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, s2.length);
    
    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }
  
  if (matches === 0) return 0.0;
  
  // Find transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }
  
  return (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler similarity with prefix scaling
 */
export function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroDistance(s1, s2);
  
  if (jaro < 0.7) return jaro;
  
  // Find common prefix length (max 4 characters)
  let prefixLength = 0;
  const maxPrefix = Math.min(4, s1.length, s2.length);
  
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }
  
  return jaro + 0.1 * prefixLength * (1 - jaro);
}

/**
 * Extract digits only from a string
 */
export function extractDigits(str: string): string {
  if (!str) return '';
  return str.replace(/\D/g, '');
}

/**
 * Extract local part of email (before @)
 */
export function extractEmailLocal(email: string): string {
  if (!email) return '';
  const atIndex = email.indexOf('@');
  return atIndex > 0 ? email.substring(0, atIndex).toLowerCase() : '';
}

/**
 * Normalize postcode (remove spaces, uppercase)
 */
export function normalizePostcode(postcode: string): string {
  if (!postcode) return '';
  return postcode.replace(/\s/g, '').toUpperCase();
}
