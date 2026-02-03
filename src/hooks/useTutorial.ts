"use client"

import { useEffect, useState } from "react"
import { driver } from "driver.js"
import { createClient } from "@/lib/supabase/client"

type TourType = 'global' | 'service'

export function useTutorial() {
    const supabase = createClient()
    const [driverObj, setDriverObj] = useState<any>(null)

    const getDynamicSteps = (tourGroup: string) => {
        // Query all elements with the matching tour group
        const elements = document.querySelectorAll(`[data-tour-group='${tourGroup}']`)

        // Convert NodeList to Array and map to driver.js steps
        const steps = Array.from(elements)
            .map((el) => {
                const id = el.id ? `#${el.id}` : null
                if (!id) return null // Driver.js needs an ID or class selector usually, effectively we need a selector.

                // If element doesn't have ID, we might need to handle it, but for now enforcing IDs is safer for driver.js
                // Alternatively, we could generate unique IDs if needed, but let's stick to existing IDs.

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

        return steps
    }

    const initDriver = (steps: any[]) => {
        return driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            doneBtnText: "Concluir",
            nextBtnText: "Próximo",
            prevBtnText: "Anterior",
            steps: steps,
            // Customizing buttons to ensure Close/Skip is visible if possible, 
            // though standard driver.js relies on 'allowClose' for the X button.
            // We can add a custom 'onPopoverRendered' to inject a close button if strictly needed,
            // but standard UI is usually sufficient. Let's rely on standard X.
        })
    }

    const markAsSeen = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from("profiles").update({ has_seen_tutorial: true }).eq("id", user.id)
        }
    }

    const startTutorial = (force = false, type: TourType | 'settings' | 'dashboard' = 'global') => {
        if (typeof document === 'undefined') return

        const steps = getDynamicSteps(type)

        if (steps.length === 0) {
            // Fallback or just don't start if no steps found
            console.warn(`No tutorial steps found for group: ${type}`)
            return
        }

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
