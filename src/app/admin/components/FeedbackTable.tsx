"use client"

import { useState } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MoreVertical, CheckCircle, Archive, Trash2, MessageSquare } from "lucide-react"
import { updateFeedbackStatus, deleteFeedback } from "@/app/actions/feedback"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

export function FeedbackTable({ initialData }: { initialData: any[] }) {
    const [data, setData] = useState(initialData)
    const [filter, setFilter] = useState<'all' | 'new'>('all')
    const [selectedFeedback, setSelectedFeedback] = useState<any>(null)

    const filteredData = filter === 'all' ? data : data.filter(item => item.status === 'new')

    const handleStatusUpdate = async (id: string, status: 'new' | 'read' | 'archived') => {
        const result = await updateFeedbackStatus(id, status)
        if (result.success) {
            setData(prev => prev.map(item => item.id === id ? { ...item, status } : item))
            toast.success("Status atualizado")
            // If viewing details, update local state too if needed, or close
            if (selectedFeedback?.id === id) {
                setSelectedFeedback(prev => ({ ...prev, status }))
            }
        } else {
            toast.error("Erro ao atualizar")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return
        const result = await deleteFeedback(id)
        if (result.success) {
            setData(prev => prev.filter(item => item.id !== id))
            toast.success("Feedback excluído")
            if (selectedFeedback?.id === id) setSelectedFeedback(null)
        } else {
            toast.error("Erro ao excluir")
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilter('all')}
                    size="sm"
                >
                    Todos
                </Button>
                <Button
                    variant={filter === 'new' ? 'default' : 'outline'}
                    onClick={() => setFilter('new')}
                    size="sm"
                >
                    Novos
                </Button>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Mensagem</TableHead>
                            <TableHead>Origem</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredData.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum feedback encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredData.map((item) => (
                                <TableRow
                                    key={item.id}
                                    className="cursor-pointer hover:bg-slate-50"
                                    onClick={() => setSelectedFeedback(item)}
                                >
                                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                                        {format(new Date(item.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium text-sm">{item.profiles?.full_name || 'Anônimo'}</span>
                                            <span className="text-xs text-muted-foreground">{item.profiles?.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[400px]">
                                        <p className="line-clamp-3 text-sm text-slate-600 break-words" title={item.message}>{item.message}</p>
                                    </TableCell>
                                    <TableCell className="max-w-[150px]">
                                        <div className="flex flex-col gap-1">
                                            <Badge variant="outline" className="w-fit text-[10px] uppercase">
                                                {item.type}
                                            </Badge>
                                            {item.url && (
                                                <span className="text-[10px] text-muted-foreground truncate" title={item.url}>
                                                    {item.url}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn(
                                            "uppercase text-[10px]",
                                            item.status === 'new' ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                                                item.status === 'read' ? "bg-green-100 text-green-700 hover:bg-green-100" :
                                                    "bg-slate-100 text-slate-700 hover:bg-slate-100"
                                        )}>
                                            {item.status === 'new' ? 'Novo' : item.status === 'read' ? 'Lido' : 'Arquivado'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'read')}>
                                                    <CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Marcar como Lido
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'archived')}>
                                                    <Archive className="mr-2 h-4 w-4 text-slate-600" /> Arquivar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(item.id, 'new')}>
                                                    <MessageSquare className="mr-2 h-4 w-4 text-blue-600" /> Marcar como Novo
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleDelete(item.id)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Feedback</DialogTitle>
                        <DialogDescription>
                            Enviado em {selectedFeedback && format(new Date(selectedFeedback.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedFeedback && (
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block mb-1">Usuário</span>
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium">{selectedFeedback.profiles?.full_name || 'Anônimo'}</div>
                                    </div>
                                    <div className="text-muted-foreground text-xs">{selectedFeedback.profiles?.email}</div>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block mb-1">Origem / Página</span>
                                    <div className="font-medium truncate" title={selectedFeedback.url}>{selectedFeedback.url || '-'}</div>
                                </div>
                            </div>

                            <div>
                                <span className="text-muted-foreground block mb-2 font-medium">Mensagem</span>
                                <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-slate-50 text-sm">
                                    <p className="whitespace-pre-wrap break-all text-sm text-foreground">{selectedFeedback.message}</p>
                                </ScrollArea>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedFeedback?.status === 'new' && (
                            <Button onClick={() => {
                                handleStatusUpdate(selectedFeedback.id, 'read')
                                setSelectedFeedback(null)
                            }} className="bg-blue-600 hover:bg-blue-700">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Marcar com Lido
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setSelectedFeedback(null)}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
