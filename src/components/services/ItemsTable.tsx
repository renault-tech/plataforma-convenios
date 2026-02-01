"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    CellContext,
    SortingState,
    getSortedRowModel,
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
    primaryColor?: string
}

import { Pencil, Trash2, AlertCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { differenceInDays, parseISO, isAfter } from "date-fns"

import { ChevronDown, ChevronRight, Paperclip, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { RowDetails } from "@/components/ui/RowDetails"
import { getExpandedRowModel } from "@tanstack/react-table"

export function ItemsTable({ columns, data, onEdit, onDelete, primaryColor }: ItemsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])

    const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
        // ... (existing helper logic) ...
        const dateColId = columns.find((c) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
            || columns.find((c) => c.type === 'date')?.id

        const baseCols: ColumnDef<any>[] = columns.map((col) => ({
            accessorKey: col.id,
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className="-ml-4 h-8 data-[state=open]:bg-accent hover:bg-slate-100/50"
                    >
                        {col.label}
                        {column.getIsSorted() === "asc" ? (
                            <ArrowUp className="ml-2 h-3 w-3" />
                        ) : column.getIsSorted() === "desc" ? (
                            <ArrowDown className="ml-2 h-3 w-3" />
                        ) : (
                            <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" />
                        )}
                    </Button>
                )
            },
            cell: ({ getValue }: CellContext<any, unknown>) => {
                // ... (existing cell logic) ...
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

        // ... (rest of logic)

        // Add Expansion Column (Leftmost)
        baseCols.unshift({
            id: "expander",
            header: "",
            cell: ({ row }) => {
                // ... existing expansion cell
                const hasDetails = !!row.original.details
                const hasAttachments = row.original.attachments && row.original.attachments.length > 0
                return (
                    <div className="flex items-center gap-1">
                        {row.getCanExpand() ? (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    row.toggleExpanded()
                                }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 transition-colors"
                            >
                                {row.getIsExpanded() ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronRight className="h-4 w-4" />
                                )}
                            </button>
                        ) : null}
                        {!row.getIsExpanded() && (
                            <div className="flex gap-0.5">
                                {hasDetails && <FileText className="h-3 w-3 text-blue-400" />}
                                {hasAttachments && <Paperclip className="h-3 w-3 text-emerald-400" />}
                            </div>
                        )}
                    </div>
                )
            },
        })

        // Add Actions Column
        if (onEdit || onDelete || dateColId) {
            baseCols.push({
                id: "actions",
                header: "",
                cell: ({ row }: CellContext<any, unknown>) => {
                    // ... existing logic for actions
                    let AlertIcon = null
                    if (dateColId) {
                        const dateVal = row.original?.[dateColId]
                        if (dateVal && typeof dateVal === 'string') {
                            try {
                                const itemDate = parseISO(dateVal)
                                const today = new Date()
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
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onEdit(row.original)
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                )}
                                {onDelete && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-50 hover:text-red-600 text-slate-400"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            onDelete(row.original)
                                        }}
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
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
        },
    })

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            {/* Wrapper for horizontal scroll on small screens */}
            <div className="overflow-x-auto">
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="h-12 px-4 text-left align-middle font-bold text-slate-800 uppercase tracking-wider text-sm border-b-2 border-slate-100 whitespace-nowrap"
                                            style={{ color: primaryColor ? `${primaryColor}` : undefined }}
                                        >
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
                            table.getRowModel().rows.map((row, index) => (
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        data-state={row.getIsSelected() && "selected"}
                                        className="group transition-colors cursor-pointer hover:bg-slate-50"
                                        style={{
                                            backgroundColor: (index % 2 === 1 && primaryColor && !row.getIsExpanded()) ? `${primaryColor}08` : undefined
                                        }}
                                        onClick={() => row.toggleExpanded()}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <TableRow className="hover:bg-transparent bg-slate-50/30">
                                            <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b-2 border-slate-100">
                                                <RowDetails details={row.original.details} attachments={row.original.attachments} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length + (onEdit || onDelete ? 2 : 1)}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Nenhum item encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
