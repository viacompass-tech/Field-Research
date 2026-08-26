'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TAX } from '@/lib/datos'

// En modo revisión no hay dónde guardar una entidad, pero la secuencia sí
// importa: primero se nombra el negocio, después se abren los módulos. El
// nombre vive en el celular de quien está revisando y en ningún otro lado.

const CLAVE = 'cix.revision.entidad'

export type EntidadRevision = { nombre: string; sub: string; zona: string }

export function leerEntidad(): EntidadRevision | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const crudo = localStorage.getItem(CLAVE)
    return crudo ? (JSON.parse(crudo) as EntidadRevision) : null
  } catch {
    return null
  }
}

/** El nombre del negocio en la cabecera. Se lee al montar, sin repintar nada más. */
export function NombreEntidad({ porDefecto }: { porDefecto: string }) {
  const [nombre, setNombre] = useState(porDefecto)
  useEffect(() => {
    const e = leerEntidad()
    if (e?.nombre) setNombre(e.nombre)
  }, [])
  return <>{nombre}</>
}

export function CrearEntidadRevision() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [sub, setSub] = useState('')
  const [zona, setZona] = useState('')
  const [previa, setPrevia] = useState<EntidadRevision | null>(null)

  useEffect(() => {
    setPrevia(leerEntidad())
  }, [])

  const entrar = () => {
    try {
      localStorage.setItem(CLAVE, JSON.stringify({ nombre: nombre.trim(), sub, zona: zona.trim() }))
    } catch {
      // Sin almacenamiento local igual se entra: solo se pierde el nombre.
    }
    router.push('/v/revision')
  }

  return (
    <section className="tarjeta flex flex-col gap-3 p-4">
      <div>
        <h2 className="font-semibold">¿A qué negocio vas?</h2>
        <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
          Primero se nombra la entidad, después se abren los once módulos. En el
          instrumento de verdad esto crea la entidad y su primera visita.
        </p>
      </div>

      <label className="block">
        <span className="kicker">Nombre</span>
        <input
          className="campo mt-1"
          placeholder="Como lo llama la gente"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </label>

      <label className="block">
        <span className="kicker">Sub-segmento</span>
        <select className="campo mt-1" value={sub} onChange={(e) => setSub(e.target.value)}>
          <option value="">Sin marcar</option>
          {TAX.territorio.sub.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="kicker">Zona</span>
        <input
          className="campo mt-1"
          placeholder="Distrito, mercado, cuadra"
          value={zona}
          onChange={(e) => setZona(e.target.value)}
        />
      </label>

      <button className="boton boton-primario" disabled={!nombre.trim()} onClick={entrar}>
        Abrir los módulos
      </button>

      {previa && (
        <button className="boton boton-fantasma" onClick={() => router.push('/v/revision')}>
          O sigue con {previa.nombre}
        </button>
      )}
    </section>
  )
}

/** Cuando alguien cae directo en el índice sin haber nombrado nada. */
export function SinEntidad() {
  const [falta, setFalta] = useState(false)
  useEffect(() => {
    setFalta(!leerEntidad()?.nombre)
  }, [])
  if (!falta) return null
  return (
    <div className="tarjeta p-4" style={{ borderColor: 'var(--orange)' }}>
      <p className="text-[14px]">
        Todavía no nombraste el negocio. En campo eso va primero: la visita cuelga de una
        entidad.
      </p>
      <a className="boton mt-2" href="/">
        Nombrarlo
      </a>
    </div>
  )
}
