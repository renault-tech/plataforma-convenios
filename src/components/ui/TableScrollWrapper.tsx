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
            {/* Force hide scrollbars with embedded style */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide-force::-webkit-scrollbar { display: none !important; }
                .scrollbar-hide-force { -ms-overflow-style: none !important; scrollbar-width: none !important; }
            `}} />

            <div
                ref={scrollRef}
                className="overflow-x-auto w-full scrollbar-hide-force"
            >
                {children}
            </div>

            {/* Scroll Controls - Positioned at Top Left (Header area) */}
            <div className={cn(
                "absolute top-3 left-2 flex gap-1 transition-opacity duration-200 z-50",
                (canScrollLeft || canScrollRight) ? "opacity-100" : "opacity-0 pointer-events-none"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md bg-white hover:bg-slate-100 border border-slate-200 shadow-sm"
                    onClick={() => scroll("left")}
                    disabled={!canScrollLeft}
                >
                    <ChevronLeft className="h-3 w-3 text-slate-500" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-md bg-white hover:bg-slate-100 border border-slate-200 shadow-sm"
                    onClick={() => scroll("right")}
                    disabled={!canScrollRight}
                >
                    <ChevronRight className="h-3 w-3 text-slate-500" />
                </Button>
            </div>
        </div>
    )
}
