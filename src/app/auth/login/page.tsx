import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { Icons } from '@/components/Icons'

export default async function LoginPage({
                                            searchParams,
                                        }: {
    searchParams: Promise<{ error?: string; message?: string }>
}) {
    const params = await searchParams

    const signIn = async (formData: FormData) => {
        'use server'

        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '')

        if (!email || !password) {
            redirect('/auth/login?error=Введите%20email%20и%20пароль')
        }

        const supabase = await createClient()

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
        }

        redirect('/dashboard')
    }

    const signUp = async (formData: FormData) => {
        'use server'

        const email = String(formData.get('email') ?? '').trim()
        const password = String(formData.get('password') ?? '')

        if (!email || !password) {
            redirect('/auth/login?error=Введите%20email%20и%20пароль')
        }

        const headerStore = await headers()
        const origin = headerStore.get('origin') ?? 'http://localhost:3000'

        const supabase = await createClient()

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
        }

        redirect(
            '/auth/login?message=Регистрация%20создана.%20Проверьте%20почту%20для%20подтверждения.',
        )
    }

    const signInWithGoogle = async () => {
        'use server'

        const headerStore = await headers()
        const origin = headerStore.get('origin') ?? 'http://localhost:3000'

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${origin}/auth/callback`,
            },
        })

        if (error || !data.url) {
            redirect('/auth/login?error=Не%20удалось%20запустить%20Google%20OAuth')
        }

        redirect(data.url)
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="glass rounded-3xl w-full max-w-md p-8 shadow-2xl shadow-cyan-900/20 animate-in">
                <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500 shadow-lg shadow-cyan-500/20">
                        <Icons.Projects className="h-7 w-7 text-slate-950" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">CYFR Board</h1>
                        <p className="text-[11px] uppercase tracking-widest text-cyan-500 font-semibold">Project command center</p>
                    </div>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                    Войдите в свою учетную запись, чтобы продолжить.
                </p>

                <form className="mt-8 space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                            placeholder="you@cyfr.ae"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-300">
                            Пароль
                        </label>
                        <input
                            type="password"
                            name="password"
                            className="w-full rounded-xl border border-white/10 bg-slate-900/50 px-4 py-3 text-white outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <button
                            type="submit"
                            formAction={signIn}
                            className="rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-cyan-500 active:scale-95 shadow-lg shadow-cyan-500/20"
                        >
                            Войти
                        </button>

                        <button
                            type="submit"
                            formAction={signUp}
                            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10 active:scale-95"
                        >
                            Регистрация
                        </button>
                    </div>

                    <div className="relative mt-6 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-white/5" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-slate-900/60 px-2 text-slate-500">ИЛИ</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        formAction={signInWithGoogle}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 active:scale-95"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 4.499C14.167 4.499 15.833 5.249 17 6.499L20 3.499C18.167 1.499 15.333 0.499 12 0.499C7.083 0.499 3 2.749 1 6.499L4 8.499C5 6.083 8.333 4.499 12 4.499Z" fill="#EA4335"/>
                            <path d="M4 8.499C3 10.916 3 13.083 4 15.499L1 17.499C1.167 18.083 1.5 18.75 2 19.499C2.667 20.333 3.5 21.083 4.499 21.499C5.499 22.083 6.667 22.499 8 22.499L8 19.499C6.667 19.499 5.5 18.999 4.499 17.499Z" fill="#FCD000"/>
                            <path d="M12 22.499C15.333 22.499 18.167 21.499 20 19.499L17 17.499C15.833 18.749 14.167 19.499 12 19.499C8.333 19.499 5 17.916 4 15.499L1 17.499C3 21.249 7.083 23.499 12 23.499L12 22.499Z" fill="#4285F4"/>
                            <path d="M23 12.499C23 11.499 22.833 10.499 22.5 9.499H12V14.499H18.833C18.667 15.499 18.167 16.333 17.5 16.999V20.499L20.5 22.499C22.167 20.583 23 16.666 23 12.499Z" fill="#34A853"/>
                        </svg>
                        Войти через Google
                    </button>
                </form>

                {(params.error || params.message) && (
                    <p
                        className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
                            params.error
                                ? 'bg-red-500/10 text-red-300'
                                : 'bg-cyan-500/10 text-cyan-200'
                        }`}
                    >
                        {params.error || params.message}
                    </p>
                )}
            </div>
        </div>
    )
}