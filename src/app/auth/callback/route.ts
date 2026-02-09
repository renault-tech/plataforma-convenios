import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            // Redirect to dashboard with welcome param if it was a signup flow
            // We can infer it's a new signup if we just verified info, or simply force it for this specific callback
            // However, usually we might just want to show "Email Confirmed"

            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            if (isLocalEnv) {
                // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
                return NextResponse.redirect(`${origin}/auth/confirmed`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}/auth/confirmed`)
            } else {
                return NextResponse.redirect(`${origin}/auth/confirmed`)
            }
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
