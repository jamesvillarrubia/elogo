/**
 * Cookie Management Utilities
 * 
 * Handles user identification and vote history tracking using cookies.
 */

import { VoteHistory } from '@/types';

const USER_ID_COOKIE = 'elo_voter_user_id';
const VOTE_HISTORY_COOKIE = 'elo_voter_history';
const COOKIE_EXPIRY_DAYS = 30;

/**
 * Generates a unique user ID if one doesn't exist
 * @returns The user ID
 */
export function getOrCreateUserId(): string {
  if (typeof window === 'undefined') return '';
  
  const existingId = getCookie(USER_ID_COOKIE);
  if (existingId) return existingId;
  
  const newId = crypto.randomUUID();
  setCookie(USER_ID_COOKIE, newId, COOKIE_EXPIRY_DAYS);
  return newId;
}

/**
 * Gets the user's vote history
 * @returns The vote history object
 */
export function getVoteHistory(): VoteHistory {
  if (typeof window === 'undefined') return { userId: '', logoComparisons: new Set() };
  
  const userId = getOrCreateUserId();
  const historyJson = getCookie(VOTE_HISTORY_COOKIE);
  
  if (!historyJson) {
    return { userId, logoComparisons: new Set() };
  }
  
  try {
    const parsed = JSON.parse(historyJson);
    return {
      userId,
      logoComparisons: new Set(parsed.logoComparisons || [])
    };
  } catch {
    return { userId, logoComparisons: new Set() };
  }
}

/**
 * Updates the vote history with a new comparison
 * @param logo1Id - First logo ID
 * @param logo2Id - Second logo ID
 */
export function updateVoteHistory(logo1Id: string, logo2Id: string): void {
  if (typeof window === 'undefined') return;
  
  const history = getVoteHistory();
  const comparisonKey = [logo1Id, logo2Id].sort().join('-');
  
  // Check if this comparison has already been made
  if (history.logoComparisons.has(comparisonKey)) {
    console.log('Comparison already exists:', comparisonKey);
    return;
  }
  
  // Add the new comparison
  history.logoComparisons.add(comparisonKey);
  
  // Save the updated history
  const historyJson = JSON.stringify({
    userId: history.userId,
    logoComparisons: Array.from(history.logoComparisons)
  });
  
  setCookie(VOTE_HISTORY_COOKIE, historyJson, COOKIE_EXPIRY_DAYS);
}

/**
 * Checks if two logos have been compared before
 * @param logo1Id - First logo ID
 * @param logo2Id - Second logo ID
 * @returns True if the logos have been compared before
 */
export function hasBeenCompared(logo1Id: string, logo2Id: string, voteHistory: VoteHistory): boolean {
  const comparisonKey = [logo1Id, logo2Id].sort().join('-');
  return voteHistory.logoComparisons.has(comparisonKey);
}

export function addComparison(logo1Id: string, logo2Id: string, voteHistory: VoteHistory): VoteHistory {
  const comparisonKey = [logo1Id, logo2Id].sort().join('-');
  const newComparisons = new Set(voteHistory.logoComparisons);
  newComparisons.add(comparisonKey);
  return {
    ...voteHistory,
    logoComparisons: newComparisons
  };
}

/**
 * Clears all application cookies
 */
export function clearCookies(): void {
  if (typeof window === 'undefined') {
    console.log('clearCookies: Not in browser environment');
    return;
  }
  
  console.log('clearCookies: Starting to clear cookies...');
  const cookies = [USER_ID_COOKIE, VOTE_HISTORY_COOKIE];
  
  cookies.forEach(cookieName => {
    console.log(`clearCookies: Attempting to clear ${cookieName}`);
    // Clear with various path and domain combinations to ensure removal
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
    document.cookie = `${cookieName}=; max-age=0; path=/;`;
  });
  
  // Force a page reload to ensure clean state
  window.location.reload();
  
  console.log('clearCookies: Cookie clearing complete');
  console.log('Current cookies:', document.cookie);
}

function setCookie(name: string, value: string, days: number): void {
  const date = new Date();
  date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${encodeURIComponent(value)};${expires};path=/`;
}

function getCookie(name: string): string {
  const cookieName = `${name}=`;
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i].trim();
    if (cookie.startsWith(cookieName)) {
      return decodeURIComponent(cookie.substring(cookieName.length));
    }
  }
  
  return '';
} 