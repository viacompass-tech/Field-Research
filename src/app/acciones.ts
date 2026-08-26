'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clienteServidor, equipoActual } from '@/lib/supabase/servidor'

export async function crearEntidad(form: FormData) {
  const equipo = await equipoActual()
  if (!equipo) throw new Error('No existe el equipo «CIX Foresight Lab» en la base')
  const sb = await clienteServidor()

  const { data, error } = await sb
    .from('entidades')
    .insert({
      equipo_id: equipo,
      nombre: String(form.get('nombre') ?? '').trim(),
      sub_segmento: String(form.get('sub') ?? '') || null,
      zona: String(form.get('zona') ?? '').trim() || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/')
  redirect(`/e/${data.id}`)
}

export async function crearVisita(form: FormData) {
  const entidad = String(form.get('entidad'))
  const sb = await clienteServidor()
  const { data, error } = await sb
    .from('visitas')
    .insert({
      entidad_id: entidad,
      tipo: String(form.get('tipo') ?? 'levantamiento'),
      recolector_nombre: String(form.get('recolector') ?? '').trim() || null,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/e/${entidad}`)
  redirect(`/v/${data.id}`)
}

