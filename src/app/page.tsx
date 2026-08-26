import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AvisoConfig, Cabecera } from '@/components/Cabecera'
import { clienteServidor, hayConfig, perfil } from '@/lib/supabase/servidor'
import { NuevaEntidad } from './NuevaEntidad'

export const dynamic = 'force-dynamic'

type EntidadFila = {
  id: string
  nombre: string
  sub_segmento: string | null
  zona: string | null
  created_at: string
  visitas: { id: string; fecha: string }[] | null
}

export default async function Entidades() {
  if (!hayConfig) {
    return (
      <>
        <Cabecera />
        <AvisoConfig que="Sin NEXT_PUBLIC_SUPABASE_URL ni NEXT_PUBLIC_SUPABASE_ANON_KEY no hay dónde guardar. Llena .env.local." />
      </>
    )
  }

  const yo = await perfil()
  if (!yo) redirect('/login')

  if (!yo.equipo_id) {
    return (
      <>
        <Cabecera nombre={yo.nombre} />
        <AvisoConfig que="Tu usuario existe pero no está en ningún equipo. Corre el bloque de arranque que está al final de supabase/schema.sql con tu correo." />
      </>
    )
  }

  const sb = await clienteServidor()
  const { data, error } = await sb
    .from('entidades')
    .select('id, nombre, sub_segmento, zona, created_at, visitas(id, fecha)')
    .order('created_at', { ascending: false })

  const entidades = (data ?? []) as EntidadFila[]

  return (
    <>
      <Cabecera nombre={yo.nombre} sub={`${entidades.length} ${entidades.length === 1 ? 'entidad' : 'entidades'}`} />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
        <NuevaEntidad />
        {error && (
          <p className="text-[13px]" style={{ color: 'var(--danger)' }}>{error.message}</p>
        )}
        {entidades.length === 0 && (
          <p className="text-[14px]" style={{ color: 'var(--ink-soft)' }}>
            Todavía no hay ninguna. La primera entidad se crea acá y sus visitas cuelgan de ella.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {entidades.map((e) => {
            const visitas = e.visitas ?? []
            const ultima = visitas
              .slice()
              .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))[0]
            return (
              <li key={e.id}>
                <Link href={`/e/${e.id}`} className="tarjeta block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold">{e.nombre}</h2>
                      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                        {[e.sub_segmento, e.zona].filter(Boolean).join(' · ') || 'Sin sub-segmento ni zona'}
                      </p>
                    </div>
                    <span className={`pastilla ${visitas.length === 0 ? 'pastilla-naranja' : ''}`}>
                      {visitas.length} {visitas.length === 1 ? 'visita' : 'visitas'}
                    </span>
                  </div>
                  {ultima && (
                    <p className="mt-2 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
                      Última: {ultima.fecha}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </main>
    </>
  )
}
