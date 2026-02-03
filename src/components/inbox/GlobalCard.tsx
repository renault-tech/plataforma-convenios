"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon, Loader2, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlobalCardProps {
    title: string
    value: number | string
    description?: string
    icon: LucideIcon
    iconColor?: string
    borderColor?: string
    onClick?: () => void
    isLoading?: boolean
    formatValue?: (value: number | string) => string
    onConfigure?: () => void
}

export function GlobalCard({
    title,
    value,
    description,
    icon: Icon,
    iconColor = "text-blue-500",
    borderColor = "border-blue-100",
    onClick,
    isLoading = false,
    formatValue,
    onConfigure
}: GlobalCardProps) {
    const displayValue = formatValue && typeof value === 'number'
        ? formatValue(value)
        : value

    return (
        <Card
            className={cn(
                "bg-white shadow-sm transition-all duration-200 h-full relative group", // Added h-full relative group
                borderColor,
                onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
            )}
            onClick={onClick}
        >
            {/* Settings Button - Only visible on hover */}
            {onConfigure && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onConfigure()
                        }}
                        className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Configurar"
                    >
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            )}

            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-700">
                    {title}
                </CardTitle>
                <Icon className={cn("h-4 w-4", iconColor)} />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-8 w-20 bg-slate-200 rounded animate-pulse" />
                        {description && <div className="h-3 w-32 bg-slate-100 rounded animate-pulse" />}
                    </div>
                ) : (
                    <>
                        <div className="text-2xl font-bold text-slate-900">
                            {displayValue}
                        </div>
                        {description && (
                            <p className="text-xs text-slate-500 mt-1">
                                {description}
                            </p>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}
