import Link from 'next/link'
import { CrearEntidadRevision } from '@/components/Revision'
import { AvisoAbierto, AvisoConfig, Cabecera } from '@/components/Cabecera'
import { TAX } from '@/lib/datos'
import { clienteServidor, equipoActual, hayConfig } from '@/lib/supabase/servidor'
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
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
          <AvisoConfig que="Sin NEXT_PUBLIC_SUPABASE_URL ni NEXT_PUBLIC_SUPABASE_ANON_KEY no hay dónde guardar. Llena .env.local para capturar de verdad." />
          <section className="tarjeta p-4">
            <p className="kicker">Territorio 1</p>
            <h1 className="mt-1 text-lg font-semibold">{TAX.territorio.n}</h1>
            <p className="mt-2 text-[14px]">{TAX.territorio.pregunta}</p>
          </section>
          <CrearEntidadRevision />
          <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
            Modo revisión: los once módulos se pintan y se pueden tocar, pero nada se
            guarda. Sirve para discutir el instrumento, no para salir a campo.
          </p>
        </main>
      </>
    )
  }

  const equipo = await equipoActual()
  if (!equipo) {
    return (
      <>
        <Cabecera />
        <AvisoConfig que="No existe el equipo «CIX Foresight Lab» en la base. Corre supabase/acceso-abierto.sql, que lo crea si falta." />
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
      <Cabecera sub={`${entidades.length} ${entidades.length === 1 ? 'entidad' : 'entidades'}`} />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
        <AvisoAbierto />
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
