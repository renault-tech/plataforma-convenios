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
import { cn, getLegibleTextColor } from "@/lib/utils"
import { Pencil, Trash2, AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Paperclip, FileText, ArrowUpDown, ArrowUp, ArrowDown, Bell, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RowDetails } from "@/components/ui/RowDetails"
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper"
import { StatusCell } from "@/components/services/StatusCell"
import { ColumnHeaderBell } from "@/components/notifications/ColumnHeaderBell"
import { NotificationConfigDialog } from "@/components/notifications/NotificationConfigDialog"
import { getStatusColor } from "@/lib/constants/status"

export type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'

export interface ColumnConfig {
    id: string
    label: string
    type: ColumnType
    required?: boolean
    visible?: boolean
    width?: number
    options?: string[]
}

interface ItemsTableProps {
    columns: ColumnConfig[]
    data: any[]
    serviceId?: string // Context
    tableBlockId?: string // For multi-table services
    onEdit?: (item: any) => void
    onDelete?: (item: any) => void
    onStatusChange?: (id: string, data: any) => Promise<void>
    primaryColor?: string
    lastViewedAt?: string
    isLoading?: boolean
    highlightedItemId?: string | null
}

import { Skeleton } from "@/components/ui/skeleton"
import { updateColumnWidthAction as saveColumnWidth } from "@/app/actions/columns"

