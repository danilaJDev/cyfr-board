import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  return (
    <div className="page-shell min-h-dvh">
      <Sidebar profile={profile} />

      <main className="lg:ml-72">
        <div className="container-page mx-auto px-4 pb-10 pt-20 sm:px-6 lg:px-10 lg:pt-10">
          {children}
        </div>
      </main>
    </div>
  )
}
