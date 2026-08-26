import { NextResponse } from 'next/server'
import { z } from 'zod'
import { clienteServidor, sesion } from '@/lib/supabase/servidor'

const Esquema = z.object({
  entidad: z.string().uuid(),
  visita: z.string().uuid(),
  modulo: z.string(),
  texto: z.string().min(3),
  confirma: z.string().min(1),
  tumba: z.string().min(1),
})

export async function POST(req: Request) {
  const usuario = await sesion()
  if (!usuario) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })
  const cuerpo = Esquema.safeParse(await req.json())
  if (!cuerpo.success) {
    return NextResponse.json({ error: cuerpo.error.issues[0].message }, { status: 400 })
  }
  const { entidad, visita, modulo, texto, confirma, tumba } = cuerpo.data
  const sb = await clienteServidor()
  const { data, error } = await sb
    .from('hipotesis')
    .insert({
      entidad_id: entidad,
      visita_id: visita,
      modulo,
      texto,
      confirma,
      tumba,
      origen: 'campo',
    })
    .select('id, texto, confirma, tumba, veredicto, origen')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ hipotesis: data })
}
