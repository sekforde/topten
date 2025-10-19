import type { Item, ItemWithScore } from '@/types';

/**
 * Weighted Scoring System
 * 
 * Calculates a fair score that:
 * 1. Excludes N/A ratings from averages
 * 2. Normalizes based on ratio of rated criteria to total criteria
 * 
 * Formula: finalScore = (sumOfRatedScores / maxPossibleForRatedCriteria) * (numRatedCriteria / totalCriteria)
 * 
 * This prevents items with fewer applicable criteria from being unfairly advantaged.
 */
export function calculateItemScore(item: Item, totalCriteriaCount?: number): ItemWithScore {
  const ratingsByUser = new Map<string, number>();
  const criteriaScores = new Map<string, { average: number; count: number }>();
  
  // Group ratings by criterion
  const byCriterion = new Map<string, number[]>();
  
  for (const rating of item.ratings) {
    if (rating.value > 0) { // Exclude "no experience" (-1) and unrated (0)
      // Track by user
      const userTotal = ratingsByUser.get(rating.userId) || 0;
      ratingsByUser.set(rating.userId, userTotal + 1);
      
      // Track by criterion
      if (!byCriterion.has(rating.criterionId)) {
        byCriterion.set(rating.criterionId, []);
      }
      byCriterion.get(rating.criterionId)!.push(rating.value);
    }
  }

  // Calculate criterion averages
  let sumOfRatedScores = 0;
  let numRatedCriteria = 0;
  
  for (const [criterionId, values] of byCriterion.entries()) {
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    criteriaScores.set(criterionId, { average, count: values.length });
    
    sumOfRatedScores += average;
    numRatedCriteria++;
  }

  // Apply weighted scoring formula
  let averageScore = 0;
  if (numRatedCriteria > 0) {
    const maxPossibleForRatedCriteria = numRatedCriteria * 5; // Max score is 5
    const rawAverage = sumOfRatedScores / maxPossibleForRatedCriteria;
    
    // Normalize by ratio of rated to total criteria (if total is provided)
    if (totalCriteriaCount && totalCriteriaCount > 0) {
      const criteriaRatio = numRatedCriteria / totalCriteriaCount;
      averageScore = rawAverage * criteriaRatio;
    } else {
      averageScore = rawAverage;
    }
  }

  const totalRatings = Array.from(byCriterion.values()).reduce((sum, ratings) => sum + ratings.length, 0);

  return {
    item,
    averageScore,
    totalRatings,
    ratingsByUser,
    criteriaScores,
  };
}

export function sortItemsByScore(items: ItemWithScore[]): ItemWithScore[] {
  return [...items].sort((a, b) => b.averageScore - a.averageScore);
}

export function getUserRatedCount(items: Item[], userId: string): number {
  return items.filter(item => 
    item.ratings.some(r => r.userId === userId && r.value > 0)
  ).length;
}

