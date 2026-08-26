'use client'

import { useState } from 'react'
import { TAX } from '@/lib/datos'
import { crearEntidad } from './acciones'

export function NuevaEntidad() {
  const [abierto, setAbierto] = useState(false)
  if (!abierto) {
    return (
      <button className="boton boton-primario w-full" onClick={() => setAbierto(true)}>
        Nueva entidad
      </button>
    )
  }
  return (
    <form action={crearEntidad} className="tarjeta flex flex-col gap-3 p-4">
      <label className="block">
        <span className="kicker">Nombre</span>
        <input className="campo mt-1" name="nombre" required placeholder="Como lo llama la gente" />
      </label>
      <label className="block">
        <span className="kicker">Sub-segmento</span>
        <select className="campo mt-1" name="sub" defaultValue="">
          <option value="">Sin marcar</option>
          {TAX.territorio.sub.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="kicker">Zona</span>
        <input className="campo mt-1" name="zona" placeholder="Distrito, mercado, cuadra" />
      </label>
      <div className="flex gap-2">
        <button className="boton boton-primario" type="submit">Crear</button>
        <button className="boton boton-fantasma" type="button" onClick={() => setAbierto(false)}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
