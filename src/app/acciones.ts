'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { clienteServidor, sesion } from '@/lib/supabase/servidor'

export async function crearEntidad(form: FormData) {
  const usuario = await sesion()
  if (!usuario) redirect('/login')
  const sb = await clienteServidor()
  const { data: perfil } = await sb.from('perfiles').select('equipo_id').eq('id', usuario.id).maybeSingle()
  if (!perfil?.equipo_id) throw new Error('Tu usuario todavía no está en un equipo')

  const { data, error } = await sb
    .from('entidades')
    .insert({
      equipo_id: perfil.equipo_id,
      nombre: String(form.get('nombre') ?? '').trim(),
      sub_segmento: String(form.get('sub') ?? '') || null,
      zona: String(form.get('zona') ?? '').trim() || null,
      creado_por: usuario.id,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/')
  redirect(`/e/${data.id}`)
}

export async function crearVisita(form: FormData) {
  const usuario = await sesion()
  if (!usuario) redirect('/login')
  const entidad = String(form.get('entidad'))
  const sb = await clienteServidor()
  const { data, error } = await sb
    .from('visitas')
    .insert({ entidad_id: entidad, tipo: String(form.get('tipo') ?? 'levantamiento'), recolector: usuario.id })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(`/e/${entidad}`)
  redirect(`/v/${data.id}`)
}

export async function salir() {
  const sb = await clienteServidor()
  await sb.auth.signOut()
  redirect('/login')
}
