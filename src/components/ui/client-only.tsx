"use client"

import { useEffect, useState } from "react"

export function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setHasMounted(true)
    }, [])

    if (!hasMounted) {
        return null
    }

    return <>{children}</>
}
