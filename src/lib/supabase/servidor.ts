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

/**
 * Con acceso abierto ya no hay perfil del que colgar el equipo: se toma el
 * único que existe. La jerarquía del modelo de datos no cambia —sigue habiendo
 * un equipo dueño de las entidades— solo deja de decidir quién ve qué.
 */
export async function equipoActual(): Promise<string | null> {
  if (!hayConfig) return null
  const sb = await clienteServidor()
  const { data } = await sb
    .from('equipos')
    .select('id')
    .eq('nombre', 'CIX Foresight Lab')
    .maybeSingle()
  return (data?.id as string | undefined) ?? null
}
