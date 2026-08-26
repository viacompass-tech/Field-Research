import { NextResponse } from 'next/server'
import { z } from 'zod'
import { modulo as definicion, vacio } from '@/lib/datos'
import type { Fila, Hallazgo, Puntuacion } from '@/lib/tipos'
import { clienteServidor, sesion } from '@/lib/supabase/servidor'

// Un solo endpoint para guardar una captura entera. Manda siempre el blob
// completo: así la cola del modo avión es idempotente y no hay que resolver
// conflictos de campo por campo.

const Esquema = z.object({
  visita: z.string().uuid(),
  modulo: z.string(),
  datos: z.record(z.string(), z.unknown()),
  no_negociables: z.array(z.number().int()),
  hueco: z.string().nullable(),
})

export async function POST(req: Request) {
  const usuario = await sesion()
  if (!usuario) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

  const cuerpo = Esquema.safeParse(await req.json())
  if (!cuerpo.success) {
    return NextResponse.json({ error: cuerpo.error.issues[0].message }, { status: 400 })
  }
  const { visita, modulo, datos, no_negociables, hueco } = cuerpo.data
  const def = definicion(modulo)
  if (!def) return NextResponse.json({ error: `No existe el módulo ${modulo}` }, { status: 400 })

  const hayAlgo = Object.entries(datos).some(([k, v]) => !k.startsWith('__') && !vacio(v))
  const pendientes = (def.nn?.length ?? 0) - no_negociables.length
  const estado = datos.__cubierto
    ? pendientes > 0
      ? 'cubierta_con_pendientes'
      : 'cubierta'
    : hayAlgo || no_negociables.length > 0
      ? 'en_curso'
      : 'vacia'

  const sb = await clienteServidor()
  const { error } = await sb
    .from('capturas')
    .upsert(
      { visita_id: visita, modulo, datos, no_negociables, hueco, estado },
      { onConflict: 'visita_id,modulo' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Lo que se consulta entre visitas vive además en su propia tabla.
  await materializar(visita, modulo, datos)

  return NextResponse.json({ ok: true })
}

async function materializar(visita: string, modulo: string, datos: Record<string, unknown>) {
  const def = definicion(modulo)
  if (!def) return
  const sb = await clienteServidor()

  for (const campo of def.campos) {
    if (!campo.id) continue

    if (campo.t === 'tagged') {
      const tipo = campo.tkey ?? campo.id
      const filas = (datos[campo.id] as Fila[] | undefined) ?? []
      await sb.from('items').delete().eq('visita_id', visita).eq('modulo', modulo).eq('tipo', tipo)
      const utiles = filas.filter((f) => f.texto?.trim())
      if (utiles.length > 0) {
        await sb.from('items').insert(
          utiles.map((f) => ({
            visita_id: visita,
            modulo,
            tipo,
            texto: f.texto.trim(),
            atributos: f.attrs ?? {},
            origen: f.origen ?? 'persona',
          })),
        )
      }
    }

    if (campo.t === 'findings') {
      const filas = (datos[campo.id] as Hallazgo[] | undefined) ?? []
      await sb.from('items').delete().eq('visita_id', visita).eq('modulo', modulo).eq('tipo', 'hallazgos')
      const utiles = filas.filter((f) => f.texto?.trim())
      if (utiles.length > 0) {
        await sb.from('items').insert(
          utiles.map((f) => ({
            visita_id: visita,
            modulo,
            tipo: 'hallazgos',
            texto: f.texto.trim(),
            atributos: { fuentes: f.fuentes ?? [], triangulado: Boolean(f.triangulado) },
            origen: f.origen ?? 'persona',
          })),
        )
      }
    }

    if (campo.t === 'scale') {
      const puntos = (datos[campo.id] as Record<string, Puntuacion> | undefined) ?? {}
      const filas = Object.entries(puntos)
        .filter(([, p]) => p && p.valor !== null && p.valor !== undefined)
        .map(([dimension, p]) => ({
          visita_id: visita,
          dimension,
          valor: p.valor,
          evidencia: p.evidencia ?? null,
          origen: p.origen ?? 'persona',
        }))
      if (filas.length > 0) {
        await sb.from('estado_negocio').upsert(filas, { onConflict: 'visita_id,dimension' })
      }
    }
  }
}
