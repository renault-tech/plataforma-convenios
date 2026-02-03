"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

interface GridWidgetProps {
    id: string
    colSpan?: number
    rowSpan?: number
    children: React.ReactNode
    onRemove?: () => void
    onResize?: (colSpan: number, rowSpan: number) => void
}

export function GridWidget({
    id,
    colSpan = 1,
    rowSpan = 1,
    children,
    onRemove,
    onResize
}: GridWidgetProps) {
    const [currentColSpan, setCurrentColSpan] = useState(colSpan)
    const [currentRowSpan, setCurrentRowSpan] = useState(rowSpan)
    const [isResizing, setIsResizing] = useState(false)
    const [resizeDirection, setResizeDirection] = useState<'right' | 'bottom' | 'corner' | null>(null)
    const widgetRef = useRef<HTMLDivElement>(null)
    const startPos = useRef({ x: 0, y: 0, colSpan: 0, rowSpan: 0 })

    const handleResizeStart = (e: React.MouseEvent, direction: 'right' | 'bottom' | 'corner') => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        setResizeDirection(direction)
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            colSpan: currentColSpan,
            rowSpan: currentRowSpan,
        }
    }

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startPos.current.x
            const deltaY = e.clientY - startPos.current.y

            // Each grid cell is approximately 350px (including gap)
            // Adjusting logical size slightly for smoother snapping
            const cellWidth = 320
            const cellHeight = 200

            if (resizeDirection === 'right' || resizeDirection === 'corner') {
                const colChange = Math.round(deltaX / cellWidth)
                const newColSpan = Math.max(1, Math.min(6, startPos.current.colSpan + colChange))
                if (newColSpan !== currentColSpan) {
                    setCurrentColSpan(newColSpan)
                }
            }

            if (resizeDirection === 'bottom' || resizeDirection === 'corner') {
                const rowChange = Math.round(deltaY / cellHeight)
                const newRowSpan = Math.max(1, Math.min(4, startPos.current.rowSpan + rowChange))
                if (newRowSpan !== currentRowSpan) {
                    setCurrentRowSpan(newRowSpan)
                }
            }
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            setResizeDirection(null)
            onResize?.(currentColSpan, currentRowSpan)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, resizeDirection, onResize, currentColSpan, currentRowSpan])

    return (
        <div
            ref={widgetRef}
            className={cn(
                "relative group transition-all duration-300 ease-in-out",
                // Subtle ring only when resizing, not constant border
                isResizing && "z-50 ring-2 ring-blue-500 ring-offset-2 bg-white shadow-xl"
            )}
            style={{
                gridColumn: `span ${currentColSpan}`,
                gridRow: `span ${currentRowSpan}`,
            }}
        >
            {/* Content Container - Flex ensures full height/width */}
            <div className="h-full w-full flex flex-col">
                {children}
            </div>

            {/* Remove Curtain & Button - Only visible on hover */}
            {onRemove && (
                <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        className="p-1.5 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                        title="Remover widget"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            )}

            {/* Resize Handles - Subtle Interaction Zones */}
            {onResize && (
                <>
                    {/* Vertical (Right) Handle */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'right')}
                        className={cn(
                            "absolute top-2 bottom-2 right-0 w-1 cursor-ew-resize z-10 transition-colors duration-200 rounded-full",
                            "hover:bg-blue-400/50", // Blue hint on hover
                            isResizing && resizeDirection === 'right' && "bg-blue-500 w-1.5"
                        )}
                    />

                    {/* Horizontal (Bottom) Handle */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'bottom')}
                        className={cn(
                            "absolute bottom-0 left-2 right-2 h-1 cursor-ns-resize z-10 transition-colors duration-200 rounded-full",
                            "hover:bg-blue-400/50", // Blue hint on hover
                            isResizing && resizeDirection === 'bottom' && "bg-blue-500 h-1.5"
                        )}
                    />

                    {/* Corner Handle - Minimalist */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, 'corner')}
                        className={cn(
                            "absolute bottom-0 right-0 w-4 h-4 z-20 cursor-nwse-resize flex items-end justify-end p-0.5",
                            "opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        )}
                    >
                        {/* Little corner triangle/dot */}
                        <div className={cn(
                            "w-1.5 h-1.5 bg-slate-300 rounded-sm group-hover:bg-blue-500 transition-colors",
                            isResizing && resizeDirection === 'corner' && "bg-blue-600 w-2 h-2"
                        )} />
                    </div>
                </>
            )}
        </div>
    )
}
