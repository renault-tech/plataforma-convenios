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

    const getStatusColor = (status: string) => {
        const s = status.toLowerCase()
        if (s === 'ativo' || s === 'concluído' || s === 'concluido' || s === 'aprovado' || s === 'pago') return "bg-green-100 text-green-800 hover:bg-green-200"
        if (s === 'pendente' || s === 'em análise' || s === 'em analise' || s === 'aguardando') return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
        if (s === 'atrasado' || s === 'cancelado' || s === 'rejeitado' || s === 'vencido') return "bg-red-100 text-red-800 hover:bg-red-200"
        if (s === 'em andamento' || s === 'andamento' || s === 'execução') return "bg-blue-100 text-blue-800 hover:bg-blue-200"
        return "bg-slate-100 text-slate-800 hover:bg-slate-200"
    }

    // Default options if none provided
    const statusOptions = options && options.length > 0
        ? options
        : ["Pendente", "Em Andamento", "Concluído", "Cancelado"]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={isLoading} className="focus:outline-none">
                <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors cursor-pointer gap-1",
                    getStatusColor(currentValue),
                    isLoading && "opacity-50 cursor-wait"
                )}>
                    {currentValue}
                    <ChevronDown className="h-3 w-3 opacity-50" />
                </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {statusOptions.map((option) => (
                    <DropdownMenuItem
                        key={option}
                        onClick={() => handleSelect(option)}
                        className={cn("text-xs", option === currentValue && "bg-slate-100 font-medium")}
                    >
                        {option}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
