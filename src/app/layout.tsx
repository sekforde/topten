import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin']
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin']
})

export const metadata: Metadata = {
    title: 'Family Top 10 - Collaborative Ranking Lists',
    description:
        'Build and rank collaborative lists with your family or friends. Sign in to collaborate and track your votes!'
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5
}

export default function RootLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
            </html>
        </ClerkProvider>
    )
}
