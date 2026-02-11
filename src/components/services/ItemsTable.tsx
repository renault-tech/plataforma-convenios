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
    ColumnOrderState,
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
import { Pencil, Trash2, AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Paperclip, FileText, ArrowUpDown, ArrowUp, ArrowDown, Bell, Lock, Unlock, GripHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RowDetails } from "@/components/ui/RowDetails"
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper"
import { StatusCell } from "@/components/services/StatusCell"
import { ColumnHeaderBell } from "@/components/notifications/ColumnHeaderBell"
import { NotificationConfigDialog } from "@/components/notifications/NotificationConfigDialog"
import { getStatusColor } from "@/lib/constants/status"

// DnD Kit Imports
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderColumnsAction } from "@/app/actions/columns"
import { toast } from "sonner"

export type ColumnType = 'text' | 'number' | 'date' | 'currency' | 'status' | 'boolean'

export interface ColumnConfig {
    id: string
    label: string
    type: ColumnType
    required?: boolean
    visible?: boolean
    width?: number
    options?: string[]
    order?: number
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

// Sortable Header Component
function SortableHeader({ id, column, children, isHeaderSticky, isPinned }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id })

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 999 : 'auto',
        position: 'relative'
    }

    // Don't allow dragging if it's a pinned column (like row_index or actions) or if resizing
    // We handle this via DndContext sensors mostly, but we can also disable listeners here if needed.
    // However, it's better to just not make them sortable in the parent list.

    return (
        <TableHead
            ref={setNodeRef}
            className={cn(
                "h-12 px-4 text-left align-middle font-bold text-slate-800 uppercase tracking-wider text-sm border-b-2 border-slate-100 group relative select-none",
                isHeaderSticky && "sticky top-0 z-40 bg-white shadow-sm",
                isPinned && "z-50" // Higher z-index for pinned columns if necessary
            )}
            style={{
                width: column.getSize(),
                minWidth: column.columnDef.minSize,
                maxWidth: column.columnDef.maxSize,
                cursor: isDragging ? 'grabbing' : 'default',
                ...style
            }}
            {...attributes}
            {...listeners}
        >
            {children}
        </TableHead>
    )
}

