"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GripVertical, X } from "lucide-react"
import { DashboardWidget, useAdminDashboard } from "@/hooks/useAdminDashboard"
import { WIDGET_CONFIG } from "./DashboardWidgets"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface DashboardCardProps {
    widget: DashboardWidget
    children: React.ReactNode
}

export function DashboardCard({ widget, children }: DashboardCardProps) {
    const { removeWidget } = useAdminDashboard()
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: widget.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${widget.w}`,
        gridRow: `span ${widget.h}`,
        zIndex: isDragging ? 50 : 1,
        opacity: isDragging ? 0.5 : 1,
    }

    const config = WIDGET_CONFIG[widget.type] || {
        title: "Widget Removido",
        icon: X,
        description: "Este widget não está mais disponível."
    }
    const router = useRouter()

    const handleClick = () => {
        if (isDragging) return

        // Define routes map
        const routes: Record<string, string> = {
            'stats_users': '/admin/users',
            'stats_services': '/admin/services', // Assuming this route exists or will be created
            'recent_users': '/admin/users',
            'chart_growth': '/admin/users',
            'chart_distribution': '/admin/users'
        }

        const route = routes[widget.type]
        if (route) {
            router.push(route)
        }
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group flex flex-col overflow-hidden transition-all hover:shadow-md hover:border-blue-200 cursor-pointer", // Added cursor-pointer
                isDragging && "ring-2 ring-blue-500 shadow-xl cursor-grabbing"
            )}
            onClick={handleClick}
        >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 cursor-move" {...attributes} {...listeners}>
                <div className="flex items-center gap-2">
                    <config.icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium select-none">{config.title}</CardTitle>
                </div>
                {/* Remove Button (Hover only) */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500 absolute top-2 right-2 z-10" // Increased z-index
                    onPointerDown={(e) => {
                        e.stopPropagation() // Prevent drag start
                    }}
                    onClick={(e) => {
                        e.stopPropagation() // Prevent card click
                        removeWidget(widget.id)
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            </CardHeader>
            <div className="flex-1 overflow-auto"> {/* Interactive children */}
                {children}
            </div>
        </Card>
    )
}
