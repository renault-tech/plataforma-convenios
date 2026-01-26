"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
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
import { useStore, Agreement, ColumnDefinition } from "@/lib/store"
import { cn } from "@/lib/utils"

export function AgreementTable() {
    const { columns, agreements } = useStore()

    const tableColumns: ColumnDef<Agreement>[] = React.useMemo(() => {
        return columns.map((col: ColumnDefinition) => ({
            accessorKey: col.id,
            header: col.label,
            cell: ({ getValue }) => {
                const value = getValue()

                if (col.type === "currency") {
                    return new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                    }).format(value as number)
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
    }, [columns])

    const table = useReactTable({
        data: agreements,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
    })

    return (
        <div className="rounded-md border bg-white">
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
                                colSpan={columns.length}
                                className="h-24 text-center"
                            >
                                Nenhum convênio encontrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
