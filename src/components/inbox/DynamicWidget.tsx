"use client"

import { X, GripVertical } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { useState, useRef, useEffect } from "react"

interface DynamicWidgetProps {
    id: string
    defaultWidth?: number
    defaultHeight?: number
    children: React.ReactNode
    onRemove?: () => void
    onResize?: (width: number, height: number) => void
    isDraggable?: boolean
}

export function DynamicWidget({
    id,
    defaultWidth = 300,
    defaultHeight = 200,
    children,
    onRemove,
    onResize,
    isDraggable = true
}: DynamicWidgetProps) {
    const [size, setSize] = useState({ width: defaultWidth, height: defaultHeight })
    const [isResizing, setIsResizing] = useState(false)
    const widgetRef = useRef<HTMLDivElement>(null)
    const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 })

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled: !isDraggable || isResizing })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        width: `${size.width}px`,
        minHeight: `${size.height}px`,
    }

    const handleResizeStart = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsResizing(true)
        startPos.current = {
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        }
    }

    useEffect(() => {
        if (!isResizing) return

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startPos.current.x
            const deltaY = e.clientY - startPos.current.y

            const newWidth = Math.max(200, startPos.current.width + deltaX)
            const newHeight = Math.max(150, startPos.current.height + deltaY)

            setSize({ width: newWidth, height: newHeight })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
            onResize?.(size.width, size.height)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, onResize, size.width, size.height])

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group transition-all duration-200",
                isDragging && "opacity-50 z-50",
                isResizing && "ring-2 ring-blue-400 ring-offset-2"
            )}
        >
            {/* Drag Handle - entire card */}
            <div
                ref={widgetRef}
                {...attributes}
                {...listeners}
                className={cn(
                    isDraggable && !isResizing && "cursor-grab active:cursor-grabbing",
                    "h-full transition-all duration-200",
                    isDragging ? "scale-105 shadow-2xl" : "hover:shadow-lg"
                )}
            >
                {children}
            </div>

            {/* Remove Button - top right */}
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        onRemove()
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-white border border-red-200 rounded-md shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-10"
                    title="Remover widget"
                    aria-label="Remover widget"
                >
                    <X className="h-3.5 w-3.5 text-red-600" />
                </button>
            )}

            {/* Resize Handle - bottom right corner */}
            {onResize && (
                <div
                    onMouseDown={handleResizeStart}
                    className={cn(
                        "absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity z-10",
                        "flex items-center justify-center",
                        "bg-gradient-to-br from-blue-500 to-blue-600",
                        "rounded-tl-lg shadow-md",
                        "hover:from-blue-600 hover:to-blue-700",
                        isResizing && "opacity-100 from-blue-600 to-blue-700"
                    )}
                    title="Arrastar para redimensionar"
                    aria-label="Redimensionar widget"
                >
                    <svg
                        className="w-3 h-3 text-white rotate-90"
                        fill="currentColor"
                        viewBox="0 0 16 16"
                    >
                        <path d="M14 2l-12 12M14 8l-6 6M14 14h-6" />
                    </svg>
                </div>
            )}
        </div>
    )
}
