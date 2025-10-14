'use client';

import { StarRating } from './star-rating';
import { calculateItemScore } from '@/lib/utils';
import type { Item, Criterion } from '@/types';

interface ItemCardProps {
  item: Item;
  criteria: Criterion[];
  userId?: string;
  isOwner?: boolean;
  onRate?: (itemId: string, criterionId: string, value: number) => void;
  onRemove?: (itemId: string) => void;
}

export function ItemCard({ item, criteria, userId, isOwner, onRate, onRemove }: ItemCardProps) {
  const scoreData = calculateItemScore(item);
  const hasLowConfidence = scoreData.totalRatings < 2;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{item.name}</h3>
          {item.description && (
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
          )}
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="text-3xl font-bold text-blue-600">
            {scoreData.averageScore.toFixed(1)}
          </div>
          <div className="text-xs text-gray-500">
            {scoreData.totalRatings} {scoreData.totalRatings === 1 ? 'rating' : 'ratings'}
          </div>
          {hasLowConfidence && (
            <div className="text-xs text-amber-600 mt-1">Low confidence</div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {criteria.map((criterion) => {
          const userRating = userId 
            ? item.ratings.find(r => r.userId === userId && r.criterionId === criterion.id)
            : undefined;
          
          const criterionScore = scoreData.criteriaScores.get(criterion.id);

          return (
            <div key={criterion.id} className="border-t pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-700">{criterion.name}</span>
                {criterionScore && (
                  <span className="text-sm text-gray-500">
                    Avg: {criterionScore.average.toFixed(1)} ({criterionScore.count})
                  </span>
                )}
              </div>
              
              <StarRating
                value={userRating?.value ?? -1}
                onChange={onRate ? (value) => onRate(item.id, criterion.id, value) : undefined}
                readonly={!onRate || !userId}
                showNoExperience={!!userId}
              />
            </div>
          );
        })}
      </div>

      {isOwner && onRemove && (
        <button
          onClick={() => onRemove(item.id)}
          className="w-full mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
        >
          Remove Item
        </button>
      )}
    </div>
  );
}

