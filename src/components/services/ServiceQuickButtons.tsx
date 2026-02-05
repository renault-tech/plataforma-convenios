"use client"

import { useService } from "@/contexts/ServiceContext"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getContrastColor } from "@/lib/color-utils"
import { PlusCircle, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"

export function ServiceQuickButtons() {
    const { services, activeService, setActiveService } = useService()

    // Create state for arrows and ref for scroll container
    const scrollRef = useRef<HTMLDivElement>(null)
    const [showLeftArrow, setShowLeftArrow] = useState(false)
    const [showRightArrow, setShowRightArrow] = useState(false)

    // Check scroll position to toggle arrows
    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setShowLeftArrow(scrollLeft > 0)
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5) // 5px tolerance
        }
    }

    // Attach listener for resize and services change
    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [services])

    // Scroll handler
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 300
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
            // Check again after scroll animation
            setTimeout(checkScroll, 300)
        }
    }

    if (services.length === 0) return null

    return (
        <div className="w-full flex items-center gap-1">
            {showLeftArrow && (
                <button
                    onClick={() => scroll('left')}
                    className="flex-none h-8 w-6 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-slate-50 rounded-full border border-slate-200 shadow-sm"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            )}

            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex-1 flex items-center gap-3 overflow-x-auto px-1 py-2 scroll-smooth"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
            >
                {/* Fallback for webkit browsers to hide scrollbar */}
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {services.map((service) => {
                    const isActive = activeService?.id === service.id
                    const bgColor = service.primary_color || '#3b82f6'
                    const textColor = isActive ? getContrastColor(bgColor) : undefined

                    return (
                        <Button
                            key={service.id}
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "h-8 px-4 text-xs rounded-full transition-all font-medium border flex-shrink-0 shadow-sm",
                                isActive
                                    ? "hover:opacity-90 border-transparent shadow-md ring-1 ring-offset-1 ring-offset-white dark:ring-offset-slate-900"
                                    : "bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-200"
                            )}
                            style={isActive ? {
                                backgroundColor: bgColor,
                                color: textColor,
                                outlineColor: bgColor
                            } : {}}
                            onClick={() => setActiveService(service)}
                        >
                            {service.name}
                        </Button>
                    )
                })}

                <Link href="/configuracoes?tab=servicos" className="flex-shrink-0">
                    <Button
                        variant="ghost"
                        className="h-8 px-4 text-xs rounded-full gap-2 border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50"
                    >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Novo
                    </Button>
                </Link>
            </div>

            {showRightArrow && (
                <button
                    onClick={() => scroll('right')}
                    className="flex-none h-8 w-6 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors bg-white hover:bg-slate-50 rounded-full border border-slate-200 shadow-sm"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
