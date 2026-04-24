'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState<'login' | 'signup' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailAuth = async (event: FormEvent, mode: 'login' | 'signup') => {
    event.preventDefault()
    setLoading(mode)
    setError('')
    setMessage('')

    const response =
      mode === 'login'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
          })

    if (response.error) {
      setError(response.error.message)
      setLoading(null)
      return
    }

    if (mode === 'signup') {
      setMessage('Проверьте почту и подтвердите email, чтобы завершить регистрацию.')
      setLoading(null)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  const handleGoogle = async () => {
    setLoading('google')
    setError('')
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-cyan-900/20 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">CYFR Board</h1>
        <p className="mt-1 text-sm text-slate-400">
          Вход для команды CYFR FITOUT L.L.C. (Dubai)
        </p>

        <form className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="you@cyfr.ae"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-300">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="submit"
              disabled={!!loading}
              onClick={(e) => handleEmailAuth(e, 'login')}
              className="rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {loading === 'login' ? 'Входим...' : 'Войти'}
            </button>
            <button
              type="submit"
              disabled={!!loading}
              onClick={(e) => handleEmailAuth(e, 'signup')}
              className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
            >
              {loading === 'signup' ? 'Создаём...' : 'Регистрация'}
            </button>
          </div>
        </form>

        <button
          onClick={handleGoogle}
          disabled={!!loading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Войти через Google
        </button>

        {(error || message) && (
          <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${error ? 'bg-red-500/10 text-red-300' : 'bg-cyan-500/10 text-cyan-200'}`}>
            {error || message}
          </p>
        )}
      </div>
    </div>
  )
}
