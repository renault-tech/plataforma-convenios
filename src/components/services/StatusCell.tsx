"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

import { MAIN_STATUS_OPTIONS, getStatusColor } from "@/lib/constants/status"

interface StatusCellProps {
    value: string
    rowId: string
    columnId: string
    options?: string[]
    onUpdate: (id: string, data: any) => Promise<void>
}

export function StatusCell({ value, rowId, columnId, options, onUpdate }: StatusCellProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [currentValue, setCurrentValue] = React.useState(value)

    const handleSelect = async (newValue: string) => {
        if (newValue === currentValue) return

        setIsLoading(true)
        // Optimistic update
        setCurrentValue(newValue)

        try {
            await onUpdate(rowId, { [columnId]: newValue })
        } catch (error) {
            // Revert on error
            setCurrentValue(value)
            console.error("Failed to update status", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Default options if none provided
    const statusOptions = options && options.length > 0
        ? options
        : MAIN_STATUS_OPTIONS

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                disabled={isLoading}
                className="focus:outline-none"
                onClick={(e) => e.stopPropagation()}
            >
                <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer gap-1",
                    getStatusColor(currentValue),
                    isLoading && "opacity-50 cursor-wait"
                )}>
                    {currentValue}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                {statusOptions.map((option) => (
                    <DropdownMenuItem
                        key={option}
                        onClick={(e) => {
                            e.stopPropagation()
                            handleSelect(option)
                        }}
                        className={cn("text-xs", option === currentValue && "bg-slate-100 font-medium")}
                    >
                        {option}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
