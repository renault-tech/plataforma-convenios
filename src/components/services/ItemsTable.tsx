"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    SortingState,
    getSortedRowModel,
    getExpandedRowModel,
} from "@tanstack/react-table"
import { format, differenceInDays, parseISO, isAfter } from "date-fns"
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
import { Pencil, Trash2, AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Paperclip, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RowDetails } from "@/components/ui/RowDetails"
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper"
import { StatusCell } from "@/components/services/StatusCell"

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
    onStatusChange?: (id: string, data: any) => Promise<void>
    primaryColor?: string
    lastViewedAt?: string
    isLoading?: boolean
    highlightedItemId?: string | null
}

import { Skeleton } from "@/components/ui/skeleton"

export function ItemsTable({ columns, data, onEdit, onDelete, onStatusChange, primaryColor, lastViewedAt, isLoading, highlightedItemId }: ItemsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])

    const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
        const dateColId = columns.find((c) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
            || columns.find((c) => c.type === 'date')?.id

        const baseCols: ColumnDef<any>[] = columns.map((col, index) => ({
            accessorKey: col.id,
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                        className={`-ml-4 h-8 data-[state=open]:bg-accent hover:bg-slate-100/50 justify-start ${index === 0 ? 'pl-[64px]' : ''}`}
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
            cell: ({ getValue, row }) => {
                const value = getValue() as string | number | null | undefined

                // Helper to render the actual content
                const renderContent = () => {
                    if (!value) return value

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
                        if (onStatusChange) {
                            return (
                                <StatusCell
                                    value={value as string}
                                    rowId={row.original.id}
                                    columnId={col.id}
                                    options={col.options}
                                    onUpdate={onStatusChange}
                                />
                            )
                        }
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
                }

                const content = renderContent()

                // If NOT first column, return simple content
                if (index !== 0) return content

                // If FIRST column, prepend the Expander and Indicators
                const hasDetails = !!row.original.details
                const hasAttachments = row.original.attachments && row.original.attachments.length > 0
                const isNew = !lastViewedAt || (!!row.original.updated_at && new Date(row.original.updated_at).getTime() > new Date(lastViewedAt).getTime())

                return (
                    <div className="relative pl-12 flex items-center h-full min-h-[20px]">
                        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-end gap-0.5 w-[44px] pr-1">
                            {/* Indicators (Paperclip/Text) FIRST */}
                            <div className="flex gap-0.5 w-[24px] justify-end">
                                {hasDetails && <FileText className="h-3 w-3 text-blue-400" />}
                                {hasAttachments && <Paperclip className="h-3 w-3 text-emerald-400" />}
                            </div>

                            {/* Expander Chevron */}
                            {row.getCanExpand() && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        row.toggleExpanded()
                                    }}
                                    className="p-0.5 rounded hover:bg-slate-200 text-slate-400 transition-colors"
                                >
                                    {row.getIsExpanded() ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        <span className="font-medium text-slate-700 block text-left break-words min-w-[150px]">
                            {content as React.ReactNode}
                        </span>
                    </div>
                )
            },
        }))

        // Add Actions Column
        if (onEdit || onDelete || dateColId) {
            baseCols.push({
                id: "actions",
                header: "",
                cell: ({ row }) => {
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
            })
        }

        return baseCols
    }, [columns, onEdit, onDelete, lastViewedAt, onStatusChange])

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
            <TableScrollWrapper>
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className="h-12 px-4 text-left align-middle font-bold text-slate-800 uppercase tracking-wider text-sm border-b-2 border-slate-100 min-w-[150px]"
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
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    {columns.map((col, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-6 w-full" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => {
                                // Let's use the same logic as Sidebar: !lastViewedAt || updated > lastViewedAt.
                                const isNew = !lastViewedAt || (!!row.original.updated_at && new Date(row.original.updated_at).getTime() > new Date(lastViewedAt).getTime())
                                const isHighlighted = highlightedItemId === row.original.id

                                return (
                                    <React.Fragment key={row.id}>
                                        <TableRow
                                            data-state={row.getIsSelected() && "selected"}
                                            data-item-id={row.original.id}
                                            className={cn(
                                                "group transition-colors cursor-pointer hover:bg-slate-50",
                                                isNew ? "bg-blue-100 hover:bg-blue-200" : "",
                                                isHighlighted && "animate-pulse bg-blue-300 hover:bg-blue-300"
                                            )}
                                            style={{
                                                backgroundColor: isHighlighted
                                                    ? '#93c5fd' // blue-300
                                                    : isNew
                                                        ? undefined
                                                        : (index % 2 === 1 && primaryColor && !row.getIsExpanded()) ? `${primaryColor}08` : undefined,
                                                transition: 'background-color 0.3s ease'
                                            }}
                                            onClick={() => row.toggleExpanded()}
                                        >


                                            {/* Cells */}
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id} className="align-top py-3">
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                        {row.getIsExpanded() && (
                                            <TableRow className="hover:bg-transparent bg-slate-50/30">
                                                <TableCell colSpan={row.getVisibleCells().length + 1} className="p-0 border-b-2 border-slate-100">
                                                    <RowDetails details={row.original.details} attachments={row.original.attachments} />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                )
                            })
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
            </TableScrollWrapper>
        </div >
    )
}
