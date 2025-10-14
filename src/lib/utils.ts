import type { Item, ItemWithScore } from '@/types';

export function calculateItemScore(item: Item): ItemWithScore {
  const ratingsByUser = new Map<string, number>();
  const criteriaScores = new Map<string, { average: number; count: number }>();
  
  let totalScore = 0;
  let totalCount = 0;

  // Group ratings by criterion
  const byCriterion = new Map<string, number[]>();
  
  for (const rating of item.ratings) {
    if (rating.value > 0) { // Exclude "no experience" (-1) and unrated (0)
      totalScore += rating.value;
      totalCount++;
      
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
  for (const [criterionId, values] of byCriterion.entries()) {
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    criteriaScores.set(criterionId, { average, count: values.length });
  }

  const averageScore = totalCount > 0 ? totalScore / totalCount : 0;

  return {
    item,
    averageScore,
    totalRatings: totalCount,
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

