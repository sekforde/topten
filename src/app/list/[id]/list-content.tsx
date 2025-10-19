'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs'
import { ItemCard } from '@/components/item-card'
import { ListNavigator } from '@/components/list-navigator'
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

interface ListSummary {
    id: string
    name: string
    itemCount: number
    memberCount: number
    isOwner: boolean
}

interface ListContentProps {
    list: TopTenList
    userIdentity: { userId: string; displayName: string } | null
    isOwner: boolean
    userLists: ListSummary[]
}

export default function ListContent({
    list: initialList,
    userIdentity: initialUserIdentity,
    isOwner,
    userLists
}: ListContentProps) {
    const router = useRouter()
    const { user: clerkUser } = useUser()
    const [list, setList] = useState(initialList)
    const [userIdentity, setUserIdentity] = useState(initialUserIdentity)
    const [showAddItemForm, setShowAddItemForm] = useState(false)
    const [newItemName, setNewItemName] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [shareUrl, setShareUrl] = useState('')
    const [showCopyNotification, setShowCopyNotification] = useState(false)
    const [showEditCriteria, setShowEditCriteria] = useState(false)
    const [newCriterionName, setNewCriterionName] = useState('')
    const [criteriaError, setCriteriaError] = useState('')
    const [showMenu, setShowMenu] = useState(false)
    const [isItemsExpanded, setIsItemsExpanded] = useState(true)
    const [showShareModal, setShowShareModal] = useState(false)
    const [isJoining, setIsJoining] = useState(false)
    const [sortedOrder, setSortedOrder] = useState<string[]>([])
    const [needsResort, setNeedsResort] = useState(false)

    // Sync local state with server data when it updates
    useEffect(() => {
        setList(initialList)
    }, [initialList])

    // Sync user identity when it updates
    useEffect(() => {
        setUserIdentity(initialUserIdentity)
    }, [initialUserIdentity])

    // No longer needed - Clerk handles authentication automatically

    // Set share URL on client
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setShareUrl(window.location.href.split('?')[0]) // Remove query params for share URL
        }
    }, [])

    // Personal links not needed - Clerk handles cross-device authentication

    // Check if user is a member of this list
    const isMember = clerkUser && list.users.some(u => u.id === clerkUser.id)

    // Auto-join logged-in users who aren't members yet
    useEffect(() => {
        async function autoJoinUser() {
            if (clerkUser && !isMember && !isJoining) {
                setIsJoining(true)
                const result = await joinList(list.id)
                if (result.success) {
                    router.refresh()
                }
                setIsJoining(false)
            }
        }
        autoJoinUser()
    }, [clerkUser, isMember, list.id, router, isJoining])

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
        setNeedsResort(true) // Mark that we need to resort
        router.refresh()
    }

    function handleResort() {
        const itemsWithScores = list.items.map((item) => calculateItemScore(item, list.criteria.length))
        const sorted = sortItemsByScore(itemsWithScores)
        setSortedOrder(sorted.map((item) => item.item.id))
        setNeedsResort(false)
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

    function handleOpenShareModal() {
        setShowShareModal(true)
        setShowMenu(false)
    }

    async function handleCopyLink(url: string) {
        try {
            await navigator.clipboard.writeText(url)
            setShowCopyNotification(true)
            setTimeout(() => setShowCopyNotification(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
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

    // Calculate scores with weighted formula
    const itemsWithScores = list.items.map((item) => calculateItemScore(item, list.criteria.length))
    
    // Initialize sorted order on first load or when items change
    useEffect(() => {
        if (sortedOrder.length === 0 && list.items.length > 0) {
            const initialItemsWithScores = list.items.map((item) => calculateItemScore(item, list.criteria.length))
            const initialSorted = sortItemsByScore(initialItemsWithScores)
            setSortedOrder(initialSorted.map((item) => item.item.id))
        }
    }, [sortedOrder.length, list.items, list.criteria.length])
    
    // Sort items - use saved order if available, otherwise sort by score
    const sortedItems = sortedOrder.length > 0
        ? sortedOrder
              .map((id) => itemsWithScores.find((item) => item.item.id === id))
              .filter((item): item is NonNullable<typeof item> => item !== undefined)
        : sortItemsByScore(itemsWithScores)

    // Calculate participation
    const totalUsers = list.users.length
    const usersWhoRated = new Set(
        list.items.flatMap((item) => item.ratings.filter((r) => r.value > 0).map((r) => r.userId))
    ).size

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-12">
            <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
                {/* Share Modal */}
                {showShareModal && shareUrl && (
                    <>
                        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowShareModal(false)} />
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">Share List</h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            Share this link with others to invite them
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setShowShareModal(false)}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="mb-4">
                                    <input
                                        type="text"
                                        value={shareUrl}
                                        readOnly
                                        className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                    />
                                </div>

                                <button
                                    onClick={() => handleCopyLink(shareUrl)}
                                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    {showCopyNotification ? '✓ Link Copied!' : 'Copy Link'}
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Navigation Bar */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 text-sm">
                        ← Back to home
                    </button>
                    <div className="flex items-center gap-3">
                        <ListNavigator currentListId={list.id} lists={userLists} />
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" />
                        </SignedIn>
                    </div>
                </div>
                {/* Header */}
                <div className="bg-white rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{list.name}</h1>
                            {userIdentity && (
                                <div className="mt-2 flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Logged in as</span>
                                    <span className="text-sm font-semibold text-gray-900">{userIdentity.displayName}</span>
                                    {isOwner && (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                                            Owner
                                        </span>
                                    )}
                                </div>
                            )}
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
                                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg border border-gray-200 py-1 z-20">
                                        <button
                                            onClick={handleOpenShareModal}
                                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50 flex items-center gap-3"
                                        >
                                            <span className="text-lg">🔗</span>
                                            <span className="font-medium text-gray-900">Share List</span>
                                        </button>

                                        {isOwner && (
                                            <>
                                                <div className="border-t border-gray-100 my-1" />
                                                <div className="px-4 py-2">
                                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                        Owner Actions
                                                    </div>
                                                </div>
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
                    <div className="mb-4">
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

                {/* Sign In or Joining Message */}
                {!clerkUser && (
                    <div className="bg-white rounded-lg p-6 mb-6 text-center">
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in to join this list</h2>
                        <p className="text-gray-600 mb-4">
                            You need to be signed in to collaborate on this list
                        </p>
                        <SignInButton mode="modal">
                            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                                Sign In to Join
                            </button>
                        </SignInButton>
                    </div>
                )}

                {clerkUser && !isMember && isJoining && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
                        <div className="flex items-center justify-center gap-3">
                            <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
                            <p className="text-blue-900 font-medium">Joining list...</p>
                        </div>
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

                {/* Control Buttons */}
                {sortedItems.length > 0 && (
                    <div className="mb-6 flex gap-3">
                        <button
                            onClick={() => setIsItemsExpanded(!isItemsExpanded)}
                            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <span>{isItemsExpanded ? '▼' : '▶'}</span>
                            <span>{isItemsExpanded ? 'Collapse All' : 'Expand All'}</span>
                        </button>
                        <button
                            onClick={handleResort}
                            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                                needsResort
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 animate-pulse'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            <span>↕️</span>
                            <span>{needsResort ? 'Re-sort Items' : 'Sort Items'}</span>
                        </button>
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
                                    isExpanded={isItemsExpanded}
                                    onRate={userIdentity ? handleRate : undefined}
                                    onRemove={isOwner ? handleRemoveItem : undefined}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Back Link */}
                <div className="mt-8 text-center hidden">
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 text-sm">
                        ← Back to home
                    </button>
                </div>
            </div>
        </div>
    )
}
