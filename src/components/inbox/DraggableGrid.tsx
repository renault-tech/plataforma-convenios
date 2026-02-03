"use client"

import { useState } from "react"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

interface DraggableGridProps {
    children: React.ReactNode[]
    items: { id: string; size?: 'small' | 'medium' | 'large' | 'wide' }[]
    onReorder: (newOrder: string[]) => void
    className?: string
}

export function DraggableGrid({ children, items, onReorder, className }: DraggableGridProps) {
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // 8px movement required to start drag
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex((item) => item.id === active.id)
            const newIndex = items.findIndex((item) => item.id === over.id)

            const newOrder = arrayMove(items, oldIndex, newIndex).map(item => item.id)
            onReorder(newOrder)
        }

        setActiveId(null)
    }

    const handleDragCancel = () => {
        setActiveId(null)
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6", className)}>
                    {children}
                </div>
            </SortableContext>

            <DragOverlay>
                {activeId ? (
                    <div className="opacity-50">
                        {children[items.findIndex(item => item.id === activeId)]}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}

interface SortableWidgetProps {
    id: string
    size?: 'small' | 'medium' | 'large' | 'wide'
    children: React.ReactNode
    onRemove?: () => void
    onConfigure?: () => void
}

export function SortableWidget({ id, size = 'medium', children, onRemove, onConfigure }: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: size === 'wide' ? 'span 2' : size === 'large' ? 'span 2' : 'span 1',
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group",
                isDragging && "opacity-50 z-50"
            )}
            {...attributes}
        >
            {/* Drag Handle - entire card is draggable */}
            <div
                {...listeners}
                className={cn(
                    "cursor-grab active:cursor-grabbing",
                    "transition-all duration-200",
                    isDragging ? "scale-105 shadow-2xl" : "hover:scale-[1.01] hover:shadow-lg"
                )}
            >
                {children}
            </div>

            {/* Action Buttons - appear on hover */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onConfigure && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onConfigure()
                        }}
                        className="p-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-colors"
                        title="Configurar widget"
                    >
                        <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                )}
                {onRemove && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onRemove()
                        }}
                        className="p-1.5 bg-white border border-red-200 rounded-md shadow-sm hover:bg-red-50 transition-colors"
                        title="Remover widget"
                    >
                        <svg className="h-3.5 w-3.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    )
}
