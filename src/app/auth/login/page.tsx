import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

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
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-900/20 backdrop-blur">
                <h1 className="text-2xl font-semibold text-white">CYFR Board</h1>

                <p className="mt-1 text-sm text-slate-400">
                    Вход для команды CYFR FITOUT L.L.C.
                </p>

                <form className="mt-6 space-y-4">
                    <div>
                        <label className="mb-1.5 block text-sm text-slate-300">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                            placeholder="you@cyfr.ae"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm text-slate-300">
                            Пароль
                        </label>
                        <input
                            type="password"
                            name="password"
                            className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            type="submit"
                            formAction={signIn}
                            className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                            Войти
                        </button>

                        <button
                            type="submit"
                            formAction={signUp}
                            className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Регистрация
                        </button>
                    </div>

                    <button
                        type="submit"
                        formAction={signInWithGoogle}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                        Войти через Google
                    </button>
                </form>

                {(params.error || params.message) && (
                    <p
                        className={`mt-4 rounded-xl px-3 py-2 text-sm ${
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