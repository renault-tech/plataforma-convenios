"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import { createClient } from "@/lib/supabase/client"

type TourType = 'global' | 'service'

export function useTutorial() {
    const supabase = createClient()
    const [driverObj, setDriverObj] = useState<any>(null)

    // Definitions
    const globalSteps = [
        {
            element: "#sidebar-nav",
            popover: {
                title: "Navegação Principal",
                description: "Aqui você acessa o Dashboard, suas Planilhas e Configurações.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#sidebar-my-services",
            popover: {
                title: "Seus Aplicativos",
                description: "Todos os aplicativos e planilhas que você criou aparecerão aqui.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#sidebar-shared-services",
            popover: {
                title: "Compartilhados com Você",
                description: "Aplicativos que outras pessoas compartilharam com você estarão listados nesta seção.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#feedback-btn",
            popover: {
                title: "Feedback e Sugestões",
                description: "Encontrou um erro ou tem uma ideia? Nos envie diretamente por aqui!",
                side: "bottom",
                align: "center"
            }
        },
        {
            element: "#notifications-trigger",
            popover: {
                title: "Notificações",
                description: "Fique por dentro de convites e atualizações importantes.",
                side: "bottom",
                align: "end"
            }
        },
        {
            element: "#user-menu-trigger",
            popover: {
                title: "Seu Perfil",
                description: "Gerencie sua conta, saia do sistema ou acesse este tutorial novamente a qualquer momento.",
                side: "bottom",
                align: "end"
            }
        }
    ]

    const serviceSteps = [
        {
            element: "#service-header-title",
            popover: {
                title: "Aplicativo / Planilha",
                description: "Este é o nome do seu aplicativo atual. Se você for o dono, pode clicar para editar o nome.",
                side: "bottom",
                align: "start"
            }
        },
        {
            element: "#service-chat-trigger-container",
            popover: {
                title: "Chat da Planilha",
                description: "Este chat é EXTRA e EXCLUSIVO desta planilha. Use-o para discutir dados específicos deste contexto, separado do Chat Global.",
                side: "right",
                align: "end"
            }
        },
        {
            element: "#service-add-item-btn",
            popover: {
                title: "Novo Registro",
                description: "Clique aqui para adicionar uma nova linha ou item à sua planilha.",
                side: "bottom",
                align: "end"
            }
        },
        {
            element: "#items-table-container",
            popover: {
                title: "Tabela Inteligente",
                description: "Esta tabela tem superpoderes: <br/>• <b>Clique na linha</b> para expandir e ver detalhes completos.<br/>• <b>Sinalização Azul:</b> Indica dados novos ou atualizados desde sua última visita.<br/>• <b>Cabeçalhos:</b> Clique para ordenar.",
                side: "top",
                align: "center"
            }
        },
        {
            element: "#service-share-btn",
            popover: {
                title: "Compartilhar",
                description: "Convide outros usuários para visualizar ou editar esta planilha com você.",
                side: "bottom",
                align: "end"
            }
        }
    ]

    const settingsSteps = [
        {
            element: "#settings-tabs",
            popover: {
                title: "Seus Aplicativos",
                description: "Navegue entre suas planilhas ou crie uma nova clicando em '+ Novo Serviço'.",
                side: "bottom",
                align: "start"
            }
        },
        {
            element: "#settings-color-trigger",
            popover: {
                title: "Identidade Visual",
                description: "Clique na cor para alterá-la. Essa cor define a identidade do seu aplicativo em todo o sistema.",
                side: "right",
                align: "center"
            }
        },
        {
            element: "#settings-column-form",
            popover: {
                title: "Criar Colunas",
                description: "Defina os campos do seu formulário e tabela. Escolha entre Texto, Número, Data, Moeda, etc.",
                side: "right",
                align: "start"
            }
        },
        {
            element: "#settings-active-columns",
            popover: {
                title: "Colunas Ativas",
                description: "Gerencie as colunas existentes. Você pode editar ou excluir campos aqui.",
                side: "left",
                align: "start"
            }
        },
        {
            element: "#settings-access-control",
            popover: {
                title: "Controle de Acesso",
                description: "Gerencie quem tem acesso e crie Grupos de Permissão avançados.",
                side: "bottom",
                align: "end"
            }
        }
    ]

    const initDriver = (steps: any[]) => {
        return driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: "Concluir",
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            steps: steps
        })
    }

    const markAsSeen = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from("profiles").update({ has_seen_tutorial: true }).eq("id", user.id)
        }
    }

    const startTutorial = (force = false, type: TourType | 'settings' = 'global') => {
        let steps = globalSteps
        if (type === 'service') steps = serviceSteps
        if (type === 'settings') steps = settingsSteps

        const drv = initDriver(steps)

        if (force) {
            drv.drive()
            return
        }

        // Only auto-start global tour
        if (type === 'global') {
            const checkAndStart = async () => {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("has_seen_tutorial")
                    .eq("id", user.id)
                    .single()

                if (profile && !profile.has_seen_tutorial) {
                    drv.drive()
                    await markAsSeen()
                }
            }
            checkAndStart()
        }
    }

    // Auto-init global on mount (handled via startTutorial(false) elsewhere or here)
    // We keep the original logic of exposing startTutorial
    useEffect(() => {
        startTutorial(false, 'global')
    }, [])

    return { startTutorial }
}
