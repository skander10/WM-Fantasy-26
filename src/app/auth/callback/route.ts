import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Profil wird automatisch vom DB-Trigger erstellt
      return NextResponse.redirect(`${origin}/pending-payment`)
    }
  }

  // Etwas ist schiefgelaufen → zurück zum Login mit Hinweis
  return NextResponse.redirect(`${origin}/login?error=1`)
}
