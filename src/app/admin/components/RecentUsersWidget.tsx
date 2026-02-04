"use client"

import { CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { X, User } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export function RecentUsersWidget() {
    const [users, setUsers] = useState<any[]>([])
    const supabase = createClient()

    const fetchUsers = async () => {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5)

        if (data) setUsers(data)
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async (id: string) => {
        // Implementation note: Soft delete or specialized admin function preferred
        // For now, toast demonstration
        toast.info("Funcionalidade de exclusão simulada para demonstração.")
    }

    return (
        <CardContent className="pt-2 px-2">
            <div className="space-y-2">
                {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-2 hover:bg-slate-100 rounded-md group transition-colors">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar_url} />
                                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{user.full_name || user.email}</span>
                                <span className="text-xs text-slate-500">{user.email}</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDelete(user.id)}
                            title="Excluir Usuário"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>
        </CardContent>
    )
}
