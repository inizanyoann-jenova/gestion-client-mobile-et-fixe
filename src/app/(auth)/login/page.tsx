'use client'

import { useActionState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null)

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">ATEXIA</h1>
        <p className="text-slate-400 text-sm mt-1">Gestion clients</p>
      </div>

      <form action={formAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-slate-300 mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="votre@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm text-slate-300 mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="text-red-400 text-sm text-center" role="alert">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors"
        >
          {isPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  )
}
