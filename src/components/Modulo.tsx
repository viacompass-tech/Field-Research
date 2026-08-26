'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Almacen, vaciarCola } from '@/lib/almacen'
import { bandas, MODULOS, NOMBRE_BANDA, TIPOS_ESTRUCTURA } from '@/lib/datos'
import { vaciarColaFotos } from '@/lib/fotos'
import type { Datos, FotoRef, ModuloDef } from '@/lib/tipos'
import { Brief, IndicadorGuardado, NoNegociables, QueMirar } from './Bloques'
import { Campo, type Variable } from './campos/Campo'
import { ContadoresExtra } from './campos/Contadores'
import { BloqueIA } from './campos/IA'
import { Hipotesis, type HipotesisFila } from './Hipotesis'
import { NombreEntidad } from './Revision'

export function Modulo({
  def,
  visita,
  entidad,
  inicial,
  fotos,
  contadores,
  variables,
  hipotesis,
  revision = false,
}: {
  def: ModuloDef
  visita: string
  entidad: { id: string; nombre: string }
  inicial: { datos: Datos; no_negociables: number[]; hueco: string | null; estructurado_at: string | null }
  fotos: FotoRef[]
  contadores: { id: string; clave: string; etiqueta: string; valor: number }[]
  variables: Variable[]
  hipotesis: HipotesisFila[]
  revision?: boolean
}) {
  const almacen = useMemo(
    () => new Almacen(visita, def.id, inicial.datos, inicial.no_negociables, inicial.hueco, revision),
    // Uno por módulo y por visita: si cambia la pantalla, cambia el almacén.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visita, def.id, revision],
  )

  // Los campos de estructura no existen en pantalla hasta que la IA produce
  // algo o hasta que se pide llenarlos a mano.
  const [verEstructura, setVerEstructura] = useState(
    () =>
      Boolean(inicial.estructurado_at) ||
      def.campos.some((c) => c.id && TIPOS_ESTRUCTURA.has(c.t ?? '') && inicial.datos[c.id] !== undefined),
  )
  const [version, setVersion] = useState(0)
  const [cubierto, setCubierto] = useState(() => Boolean(inicial.datos.__cubierto))

  // Guardar antes de irse, y subir lo que quedó en el celular al volver la red.
  useEffect(() => {
    const salir = () => void almacen.volcar()
    const volvio = () => { void vaciarCola(); void vaciarColaFotos() }
    window.addEventListener('online', volvio)
    document.addEventListener('visibilitychange', salir)
    volvio()
    return () => {
      window.removeEventListener('online', volvio)
      document.removeEventListener('visibilitychange', salir)
      void almacen.volcar()
    }
  }, [almacen])

  const i = MODULOS.findIndex((m) => m.id === def.id)
  const anterior = i > 0 ? MODULOS[i - 1] : null
  const siguiente = i < MODULOS.length - 1 ? MODULOS[i + 1] : null
  // El barrido y las advertencias son la banda «qué mirar»: si el módulo las
  // trae pero no tiene campos de ese tipo, la banda existe igual.
  const grupos = useMemo(() => {
    const g = bandas(def)
    if ((def.mira?.length || def.guard?.length) && !g.some((x) => x.banda === 'mirar')) {
      const antes = g.findIndex((x) => x.banda !== 'mirar')
      g.splice(antes < 0 ? g.length : antes, 0, { banda: 'mirar', campos: [] })
    }
    return g
  }, [def])

  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-28">
      <header
        className="pegajoso top-0 border-b px-4 py-3"
        style={{ background: 'color-mix(in srgb, var(--canvas) 88%, transparent)', borderColor: 'var(--line)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/v/${visita}`} className="kicker enlace-suave">
              ← {revision ? <NombreEntidad porDefecto="sin nombre" /> : entidad.nombre}
            </Link>
            <h1 className="truncate font-semibold leading-tight">
              {def.code} · {def.nombre}
            </h1>
            <p className="text-[12px]" style={{ color: 'var(--ink-soft)' }}>
              {def.dur}
              {def.opcional ? ' · opcional' : ''}
            </p>
          </div>
          <IndicadorGuardado almacen={almacen} />
        </div>
      </header>

      <main className="flex flex-col gap-4 px-4 py-4">
        {def.brief && <Brief />}
        {def.obj && (
          <p className="text-[14px]" style={{ color: 'var(--ink-soft)' }}>
            {def.obj}
          </p>
        )}

        <NoNegociables modulo={def} almacen={almacen} />

        {grupos.map(({ banda, campos }) => {
          const visibles = campos.filter(
            (c) => c.t === 'aiblock' || !TIPOS_ESTRUCTURA.has(c.t ?? '') || verEstructura,
          )
          if (visibles.length === 0 && banda !== 'mirar') return null
          let subPrevio: string | undefined
          return (
            <section key={banda} className="flex flex-col gap-3">
              <h2
                className="pegajoso top-[76px] -mx-4 px-4 py-2 kicker"
                style={{ background: 'color-mix(in srgb, var(--canvas) 88%, transparent)' }}
              >
                {NOMBRE_BANDA[banda]}
              </h2>
              {banda === 'mirar' && <QueMirar modulo={def} />}
              {visibles.map((c) => {
                const sub = c.sub && c.sub !== subPrevio ? c.sub : null
                subPrevio = c.sub
                return (
                  <div key={`${c.id ?? c.t}:${version}`} className="flex flex-col gap-3">
                    {sub && (
                      <p className="text-[13px] font-semibold" style={{ color: 'var(--ink-soft)' }}>
                        {sub}
                      </p>
                    )}
                    {c.t === 'aiblock' ? (
                      <BloqueIA
                        modulo={def}
                        visita={visita}
                        almacen={almacen}
                        mostrando={verEstructura}
                        onManual={() => setVerEstructura(true)}
                        onListo={() => {
                          setVerEstructura(true)
                          setVersion((v) => v + 1)
                        }}
                      />
                    ) : (
                      <Campo
                        campo={c}
                        almacen={almacen}
                        visita={visita}
                        modulo={def.id}
                        fotos={fotos}
                        variables={variables}
                      />
                    )}
                  </div>
                )
              })}
              {banda === 'contar' && (
                <ContadoresExtra visita={visita} modulo={def.id} iniciales={contadores} />
              )}
            </section>
          )
        })}

        <Hipotesis entidad={entidad.id} visita={visita} modulo={def.id} iniciales={hipotesis} />

        <button
          className="boton"
          style={cubierto ? { borderColor: 'var(--ok)', color: 'var(--ok)' } : undefined}
          aria-pressed={cubierto}
          onClick={() => {
            const siguiente = !cubierto
            setCubierto(siguiente)
            almacen.set('__cubierto', siguiente)
          }}
        >
          {cubierto ? 'Módulo cubierto' : 'Marcar módulo como cubierto'}
        </button>
      </main>

      {/* Barra de posición: solo dentro del módulo. En las listas es ruido. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t px-2 py-2"
        style={{ background: 'var(--paper)', borderColor: 'var(--line)' }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          {anterior ? (
            <Link className="boton boton-fantasma" href={`/v/${visita}/${anterior.id}`}>
              ← {anterior.code}
            </Link>
          ) : (
            <span className="boton boton-fantasma opacity-0" aria-hidden />
          )}
          <Link className="text-[13px] enlace-suave" href={`/v/${visita}`}>
            {i + 1} de {MODULOS.length}
          </Link>
          {siguiente ? (
            <Link className="boton boton-fantasma" href={`/v/${visita}/${siguiente.id}`}>
              {siguiente.code} →
            </Link>
          ) : (
            <span className="boton boton-fantasma opacity-0" aria-hidden />
          )}
        </div>
      </nav>
    </div>
  )
}
