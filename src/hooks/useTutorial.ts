"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import { createClient } from "@/lib/supabase/client"

type TourType = 'global' | 'service' | string

export function useTutorial() {
    const supabase = createClient()
    const [driverObj, setDriverObj] = useState<any>(null)

    // Helper to check if a tour group has been completed locally
    const isTourSeen = (group: string) => {
        if (typeof window === 'undefined') return false
        try {
            const seen = JSON.parse(localStorage.getItem('seen_tutorials') || '[]')
            return seen.includes(group)
        } catch {
            return false
        }
    }

    const markAsSeen = (group: string) => {
        if (typeof window === 'undefined') return

        // 1. Local Storage (Granular)
        try {
            const seen = JSON.parse(localStorage.getItem('seen_tutorials') || '[]')
            if (!seen.includes(group)) {
                const newSeen = [...seen, group]
                localStorage.setItem('seen_tutorials', JSON.stringify(newSeen))
            }
        } catch (e) {
            console.error("Error saving tutorial state", e)
        }

        // 2. DB (Global/Legacy) - Only updates 'has_seen_tutorial' flag once
        // We do this silently in background
        const updateDB = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from("profiles").update({ has_seen_tutorial: true }).eq("id", user.id)
            }
        }
        updateDB()
    }

    const getDynamicSteps = (tourGroup: string) => {
        const elements = document.querySelectorAll(`[data-tour-group='${tourGroup}']`)

        const steps = Array.from(elements)
            .map((el) => {
                const id = el.id ? `#${el.id}` : null
                if (!id) return null

                return {
                    element: id,
                    popover: {
                        title: el.getAttribute('data-tour-title') || "",
                        description: el.getAttribute('data-tour-desc') || "",
                        side: el.getAttribute('data-tour-side') || "bottom",
                        align: el.getAttribute('data-tour-align') || "start"
                    },
                    order: parseInt(el.getAttribute('data-tour-order') || "999")
                }
            })
            .filter(step => step !== null)
            .sort((a: any, b: any) => a.order - b.order)

        // Add the generic final step about the Help Icon
        // Only if we found steps and the help icon exists
        if (steps.length > 0 && document.getElementById('navbar-help-btn')) {
            steps.push({
                element: '#navbar-help-btn',
                popover: {
                    title: "Ajuda Sempre Disponível",
                    description: "Sempre que tiver dúvidas sobre uma tela, clique neste ícone para ver o tutorial novamente.",
                    side: "left",
                    align: "center"
                },
                order: 9999
            })
        }

        return steps
    }

    const initDriver = (steps: any[], onFinish?: () => void) => {
        return driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: "Entendi",
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            steps: steps,
            onDestroyed: () => {
                if (onFinish) onFinish()
            }
        })
    }

    const startTutorial = (force = false, type?: TourType) => {
        if (typeof document === 'undefined') return

        let targetGroup = type

        // Auto-detect context if not provided
        if (!targetGroup) {
            const allGroups = Array.from(document.querySelectorAll('[data-tour-group]'))
                .map(el => el.getAttribute('data-tour-group'))
                .filter(g => g !== null) as string[]

            const uniqueGroups = Array.from(new Set(allGroups))
            const specificGroup = uniqueGroups.find(g => g !== 'global') // 'global' is legacy, we prefer 'home', 'dashboard', etc.
            targetGroup = specificGroup || uniqueGroups[0]
        }

        if (!targetGroup) return

        // Check if seen (only if not forced)
        if (!force && isTourSeen(targetGroup)) {
            return
        }

        const steps = getDynamicSteps(targetGroup)
        if (steps.length === 0) return

        const drv = initDriver(steps, () => {
            // Mark as seen when closed/finished
            markAsSeen(targetGroup!)
        })

        drv.drive()
    }



    return { startTutorial }
}

