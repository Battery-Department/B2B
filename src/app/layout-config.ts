// Layout configuration for Next.js App Router
// This file configures rendering behavior for all pages

export const dynamic = 'force-dynamic'
export const revalidate = 0

// This ensures all pages are rendered dynamically at request time
// preventing static generation timeouts during build