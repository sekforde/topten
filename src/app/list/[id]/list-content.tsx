'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ItemCard } from '@/components/item-card';
import { calculateItemScore, sortItemsByScore } from '@/lib/utils';
import { joinList, addItem, rateItem, removeItem, toggleLockList } from '@/actions/list-actions';
import type { TopTenList } from '@/types';

interface ListContentProps {
  list: TopTenList;
  userIdentity: { userId: string; displayName: string } | null;
  isOwner: boolean;
}

export default function ListContent({ list: initialList, userIdentity: initialUserIdentity, isOwner }: ListContentProps) {
  const router = useRouter();
  const [list, setList] = useState(initialList);
  const [userIdentity, setUserIdentity] = useState(initialUserIdentity);
  const [displayName, setDisplayName] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(!initialUserIdentity);
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showCopyNotification, setShowCopyNotification] = useState(false);

  // Sync local state with server data when it updates
  useEffect(() => {
    setList(initialList);
  }, [initialList]);

  // Sync user identity when it updates
  useEffect(() => {
    setUserIdentity(initialUserIdentity);
  }, [initialUserIdentity]);

  // Set share URL on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSubmitting(true);
    const result = await joinList(list.id, displayName.trim());
    
    if (result.success && result.userId) {
      setUserIdentity({ userId: result.userId, displayName: displayName.trim() });
      setShowJoinForm(false);
      router.refresh();
    }
    setIsSubmitting(false);
  }

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim() || !userIdentity) return;

    setIsSubmitting(true);
    const result = await addItem(list.id, newItemName.trim(), newItemDescription.trim() || undefined);
    
    if (result.success) {
      setNewItemName('');
      setNewItemDescription('');
      setShowAddItemForm(false);
      router.refresh();
    }
    setIsSubmitting(false);
  }

  async function handleRate(itemId: string, criterionId: string, value: number) {
    if (!userIdentity) return;

    await rateItem(list.id, itemId, criterionId, value);
    router.refresh();
  }

  async function handleRemoveItem(itemId: string) {
    if (!isOwner || !confirm('Are you sure you want to remove this item?')) return;

    const ownerToken = list.ownerToken; // In production this would come from cookie
    await removeItem(list.id, itemId, ownerToken);
    router.refresh();
  }

  async function handleToggleLock() {
    if (!isOwner) return;

    const ownerToken = list.ownerToken;
    await toggleLockList(list.id, ownerToken);
    router.refresh();
  }

  async function handleCopyLink() {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setShowCopyNotification(true);
      setTimeout(() => setShowCopyNotification(false), 2000);
    }
  }

  // Calculate scores and sort items
  const itemsWithScores = list.items.map(item => calculateItemScore(item));
  const sortedItems = sortItemsByScore(itemsWithScores);

  // Calculate participation
  const totalUsers = list.users.length;
  const usersWhoRated = new Set(
    list.items.flatMap(item => 
      item.ratings.filter(r => r.value > 0).map(r => r.userId)
    )
  ).size;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-12">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {list.name}
              </h1>
              {list.description && (
                <p className="text-gray-600">{list.description}</p>
              )}
            </div>
            {isOwner && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                Owner
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <div>{list.items.length} items</div>
            <div>•</div>
            <div>{totalUsers} members</div>
            {totalUsers > 0 && (
              <>
                <div>•</div>
                <div>{usersWhoRated} have voted</div>
              </>
            )}
          </div>

          {/* Criteria */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Rating Criteria:</h3>
            <div className="flex flex-wrap gap-2">
              {list.criteria.map(criterion => (
                <span
                  key={criterion.id}
                  className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {criterion.name}
                </span>
              ))}
            </div>
          </div>

          {/* Share Link */}
          <div className="flex gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm whitespace-nowrap"
            >
              {showCopyNotification ? '✓ Copied!' : 'Copy Link'}
            </button>
          </div>

          {/* Owner Controls */}
          {isOwner && (
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={handleToggleLock}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  list.isLocked
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                }`}
              >
                {list.isLocked ? '🔒 List Locked' : '🔓 Lock List'}
              </button>
            </div>
          )}
        </div>

        {/* Join Form */}
        {showJoinForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
                className="w-full bg-green-600 text-white px-6 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-md"
              >
                + Add New Item
              </button>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add a new item</h2>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label htmlFor="itemName" className="block text-sm font-medium text-gray-700 mb-2">
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
                  <div>
                    <label htmlFor="itemDescription" className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      id="itemDescription"
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      placeholder="Add details..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
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
                        setShowAddItemForm(false);
                        setNewItemName('');
                        setNewItemDescription('');
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {sortedItems.length > 0 ? 'Rankings' : 'No items yet'}
          </h2>
          
          {sortedItems.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600">
                {userIdentity 
                  ? 'Be the first to add an item to this list!'
                  : 'Join the list to start adding items and voting.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedItems.map((itemWithScore, index) => (
                <div key={itemWithScore.item.id} className="relative">
                  <div className="absolute -left-2 top-6 sm:-left-4 bg-blue-600 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl shadow-md">
                    {index + 1}
                  </div>
                  <div className="ml-8 sm:ml-10">
                    <ItemCard
                      item={itemWithScore.item}
                      criteria={list.criteria}
                      userId={userIdentity?.userId}
                      isOwner={isOwner}
                      onRate={userIdentity ? handleRate : undefined}
                      onRemove={isOwner ? handleRemoveItem : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}

