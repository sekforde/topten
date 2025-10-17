'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ListSummary {
    id: string
    name: string
    itemCount: number
    memberCount: number
    isOwner: boolean
}

interface ListNavigatorProps {
    currentListId: string
    lists: ListSummary[]
}

export function ListNavigator({ currentListId, lists }: ListNavigatorProps) {
    const [isOpen, setIsOpen] = useState(false)

    const currentList = lists.find((list) => list.id === currentListId)
    const otherLists = lists.filter((list) => list.id !== currentListId)

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as HTMLElement
            if (!target.closest('#list-navigator')) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('click', handleClickOutside)
            return () => document.removeEventListener('click', handleClickOutside)
        }
    }, [isOpen])

    if (lists.length <= 1) {
        return null // Don't show navigator if user only has one list
    }

    return (
        <div id="list-navigator" className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Switch to another list"
            >
                <span>📋</span>
                <span className="hidden sm:inline">Lists</span>
                <span className="text-xs text-gray-500">({lists.length})</span>
                <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg border border-gray-200 shadow-lg z-20 max-h-96 overflow-y-auto">
                        {/* Current List */}
                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                Current List
                            </div>
                        </div>
                        {currentList && (
                            <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                            {currentList.name}
                                        </div>
                                        <div className="flex gap-2 text-xs text-gray-600 mt-1">
                                            <span>{currentList.itemCount} items</span>
                                            <span>•</span>
                                            <span>{currentList.memberCount} members</span>
                                        </div>
                                    </div>
                                    {currentList.isOwner && (
                                        <span className="ml-2 bg-blue-200 text-blue-800 text-xs font-medium px-2 py-0.5 rounded flex-shrink-0">
                                            Owner
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Other Lists */}
                        {otherLists.length > 0 && (
                            <>
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                        Other Lists
                                    </div>
                                </div>
                                <div className="py-1">
                                    {otherLists.map((list) => (
                                        <Link
                                            key={list.id}
                                            href={`/list/${list.id}`}
                                            onClick={() => setIsOpen(false)}
                                            className="block px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium text-gray-900 truncate">{list.name}</div>
                                                    <div className="flex gap-2 text-xs text-gray-600 mt-1">
                                                        <span>{list.itemCount} items</span>
                                                        <span>•</span>
                                                        <span>{list.memberCount} members</span>
                                                    </div>
                                                </div>
                                                {list.isOwner && (
                                                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded flex-shrink-0">
                                                        Owner
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* View All / Home Link */}
                        <div className="border-t border-gray-200">
                            <Link
                                href="/"
                                onClick={() => setIsOpen(false)}
                                className="block px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors text-center"
                            >
                                View All Lists →
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

