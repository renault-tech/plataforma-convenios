"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    CellContext,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'

export interface ColumnConfig {
    id: string
    label: string
    type: ColumnType
    required?: boolean
    options?: string[]
}

interface ItemsTableProps {
    columns: ColumnConfig[]
    data: any[]
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
}

import { Pencil, Trash2, AlertCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { differenceInDays, parseISO, isAfter } from "date-fns"

export function ItemsTable({ columns, data, onEdit, onDelete }: ItemsTableProps) {
    const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
        // Find Date Column for Alerts
        const dateColId = columns.find((c) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
            || columns.find((c) => c.type === 'date')?.id

        const baseCols = columns.map((col) => ({
            accessorKey: col.id,
            header: col.label,
            cell: ({ getValue }: CellContext<any, unknown>) => {
                const value = getValue() as string | number | null | undefined

                if (col.type === "currency") {
                    return new Intl.NumberFormat("pt-BR", {
                        style: "decimal",
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    }).format(Number(value) || 0)
                }

                if (col.type === "date" && value) {
                    try {
                        return format(new Date(value as string), "dd/MM/yyyy", { locale: ptBR })
                    } catch (e) {
                        return value
                    }
                }

                if (col.type === "status") {
                    return (
                        <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            (value === "Ativo" || value === "Concluído") ? "bg-green-100 text-green-800" :
                                (value === "Pendente" || value === "Em Análise") ? "bg-yellow-100 text-yellow-800" :
                                    "bg-slate-100 text-slate-800"
                        )}>
                            {value as React.ReactNode}
                        </span>
                    )
                }

                return value
            },
        }))

        // Add Actions Column with Alerts
        if (onEdit || onDelete || dateColId) {
            baseCols.push({
                id: "actions",
                header: "",
                cell: ({ row }: CellContext<any, unknown>) => {
                    // Alert Logic
                    let AlertIcon = null
                    if (dateColId) {
                        // Fix: The data is flattened in the parent component (spread ...item.data),
                        // so we access it directly on row.original, not row.original.data
                        const dateVal = row.original?.[dateColId]
                        if (dateVal && typeof dateVal === 'string') {
                            try {
                                const itemDate = parseISO(dateVal)
                                const today = new Date()
                                // Check if future
                                if (isAfter(itemDate, today)) {
                                    const days = differenceInDays(itemDate, today)
                                    if (days <= 30) {
                                        AlertIcon = (
                                            <div title={`Vence em ${days} dias (Crítico)`} className="mr-2 text-red-500 animate-pulse">
                                                <AlertCircle className="h-5 w-5" />
                                            </div>
                                        )
                                    } else if (days <= 90) {
                                        AlertIcon = (
                                            <div title={`Vence em ${days} dias (Atenção)`} className="mr-2 text-yellow-500">
                                                <AlertTriangle className="h-5 w-5" />
                                            </div>
                                        )
                                    }
                                }
                            } catch (e) { }
                        }
                    }

                    return (
                        <div className="flex items-center justify-end">
                            {AlertIcon}
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {onEdit && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600 text-slate-400"
                                        onClick={() => onEdit(row.original)}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-slate-400"
                                        onClick={() => onDelete(row.original)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    )
                }
            } as any)
        }

        return baseCols
    }, [columns, onEdit, onDelete])

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                return (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                )
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                className="group hover:bg-slate-50 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell
                                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                                className="h-24 text-center text-muted-foreground"
                            >
                                Nenhum item encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
