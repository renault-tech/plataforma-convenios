"use client"

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

/**
 * Hook to sync dark mode with DOM on mount
 * Call this in the root layout to ensure dark class is applied on page load
 */
export function useDarkMode() {
    const { isDarkMode } = useStore()

    useEffect(() => {
        // Sync dark class with store state on mount
        if (isDarkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }, [isDarkMode])
}
