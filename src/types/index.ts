/**
 * Type definitions for the Logo ELO Ranking System
 */

export interface Logo {
  id: string;
  url: string;
  eloRating: number;
  totalMatches: number;
  name?: string;
  description?: string;
}

export interface VoteHistory {
  userId: string;
  logoComparisons: Set<string>;
}

export interface LogoPair {
  logo1: Logo;
  logo2: Logo;
}

export interface VoteResult {
  winnerId: string;
  loserId: string;
  newWinnerRating: number;
  newLoserRating: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  eloRating: number;
  totalMatches: number;
  winRate?: number;
} 