"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, User, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useChat } from "@/contexts/ChatContext"
import { toast } from "sonner"

interface Profile {
    id: string
    full_name: string
    avatar_url?: string
}

export function NewChatDialog({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const [results, setResults] = useState<Profile[]>([])
    const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { createConversation, currentUser } = useChat()
    const supabase = createClient()

    useEffect(() => {
        const searchUsers = async () => {
            if (search.length < 2) {
                setResults([])
                return
            }

            setIsLoading(true)
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url')
                    .ilike('full_name', `%${search}%`)
                    .neq('id', currentUser?.id) // Exclude self
                    .limit(10)

                if (error) throw error
                setResults(data || [])
            } catch (err) {
                console.error("Error searching searching:", err)
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(searchUsers, 300)
        return () => clearTimeout(timer)
    }, [search, currentUser, supabase])

    const handleToggleUser = (user: Profile) => {
        if (selectedUsers.find(u => u.id === user.id)) {
            setSelectedUsers(prev => prev.filter(u => u.id !== user.id))
        } else {
            // For now only 1-on-1 chats support in UI flow, but logic supports groups
            // If we want groups, we keep array. If DMs only for now, we replace.
            // Let's support selecting multiple to create group, or 1 for DM.
            setSelectedUsers(prev => [...prev, user])
        }
    }

    const handleCreateChat = async () => {
        if (selectedUsers.length === 0) return

        setIsLoading(true)
        try {
            const userIds = selectedUsers.map(u => u.id)
            // Determine type: if > 1 person, it's a group (global group for now)
            // If 1 person, it's a DM (global)
            // TODO: Ensure uniqueness check in createConversation to avoid dupes? 
            // For now, API creates new.

            const type = selectedUsers.length > 1 ? 'group' : 'global'

            await createConversation(userIds, type)
            setOpen(false)
            setSearch("")
            setSelectedUsers([])
            toast.success("Conversa criada!")
        } catch (err) {
            toast.error("Erro ao criar conversa")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nova Conversa</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar pessoa..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <ScrollArea className="h-[200px] border rounded-md p-2">
                        {isLoading && results.length === 0 && (
                            <div className="flex justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            </div>
                        )}

                        {!isLoading && results.length === 0 && search.length >= 2 && (
                            <div className="text-center p-4 text-sm text-slate-500">
                                Nenhum usuário encontrado.
                            </div>
                        )}

                        <div className="space-y-1">
                            {results.map(user => {
                                const isSelected = selectedUsers.some(u => u.id === user.id)
                                return (
                                    <Button
                                        key={user.id}
                                        variant="ghost"
                                        className={`w-full justify-start px-2 ${isSelected ? 'bg-blue-50 text-blue-700' : ''}`}
                                        onClick={() => handleToggleUser(user)}
                                    >
                                        <Avatar className="h-8 w-8 mr-3">
                                            <AvatarImage src={user.avatar_url} />
                                            <AvatarFallback>{user.full_name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left">
                                            <div className="text-sm font-medium">{user.full_name}</div>
                                        </div>
                                        {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                                    </Button>
                                )
                            })}
                        </div>
                    </ScrollArea>

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateChat} disabled={selectedUsers.length === 0 || isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Iniciar Conversa
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
