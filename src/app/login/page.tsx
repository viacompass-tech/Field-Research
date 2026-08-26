'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { clienteNavegador, hayConfig } from '@/lib/supabase/cliente'

function Formulario() {
  const params = useSearchParams()
  const vuelve = params.get('vuelve') ?? '/'
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  const entrar = async () => {
    setCargando(true)
    setError(null)
    try {
      const sb = clienteNavegador()
      const { error } = await sb.auth.signInWithOtp({
        email: correo.trim(),
        options: { emailRedirectTo: `${location.origin}/auth/callback?vuelve=${encodeURIComponent(vuelve)}` },
      })
      if (error) throw new Error(error.message)
      setEnviado(true)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  if (!hayConfig) {
    return (
      <div className="tarjeta p-4">
        <h2 className="font-semibold">Falta configurar Supabase</h2>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--ink-soft)' }}>
          Copia <code>.env.example</code> a <code>.env.local</code> y llena
          <code> NEXT_PUBLIC_SUPABASE_URL</code> y <code> NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          Sin eso se puede mirar la interfaz, no capturar.
        </p>
      </div>
    )
  }

  if (enviado) {
    return (
      <div className="tarjeta p-4">
        <h2 className="font-semibold">Revisa tu correo</h2>
        <p className="mt-2 text-[14px]" style={{ color: 'var(--ink-soft)' }}>
          Te mandamos un enlace a {correo}. Ábrelo en este mismo celular.
        </p>
      </div>
    )
  }

  return (
    <div className="tarjeta p-4">
      <label className="block">
        <span className="kicker">Tu correo</span>
        <input
          className="campo mt-1"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="nombre@correo.pe"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
      </label>
      {error && <p className="mt-2 text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>}
      <button
        className="boton boton-primario mt-3 w-full"
        disabled={!correo.includes('@') || cargando}
        onClick={() => void entrar()}
      >
        {cargando ? 'Enviando…' : 'Enviar enlace de acceso'}
      </button>
    </div>
  )
}

export default function Login() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
      <div>
        <p className="kicker">CIX Foresight Lab</p>
        <h1 className="text-2xl font-bold leading-tight">Guía de campo T1</h1>
        <p className="mt-1 text-[14px]" style={{ color: 'var(--ink-soft)' }}>
          El sistema operativo del comercio informal.
        </p>
      </div>
      <Suspense fallback={null}>
        <Formulario />
      </Suspense>
    </main>
  )
}
