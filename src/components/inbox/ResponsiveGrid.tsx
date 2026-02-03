"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
    children: ReactNode
    className?: string
}

export function ResponsiveGrid({ children, className }: ResponsiveGridProps) {
    return (
        <div
            className={cn(
                "grid gap-6 auto-rows-[200px]",
                "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5",
                className
            )}
        >
            {children}
        </div>
    )
}
