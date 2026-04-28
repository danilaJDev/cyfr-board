import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Image from 'next/image' // Import Image component

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
            redirect(`/auth/login?error=${encodeURIComponent('Введите email и пароль')}`)
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
            redirect(`/auth/login?error=${encodeURIComponent('Введите email и пароль')}`)
        }

        const headerStore = await headers()
        const origin = headerStore.get('origin') ?? 'http://localhost:3000'

        const supabase = await createClient()

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${origin}/auth/callback`,
            },
        })

        if (error) {
            redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
        }

        // Check if the user is already confirmed
        if (data.user && data.user.confirmed_at) {
            redirect(`/auth/login?error=${encodeURIComponent('Пользователь с таким email уже зарегистрирован')}`)
        }

        redirect(
            `/auth/login?message=${encodeURIComponent('Регистрация создана. Проверьте почту для подтверждения.')}`,
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
            redirect(`/auth/login?error=${encodeURIComponent('Не удалось запустить Google OAuth')}`)
        }

        redirect(data.url)
    }

    return (
        <div className="relative flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
                <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
            </div>

            <div className="glass relative w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-cyan-900/20 sm:p-8 animate-in">
                <div className="mb-6 flex items-center gap-3 sm:gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 shadow-lg shadow-cyan-500/30">
                        {/* Replaced Icons.Building with Image component */}
                        <Image
                            src="/cyfr_logo.svg" // Assuming cyfr_logo.svg is in public folder
                            alt="CYFR Logo"
                            width={28}
                            height={28}
                            className="h-7 w-7 text-slate-950" // Apply existing styling if needed, though Image handles size
                        />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            CYFR Board
                        </h1>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-400 sm:text-[11px]">
                            Command center
                        </p>
                    </div>
                </div>

                <p className="text-sm text-slate-400">
                    Войдите в свою учетную запись, чтобы продолжить.
                </p>

                <form className="mt-7 space-y-5" autoComplete="on">
                    <div>
                        <label htmlFor="login-email" className="label-base">
                            Email
                        </label>
                        <input
                            id="login-email"
                            type="email"
                            name="email"
                            autoComplete="email"
                            inputMode="email"
                            className="input-base"
                            placeholder="you@cyfr.ae"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="login-password" className="label-base">
                            Пароль
                        </label>
                        <input
                            id="login-password"
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            className="input-base"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <button
                            type="submit"
                            formAction={signIn}
                            className="btn-primary py-3 text-sm"
                        >
                            Войти
                        </button>
                        <button
                            type="submit"
                            formAction={signUp}
                            className="btn-secondary py-3 text-sm"
                        >
                            Регистрация
                        </button>
                    </div>

                    <div className="relative my-4 flex items-center">
                        <div className="h-px flex-1 bg-white/10" />
                        <span className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                            или
                        </span>
                        <div className="h-px flex-1 bg-white/10" />
                    </div>

                    <button
                        type="submit"
                        formAction={signInWithGoogle}
                        className="btn-secondary w-full py-3 text-sm"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                            <path
                                fill="#EA4335"
                                d="M12 4.499c2.167 0 3.833.75 5 2l3-3C18.167 1.499 15.333.499 12 .499 7.083.499 3 2.749 1 6.499l3 2c1-2.416 4.333-4 8-4z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M4 8.499c-1 2.417-1 4.584 0 7l-3 2c.167.584.5 1.25 1 2 .667.834 1.5 1.584 2.499 2 1 .584 2.167 1 3.499 1l.002-3c-1.333 0-2.5-.5-3.5-2L4 8.5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M12 22.499c3.333 0 6.167-1 8-3l-3-2c-1.167 1.25-2.833 2-5 2-3.667 0-7-1.583-8-4l-3 2c2 3.75 6.083 6 11 6z"
                            />
                            <path
                                fill="#34A853"
                                d="M23 12.499c0-1-.167-2-.5-3H12v5h6.833c-.166 1-.666 1.834-1.333 2.5v3.5l3 2c1.667-1.916 2.5-5.833 2.5-10z"
                            />
                        </svg>
                        Войти через Google
                    </button>
                </form>

                {(params.error || params.message) && (
                    <p
                        role={params.error ? 'alert' : 'status'}
                        className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
                            params.error
                                ? 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20'
                                : 'bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/20'
                        }`}
                    >
                        {params.error || params.message}
                    </p>
                )}

                <p className="mt-6 text-center text-[11px] text-slate-500">
                    © {new Date().getFullYear()} CYFR FITOUT L.L.C
                </p>
            </div>
        </div>
    )
}
