import { 
  normalizeString, 
  jaroWinkler, 
  tokenOverlap, 
  extractDigits, 
  extractEmailLocal, 
  normalizePostcode 
} from './fuzzy';
import { devLog } from './devLog';
import type { Suggestion, ReasonBadge } from '../components/DedupReviewDialog';
import type { Pub as ContextPub } from '../context/PubDataContext';

export interface Pub {
  uuid: string;
  name: string;
  postcode?: string;
  address?: string;
  town?: string;
  phone?: string;
  email?: string;
  rtm?: string;
  [key: string]: any;
}

export interface DedupeCandidate {
  existing: Pub;
  incoming: Pub;
  nameSim: number;
  score: number;
  reasons: string[];
}

export interface DedupeResult {
  autoMerge: DedupeCandidate[];
  needsReview: DedupeCandidate[];
}

export interface SuggestionResult {
  autoMerge: Suggestion[];
  needsReview: Suggestion[];
}

/**
 * Generate candidates for deduplication based on postcode and address rules
 */
function generateCandidates(existingPubs: Pub[], incomingPub: Pub): Pub[] {
  const candidates: Pub[] = [];
  
  // If incoming has postcode, only compare to pubs with same postcode
  if (incomingPub.postcode) {
    const normIncomingPostcode = normalizePostcode(incomingPub.postcode);
    for (const existing of existingPubs) {
      if (existing.postcode && normalizePostcode(existing.postcode) === normIncomingPostcode) {
        candidates.push(existing);
      }
    }
    return candidates;
  }
  
  // If town present, compare to pubs with same town and address token overlap >= 2
  if (incomingPub.town) {
    for (const existing of existingPubs) {
      if (existing.town && existing.town.toLowerCase() === incomingPub.town.toLowerCase()) {
        if (incomingPub.address && existing.address) {
          const overlap = tokenOverlap(incomingPub.address, existing.address);
          if (overlap >= 2) {
            candidates.push(existing);
          }
        }
      }
    }
    return candidates;
  }
  
  // Fallback: compare to pubs with address token overlap >= 3
  for (const existing of existingPubs) {
    if (incomingPub.address && existing.address) {
      const overlap = tokenOverlap(incomingPub.address, existing.address);
      if (overlap >= 3) {
        candidates.push(existing);
      }
    }
  }
  
  return candidates;
}

/**
 * Calculate composite similarity score for a candidate pair
 */
function calculateScore(existing: Pub, incoming: Pub, nameSim: number): { score: number; reasons: string[] } {
  let score = nameSim;
  const reasons: string[] = [];
  
  // Postcode bonus
  if (existing.postcode && incoming.postcode) {
    const normExisting = normalizePostcode(existing.postcode);
    const normIncoming = normalizePostcode(incoming.postcode);
    if (normExisting === normIncoming) {
      score += 0.05;
      reasons.push('postcode');
    }
  }
  
  // RTM bonus
  if (existing.rtm && incoming.rtm && existing.rtm.toLowerCase() === incoming.rtm.toLowerCase()) {
    score += 0.03;
    reasons.push('rtm');
  }
  
  // Address token overlap bonus
  if (existing.address && incoming.address) {
    const overlap = tokenOverlap(existing.address, incoming.address);
    if (overlap >= 3) {
      score += 0.03;
      reasons.push('3+ address tokens');
    } else if (overlap === 2) {
      score += 0.02;
      reasons.push('2 address tokens');
    }
  }
  
  // Town bonus
  if (existing.town && incoming.town && existing.town.toLowerCase() === incoming.town.toLowerCase()) {
    score += 0.02;
    reasons.push('town');
  }
  
  // Phone bonus
  if (existing.phone && incoming.phone) {
    const existingDigits = extractDigits(existing.phone);
    const incomingDigits = extractDigits(incoming.phone);
    if (existingDigits && incomingDigits && existingDigits === incomingDigits) {
      score += 0.01;
      reasons.push('phone');
    }
  }
  
  // Email bonus
  if (existing.email && incoming.email) {
    const existingLocal = extractEmailLocal(existing.email);
    const incomingLocal = extractEmailLocal(incoming.email);
    if (existingLocal && incomingLocal && existingLocal === incomingLocal) {
      score += 0.01;
      reasons.push('email');
    }
  }
  
  // RTM penalty for very different types
  if (existing.rtm && incoming.rtm) {
    const existingLower = existing.rtm.toLowerCase();
    const incomingLower = incoming.rtm.toLowerCase();
    const wholesaleKeywords = ['wholesale', 'spot', 'managed'];
    
    const existingIsWholesale = wholesaleKeywords.some(keyword => existingLower.includes(keyword));
    const incomingIsWholesale = wholesaleKeywords.some(keyword => incomingLower.includes(keyword));
    
    if (existingIsWholesale !== incomingIsWholesale) {
      score -= 0.05;
      reasons.push('rtm penalty');
    }
  }
  
  return { score: Math.max(0, Math.min(1, score)), reasons };
}

/**
 * Determine if a candidate should be auto-merged, needs review, or ignored
 */
