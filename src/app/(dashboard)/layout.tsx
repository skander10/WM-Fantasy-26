import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      <Navbar isAdmin={isAdmin} />
      <div className="flex-1">{children}</div>
    </div>
  )
}
