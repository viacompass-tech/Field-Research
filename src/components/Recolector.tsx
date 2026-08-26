'use client'

import { useEffect, useState } from 'react'

// Sin sesión no hay usuario que firme lo capturado. El modelo de datos sí lo
// pide —«cuánto del corpus lo escribió alguien que estuvo ahí»— así que el
// nombre de quien captura vive en el dispositivo y se estampa en cada captura.
// No bloquea nada: se puede escribir en cualquier momento, o nunca.

const CLAVE = 'cix.recolector'

export function leerRecolector(): string | null {
  if (typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(CLAVE)
  } catch {
    return null
  }
}

export function Recolector() {
  const [nombre, setNombre] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [borrador, setBorrador] = useState('')

  useEffect(() => {
    const guardado = leerRecolector()
    setNombre(guardado)
    setBorrador(guardado ?? '')
  }, [])

  const guardar = () => {
    const limpio = borrador.trim()
    try {
      if (limpio) localStorage.setItem(CLAVE, limpio)
      else localStorage.removeItem(CLAVE)
    } catch {
      // Sin almacenamiento local se pierde al recargar; no vale bloquear por eso.
    }
    setNombre(limpio || null)
    setEditando(false)
  }

  if (editando) {
    return (
      <span className="flex items-center gap-1">
        <input
          className="campo max-w-40 py-1"
          autoFocus
          placeholder="Tu nombre"
          value={borrador}
          onChange={(e) => setBorrador(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') guardar()
            if (e.key === 'Escape') setEditando(false)
          }}
        />
        <button className="boton boton-fantasma px-2 text-[13px]" onClick={guardar}>
          Listo
        </button>
      </span>
    )
  }

  return (
    <button
      className={`pastilla ${nombre ? '' : 'pastilla-naranja'}`}
      onClick={() => setEditando(true)}
      title="Quién está capturando, guardado en este dispositivo"
    >
      {nombre ?? 'Quién captura'}
    </button>
  )
}
