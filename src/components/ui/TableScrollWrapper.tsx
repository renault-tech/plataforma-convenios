"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TableScrollWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function TableScrollWrapper({ children, className, ...props }: TableScrollWrapperProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = React.useState(false)
    const [canScrollRight, setCanScrollRight] = React.useState(false)

    const checkScroll = React.useCallback(() => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setCanScrollLeft(scrollLeft > 0)
            // Use a small threshold (e.g. 1px) to avoid rounding errors
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
        }
    }, [])

    React.useEffect(() => {
        const element = scrollRef.current
        if (element) {
            checkScroll()
            // Use ResizeObserver for more robust detection
            const observer = new ResizeObserver(() => {
                checkScroll()
            })
            observer.observe(element)

            // Also listen to window resize
            window.addEventListener("resize", checkScroll)

            return () => {
                observer.disconnect()
                window.removeEventListener("resize", checkScroll)
            }
        }
    }, [checkScroll])

    // Re-check when children change (e.g. data loaded)
    React.useEffect(() => {
        // Small timeout to ensure rendering is complete
        const timer = setTimeout(checkScroll, 100)
        return () => clearTimeout(timer)
    }, [children, checkScroll])

    const scroll = (direction: "left" | "right") => {
        if (scrollRef.current) {
            const scrollAmount = 300
            scrollRef.current.scrollBy({
                left: direction === "left" ? -scrollAmount : scrollAmount,
                behavior: "smooth",
            })
        }
    }

    return (
        <div className={cn("relative group", className)} {...props}>
            <div
                ref={scrollRef}
                className="overflow-x-auto w-full scrollbar-hide"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}
                onMouseEnter={checkScroll}
                onTouchStart={checkScroll}
            >
                {/* Ensure table grows to fit content */}
                <div className="min-w-fit">
                    {children}
                </div>
            </div>

            {/* Scroll Controls - Positioned at Top Left (Header area) */}
            {/* Scroll Controls - With Gradient Mask */}
            {(canScrollLeft || canScrollRight) && (
                <>
                    {/* Left Arrow Container with Gradient */}
                    <div className={cn(
                        "absolute top-0 left-0 bottom-0 w-12 flex items-start justify-center pt-3 z-50 transition-opacity duration-300 pointer-events-none",
                        !canScrollLeft ? "opacity-0" : "opacity-100"
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-6 w-6 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-100 pointer-events-auto"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                scroll("left");
                            }}
                            disabled={!canScrollLeft}
                            aria-label="Rolar para esquerda"
                        >
                            <ChevronLeft className="h-3 w-3 text-slate-600" />
                        </Button>
                    </div>

                    {/* Right Arrow Container with Gradient */}
                    <div className={cn(
                        "absolute top-0 right-0 bottom-0 w-12 flex items-start justify-center pt-3 z-50 transition-opacity duration-300 pointer-events-none",
                        !canScrollRight ? "opacity-0" : "opacity-100"
                    )}>
                        <div className="absolute inset-0 bg-gradient-to-l from-white via-white/80 to-transparent" />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative h-6 w-6 rounded-md bg-white border border-slate-200 shadow-sm hover:bg-slate-100 pointer-events-auto"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                scroll("right");
                            }}
                            disabled={!canScrollRight}
                            aria-label="Rolar para direita"
                        >
                            <ChevronRight className="h-3 w-3 text-slate-600" />
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}
