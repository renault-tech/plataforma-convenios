"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    useReactTable,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChevronDown, ChevronRight, FileText, Paperclip } from "lucide-react"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useStore, Agreement, ColumnDefinition } from "@/lib/store"
import { cn } from "@/lib/utils"
import { RowDetails } from "@/components/ui/RowDetails"
import { TableScrollWrapper } from "@/components/ui/TableScrollWrapper"

export function AgreementTable() {
    const { columns, agreements } = useStore()

    const tableColumns: ColumnDef<Agreement>[] = React.useMemo(() => {
        const cols: ColumnDef<Agreement>[] = [
            {
                id: "expander",
                header: "",
                cell: ({ row }) => {
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
            },
            ...columns.map((col: ColumnDefinition) => ({
                accessorKey: col.id,
                header: col.label,
                cell: ({ getValue }: any) => {
                    const value = getValue()

                    if (col.type === "currency") {
                        return new Intl.NumberFormat("pt-BR", {
                            style: "decimal",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(Number(value) || 0)
                    }

                    if (col.type === "date" && value) {
                        try {
                            return format(new Date(value), "dd/MM/yyyy", { locale: ptBR })
                        } catch (e) {
                            return value
                        }
                    }

                    if (col.type === "status") {
                        return (
                            <span className={cn(
                                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                                (value === "Ativo" || value === "Vigente") ? "bg-green-100 text-green-800" :
                                    (value === "Pendente" || value === "Em Análise") ? "bg-yellow-100 text-yellow-800" :
                                        "bg-slate-100 text-slate-800"
                            )}>
                                {value}
                            </span>
                        )
                    }

                    return value
                },
            }))
        ]

        return cols
    }, [columns])

    const table = useReactTable({
        data: agreements,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getRowCanExpand: () => true,
    })

    return (
        <div className="rounded-md border bg-white overflow-hidden">
            <TableScrollWrapper>
                <Table className="min-w-full">
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id} className="min-w-[150px]">
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
                                <React.Fragment key={row.id}>
                                    <TableRow
                                        key={row.id}
                                        data-state={row.getIsSelected() && "selected"}
                                        className="cursor-pointer hover:bg-slate-50"
                                        onClick={() => row.toggleExpanded()}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell key={cell.id} className="align-top py-3 break-words">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {row.getIsExpanded() && (
                                        <TableRow className="bg-slate-50/50 hover:bg-transparent">
                                            <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b">
                                                <RowDetails details={row.original.details} attachments={row.original.attachments} />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Nenhum convênio encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableScrollWrapper>
        </div>
    )
}
