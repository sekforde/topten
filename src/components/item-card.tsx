'use client'

import { useState } from 'react'
import { StarRating } from './star-rating'
import { calculateItemScore } from '@/lib/utils'
import type { Item, Criterion } from '@/types'

interface ItemCardProps {
    index: number
    item: Item
    criteria: Criterion[]
    userId?: string
    isOwner?: boolean
    isExpanded?: boolean
    onRate?: (itemId: string, criterionId: string, value: number) => void
    onRemove?: (itemId: string) => void
}

export function ItemCard({ index, item, criteria, userId, isOwner, isExpanded = false, onRate, onRemove }: ItemCardProps) {
    const scoreData = calculateItemScore(item)
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="bg-white rounded-lg p-4 sm:p-6 space-y-4">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 flex items-center gap-2">
                    <h3 className="text-3xl font-bold text-gray-900">
                        {index + 1}. {item.name}
                    </h3>
                    
                    {isOwner && onRemove && (
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="Item menu"
                            >
                                <span className="text-xl text-gray-600">⋯</span>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg border border-gray-200 py-1 z-20 shadow-lg">
                                        <button
                                            onClick={() => {
                                                onRemove(item.id)
                                                setShowMenu(false)
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                                        >
                                            <span>🗑️</span>
                                            <span>Remove Item</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold">{scoreData.averageScore.toFixed(1)}</div>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-3">
                {criteria.map((criterion) => {
                    const userRating = userId
                        ? item.ratings.find((r) => r.userId === userId && r.criterionId === criterion.id)
                        : undefined

                    const criterionScore = scoreData.criteriaScores.get(criterion.id)

                    return (
                        <div key={criterion.id} className="">
                            <div className="flex flex-row justify-between items-center">
                                <div className="flex-1 sm:pl-12 text-xl font-medium text-gray-700 border-0 border-blue-500">
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
            )}
        </div>
    )
}