function classifyCandidate(candidate: DedupeCandidate): 'auto-merge' | 'needs-review' | 'ignore' {
  const { existing, incoming, nameSim, score } = candidate;
  
  // Auto-merge conditions
  if (existing.postcode && incoming.postcode && 
      normalizePostcode(existing.postcode) === normalizePostcode(incoming.postcode) && 
      nameSim >= 0.90) {
    return 'auto-merge';
  }
  
  if (score >= 0.92) {
    return 'auto-merge';
  }
  
  // Needs review conditions
  if (score >= 0.86 && score < 0.92) {
    return 'needs-review';
  }
  
  if (existing.postcode && incoming.postcode && 
      normalizePostcode(existing.postcode) === normalizePostcode(incoming.postcode) && 
      nameSim >= 0.80 && nameSim < 0.90 && 
      candidate.reasons.length > 1) {
    return 'needs-review';
  }
  
  return 'ignore';
}

/**
 * Main deduplication function
 */
export function suggest(existingPubs: Pub[], incomingPubs: Pub[]): DedupeResult {
  const autoMerge: DedupeCandidate[] = [];
  const needsReview: DedupeCandidate[] = [];
  
  devLog('dedupe', `Processing ${incomingPubs.length} incoming pubs against ${existingPubs.length} existing pubs`);
  
  for (const incoming of incomingPubs) {
    const candidates = generateCandidates(existingPubs, incoming);
    
    if (candidates.length === 0) {
      devLog('dedupe', `No candidates found for "${incoming.name}"`);
      continue;
    }
    
    let bestCandidate: DedupeCandidate | null = null;
    
    for (const existing of candidates) {
      const normExistingName = normalizeString(existing.name);
      const normIncomingName = normalizeString(incoming.name);
      
      const nameSim = jaroWinkler(normExistingName, normIncomingName);
      
      // Drop immediately if name similarity is too low
      if (nameSim < 0.75) {
        continue;
      }
      
      const { score, reasons } = calculateScore(existing, incoming, nameSim);
      
      const candidate: DedupeCandidate = {
        existing,
        incoming,
        nameSim,
        score,
        reasons
      };
      
      if (!bestCandidate || candidate.score > bestCandidate.score) {
        bestCandidate = candidate;
      }
    }
    
    if (bestCandidate) {
      const classification = classifyCandidate(bestCandidate);
      
      if (classification === 'auto-merge') {
        autoMerge.push(bestCandidate);
        devLog('dedupe', `Auto-merge: "${incoming.name}" → "${bestCandidate.existing.name}" (score: ${bestCandidate.score.toFixed(3)})`);
      } else if (classification === 'needs-review') {
        needsReview.push(bestCandidate);
        devLog('dedupe', `Needs review: "${incoming.name}" → "${bestCandidate.existing.name}" (score: ${bestCandidate.score.toFixed(3)})`);
      }
    }
  }
  
  devLog('dedupe', `Found ${autoMerge.length} auto-merge and ${needsReview.length} needs-review candidates`);
  
  return { autoMerge, needsReview };
}

/**
 * Convert string reasons to ReasonBadge format
 */
function convertReasonsToBadges(reasons: string[]): ReasonBadge[] {
  return reasons.map(reason => {
    if (reason === 'postcode') {
      return { type: 'postcode' };
    } else if (reason === 'rtm') {
      return { type: 'rtm' };
    } else if (reason === 'town') {
      return { type: 'town' };
    } else if (reason === 'phone') {
      return { type: 'phone' };
    } else if (reason === 'email') {
      return { type: 'email' };
    } else if (reason.includes('address tokens')) {
      const match = reason.match(/(\d+)/);
      return { type: 'addrTokens', value: match ? match[1] : '3' };
    } else {
      return { type: 'postcode' }; // fallback
    }
  });
}

/**
 * Convert dedupe candidates to suggestions format
 */
export function convertToSuggestions(
  candidates: DedupeCandidate[],
  existingPubs: Pub[],
  incomingPubs: Pub[],
  fileName: string,
  rowIndices?: Record<string, number>
): Suggestion[] {
  return candidates.map(candidate => {
    const existingPub = existingPubs.find(p => p.uuid === candidate.existing.uuid);
    const incomingPub = incomingPubs.find(p => p.uuid === candidate.incoming.uuid);
    
    if (!existingPub || !incomingPub) {
      throw new Error('Pub not found in conversion');
    }

    // Convert the dedupe Pub format to the context Pub format
    const contextExistingPub: ContextPub = {
      uuid: existingPub.uuid,
      fileId: '',
      fileName: '',
      listType: 'masterhouse',
      zip: existingPub.postcode || '',
      pub: existingPub.name,
      rtm: existingPub.rtm,
      // Add other required fields with defaults
      deadline: undefined,
      priorityLevel: undefined,
      followUpDays: undefined,
      mileageToNext: undefined,
      driveTimeToNext: undefined,
      last_visited: undefined,
      landlord: undefined,
      notes: undefined,
      scheduledTime: undefined,
      visitNotes: undefined,
      Priority: undefined
    };

    return {
      id: `${existingPub.uuid}::${incomingPub.uuid}`,
      existing: contextExistingPub,
      incoming: {
        name: incomingPub.name,
        postcode: incomingPub.postcode,
        extras: {},
        fileName,
        rowIndex: rowIndices?.[incomingPub.uuid] || 0
      },
      nameSim: candidate.nameSim,
      score: candidate.score,
      reasons: convertReasonsToBadges(candidate.reasons),
      defaultAction: candidate.score >= 0.92 ? 'merge' : 'review'
    };
  });
}
