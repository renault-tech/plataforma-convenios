import { createClient } from "@/lib/supabase/server"
import { ServiceView } from "@/components/services/ServiceView"
import { redirect } from "next/navigation"

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    // 1. Fetch Service by Slug
    // We need to fetch details to display the header and configure columns instantly
    const { data: services, error: serviceError } = await supabase
        .from("services")
        .select(`
            *,
            service_permissions (
                status,
                grantee_type,
                origin_group_id
            ),
            table_blocks (*)
        `)
        .eq("slug", slug)

    // Logic to find the correct service (owned or shared)
    // Similar to ServiceContext logic but simplified for single lookup
    const service = services?.find(s =>
        s.owner_id === user.id ||
        s.service_permissions?.some((p: any) => p.status === 'active')
    )

    if (!service) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-xl font-bold mb-2">Serviço não encontrado</h1>
                <p className="text-muted-foreground">Você não tem acesso a este serviço ou ele não existe.</p>
            </div>
        )
    }

    // Fetch service_columns if they exist (for imported services)
    const { data: serviceColumns } = await supabase
        .from('service_columns')
        .select('*')
        .eq('service_id', service.id)
        .order('order', { ascending: true })

    // Attach columns to service object if they exist
    if (serviceColumns && serviceColumns.length > 0) {
        service.service_columns = serviceColumns
    }

    // 2. Fetch Initial Items (Limited)
    // Fetch only necessary data for the table to avoid over-fetching
    const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*') // For now select * to ensure existing components work. Optimize later.
        .eq('service_id', service.id)
        .order('created_at', { ascending: true }) // Excel style: Oldest (Top of sheet) first

    const initialItems = itemsData?.map(item => ({
        id: item.id,
        service_id: item.service_id,
        table_block_id: item.table_block_id,
        created_at: item.created_at,
        ...item.data
    })) || []

    return (
        <ServiceView
            initialService={service}
            initialItems={initialItems}
        />
    )
}
