'use client'

import { useState } from 'react'

export type HipotesisFila = {
  id: string
  texto: string
  confirma: string | null
  tumba: string | null
  veredicto: string
  origen: string
}

// Una hipótesis que nace en la calle se levanta desde cualquier módulo. Sin
// qué la confirmaría y qué la tumbaría es una opinión, así que ambas van juntas.
export function Hipotesis({
  entidad,
  visita,
  modulo,
  iniciales,
}: {
  entidad: string
  visita: string
  modulo: string
  iniciales: HipotesisFila[]
}) {
  const [lista, setLista] = useState(iniciales)
  const [abierto, setAbierto] = useState(false)
  const [texto, setTexto] = useState('')
  const [confirma, setConfirma] = useState('')
  const [tumba, setTumba] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  const crear = async () => {
    setGuardando(true)
    setError(null)
    try {
      const r = await fetch('/api/hipotesis', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entidad, visita, modulo, texto, confirma, tumba }),
      })
      const cuerpo = await r.json()
      if (!r.ok) throw new Error(cuerpo?.error ?? `HTTP ${r.status}`)
      setLista([...lista, cuerpo.hipotesis])
      setTexto(''); setConfirma(''); setTumba(''); setAbierto(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="tarjeta p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Hipótesis de campo</h3>
        <span className="pastilla">{lista.length}</span>
      </div>
      {lista.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2 text-[13px]">
          {lista.map((h) => (
            <li key={h.id} className="rounded-xl p-2" style={{ background: 'var(--canvas)' }}>
              <p>{h.texto}</p>
              {h.confirma && <p style={{ color: 'var(--ok)' }}>La confirma: {h.confirma}</p>}
              {h.tumba && <p style={{ color: 'var(--danger)' }}>La tumba: {h.tumba}</p>}
            </li>
          ))}
        </ul>
      )}
      {abierto ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            className="campo min-h-20"
            placeholder="Qué crees que pasa, en una frase que se pueda tumbar"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <input
            className="campo"
            placeholder="Qué la confirmaría"
            value={confirma}
            onChange={(e) => setConfirma(e.target.value)}
          />
          <input
            className="campo"
            placeholder="Qué la tumbaría"
            value={tumba}
            onChange={(e) => setTumba(e.target.value)}
          />
          {error && <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>}
          <div className="flex gap-2">
            <button
              className="boton boton-primario"
              disabled={!texto.trim() || !confirma.trim() || !tumba.trim() || guardando}
              onClick={() => void crear()}
            >
              {guardando ? 'Guardando…' : 'Levantar hipótesis'}
            </button>
            <button className="boton boton-fantasma" onClick={() => setAbierto(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <button className="boton mt-3" onClick={() => setAbierto(true)}>
          Levantar una hipótesis
        </button>
      )}
    </section>
  )
}
