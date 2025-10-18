'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { createList } from '@/actions/list-actions'

export default function CreateListPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [criteria, setCriteria] = useState<string[]>([''])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    function addCriterion() {
        setCriteria([...criteria, ''])
    }

    function updateCriterion(index: number, value: string) {
        const newCriteria = [...criteria]
        newCriteria[index] = value
        setCriteria(newCriteria)
    }

    function removeCriterion(index: number) {
        if (criteria.length > 1) {
            setCriteria(criteria.filter((_, i) => i !== index))
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')

        const validCriteria = criteria.filter((c) => c.trim() !== '')

        if (!name.trim()) {
            setError('Please enter a list name')
            return
        }

        if (validCriteria.length === 0) {
            setError('Please add at least one criterion')
            return
        }

        setIsSubmitting(true)

        try {
            const result = await createList(name.trim(), validCriteria)

            if (result.success && result.listId) {
                router.push(`/list/${result.listId}`)
            } else {
                setError(result.error || 'Failed to create list')
                setIsSubmitting(false)
            }
        } catch (err) {
            setError('An unexpected error occurred')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
                {/* Header with Auth */}
                <div className="flex justify-between items-center mb-8">
                    <button onClick={() => router.push('/')} className="text-gray-600 hover:text-gray-900 text-sm">
                        ← Back to home
                    </button>
                    <div className="flex items-center gap-3">
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

                <div className="mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Create a New List</h1>
                    <p className="text-gray-600">Define your list and the criteria you&apos;ll use to rate items.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* List Name */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                            List Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Family Holiday Ideas"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                            required
                        />
                    </div>

                    {/* Criteria */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="mb-4">
                            <h2 className="text-sm font-semibold text-gray-900 mb-1">Rating Criteria *</h2>
                            <p className="text-sm text-gray-600">
                                What aspects should people rate? (e.g., Cost, Fun, Quality)
                            </p>
                        </div>

                        <div className="space-y-3">
                            {criteria.map((criterion, index) => (
                                <div key={index} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={criterion}
                                        onChange={(e) => updateCriterion(index, e.target.value)}
                                        placeholder={`Criterion ${index + 1}`}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                                    />
                                    {criteria.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeCriterion(index)}
                                            className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addCriterion}
                            className="mt-4 w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-lg"
                        >
                            + Add Criterion
                        </button>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-red-800 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Creating...' : 'Create List'}
                    </button>

                    {/* Back Link */}
                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="text-gray-600 hover:text-gray-900 text-sm"
                        >
                            ← Back to home
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
