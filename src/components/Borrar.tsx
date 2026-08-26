'use client'

import { useCallback, useRef, useState } from 'react'

// Nada se borra a un toque: confirmación que dice qué se pierde, y deshacer
// durante nueve segundos. Para lo pesado, además hay que escribir QUITAR.

const SEGUNDOS = 9

export type Aviso = { texto: string; deshacer: () => void }

export function useDeshacer() {
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const reloj = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ejecutar = useCallback(
    (texto: string, quitar: () => void, restaurar: () => void, definitivo?: () => void | Promise<void>) => {
      if (reloj.current) clearTimeout(reloj.current)
      quitar()
      setAviso({
        texto,
        deshacer: () => {
          if (reloj.current) clearTimeout(reloj.current)
          setAviso(null)
          restaurar()
        },
      })
      reloj.current = setTimeout(() => {
        setAviso(null)
        void definitivo?.()
      }, SEGUNDOS * 1000)
    },
    [],
  )

  return { aviso, ejecutar }
}

export function AvisoDeshacer({ aviso }: { aviso: Aviso | null }) {
  if (!aviso) return null
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-24 z-50 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 shadow-lg"
      style={{ background: 'var(--ink)', color: '#fff' }}
    >
      <span className="text-[13px]">{aviso.texto}</span>
      <button className="boton boton-fantasma" style={{ color: '#fff' }} onClick={aviso.deshacer}>
        Deshacer
      </button>
    </div>
  )
}

export function BotonBorrar({
  que,
  pesa,
  exigirTexto,
  onConfirmar,
  etiqueta = 'Quitar',
}: {
  que: string
  pesa?: string
  exigirTexto?: boolean
  onConfirmar: () => void
  etiqueta?: string
}) {
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const listo = !exigirTexto || texto.trim().toUpperCase() === 'QUITAR'

  if (!abierto) {
    return (
      <button
        className="boton boton-fantasma boton-peligro px-3"
        onClick={() => setAbierto(true)}
        aria-label={`${etiqueta}: ${que}`}
      >
        {etiqueta}
      </button>
    )
  }

  return (
    <div className="tarjeta p-3" style={{ borderColor: 'var(--danger)' }}>
      <p className="text-[13px]">
        Se pierde <strong>{que}</strong>
        {pesa ? ` · ${pesa}` : ''}. Quedan nueve segundos para deshacer.
      </p>
      {exigirTexto && (
        <input
          className="campo mt-2"
          placeholder="Escribe QUITAR"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
      )}
      <div className="mt-2 flex gap-2">
        <button
          className="boton boton-peligro"
          disabled={!listo}
          onClick={() => {
            setAbierto(false)
            setTexto('')
            onConfirmar()
          }}
        >
          Sí, quitar
        </button>
        <button className="boton boton-fantasma" onClick={() => { setAbierto(false); setTexto('') }}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
