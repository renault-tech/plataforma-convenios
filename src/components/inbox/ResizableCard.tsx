"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface ResizableCardProps {
    children: React.ReactNode
    defaultSize?: 'small' | 'medium' | 'large' | 'wide'
    onResize?: (size: 'small' | 'medium' | 'large' | 'wide') => void
    className?: string
}

const SIZE_CLASSES = {
    small: 'col-span-1',
    medium: 'col-span-1',
    large: 'col-span-2',
    wide: 'col-span-2',
}

export function ResizableCard({ children, defaultSize = 'medium', onResize, className }: ResizableCardProps) {
    const [size, setSize] = useState(defaultSize)
    const [isResizing, setIsResizing] = useState(false)
    const cardRef = useRef<HTMLDivElement>(null)

    const handleResize = (newSize: 'small' | 'medium' | 'large' | 'wide') => {
        setSize(newSize)
        onResize?.(newSize)
    }

    return (
        <div
            ref={cardRef}
            className={cn(
                SIZE_CLASSES[size],
                "relative group transition-all duration-200",
                className
            )}
        >
            {children}

            {/* Resize handles - appear on hover */}
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1 bg-white border border-slate-200 rounded-md shadow-sm p-1">
                    <button
                        onClick={() => handleResize('small')}
                        className={cn(
                            "p-1 rounded hover:bg-slate-100 transition-colors",
                            size === 'small' && "bg-blue-100 text-blue-600"
                        )}
                        title="Pequeno (1 coluna)"
                    >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <rect x="6" y="6" width="4" height="4" rx="1" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleResize('medium')}
                        className={cn(
                            "p-1 rounded hover:bg-slate-100 transition-colors",
                            size === 'medium' && "bg-blue-100 text-blue-600"
                        )}
                        title="Médio (1 coluna)"
                    >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <rect x="4" y="4" width="8" height="8" rx="1" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleResize('large')}
                        className={cn(
                            "p-1 rounded hover:bg-slate-100 transition-colors",
                            size === 'large' && "bg-blue-100 text-blue-600"
                        )}
                        title="Grande (2 colunas)"
                    >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <rect x="2" y="4" width="12" height="8" rx="1" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleResize('wide')}
                        className={cn(
                            "p-1 rounded hover:bg-slate-100 transition-colors",
                            size === 'wide' && "bg-blue-100 text-blue-600"
                        )}
                        title="Largo (2 colunas)"
                    >
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 16 16">
                            <rect x="1" y="6" width="14" height="4" rx="1" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}
