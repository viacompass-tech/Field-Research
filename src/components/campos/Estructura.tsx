'use client'

import { useState } from 'react'
import type { Almacen } from '@/lib/almacen'
import { TAX } from '@/lib/datos'
import type { Actor, CampoDef, Fila, Hallazgo, Puntuacion, Supuesto, Texto } from '@/lib/tipos'
import { Marco, PastillaIA } from './Marco'
import { AvisoDeshacer, BotonBorrar, useDeshacer } from '../Borrar'

type Props = { campo: CampoDef; almacen: Almacen }

const nuevaClave = () => crypto.randomUUID().slice(0, 8)

// ── nueve dimensiones del escenario ───────────────────────────────────────

export function CampoNueve({ campo, almacen }: Props) {
  const [v, setV] = useState<Record<string, Texto>>(() => almacen.get(campo.id!, {} as Record<string, Texto>))
  const escribir = (id: string, texto: string) => {
    const siguiente = { ...v, [id]: { texto, origen: 'persona' as const } }
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
  }
  const deIA = Object.values(v).some((d) => d?.origen === 'ia')
  return (
    <Marco campo={campo} extra={<PastillaIA visible={deIA} />}>
      <div className="flex flex-col gap-3">
        {TAX.dimensiones_escenario.map((d) => (
          <label key={d.id} className="block">
            <span className="kicker">{d.n}</span>
            <textarea
              className={`campo mt-1 min-h-20 ${v[d.id]?.origen === 'ia' ? 'ia' : ''}`}
              value={v[d.id]?.texto ?? ''}
              onChange={(e) => escribir(d.id, e.target.value)}
            />
          </label>
        ))}
      </div>
    </Marco>
  )
}

// ── mapa de percepción por actor ──────────────────────────────────────────

