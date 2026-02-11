import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { cn, getContrastYIQ } from "@/lib/utils"

interface ServiceNavigationProps {
    services: any[]
    activeServiceId: string
}

export function ServiceNavigation({ services, activeServiceId }: ServiceNavigationProps) {
    return (
        <div className="flex flex-wrap items-center gap-3 pb-2 border-b border-transparent">
            {services.map(service => {
                const isActive = service.id === activeServiceId
                const textColor = isActive ? getContrastYIQ(service.primary_color) : undefined

                return (
                    <Link key={service.id} href={`/servicos/${service.slug}`}>
                        <Button
                            variant={isActive ? "default" : "outline"}
                            className={cn(
                                "h-9 px-4 rounded-full transition-colors font-medium",
                                isActive
                                    ? "hover:opacity-90 border-transparent shadow-sm"
                                    : "hover:bg-slate-100 text-slate-600 border-slate-200"
                            )}
                            style={isActive ? {
                                backgroundColor: service.primary_color,
                                color: textColor
                            } : {}}
                        >
                            {service.name}
                        </Button>
                    </Link>
                )
            })}
            <Link href="/configuracoes?tab=new">
                <Button
                    variant="secondary"
                    className={cn(
                        "h-9 px-4 rounded-full gap-2 border shadow-sm",
                        "bg-white text-slate-900 hover:bg-slate-50 border-slate-200"
                    )}
                >
                    <PlusCircle className="h-4 w-4" />
                    Novo Serviço
                </Button>
            </Link>
        </div>
    )
}
