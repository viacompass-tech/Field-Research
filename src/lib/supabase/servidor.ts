import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const hayConfig = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

export async function clienteServidor() {
  const almacen = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sin-configurar',
    {
      cookies: {
        getAll() {
          return almacen.getAll()
        },
        setAll(nuevas) {
          try {
            for (const { name, value, options } of nuevas) almacen.set(name, value, options)
          } catch {
            // Llamado desde un Server Component: el middleware ya refrescó la sesión.
          }
        },
      },
    },
  )
}

export async function sesion() {
  if (!hayConfig) return null
  const sb = await clienteServidor()
  const { data } = await sb.auth.getUser()
  return data.user ?? null
}

export async function perfil() {
  const usuario = await sesion()
  if (!usuario) return null
  const sb = await clienteServidor()
  const { data } = await sb
    .from('perfiles')
    .select('id, nombre, correo, equipo_id, rol')
    .eq('id', usuario.id)
    .maybeSingle()
  return data ?? { id: usuario.id, nombre: usuario.email, correo: usuario.email, equipo_id: null, rol: 'lab' }
}
