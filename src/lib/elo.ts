/**
 * ELO Rating System Utilities
 * 
 * This module provides functions for calculating ELO ratings based on match outcomes.
 * Uses the standard ELO formula with configurable K-factor.
 */

/**
 * Calculates the expected score for a player based on their rating and their opponent's rating
 * @param ratingA - Rating of the first player
 * @param ratingB - Rating of the second player
 * @returns Expected score (probability of winning) for player A
 */
export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculates new ELO ratings for both players after a match
 * @param winnerRating - Current rating of the winning player
 * @param loserRating - Current rating of the losing player
 * @param kFactor - K-factor for the rating system (default: 32)
 * @returns Tuple of [newWinnerRating, newLoserRating]
 */
export function calculateNewRatings(
  winnerRating: number,
  loserRating: number,
  kFactor: number = 32
): [number, number] {
  const expectedWinner = calculateExpectedScore(winnerRating, loserRating);
  const expectedLoser = calculateExpectedScore(loserRating, winnerRating);
  
  const newWinnerRating = winnerRating + kFactor * (1 - expectedWinner);
  const newLoserRating = loserRating + kFactor * (0 - expectedLoser);
  
  return [newWinnerRating, newLoserRating];
}

/**
 * Calculates the probability of winning for both players
 * @param ratingA - Rating of the first player
 * @param ratingB - Rating of the second player
 * @returns Tuple of [probabilityA, probabilityB]
 */
export function calculateWinProbabilities(ratingA: number, ratingB: number): [number, number] {
  const probA = calculateExpectedScore(ratingA, ratingB);
  const probB = 1 - probA;
  return [probA, probB];
} 