export function CampoEmpatia({ campo, almacen }: Props) {
  const [actores, setActores] = useState<Actor[]>(() => almacen.get(campo.id!, [] as Actor[]))
  const [abierto, setAbierto] = useState<string | null>(null)
  const { aviso, ejecutar } = useDeshacer()

  const guardar = (lista: Actor[]) => {
    setActores(lista)
    almacen.set(campo.id!, lista)
  }
  const editar = (k: string, parche: Partial<Actor>) =>
    guardar(actores.map((a) => (a.k === k ? { ...a, ...parche, origen: 'persona' } : a)))

  return (
    <Marco campo={campo} extra={<PastillaIA visible={actores.some((a) => a.origen === 'ia')} />}>
      <div className="flex flex-col gap-3">
        {actores.map((a) => (
          <div key={a.k} className="tarjeta p-3">
            <div className="flex items-center gap-2">
              <input
                className="campo"
                placeholder="Quién es (rol, no nombre propio)"
                value={a.nombre}
                onChange={(e) => editar(a.k, { nombre: e.target.value })}
              />
              <button
                className="boton boton-fantasma px-3"
                onClick={() => setAbierto(abierto === a.k ? null : a.k)}
                aria-expanded={abierto === a.k}
              >
                {abierto === a.k ? 'Cerrar' : 'Abrir'}
              </button>
            </div>
            {abierto === a.k && (
              <div className="mt-2 flex flex-col gap-2">
                {TAX.dimensiones_percepcion.map((d) => (
                  <label key={d.id} className="block">
                    <span className="kicker">{d.n}</span>
                    <textarea
                      className={`campo mt-1 min-h-16 ${a.origen === 'ia' ? 'ia' : ''}`}
                      value={a.dims[d.id] ?? ''}
                      onChange={(e) => editar(a.k, { dims: { ...a.dims, [d.id]: e.target.value } })}
                    />
                  </label>
                ))}
                <BotonBorrar
                  que={`el actor ${a.nombre || 'sin nombre'}`}
                  pesa={`${Object.keys(a.dims).length} dimensiones escritas`}
                  onConfirmar={() => {
                    const previa = actores
                    ejecutar(
                      'Se quitó un actor',
                      () => guardar(actores.filter((x) => x.k !== a.k)),
                      () => guardar(previa),
                    )
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <button
          className="boton self-start"
          onClick={() => {
            const k = nuevaClave()
            guardar([...actores, { k, nombre: '', dims: {}, origen: 'persona' }])
            setAbierto(k)
          }}
        >
          Agregar actor
        </button>
      </div>
      <AvisoDeshacer aviso={aviso} />
    </Marco>
  )
}

// ── filas con etiquetas (procesos, herramientas, flujos, intenciones…) ────

export function CampoEtiquetado({ campo, almacen }: Props) {
  const [filas, setFilas] = useState<Fila[]>(() => almacen.get(campo.id!, [] as Fila[]))
  const { aviso, ejecutar } = useDeshacer()

  const guardar = (lista: Fila[]) => {
    setFilas(lista)
    almacen.set(campo.id!, lista)
  }
  const editar = (k: string, parche: Partial<Fila>) =>
    guardar(filas.map((f) => (f.k === k ? { ...f, ...parche, origen: 'persona' } : f)))

  return (
    <Marco
      campo={campo}
      extra={
        <span className="flex gap-2">
          <PastillaIA visible={filas.some((f) => f.origen === 'ia')} />
          <span className="pastilla">{filas.length}</span>
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        {filas.map((f) => (
          <div key={f.k} className="tarjeta p-3" style={f.origen === 'ia' ? { borderColor: 'var(--purple)' } : undefined}>
            <textarea
              className="campo min-h-16"
              placeholder={campo.ph}
              value={f.texto}
              onChange={(e) => editar(f.k, { texto: e.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {(campo.cols ?? []).map((c) => (
                <label key={c.id} className="flex-1 min-w-36">
                  <span className="kicker">{c.l}</span>
                  <select
                    className="campo mt-1"
                    value={f.attrs[c.id] ?? ''}
                    onChange={(e) => editar(f.k, { attrs: { ...f.attrs, [c.id]: e.target.value } })}
                  >
                    <option value="">Sin marcar</option>
                    {c.opts.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="mt-2">
              <BotonBorrar
                que={f.texto ? `«${f.texto.slice(0, 40)}»` : 'esta fila'}
                onConfirmar={() => {
                  const previa = filas
                  ejecutar(
                    'Se quitó una fila',
                    () => guardar(filas.filter((x) => x.k !== f.k)),
                    () => guardar(previa),
                  )
                }}
              />
            </div>
          </div>
        ))}
        <button
          className="boton self-start"
          onClick={() => guardar([...filas, { k: nuevaClave(), texto: '', attrs: {}, origen: 'persona' }])}
        >
          Agregar
        </button>
      </div>
      <AvisoDeshacer aviso={aviso} />
    </Marco>
  )
}

// ── hallazgos y triangulación ─────────────────────────────────────────────

const FUENTES = [
  'Observación de la cuadra',
  'Observación de la operación',
  'Lo que dijo el dueño',
  'Lo que dijo un cliente',
  'Artefacto o foto',
  'Acompañamiento',
  'Escritorio',
]

export function CampoHallazgos({ campo, almacen }: Props) {
  const [filas, setFilas] = useState<Hallazgo[]>(() => almacen.get(campo.id!, [] as Hallazgo[]))
  const { aviso, ejecutar } = useDeshacer()

  const guardar = (lista: Hallazgo[]) => {
    // Triangulado no se pregunta: sale de tener dos fuentes distintas.
    const conMarca = lista.map((h) => ({ ...h, triangulado: h.fuentes.length >= 2 }))
    setFilas(conMarca)
    almacen.set(campo.id!, conMarca)
  }
  const editar = (k: string, parche: Partial<Hallazgo>) =>
    guardar(filas.map((f) => (f.k === k ? { ...f, ...parche, origen: 'persona' } : f)))

  return (
    <Marco campo={campo} extra={<PastillaIA visible={filas.some((f) => f.origen === 'ia')} />}>
      <div className="flex flex-col gap-3">
        {filas.map((h) => (
          <div key={h.k} className="tarjeta p-3">
            <textarea
              className="campo min-h-20"
              placeholder="Qué encontraste, en una frase que se pueda discutir"
              value={h.texto}
              onChange={(e) => editar(h.k, { texto: e.target.value })}
            />
            <p className="kicker mt-2">De dónde sale</p>
            <div className="mt-1 flex flex-wrap gap-2">
              {FUENTES.map((f) => {
                const marcada = h.fuentes.includes(f)
                return (
                  <button
                    key={f}
                    className={`pastilla ${marcada ? 'pastilla-ok' : ''}`}
                    aria-pressed={marcada}
                    onClick={() =>
                      editar(h.k, {
                        fuentes: marcada ? h.fuentes.filter((x) => x !== f) : [...h.fuentes, f],
                      })
                    }
                  >
                    {f}
                  </button>
                )
              })}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className={`pastilla ${h.triangulado ? 'pastilla-ok' : 'pastilla-naranja'}`}>
                {h.triangulado ? 'triangulado' : 'una sola fuente'}
              </span>
              <BotonBorrar
                que={h.texto ? `«${h.texto.slice(0, 40)}»` : 'este hallazgo'}
                onConfirmar={() => {
                  const previa = filas
                  ejecutar(
                    'Se quitó un hallazgo',
                    () => guardar(filas.filter((x) => x.k !== h.k)),
                    () => guardar(previa),
                  )
                }}
              />
            </div>
          </div>
        ))}
        <button
          className="boton self-start"
          onClick={() =>
            guardar([...filas, { k: nuevaClave(), texto: '', fuentes: [], triangulado: false, origen: 'persona' }])
          }
        >
          Agregar hallazgo
        </button>
      </div>
      <AvisoDeshacer aviso={aviso} />
    </Marco>
  )
}

// ── nueve dimensiones del estado del negocio ──────────────────────────────

export function CampoEscala({ campo, almacen }: Props) {
  const [v, setV] = useState<Record<string, Puntuacion>>(
    () => almacen.get(campo.id!, {} as Record<string, Puntuacion>),
  )
  const escribir = (id: string, parche: Partial<Puntuacion>) => {
    const previo = v[id] ?? { valor: null, evidencia: '', origen: 'persona' as const }
    const siguiente = { ...v, [id]: { ...previo, ...parche, origen: 'persona' as const } }
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
  }
  const puestas = Object.values(v).filter((p) => p?.valor !== null && p?.valor !== undefined)
  const promedio = puestas.length
    ? puestas.reduce((a, p) => a + (p.valor ?? 0), 0) / puestas.length
    : null

  return (
    <Marco campo={campo} extra={<PastillaIA visible={Object.values(v).some((p) => p?.origen === 'ia')} />}>
      {promedio !== null && (
        <p className="mb-3 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          Promedio {promedio.toFixed(1)} sobre {puestas.length} dimensiones observadas.
          Instrumento v0: <strong>no tiene ponderación validada</strong>, no lo uses para comparar casos.
        </p>
      )}
      <div className="flex flex-col gap-4">
        {TAX.salud.map((d) => {
          const p = v[d.id]
          return (
            <div key={d.id}>
              <p className="font-semibold text-[14px]">{d.n}</p>
              <div className="mt-1 flex gap-1">
                {d.a.map((ancla, i) => {
                  const activo = p?.valor === i
                  return (
                    <button
                      key={i}
                      title={ancla}
                      className="boton flex-1 px-0"
                      style={
                        activo
                          ? { background: 'var(--blue)', borderColor: 'var(--blue)', color: '#fff' }
                          : undefined
                      }
                      aria-pressed={activo}
                      onClick={() => escribir(d.id, { valor: activo ? null : i })}
                    >
                      {i}
                    </button>
                  )
                })}
              </div>
              <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                {p?.valor !== null && p?.valor !== undefined ? d.a[p.valor] : 'Sin observar'}
              </p>
              <textarea
                className={`campo mt-1 min-h-16 ${p?.origen === 'ia' ? 'ia' : ''}`}
                placeholder="De dónde sale. Una puntuación sin cita es una opinión."
                value={p?.evidencia ?? ''}
                onChange={(e) => escribir(d.id, { evidencia: e.target.value })}
              />
            </div>
          )
        })}
      </div>
    </Marco>
  )
}

// ── supuestos del territorio ──────────────────────────────────────────────

const VEREDICTOS: { id: Supuesto['veredicto']; n: string }[] = [
  { id: 'confirmada', n: 'Lo sostiene' },
  { id: 'refutada', n: 'Lo contradice' },
  { id: 'no_observada', n: 'No se pudo ver' },
]

export function CampoSupuestos({ campo, almacen }: Props) {
  const [v, setV] = useState<Record<number, Supuesto>>(
    () => almacen.get(campo.id!, {} as Record<number, Supuesto>),
  )
  const escribir = (i: number, parche: Partial<Supuesto>) => {
    const previo = v[i] ?? { veredicto: 'no_observada' as const, evidencia: '' }
    const siguiente = { ...v, [i]: { ...previo, ...parche } }
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
  }
  const marcados = Object.keys(v).length
  return (
    <Marco
      campo={campo}
      extra={
        <span className={`pastilla ${marcados < TAX.territorio.supuestos.length ? 'pastilla-naranja' : 'pastilla-ok'}`}>
          {marcados}/{TAX.territorio.supuestos.length}
        </span>
      }
    >
      <div className="flex flex-col gap-4">
        {TAX.territorio.supuestos.map((s, i) => (
          <div key={i}>
            <p className="text-[14px]">{s}</p>
            <div className="mt-1 flex gap-1">
              {VEREDICTOS.map((ver) => {
                const activo = v[i]?.veredicto === ver.id
                return (
                  <button
                    key={ver.id}
                    className="boton flex-1 px-2 text-[13px]"
                    aria-pressed={activo}
                    style={
                      activo
                        ? {
                            borderColor:
                              ver.id === 'confirmada'
                                ? 'var(--ok)'
                                : ver.id === 'refutada'
                                  ? 'var(--danger)'
                                  : 'var(--ink-soft)',
                            color:
                              ver.id === 'confirmada'
                                ? 'var(--ok)'
                                : ver.id === 'refutada'
                                  ? 'var(--danger)'
                                  : 'var(--ink-soft)',
                          }
                        : undefined
                    }
                    onClick={() => escribir(i, { veredicto: ver.id })}
                  >
                    {ver.n}
                  </button>
                )
              })}
            </div>
            <textarea
              className="campo mt-1 min-h-16"
              placeholder="Con qué de hoy"
              value={v[i]?.evidencia ?? ''}
              onChange={(e) => escribir(i, { evidencia: e.target.value })}
            />
          </div>
        ))}
      </div>
    </Marco>
  )
}

// ── variables abiertas (se crean desde Análisis) ──────────────────────────

export function CampoVariables({
  campo,
  almacen,
  variables,
}: Props & { variables: { clave: string; etiqueta: string; tipo: string; opciones: string[] }[] }) {
  const [v, setV] = useState<Record<string, string>>(() => almacen.get(campo.id!, {} as Record<string, string>))
  if (variables.length === 0) {
    return (
      <Marco campo={campo}>
        <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          Todavía no hay ninguna. Se crean desde Análisis, en otra fase, y aparecen acá solas.
        </p>
      </Marco>
    )
  }
  const escribir = (clave: string, valor: string) => {
    const siguiente = { ...v, [clave]: valor }
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
  }
  return (
    <Marco campo={campo}>
      <div className="flex flex-col gap-3">
        {variables.map((va) => (
          <label key={va.clave} className="block">
            <span className="kicker">{va.etiqueta}</span>
            {va.opciones.length > 0 ? (
              <select className="campo mt-1" value={v[va.clave] ?? ''} onChange={(e) => escribir(va.clave, e.target.value)}>
                <option value="">Sin marcar</option>
                {va.opciones.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <input className="campo mt-1" value={v[va.clave] ?? ''} onChange={(e) => escribir(va.clave, e.target.value)} />
            )}
          </label>
        ))}
      </div>
    </Marco>
  )
}

// ── mapa del caso ─────────────────────────────────────────────────────────

// No pide datos: dibuja los flujos que ya se registraron. Sirve para ver de un
// golpe quién sostiene la operación y en qué dirección corre cada cosa.
export function CampoMapa({ campo, almacen }: Props) {
  const flujos = almacen.get<Fila[]>('flujos', [])
  const conNombre = flujos.filter((f) => f.texto.trim() !== '')
  if (conNombre.length === 0) {
    return (
      <Marco campo={campo}>
        <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          Se dibuja solo con lo que registres arriba en flujos.
        </p>
      </Marco>
    )
  }
  const R = 120
  const centro = { x: 160, y: 150 }
  return (
    <Marco campo={campo}>
      <svg viewBox="0 0 320 300" className="w-full" role="img" aria-label="Mapa de flujos del caso">
        {conNombre.map((f, i) => {
          const ang = (2 * Math.PI * i) / conNombre.length - Math.PI / 2
          const x = centro.x + R * Math.cos(ang)
          const y = centro.y + R * Math.sin(ang)
          const critico = f.attrs.critico === 'Crítico'
          return (
            <g key={f.k}>
              <line
                x1={centro.x}
                y1={centro.y}
                x2={x}
                y2={y}
                stroke={critico ? 'var(--orange)' : 'var(--line)'}
                strokeWidth={critico ? 2.5 : 1.5}
              />
              <circle cx={x} cy={y} r={7} fill={critico ? 'var(--orange)' : 'var(--ink-soft)'} />
              <text
                x={x}
                y={y + (Math.sin(ang) >= 0 ? 20 : -12)}
                textAnchor="middle"
                fontSize="9"
                fill="var(--ink)"
              >
                {f.texto.split('—')[0].trim().slice(0, 18)}
              </text>
            </g>
          )
        })}
        <circle cx={centro.x} cy={centro.y} r={22} fill="var(--blue)" />
        <text x={centro.x} y={centro.y + 4} textAnchor="middle" fontSize="10" fill="#fff">
          el caso
        </text>
      </svg>
      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
        En naranja, los actores cuya ausencia rompe la operación en menos de una semana.
      </p>
    </Marco>
  )
}
