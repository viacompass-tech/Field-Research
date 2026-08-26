'use client'

import { useRef, useState } from 'react'
import type { Almacen } from '@/lib/almacen'
import type { CampoDef, Texto } from '@/lib/tipos'
import { Marco, PastillaIA } from './Marco'

// Todos los campos guardan su valor en estado local y lo empujan al almacén.
// Nunca suben el valor al módulo: si subiera, cada tecla repintaría la pantalla
// y volvería el salto de scroll que costó cuatro iteraciones matar.

type Props = { campo: CampoDef; almacen: Almacen }

export function CampoTexto({ campo, almacen }: Props) {
  const [v, setV] = useState(() => almacen.get(campo.id!, ''))
  return (
    <Marco campo={campo}>
      <input
        className="campo"
        placeholder={campo.ph}
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          almacen.set(campo.id!, e.target.value)
        }}
      />
    </Marco>
  )
}

export function CampoArea({ campo, almacen }: Props) {
  const [v, setV] = useState(() => almacen.get(campo.id!, ''))
  return (
    <Marco campo={campo}>
      <textarea
        className="campo min-h-32"
        placeholder={campo.ph}
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          almacen.set(campo.id!, e.target.value)
        }}
      />
    </Marco>
  )
}

export function CampoSeleccion({ campo, almacen }: Props) {
  const [v, setV] = useState(() => almacen.get(campo.id!, ''))
  return (
    <Marco campo={campo}>
      <select
        className="campo"
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          almacen.set(campo.id!, e.target.value)
        }}
      >
        <option value="">Sin marcar</option>
        {(campo.opts ?? []).map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </Marco>
  )
}

export function CampoChecks({ campo, almacen }: Props) {
  const [v, setV] = useState<string[]>(() => almacen.get(campo.id!, [] as string[]))
  const alternar = (o: string) => {
    const siguiente = v.includes(o) ? v.filter((x) => x !== o) : [...v, o]
    setV(siguiente)
    almacen.set(campo.id!, siguiente)
  }
  return (
    <Marco
      campo={campo}
      extra={<span className="pastilla">{v.length}/{(campo.opts ?? []).length}</span>}
    >
      <ul className="flex flex-col gap-2">
        {(campo.opts ?? []).map((o) => {
          const marcado = v.includes(o)
          return (
            <li key={o}>
              <button
                className="boton w-full justify-start text-left"
                style={
                  marcado
                    ? { borderColor: 'var(--blue)', background: 'color-mix(in srgb, var(--blue) 6%, #fff)' }
                    : undefined
                }
                aria-pressed={marcado}
                onClick={() => alternar(o)}
              >
                <span aria-hidden style={{ color: marcado ? 'var(--blue)' : 'var(--line)' }}>
                  {marcado ? '◉' : '○'}
                </span>
                <span className="font-normal">{o}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </Marco>
  )
}

export function CampoRepetible({ campo, almacen }: Props) {
  const [filas, setFilas] = useState<string[]>(() => {
    const guardadas = almacen.get(campo.id!, [] as string[])
    const min = campo.min ?? 1
    return guardadas.length >= min ? guardadas : [...guardadas, ...Array(min - guardadas.length).fill('')]
  })
  const escribir = (i: number, texto: string) => {
    const siguiente = filas.map((f, j) => (j === i ? texto : f))
    setFilas(siguiente)
    almacen.set(campo.id!, siguiente.filter((f) => f.trim() !== ''))
  }
  const llenas = filas.filter((f) => f.trim() !== '').length
  const min = campo.min ?? 0
  return (
    <Marco
      campo={campo}
      extra={
        min > 0 ? (
          <span className={`pastilla ${llenas < min ? 'pastilla-naranja' : 'pastilla-ok'}`}>
            {llenas}/{min}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-2">
        {filas.map((f, i) => (
          <textarea
            key={i}
            className="campo min-h-20"
            placeholder={campo.ph}
            value={f}
            onChange={(e) => escribir(i, e.target.value)}
          />
        ))}
        <button
          className="boton self-start"
          onClick={() => setFilas([...filas, ''])}
        >
          Agregar otro
        </button>
      </div>
    </Marco>
  )
}

// El cuadro de captura: lo primero y lo más grande, con contador de caracteres
// en vivo y dictado donde el navegador lo permita.
export function CampoCaptura({ campo, almacen }: Props) {
  const [v, setV] = useState(() => almacen.get(campo.id!, ''))
  const [dictando, setDictando] = useState(false)
  const reconocedor = useRef<unknown>(null)

  const dictar = () => {
    type Reconocimiento = {
      lang: string
      continuous: boolean
      interimResults: boolean
      onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
      onend: (() => void) | null
      start: () => void
      stop: () => void
    }
    const w = window as unknown as { SpeechRecognition?: new () => Reconocimiento; webkitSpeechRecognition?: new () => Reconocimiento }
    const Motor = w.SpeechRecognition ?? w.webkitSpeechRecognition
    if (!Motor) return
    if (dictando) {
      ;(reconocedor.current as Reconocimiento | null)?.stop()
      return
    }
    const r = new Motor()
    reconocedor.current = r
    r.lang = 'es-PE'
    r.continuous = true
    r.interimResults = false
    r.onresult = (e) => {
      let dicho = ''
      for (let i = 0; i < e.results.length; i++) dicho += e.results[i][0].transcript
      setV((antes) => {
        const siguiente = antes ? `${antes} ${dicho}`.trim() : dicho
        almacen.set(campo.id!, siguiente)
        return siguiente
      })
    }
    r.onend = () => setDictando(false)
    r.start()
    setDictando(true)
  }

  const hayDictado =
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)

  return (
    <section className="tarjeta p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-tight">
          {campo.l}
          {campo.req && <span style={{ color: 'var(--orange)' }}> ·</span>}
        </h3>
        <span className="pastilla" aria-live="off">{v.length}</span>
      </div>
      <textarea
        className="campo mt-3 min-h-64 leading-relaxed"
        placeholder={campo.ph}
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          almacen.set(campo.id!, e.target.value)
        }}
      />
      {hayDictado && (
        <button className="boton mt-2" onClick={dictar} aria-pressed={dictando}>
          {dictando ? 'Detener dictado' : 'Dictar'}
        </button>
      )}
    </section>
  )
}

// Interpretación: lo que escribe la IA queda marcado como borrador y deja de
// estarlo en cuanto una persona lo toca.
export function CampoInterpretacion({ campo, almacen }: Props) {
  const inicial = almacen.get<Texto>(campo.id!, { texto: '', origen: 'persona' })
  const [v, setV] = useState(inicial.texto)
  const [origen, setOrigen] = useState(inicial.origen)
  return (
    <Marco campo={campo} extra={<PastillaIA visible={origen === 'ia'} />}>
      <textarea
        className={`campo min-h-40 ${origen === 'ia' ? 'ia' : ''}`}
        placeholder="Qué crees que está pasando y por qué. Separado de lo que viste."
        value={v}
        onChange={(e) => {
          setV(e.target.value)
          setOrigen('persona')
          almacen.set(campo.id!, { texto: e.target.value, origen: 'persona' })
        }}
      />
    </Marco>
  )
}
