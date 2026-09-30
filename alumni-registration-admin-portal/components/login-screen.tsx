'use client'

import { useState, type FormEvent } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function LoginScreen({ onSignedIn }: { onSignedIn: () => void }) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await authClient.login(password)
      onSignedIn()
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Could not sign in.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4">
      <section className="w-full max-w-sm rounded-xl border border-[#dfe4e9] bg-white p-7 shadow-[0_18px_44px_rgba(12,22,40,0.12)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#edf4f7] text-[#087fae]">
            <ShieldCheck className="size-6" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-[#18202b]">SVCE Admin Workspace</h1>
          <p className="mt-1 text-sm text-[#697583]">Sign in to manage alumni registrations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-xs font-semibold text-[#697583]">
            Admin password
            <div className="relative mt-1.5">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9aa3ae]" />
              <input
                type="password"
                autoFocus
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-11 w-full rounded-md border border-[#dfe4e9] bg-white pl-9 pr-3 text-sm text-[#18202b] outline-none focus:border-[#087fae]"
                placeholder="Enter admin password"
              />
            </div>
          </label>

          {error && (
            <p role="alert" className="rounded-md border border-[#f0d3cf] bg-[#fff7f5] px-3 py-2 text-sm text-[#9a3f31]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#0788c5] text-sm font-semibold text-white hover:bg-[#0675aa] disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  )
}
