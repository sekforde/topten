'use client'

import { StarRating } from './star-rating'
import { calculateItemScore } from '@/lib/utils'
import type { Item, Criterion } from '@/types'

interface ItemCardProps {
    index: number
    item: Item
    criteria: Criterion[]
    userId?: string
    isOwner?: boolean
    onRate?: (itemId: string, criterionId: string, value: number) => void
    onRemove?: (itemId: string) => void
}

export function ItemCard({ index, item, criteria, userId, isOwner, onRate, onRemove }: ItemCardProps) {
    const scoreData = calculateItemScore(item)

    return (
        <div className="bg-white rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                    <h3 className="text-3xl font-bold text-gray-900">
                        {index + 1}. {item.name}
                    </h3>
                </div>

                <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold">{scoreData.averageScore.toFixed(1)}</div>
                </div>
            </div>

            <div className="space-y-3">
                {criteria.map((criterion) => {
                    const userRating = userId
                        ? item.ratings.find((r) => r.userId === userId && r.criterionId === criterion.id)
                        : undefined

                    const criterionScore = scoreData.criteriaScores.get(criterion.id)

                    return (
                        <div key={criterion.id} className="">
                            <div className="flex flex-row justify-between items-center">
                                <div className="flex-1 pl-12 text-xl font-medium text-gray-700 border-0 border-blue-500">
                                    {criterion.name}
                                </div>
                                <StarRating
                                    value={userRating?.value ?? -1}
                                    onChange={onRate ? (value) => onRate(item.id, criterion.id, value) : undefined}
                                    readonly={!onRate || !userId}
                                    showNoExperience={!!userId}
                                />
                                <div className="text-md text-gray-500 w-18 text-right">
                                    {criterionScore && <span>{criterionScore.average.toFixed(1)}</span>}
                                    {criterionScore && <span> ({criterionScore.count})</span>}
                                </div>
                            </div>
                        </div>
                    )
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
    )
}