export function ItemsTable({ columns, data, serviceId, tableBlockId, onEdit, onDelete, onStatusChange, primaryColor, lastViewedAt, isLoading, highlightedItemId }: ItemsTableProps) {
    const [sorting, setSorting] = React.useState<SortingState>([{ id: "row_index", desc: false }])
    const [columnSizing, setColumnSizing] = React.useState({})
    const [isHeaderSticky, setIsHeaderSticky] = React.useState(false)
    const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])

    // Initialize/Sync column order
    // We use a simplified strategy: existing state wins unless new columns appear.
    // Actually, trust props first for initialization, then local state for DnD.
    React.useEffect(() => {
        if (columns.length > 0) {
            // Base IDs from props
            const propIds = columns.map(c => c.id)

            // Add fixed columns
            const allIds = ["row_index", ...propIds]
            if (onEdit || onDelete || columns.some(c => c.type === 'date')) {
                allIds.push("actions")
            }

            setColumnOrder(prev => {
                // If it's the first load (empty), just set it.
                if (prev.length === 0) return allIds

                // If props changed (e.g. added column), insert it.
                // This logic is complex. For now, let's just reset if length mismatch significant
                // or just rely on the prop order essentially resetting it if we don't save fast enough.
                // Better: If the set of IDs matches, keep order. If not, reset.
                const prevSet = new Set(prev)
                const newSet = new Set(allIds)

                if (prev.length === allIds.length && allIds.every(id => prevSet.has(id))) {
                    return prev
                }

                return allIds
            })
        }
    }, [columns, onEdit, onDelete])


    const tableColumns: ColumnDef<any>[] = React.useMemo(() => {
        const dateColId = columns.find((c) => c.type === 'date' && /vencimento|prazo|limite|validade/i.test(c.label))?.id
            || columns.find((c) => c.type === 'date')?.id

        const baseCols: ColumnDef<any>[] = columns.map((col, index) => ({
            id: col.id, // Explicit ID
            accessorKey: col.id,
            size: col.width || 150, // Default width
            minSize: 80,
            maxSize: 800,
            header: ({ column, header }) => {
                return (
                    <div className={cn("flex items-center relative w-full h-full", index === 0 ? "justify-start pl-[48px]" : "justify-center")}>
                        {/* Grip Handle for Dragging - Visible on Hover */}
                        {/* <div className="absolute left-2 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing">
                            <GripHorizontal className="h-4 w-4" /> 
                        </div> */}
                        {/* Actually we drag by whole header now */}

                        {index === 0 && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                    // e.stopPropagation() // Prevent drag start?
                                    // Actually PointerSensor handles this if we configure it right
                                    setIsHeaderSticky(!isHeaderSticky)
                                }}
                                onPointerDown={(e) => e.stopPropagation()} // Stop propagation to prevent drag
                                className="h-6 w-6 mr-2 text-slate-400 hover:text-slate-600 absolute left-4 z-10"
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
                            onPointerDown={(e) => e.stopPropagation()} // Stop drag interaction
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
                            <div onPointerDown={(e) => e.stopPropagation()}>
                                <ColumnHeaderBell
                                    columnId={col.id}
                                    type={col.type}
                                    serviceId={serviceId}
                                    statusOptions={col.type === 'status' ? col.options : undefined}
                                />
                            </div>
                        )}
                    </div>
                )
            },
            cell: ({ getValue, row }) => {
                const value = getValue() as string | number | null | undefined

                // Helper to render the actual content
                const renderContent = () => {
                    let safeValue = value

                    // Handle Excel Object leak (Hyperlink/RichText) - Defensive Check
                    if (safeValue && typeof safeValue === 'object') {
                        if ('text' in safeValue) safeValue = (safeValue as any).text
                        else if ('hyperlink' in safeValue) safeValue = (safeValue as any).hyperlink
                        else safeValue = JSON.stringify(safeValue)
                    }

                    if (!safeValue) return safeValue

                    if (col.type === "currency") {
                        return new Intl.NumberFormat("pt-BR", {
                            style: "decimal",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(Number(safeValue) || 0)
                    }

                    if (col.type === "date" && safeValue) {
                        try {
                            return format(new Date(safeValue as string), "dd/MM/yyyy", { locale: ptBR })
                        } catch (e) {
                            return safeValue
                        }
                    }

                    if (col.type === "status") {
                        if (onStatusChange) {
                            return (
                                <StatusCell
                                    value={String(safeValue)}
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
                                getStatusColor(String(safeValue))
                            )}>
                                {safeValue as React.ReactNode}
                            </span>
                        )
                    }

                    return safeValue
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

        // Add invisible row_index column for sorting
        baseCols.unshift({
            id: "row_index",
            accessorKey: "row_index",
            header: "",
            size: 0,
            enableHiding: true,
            sortingFn: 'basic', // Ensure numeric sort
            cell: () => null
        })

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
    }, [columns, onEdit, onDelete, lastViewedAt, onStatusChange, isHeaderSticky, serviceId]) // Added serviceId dep

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
        onSortingChange: setSorting,
        onColumnSizingChange: setColumnSizing,
        onColumnOrderChange: setColumnOrder, // Hook up order state
        columnResizeMode: "onChange",
        enableColumnResizing: true,
        // @ts-ignore
        autoResetPageIndex: false,
        // @ts-ignore
        autoResetSorting: false,
        // @ts-ignore
        autoResetColumnSizing: false,
        getSortedRowModel: getSortedRowModel(),
        state: {
            sorting,
            columnSizing,
            columnOrder, // Pass order state
        },
    })

    // DnD Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Drag starts after 8px movement
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (active && over && active.id !== over.id) {
            setColumnOrder((order) => {
                const oldIndex = order.indexOf(active.id as string)
                const newIndex = order.indexOf(over.id as string)
                const newOrder = arrayMove(order, oldIndex, newIndex)

                // Persist to DB
                if (serviceId) {
                    // Filter out non-data columns for the action
                    const dataColumnsOrder = newOrder.filter(id => id !== 'row_index' && id !== 'actions')

                    // Defer server action to next tick to avoid "update during render" conflicts
                    setTimeout(() => {
                        toast.promise(
                            reorderColumnsAction(serviceId, tableBlockId, dataColumnsOrder),
                            {
                                loading: 'Salvando ordem...',
                                success: 'Ordem das colunas atualizada!',
                                error: 'Erro ao salvar ordem'
                            }
                        )
                    }, 0)
                }

                return newOrder
            })
        }
    }

    const autoFitColumn = (columnId: string) => {
        const colConfig = columns.find(c => c.id === columnId)
        if (!colConfig) return

        let maxLength = (colConfig.label || "").length
        if (!data) return
        const sampleData = data.slice(0, 50)

        sampleData.forEach(row => {
            const val = row[columnId]
            if (val !== undefined && val !== null) {
                const strVal = String(val)
                if (strVal.length > maxLength) maxLength = strVal.length
            }
        })

        let newWidth = Math.min(Math.max(maxLength * 10 + 24, 80), 600)

        setColumnSizing(prev => ({
            ...prev,
            [columnId]: newWidth
        }))

        if (serviceId) {
            saveColumnWidth(serviceId, tableBlockId, columnId, newWidth)
        }
    }

    return (
        <div className="rounded-md border bg-white shadow-sm">
            <DndContext
                id={`dnd-table-${serviceId || 'default'}`}
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <TableScrollWrapper
                    innerClassName={isHeaderSticky ? "max-h-[75vh] overflow-y-auto" : ""}
                    hideScrollbar={!isHeaderSticky}
                >
                    <Table className="min-w-full w-full table-fixed" style={{ tableLayout: 'fixed' }}>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                                    <SortableContext
                                        items={columnOrder}
                                        strategy={horizontalListSortingStrategy}
                                    >
                                        {headerGroup.headers.map((header) => {
                                            // Decide if this column is sortable/draggable
                                            const isPinned = header.column.id === 'row_index' || header.column.id === 'actions'

                                            // If pinned, we don't wrap in SortableHeader? 
                                            // Actually SortableContext expects items to match.
                                            // But if we pass pinned items to SortableHeader, they will be draggable.
                                            // To fix: In SortableHeader check id.

                                            if (isPinned) {
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        className={cn(
                                                            "h-12 px-4 text-left align-middle font-bold text-slate-800 uppercase tracking-wider text-sm border-b-2 border-slate-100 group relative",
                                                            isHeaderSticky && "sticky top-0 z-40 bg-white shadow-sm",
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
                                                    </TableHead>
                                                )
                                            }

                                            return (
                                                <SortableHeader
                                                    key={header.id}
                                                    id={header.id}
                                                    column={header.column}
                                                    isHeaderSticky={isHeaderSticky}
                                                >
                                                    {/* Render Header Content */}
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.header,
                                                            header.getContext()
                                                        )}

                                                    {/* Resizer Handle (Moved inside SortableHeader) */}
                                                    {header.column.getCanResize() && (
                                                        <div
                                                            onMouseDown={(e) => {
                                                                header.getResizeHandler()(e)
                                                                e.stopPropagation()
                                                                e.preventDefault()
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
                                                            onDoubleClick={(e) => {
                                                                e.stopPropagation()
                                                                autoFitColumn(header.column.id)
                                                            }}
                                                            // Very Important: STOP PROPAGATION on click to prevent Drag start on resizer
                                                            onPointerDown={(e) => e.stopPropagation()}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className={cn(
                                                                "absolute right-0 top-0 h-full w-4 cursor-col-resize touch-none select-none z-20 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity",
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-1 h-full bg-blue-300",
                                                                header.column.getIsResizing() ? "bg-blue-600 w-1.5 opacity-100" : ""
                                                            )} />
                                                        </div>
                                                    )}
                                                </SortableHeader>
                                            )
                                        })}
                                    </SortableContext>
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
                                                        ? '#fef08a'
                                                        : isNew
                                                            ? undefined
                                                            : (index % 2 === 1 && primaryColor && !row.getIsExpanded()) ? `${primaryColor}08` : undefined,
                                                    transition: 'background-color 0.3s ease'
                                                }}
                                                onClick={() => row.toggleExpanded()}
                                            >
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
                                                    <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b-2 border-slate-100">
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
            </DndContext>
        </div >
    )
}
