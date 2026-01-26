import { Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navbar() {
    return (
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
            <div className="flex-1">
                <h1 className="text-lg font-semibold">Gestão de Parcerias</h1>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notificações</span>
                </Button>
                <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                    <span className="sr-only">Perfil</span>
                </Button>
            </div>
        </header>
    )
}
