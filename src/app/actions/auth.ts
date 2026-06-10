'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(_: unknown, formData: FormData): Promise<string | null> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) {
    if (error.message === 'Invalid login credentials') {
      return 'Email oder Passwort ist falsch.'
    }
    return 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.'
  }

  redirect('/predict/matches')
}

export async function register(_: unknown, formData: FormData): Promise<string | null> {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const username = (formData.get('username') as string)?.trim()
  const firstName = (formData.get('firstName') as string)?.trim()
  const lastName = (formData.get('lastName') as string)?.trim()

  if (!firstName) return 'Vorname ist erforderlich.'
  if (!lastName) return 'Nachname ist erforderlich.'
  if (!username) return 'Username ist erforderlich.'
  if (!email) return 'Email ist erforderlich.'
  if (!password || password.length < 6) return 'Passwort muss mindestens 6 Zeichen haben.'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Daten werden als Metadata gespeichert — Profil wird erst nach Email-Bestätigung erstellt
      data: { username, first_name: firstName, last_name: lastName },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return 'Diese Email-Adresse ist bereits registriert.'
    }
    return error.message
  }

  redirect('/check-email')
}
