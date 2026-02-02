"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { toast } from "sonner"
import { useAdmin } from "@/hooks/useAdmin"

type Profile = {
    id: string
    email: string
    full_name: string | null
    role: 'admin' | 'user'
    is_super_admin: boolean
    created_at: string
}

export default function UsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const { isSuperAdmin, isAdmin } = useAdmin()

    const fetchUsers = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching users:', error)
                toast.error("Erro ao carregar usuários. Verifique se você tem permissão.")
            } else {
                setUsers(data || [])
            }
        } catch (error) {
            console.error('Error:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (isAdmin) {
            fetchUsers()
        }
    }, [isAdmin])

    const handlePromote = async (id: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', id)

        if (error) {
            toast.error("Erro ao promover usuário")
        } else {
            toast.success("Usuário promovido a Admin!")
            setUsers(users.map(u => u.id === id ? { ...u, role: 'admin' } : u))
        }
    }

    const handleDemote = async (id: string) => {
        const { error } = await supabase
            .from('profiles')
            .update({ role: 'user' })
            .eq('id', id)

        if (error) {
            toast.error("Erro ao rebaixar usuário")
        } else {
            toast.success("Usuário removido da administração!")
            setUsers(users.map(u => u.id === id ? { ...u, role: 'user' } : u))
        }
    }

    if (loading) {
        return <div className="text-center py-8">Carregando usuários...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Gerenciamento de Usuários</h2>
                    <p className="text-slate-500">Visualize e gerencie permissões de acesso.</p>
                </div>
                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                    Total: {users.length}
                </div>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Usuário</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Cadastro</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-xs font-bold">
                                            {user.full_name ? user.full_name.substring(0, 2).toUpperCase() : user.email ? user.email.substring(0, 2).toUpperCase() : '??'}
                                        </div>
                                        <span>{user.full_name || "Sem nome"}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.is_super_admin ? (
                                            <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">
                                                <ShieldCheck className="h-3 w-3 mr-1" />
                                                Super Admin
                                            </Badge>
                                        ) : user.role === 'admin' ? (
                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                                                <Shield className="h-3 w-3 mr-1" />
                                                Admin
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-500">
                                                Usuário
                                            </Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR }) : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                    {!user.is_super_admin && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Abrir menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                {user.role !== 'admin' && (
                                                    <DropdownMenuItem onClick={() => handlePromote(user.id)} className="text-blue-600">
                                                        <Shield className="mr-2 h-4 w-4" />
                                                        Promover a Admin
                                                    </DropdownMenuItem>
                                                )}
                                                {user.role === 'admin' && (
                                                    <DropdownMenuItem onClick={() => handleDemote(user.id)} className="text-red-600">
                                                        <ShieldAlert className="mr-2 h-4 w-4" />
                                                        Remover Admin
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
