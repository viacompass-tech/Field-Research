import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clienteServidor } from '@/lib/supabase/servidor'

const Esquema = z.object({
  visita: z.string().uuid(),
  modulo: z.string(),
  clave: z.string(),
  etiqueta: z.string(),
  valor: z.number().int().min(0),
})

export async function POST(req: Request) {
  const cuerpo = Esquema.safeParse(await req.json())
  if (!cuerpo.success) {
    return NextResponse.json({ error: cuerpo.error.issues[0].message }, { status: 400 })
  }
  const { visita, modulo, clave, etiqueta, valor } = cuerpo.data
  const sb = await clienteServidor()
  const { error } = await sb
    .from('contadores')
    .upsert(
      { visita_id: visita, modulo, clave, etiqueta, valor },
      { onConflict: 'visita_id,modulo,clave' },
    )
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
