'use client'

import { useState } from 'react'
import type { Almacen } from '@/lib/almacen'
import { vacio } from '@/lib/datos'
import type { Datos, ModuloDef } from '@/lib/tipos'

// El botón de la IA va al final de la captura. Lo que devuelve no pisa nada de
// lo que escribió una persona: solo llena vacíos, y llega marcado.
export function BloqueIA({
  modulo,
  visita,
  almacen,
  mostrando,
  onListo,
  onManual,
}: {
  modulo: ModuloDef
  visita: string
  almacen: Almacen
  mostrando: boolean
  onListo: () => void
  onManual: () => void
}) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const estructurar = async () => {
    setCargando(true)
    setError(null)
    try {
      await almacen.volcar()
      const r = await fetch('/api/estructurar', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visita, modulo: modulo.id }),
      })
      const cuerpo = await r.json()
      if (!r.ok) throw new Error(cuerpo?.error ?? `HTTP ${r.status}`)
      almacen.fusionar(cuerpo.campos as Datos, (id) => vacio(almacen.datos[id]))
      onListo()
    } catch (e) {
      // El error real, no "algo salió mal".
      setError((e as Error).message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <section className="tarjeta p-4" style={{ borderColor: 'var(--purple)' }}>
      <h3 className="font-semibold">Estructurar lo escrito</h3>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
        Lee la captura y las fotos de este módulo y propone la estructura. Llega como
        borrador: nada de lo tuyo se sobrescribe.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="boton boton-ia" onClick={() => void estructurar()} disabled={cargando}>
          {cargando ? 'Leyendo…' : 'Estructurar con IA'}
        </button>
        {!mostrando && (
          <button className="boton" onClick={onManual}>
            Llenar a mano
          </button>
        )}
      </div>
      {error && (
        <p className="mt-3 text-[13px]" style={{ color: 'var(--danger)' }} role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
