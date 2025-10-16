'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCard } from '@/components/item-card'
import { calculateItemScore, sortItemsByScore } from '@/lib/utils'
import {
    joinList,
    addItem,
    rateItem,
    removeItem,
    toggleLockList,
    addCriterion,
    removeCriterion
} from '@/actions/list-actions'
import type { TopTenList } from '@/types'

interface ListContentProps {
    list: TopTenList
    userIdentity: { userId: string; displayName: string } | null
    isOwner: boolean
}

export default function ListContent({
    list: initialList,
    userIdentity: initialUserIdentity,
    isOwner
}: ListContentProps) {
    const router = useRouter()
    const [list, setList] = useState(initialList)
    const [userIdentity, setUserIdentity] = useState(initialUserIdentity)
    const [displayName, setDisplayName] = useState('')
    const [showJoinForm, setShowJoinForm] = useState(!initialUserIdentity)
    const [showAddItemForm, setShowAddItemForm] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [shareUrl, setShareUrl] = useState('')
    const [showCopyNotification, setShowCopyNotification] = useState(false)
    const [showEditCriteria, setShowEditCriteria] = useState(false)
    const [newCriterionName, setNewCriterionName] = useState('')
    const [criteriaError, setCriteriaError] = useState('')
    const [showMenu, setShowMenu] = useState(false)

    // Sync local state with server data when it updates
    useEffect(() => {
        setList(initialList)
    }, [initialList])

    // Sync user identity when it updates
    useEffect(() => {
        setUserIdentity(initialUserIdentity)
    }, [initialUserIdentity])

    // Set share URL on client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareUrl(window.location.href)
        }
    }, [])

    async function handleJoin(e: React.FormEvent) {
        e.preventDefault()
        if (!displayName.trim()) return

        setIsSubmitting(true)
        const result = await joinList(list.id, displayName.trim())

        if (result.success && result.userId) {
            setUserIdentity({ userId: result.userId, displayName: displayName.trim() })
            setShowJoinForm(false)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    async function handleAddItem(e: React.FormEvent) {
        e.preventDefault()
        if (!newItemName.trim() || !userIdentity) return

        setIsSubmitting(true)
        const result = await addItem(list.id, newItemName.trim())

        if (result.success) {
            setNewItemName('')
            setShowAddItemForm(false)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    async function handleRate(itemId: string, criterionId: string, value: number) {
        if (!userIdentity) return

        await rateItem(list.id, itemId, criterionId, value)
        router.refresh()
    }

    async function handleRemoveItem(itemId: string) {
        if (!isOwner || !confirm('Are you sure you want to remove this item?')) return

        const ownerToken = list.ownerToken // In production this would come from cookie
        await removeItem(list.id, itemId, ownerToken)
        router.refresh()
    }

    async function handleToggleLock() {
        if (!isOwner) return

        const ownerToken = list.ownerToken
        await toggleLockList(list.id, ownerToken)
        router.refresh()
    }

    async function handleCopyLink() {
        if (shareUrl) {
            await navigator.clipboard.writeText(shareUrl)
            setShowCopyNotification(true)
            setTimeout(() => setShowCopyNotification(false), 2000)
            setShowMenu(false)
        }
    }

    function handleEditCriteriaToggle() {
        setShowEditCriteria(!showEditCriteria)
        setShowMenu(false)
    }

    async function handleToggleLockMenu() {
        await handleToggleLock()
        setShowMenu(false)
    }

    async function handleAddCriterion(e: React.FormEvent) {
        e.preventDefault()
        if (!newCriterionName.trim() || !isOwner) return

        setIsSubmitting(true)
        setCriteriaError('')

        const ownerToken = list.ownerToken
        const result = await addCriterion(list.id, newCriterionName.trim(), ownerToken)

        if (result.success) {
            setNewCriterionName('')
            router.refresh()
        } else {
            setCriteriaError(result.error || 'Failed to add criterion')
        }

        setIsSubmitting(false)
    }

    async function handleRemoveCriterion(criterionId: string, criterionName: string) {
        if (!isOwner || !confirm(`Remove "${criterionName}"? This will delete all ratings for this criterion.`)) return

        const ownerToken = list.ownerToken
        await removeCriterion(list.id, criterionId, ownerToken)
        router.refresh()
    }

    // Calculate scores and sort items
    const itemsWithScores = list.items.map((item) => calculateItemScore(item))
    const sortedItems = sortItemsByScore(itemsWithScores)

    // Calculate participation
    const totalUsers = list.users.length
    const usersWhoRated = new Set(
        list.items.flatMap((item) => item.ratings.filter((r) => r.value > 0).map((r) => r.userId))
    ).size

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-12">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                {/* Header */}
                <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{list.name}</h1>
                        </div>

                        {/* Menu Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Menu"
                            >
                                <span className="text-2xl text-gray-700">⋯</span>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg border border-gray-200 py-1 z-20">
                                        <button
                                            onClick={handleCopyLink}
                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                        >
                                            <span>🔗</span>
                                            <span>{showCopyNotification ? '✓ Link Copied!' : 'Copy Share Link'}</span>
                                        </button>

                                        {isOwner && (
                                            <>
                                                <div className="border-t border-gray-100 my-1" />
                                                <button
                                                    onClick={handleEditCriteriaToggle}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                >
                                                    <span>✏️</span>
                                                    <span>
                                                        {showEditCriteria ? 'Done Editing Criteria' : 'Edit Criteria'}
                                                    </span>
                                                </button>

                                                <button
                                                    onClick={handleToggleLockMenu}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                                                >
                                                    <span>{list.isLocked ? '🔓' : '🔒'}</span>
                                                    <span>{list.isLocked ? 'Unlock List' : 'Lock List'}</span>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Criteria */}
                    <div className="mb-4 hidden">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Rating Criteria:</h3>
                        <div className="flex flex-wrap gap-2">
                            {list.criteria.map((criterion) => (
                                <span
                                    key={criterion.id}
                                    className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2"
                                >
                                    {criterion.name}
                                    {showEditCriteria && isOwner && list.criteria.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveCriterion(criterion.id, criterion.name)}
                                            className="text-red-600 hover:text-red-700 ml-1"
                                            title="Remove criterion"
                                        >
                                            ×
                                        </button>
                                    )}
                                </span>
                            ))}
                        </div>

                        {/* Add Criterion Form */}
                        {showEditCriteria && isOwner && (
                            <form onSubmit={handleAddCriterion} className="mt-3 flex gap-2">
                                <input
                                    type="text"
                                    value={newCriterionName}
                                    onChange={(e) => setNewCriterionName(e.target.value)}
                                    placeholder="New criterion name..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !newCriterionName.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Adding...' : 'Add'}
                                </button>
                            </form>
                        )}

                        {criteriaError && <p className="mt-2 text-sm text-red-600">{criteriaError}</p>}
                    </div>
                </div>

                {/* Join Form */}
                {showJoinForm && (
                    <div className="bg-white rounded-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Join this list</h2>
                        <form onSubmit={handleJoin} className="space-y-4">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your display name
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="e.g., Dad, Mum, Alice"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isSubmitting ? 'Joining...' : 'Join List'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Add Item Button/Form */}
                {userIdentity && !list.isLocked && (
                    <div className="mb-6">
                        {!showAddItemForm ? (
                            <button
                                onClick={() => setShowAddItemForm(true)}
                                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                + Add New Item
                            </button>
                        ) : (
                            <div className="bg-white rounded-lg p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Add a new item</h2>
                                <form onSubmit={handleAddItem} className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="itemName"
                                            className="block text-sm font-medium text-gray-700 mb-2"
                                        >
                                            Item name *
                                        </label>
                                        <input
                                            type="text"
                                            id="itemName"
                                            value={newItemName}
                                            onChange={(e) => setNewItemName(e.target.value)}
                                            placeholder="e.g., Portugal, Pizza Night"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                            required
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                                        >
                                            {isSubmitting ? 'Adding...' : 'Add Item'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAddItemForm(false)
                                                setNewItemName('')
                                            }}
                                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* Items List */}
                <div>
                    {sortedItems.length === 0 ? (
                        <div className="bg-white rounded-lg p-8 text-center">
                            <p className="text-gray-600">
                                {userIdentity
                                    ? 'Be the first to add an item to this list!'
                                    : 'Join the list to start adding items and voting.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sortedItems.map((itemWithScore, index) => (
                                <ItemCard
                                    key={itemWithScore.item.id}
                                    index={index}
                                    item={itemWithScore.item}
                                    criteria={list.criteria}
                                    userId={userIdentity?.userId}
                                    isOwner={isOwner}
                                    onRate={userIdentity ? handleRate : undefined}
                                    onRemove={isOwner ? handleRemoveItem : undefined}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center">
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 text-sm">
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    )
}
