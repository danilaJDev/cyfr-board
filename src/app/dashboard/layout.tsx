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
        <div className="min-h-screen bg-slate-950 text-white">
            <Sidebar profile={profile} />

            <main className="px-4 pb-10 pt-20 md:ml-72 md:px-10 md:pt-10">
                {children}
            </main>
        </div>
    )
}