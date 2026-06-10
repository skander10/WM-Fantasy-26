import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Öffentliche Routen: kein Login nötig
  const publicPaths = ['/', '/login', '/register', '/check-email', '/auth/callback']
  if (publicPaths.includes(path)) return supabaseResponse

  // Nicht eingeloggt → Login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Profil holen um paid/admin zu prüfen
  const { data: profile } = await supabase
    .from('profiles')
    .select('paid, role')
    .eq('id', user.id)
    .single()

  // Admin-Seiten: nur für Admin
  if (path.startsWith('/admin') && profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Nicht bezahlt → Warte-Seite (außer /pending-payment selbst)
  if (!profile?.paid && path !== '/pending-payment') {
    return NextResponse.redirect(new URL('/pending-payment', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
}
