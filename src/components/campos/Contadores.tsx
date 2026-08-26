'use client'

import { useEffect, useRef, useState } from 'react'
import type { Almacen } from '@/lib/almacen'
import type { CampoDef, Cronometro } from '@/lib/tipos'
import { Marco } from './Marco'
import { AvisoDeshacer, BotonBorrar, useDeshacer } from '../Borrar'

type Props = { campo: CampoDef; almacen: Almacen }

// Nunca se pide una cifra que se pueda derivar: se cuenta tocando. El
// porcentaje sale solo de dos contadores.
const EVENTO = 'cix:contador'

function tocar() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(12)
}

function reloj(seg: number) {
  const m = Math.floor(Math.max(0, seg) / 60)
  const s = Math.max(0, seg) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function CampoContador({ campo, almacen }: Props) {
  const [v, setV] = useState<number>(() => almacen.get(campo.id!, 0))
  const [base, setBase] = useState<number>(() => (campo.of ? almacen.get(campo.of, 0) : 0))
  const [fin, setFin] = useState<number | null>(() => almacen.get(`${campo.id}__ventana`, null as number | null))
  const [ahora, setAhora] = useState(() => Date.now())

  // Un contador derivado se entera de los cambios del otro sin repintar el módulo.
  useEffect(() => {
    if (!campo.of) return
    const oir = (e: Event) => {
      const d = (e as CustomEvent<{ id: string; valor: number }>).detail
      if (d.id === campo.of) setBase(d.valor)
    }
    window.addEventListener(EVENTO, oir)
    return () => window.removeEventListener(EVENTO, oir)
  }, [campo.of])

  useEffect(() => {
    if (fin === null) return
    const t = setInterval(() => setAhora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [fin])

  const restante = fin === null ? null : Math.round((fin - ahora) / 1000)
  useEffect(() => {
    if (restante !== null && restante <= 0) {
      tocar()
      setFin(null)
      almacen.set(`${campo.id}__ventana`, null)
    }
  }, [restante, almacen, campo.id])

  const mover = (delta: number) => {
    const siguiente = Math.max(0, v + delta)
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
    tocar()
    window.dispatchEvent(new CustomEvent(EVENTO, { detail: { id: campo.id, valor: siguiente } }))
  }

  const pct = campo.of && base > 0 ? Math.round((v / base) * 100) : null

  return (
    <Marco
      campo={campo}
      extra={pct !== null ? <span className="pastilla pastilla-ok">{pct}% de {base}</span> : undefined}
    >
      <div className="flex items-center justify-between gap-3">
        <button className="contador-boton" onClick={() => mover(-1)} aria-label="Restar uno">−</button>
        <span className="contador-valor" aria-live="polite">{v}</span>
        <button
          className="contador-boton"
          style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
          onClick={() => mover(1)}
          aria-label="Sumar uno"
        >
          +
        </button>
      </div>

      {campo.timer && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
            Ventana de {Math.round(campo.timer / 60)} minutos
          </span>
          {restante === null ? (
            <button
              className="boton"
              onClick={() => {
                const t = Date.now() + campo.timer! * 1000
                setFin(t)
                setAhora(Date.now())
                almacen.set(`${campo.id}__ventana`, t)
                tocar()
              }}
            >
              Iniciar ventana
            </button>
          ) : (
            <span className="flex items-center gap-2">
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{reloj(restante)}</strong>
              <button
                className="boton boton-fantasma"
                onClick={() => { setFin(null); almacen.set(`${campo.id}__ventana`, null) }}
              >
                Cortar
              </button>
            </span>
          )}
        </div>
      )}
    </Marco>
  )
}

export function CampoCronometro({ campo, almacen }: Props) {
  const inicial = almacen.get<Cronometro>(campo.id!, { vueltas: [] })
  const [vueltas, setVueltas] = useState<number[]>(inicial.vueltas)
  const [desde, setDesde] = useState<number | null>(null)
  const [ahora, setAhora] = useState(() => Date.now())
  const { aviso, ejecutar } = useDeshacer()
  const cuadro = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (desde === null) return
    cuadro.current = setInterval(() => setAhora(Date.now()), 100)
    return () => { if (cuadro.current) clearInterval(cuadro.current) }
  }, [desde])

  const guardar = (lista: number[]) => {
    setVueltas(lista)
    almacen.set(campo.id!, { vueltas: lista })
  }

  const promedio = vueltas.length
    ? vueltas.reduce((a, b) => a + b, 0) / vueltas.length / 1000
    : null

  return (
    <Marco
      campo={campo}
      extra={
        promedio !== null ? (
          <span className="pastilla pastilla-ok">promedio {promedio.toFixed(1)} s</span>
        ) : undefined
      }
    >
      <div className="flex items-center justify-between gap-3">
        <span className="contador-valor">
          {desde === null ? '0.0' : ((ahora - desde) / 1000).toFixed(1)}
          <span className="text-base font-normal"> s</span>
        </span>
        {desde === null ? (
          <button
            className="boton boton-primario"
            onClick={() => { setDesde(Date.now()); setAhora(Date.now()); tocar() }}
          >
            Empezar
          </button>
        ) : (
          <button
            className="boton"
            onClick={() => {
              guardar([...vueltas, Date.now() - desde])
              setDesde(null)
              tocar()
            }}
          >
            Terminar vuelta
          </button>
        )}
      </div>

      {vueltas.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {vueltas.map((ms, i) => (
            <li key={i} className="flex items-center justify-between text-[13px]">
              <span>Vuelta {i + 1} · {(ms / 1000).toFixed(1)} s</span>
              <BotonBorrar
                que={`la vuelta ${i + 1}`}
                onConfirmar={() => {
                  const previa = vueltas
                  ejecutar(
                    `Se quitó la vuelta ${i + 1}`,
                    () => guardar(vueltas.filter((_, j) => j !== i)),
                    () => guardar(previa),
                  )
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <AvisoDeshacer aviso={aviso} />
    </Marco>
  )
}

// Contadores que no trae el instrumento y aparecen en la calle. Se guardan en
// la tabla `contadores`, no dentro de la captura: nacen para compararse.
export function ContadoresExtra({
  visita,
  modulo,
  iniciales,
}: {
  visita: string
  modulo: string
  iniciales: { id: string; clave: string; etiqueta: string; valor: number }[]
}) {
  const [lista, setLista] = useState(iniciales)
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')

  const sincronizar = (clave: string, etiqueta: string, valor: number) => {
    void fetch('/api/contador', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visita, modulo, clave, etiqueta, valor }),
    })
  }

  const mover = (i: number, delta: number) => {
    const siguiente = lista.map((c, j) => (j === i ? { ...c, valor: Math.max(0, c.valor + delta) } : c))
    setLista(siguiente)
    tocar()
    sincronizar(siguiente[i].clave, siguiente[i].etiqueta, siguiente[i].valor)
  }

  return (
    <section className="tarjeta p-4">
      <h3 className="font-semibold">Contadores de campo</h3>
      <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
        Lo que apareció en la calle y el instrumento no traía.
      </p>
      <div className="mt-3 flex flex-col gap-4">
        {lista.map((c, i) => (
          <div key={c.clave}>
            <p className="text-[13px] font-semibold">{c.etiqueta}</p>
            <div className="mt-1 flex items-center justify-between gap-3">
              <button className="contador-boton" onClick={() => mover(i, -1)} aria-label="Restar uno">−</button>
              <span className="contador-valor">{c.valor}</span>
              <button
                className="contador-boton"
                style={{ borderColor: 'var(--blue)', color: 'var(--blue)' }}
                onClick={() => mover(i, 1)}
                aria-label="Sumar uno"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
      {abierto ? (
        <div className="mt-3 flex gap-2">
          <input
            className="campo"
            placeholder="Qué vas a contar"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <button
            className="boton boton-primario"
            disabled={!nombre.trim()}
            onClick={() => {
              const clave = `c_${crypto.randomUUID().slice(0, 8)}`
              setLista([...lista, { id: clave, clave, etiqueta: nombre.trim(), valor: 0 }])
              sincronizar(clave, nombre.trim(), 0)
              setNombre('')
              setAbierto(false)
            }}
          >
            Crear
          </button>
        </div>
      ) : (
        <button className="boton mt-3" onClick={() => setAbierto(true)}>
          Contador nuevo
        </button>
      )}
    </section>
  )
}
