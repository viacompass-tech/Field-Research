'use client'

import { useState, useSyncExternalStore } from 'react'
import type { Almacen } from '@/lib/almacen'
import { TAX } from '@/lib/datos'
import type { ModuloDef } from '@/lib/tipos'

export function IndicadorGuardado({ almacen }: { almacen: Almacen }) {
  const estado = useSyncExternalStore(almacen.suscribir, almacen.leer, almacen.leer)
  const texto: Record<string, string> = {
    limpio: 'al día',
    escribiendo: 'escribiendo…',
    guardando: 'guardando…',
    guardado: 'guardado',
    pendiente: 'en el celular',
    error: 'no subió',
    revision: 'modo revisión · no se guarda',
  }
  const color =
    estado.estado === 'revision'
      ? 'var(--orange)'
      : estado.estado === 'error'
      ? 'var(--danger)'
      : estado.estado === 'pendiente'
        ? 'var(--orange)'
        : estado.estado === 'guardado'
          ? 'var(--ok)'
          : 'var(--ink-soft)'
  return (
    <span className="flex flex-col items-end text-[12px]" style={{ color }} aria-live="polite">
      <span>{texto[estado.estado]}</span>
      {estado.error && <span className="max-w-40 truncate" title={estado.error}>{estado.error}</span>}
    </span>
  )
}

// El territorio, a mano, en el módulo donde se pide el consentimiento.
export function Brief() {
  return (
    <section className="tarjeta p-4" style={{ borderColor: 'var(--blue)' }}>
      <p className="kicker">Territorio 1</p>
      <h2 className="mt-1 font-semibold">{TAX.territorio.n}</h2>
      <p className="mt-2 text-[14px]">{TAX.territorio.pregunta}</p>
      <p className="mt-3 kicker">Frontera</p>
      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{TAX.territorio.frontera}</p>
      <p className="mt-3 kicker" style={{ color: 'var(--orange)' }}>Riesgo del territorio</p>
      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{TAX.territorio.riesgo}</p>
    </section>
  )
}

export function NoNegociables({ modulo, almacen }: { modulo: ModuloDef; almacen: Almacen }) {
  const [marcados, setMarcados] = useState<number[]>(() => almacen.nn)
  const [hueco, setHueco] = useState<string>(() => almacen.hueco ?? '')
  const total = modulo.nn?.length ?? 0
  if (total === 0) return null
  const pendientes = total - marcados.length

  const alternar = (i: number) => {
    const siguiente = marcados.includes(i) ? marcados.filter((x) => x !== i) : [...marcados, i]
    setMarcados(siguiente)
    almacen.setNN(siguiente)
  }

  return (
    <section className="tarjeta p-4" style={{ borderColor: pendientes ? 'var(--orange)' : 'var(--ok)' }}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">No negociables</h3>
        <span className={`pastilla ${pendientes ? 'pastilla-naranja' : 'pastilla-ok'}`}>
          {marcados.length}/{total}
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {(modulo.nn ?? []).map((n, i) => {
          const hecho = marcados.includes(i)
          return (
            <li key={i}>
              <button
                className="boton w-full justify-start py-2 text-left"
                style={hecho ? { borderColor: 'var(--ok)' } : { borderColor: 'var(--orange)' }}
                aria-pressed={hecho}
                onClick={() => alternar(i)}
              >
                <span aria-hidden style={{ color: hecho ? 'var(--ok)' : 'var(--orange)' }}>
                  {hecho ? '✓' : '○'}
                </span>
                <span className="font-normal">{n}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {pendientes > 0 && (
        <label className="mt-3 block">
          <span className="kicker">Si sigues igual, declara el hueco</span>
          <textarea
            className="campo mt-1 min-h-16"
            placeholder="Qué quedó sin cubrir y por qué. Esto no bloquea nada: queda escrito."
            value={hueco}
            onChange={(e) => {
              setHueco(e.target.value)
              almacen.setHueco(e.target.value || null)
            }}
          />
        </label>
      )}
    </section>
  )
}

export function QueMirar({ modulo }: { modulo: ModuloDef }) {
  if (!modulo.mira?.length && !modulo.guard?.length) return null
  return (
    <section className="tarjeta p-4">
      {modulo.mira && modulo.mira.length > 0 && (
        <>
          <h3 className="font-semibold">Barrido</h3>
          <ul className="mt-2 flex flex-col gap-1 text-[14px]">
            {modulo.mira.map((m, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden style={{ color: 'var(--blue)' }}>·</span>
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {modulo.guard && modulo.guard.length > 0 && (
        <div className="mt-4 rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--orange) 8%, #fff)' }}>
          <p className="kicker" style={{ color: 'var(--orange)' }}>Cuidado</p>
          <ul className="mt-1 flex flex-col gap-1 text-[13px]">
            {modulo.guard.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