export function ItemsTable({ columns, data, serviceId, tableBlockId, onEdit, onDelete, onStatusChange, primaryColor, lastViewedAt, isLoading, highlightedItemId }: ItemsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnSizing, setColumnSizing] = React.useState({})
    const [isHeaderSticky, setIsHeaderSticky] = React.useState(false)

    const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
        const dateColId = columns.find((c) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
            || columns.find((c) => c.type === 'date')?.id

        const baseCols: ColumnDef<any>[] = columns.map((col, index) => ({
            accessorKey: col.id,
            size: col.width || 150, // Default width
            minSize: 80,
            maxSize: 800,
            header: ({ column, header }) => {
                return (
                    <div className={cn("flex items-center relative w-full h-full", index === 0 ? "justify-start pl-[48px]" : "justify-center")}>
                        {index === 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setIsHeaderSticky(!isHeaderSticky)
                                }}
                                className="h-6 w-6 mr-2 text-slate-400 hover:text-slate-600 absolute left-4"
                                title={isHeaderSticky ? "Desafixar cabeçalho" : "Fixar cabeçalho"}
                            >
                                {isHeaderSticky ? (
                                    <Lock className="h-3 w-3" />
                                ) : (
                                    <Unlock className="h-3 w-3" />
                                )}
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                            className="h-8 data-[state=open]:bg-accent hover:bg-slate-100/50 px-2"
                        >
                            <span className="truncate max-w-[150px] block" title={col.label}>{col.label || col.id}</span>
                            {column.getIsSorted() === "asc" ? (
                                <ArrowUp className="ml-2 h-3 w-3 flex-shrink-0" />
                            ) : column.getIsSorted() === "desc" ? (
                                <ArrowDown className="ml-2 h-3 w-3 flex-shrink-0" />
                            ) : (
                                <ArrowUpDown className="ml-2 h-3 w-3 opacity-50 flex-shrink-0" />
                            )}
                        </Button>
                        {(col.type === 'date' || col.type === 'status') && (
                            <ColumnHeaderBell
                                columnId={col.id}
                                type={col.type}
                                serviceId={serviceId}
                                statusOptions={col.type === 'status' ? col.options : undefined}
                            />
                        )}
                    </div>
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
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                                getStatusColor(value as string)
                            )}>
                                {value as React.ReactNode}
                            </span>
                        )
                    }

                    return value
                }

                const content = renderContent()

                if (index !== 0) return <div className="flex justify-center items-center w-full h-full">{content}</div>

                // If FIRST column, prepend the Expander and Indicators
                const hasDetails = !!row.original.details
                const hasAttachments = row.original.attachments && row.original.attachments.length > 0
                const isNew = !!lastViewedAt && (!!row.original.updated_at && new Date(row.original.updated_at).getTime() > new Date(lastViewedAt).getTime())

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

                    // Determine context for Row Alarm (Date if exists, otherwise Status, otherwise generic)
                    const triggerType = dateColId ? 'date' : 'status'

                    return (
                        <div className="flex items-center justify-end">
                            {AlertIcon}
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <NotificationConfigDialog
                                    targetType="row"
                                    targetId={row.original.id}
                                    serviceId={serviceId}
                                    triggerType={triggerType}
                                    dateColumnId={dateColId}
                                >
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-yellow-50 hover:text-yellow-600 text-slate-400"
                                        title="Definir Alerta"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                        }}
                                    >
                                        <Bell className="h-4 w-4" />
                                    </Button>
                                </NotificationConfigDialog>
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
    }, [columns, onEdit, onDelete, lastViewedAt, onStatusChange, isHeaderSticky])

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
        onSortingChange: setSorting,
        onColumnSizingChange: setColumnSizing,
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnSizing,
        },
    })

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <TableScrollWrapper
                innerClassName={isHeaderSticky ? "max-h-[75vh] overflow-y-auto" : ""}
                hideScrollbar={!isHeaderSticky}
            >
                <Table className="min-w-full w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn(
                                                "h-12 px-4 text-left align-middle font-bold text-slate-800 uppercase tracking-wider text-sm border-b-2 border-slate-100 group relative",
                                                isHeaderSticky && "sticky top-0 z-40 bg-white shadow-sm"
                                            )}
                                            style={{
                                                width: header.getSize(),
                                                minWidth: header.column.columnDef.minSize,
                                                maxWidth: header.column.columnDef.maxSize,
                                                color: primaryColor ? getLegibleTextColor(primaryColor) : undefined
                                            }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {/* Resizer Handle */}
                                            {header.column.getCanResize() && (
                                                <div
                                                    onMouseDown={(e) => {
                                                        header.getResizeHandler()(e)
                                                        e.stopPropagation()
                                                        e.preventDefault() // Prevent text selection
                                                        const startWidth = header.column.getSize()
                                                        const onMouseUp = () => {
                                                            const endWidth = header.column.getSize()
                                                            if (startWidth !== endWidth) {
                                                                if (serviceId) {
                                                                    saveColumnWidth(serviceId, tableBlockId, header.column.id, endWidth)
                                                                }
                                                            }
                                                            window.removeEventListener('mouseup', onMouseUp)
                                                        }
                                                        window.addEventListener('mouseup', onMouseUp)
                                                    }}
                                                    onTouchStart={(e) => {
                                                        header.getResizeHandler()(e)
                                                        e.stopPropagation()
                                                        const startWidth = header.column.getSize()
                                                        const onTouchEnd = () => {
                                                            const endWidth = header.column.getSize()
                                                            if (startWidth !== endWidth) {
                                                                if (serviceId) {
                                                                    saveColumnWidth(serviceId, tableBlockId, header.column.id, endWidth)
                                                                }
                                                            }
                                                            window.removeEventListener('touchend', onTouchEnd)
                                                        }
                                                        window.addEventListener('touchend', onTouchEnd)
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className={cn(
                                                        "absolute right-0 top-0 h-full w-4 cursor-col-resize touch-none select-none z-20 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity",
                                                    )}
                                                >
                                                    {/* The visible line */}
                                                    <div className={cn(
                                                        "w-1 h-full bg-blue-300",
                                                        header.column.getIsResizing() ? "bg-blue-600 w-1.5 opacity-100" : ""
                                                    )} />
                                                </div>
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
                                // Only mark as new if we HAVE a previous view date and the item is newer than that.
                                // This prevents "all blue" on first load or F5 when lastViewedAt might be undefined initially.
                                const isNew = !!lastViewedAt && (!!row.original.updated_at && new Date(row.original.updated_at).getTime() > new Date(lastViewedAt).getTime())
                                const isHighlighted = highlightedItemId === row.original.id

                                return (
                                    <React.Fragment key={row.id}>
                                        <TableRow
                                            data-state={row.getIsSelected() && "selected"}
                                            data-item-id={row.original.id}
                                            className={cn(
                                                "group transition-colors cursor-pointer hover:bg-slate-50",
                                                isNew ? "bg-blue-100 hover:bg-blue-200" : "",
                                                isHighlighted && "animate-pulse bg-yellow-200 hover:bg-yellow-200"
                                            )}
                                            style={{
                                                backgroundColor: isHighlighted
                                                    ? '#fef08a' // yellow-200
                                                    : isNew
                                                        ? undefined
                                                        : (index % 2 === 1 && primaryColor && !row.getIsExpanded()) ? `${primaryColor}08` : undefined,
                                                transition: 'background-color 0.3s ease'
                                            }}
                                            onClick={() => row.toggleExpanded()}
                                        >


                                            {/* Cells */}
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell
                                                    key={cell.id}
                                                    className="align-middle py-3 px-2 border-b border-slate-100 whitespace-normal break-words"
                                                    style={{
                                                        width: cell.column.getSize(),
                                                        minWidth: cell.column.columnDef.minSize,
                                                        maxWidth: cell.column.columnDef.maxSize,
                                                    }}
                                                >
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
