import Link from 'next/link'
import { getUserListIds, getListWithUserContext } from '@/actions/list-actions'

export default async function Home() {
    const listIds = await getUserListIds()

    // Fetch all lists the user has access to
    const listsData = await Promise.all(listIds.map((id) => getListWithUserContext(id)))

    const userLists = listsData
        .filter((data) => data.list !== null)
        .map((data) => ({
            list: data.list!,
            isOwner: data.isOwner
        }))

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Family Top 10</h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Build and rank collaborative lists with your family or friends. No accounts, no fuss—just share
                        a link and start voting!
                    </p>
                </div>

                {/* Create Button */}
                <div className="mb-12 flex justify-center">
                    <Link
                        href="/create"
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 transition-transform"
                    >
                        Create New List
                    </Link>
                </div>

                {/* User's Lists */}
                {userLists.length > 0 && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Lists</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {userLists.map(({ list, isOwner }) => (
                                <Link
                                    key={list.id}
                                    href={`/list/${list.id}`}
                                    className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-2 border-transparent hover:border-blue-300"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{list.name}</h3>
                                        {isOwner && (
                                            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                                Owner
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <div>{list.items.length} items</div>
                                        <div>•</div>
                                        <div>{list.users.length} members</div>
                                        <div>•</div>
                                        <div>{list.criteria.length} criteria</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* How it works */}
                <div className="mt-16 bg-white rounded-xl shadow-md p-6 sm:p-8 hidden">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How it works</h2>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Create a list</h3>
                                <p className="text-gray-600 text-sm">
                                    Name your list and define custom criteria to rate items by (e.g., Cost, Fun, Quality).
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Share the link</h3>
                                <p className="text-gray-600 text-sm">
                                    Send the link to family or friends. They join with just a display name—no
                                    registration required.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">Add & rate items</h3>
                                <p className="text-gray-600 text-sm">
                                    Everyone can add items and rate them 1-5 stars on each criterion. Skip items you
                                    don&apos;t know!
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                                4
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-1">See the rankings</h3>
                                <p className="text-gray-600 text-sm">
                                    Watch the rankings update in real-time as votes come in. The best items rise to the
                                    top!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
