import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Cabecera } from '@/components/Cabecera'
import { MODULOS } from '@/lib/datos'
import { clienteServidor, perfil } from '@/lib/supabase/servidor'
import { crearVisita } from '@/app/acciones'

export const dynamic = 'force-dynamic'

export default async function Entidad({ params }: { params: Promise<{ entidad: string }> }) {
  const { entidad } = await params
  const yo = await perfil()
  if (!yo) redirect('/login')

  const sb = await clienteServidor()
  const { data } = await sb
    .from('entidades')
    .select('id, nombre, sub_segmento, zona, estado, visitas(id, tipo, fecha, cerrada_at, capturas(modulo, estado))')
    .eq('id', entidad)
    .maybeSingle()
  if (!data) notFound()

  type Visita = {
    id: string
    tipo: string
    fecha: string
    cerrada_at: string | null
    capturas: { modulo: string; estado: string }[] | null
  }
  const visitas = ((data.visitas ?? []) as Visita[])
    .slice()
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  return (
    <>
      <Cabecera nombre={yo.nombre} sub={data.nombre} />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
        <section className="tarjeta p-4">
          <h1 className="text-lg font-semibold">{data.nombre}</h1>
          <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>
            {[data.sub_segmento, data.zona].filter(Boolean).join(' · ') || 'Sin sub-segmento ni zona'}
          </p>
        </section>

        <form action={crearVisita} className="tarjeta flex flex-col gap-3 p-4">
          <input type="hidden" name="entidad" value={entidad} />
          <label className="block">
            <span className="kicker">Tipo de visita</span>
            <select className="campo mt-1" name="tipo" defaultValue="levantamiento">
              <option value="levantamiento">Levantamiento</option>
              <option value="intervencion">Intervención</option>
              <option value="medicion">Medición posterior</option>
            </select>
          </label>
          <button className="boton boton-primario" type="submit">Nueva visita</button>
        </form>

        {visitas.length === 0 ? (
          <p className="text-[14px]" style={{ color: 'var(--ink-soft)' }}>
            Todavía no hay visitas. La primera abre los once módulos.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {visitas.map((v) => {
              const cubiertos = (v.capturas ?? []).filter((c) => c.estado.startsWith('cubierta')).length
              return (
                <li key={v.id}>
                  <Link href={`/v/${v.id}`} className="tarjeta block p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{v.fecha}</h2>
                        <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{v.tipo}</p>
                      </div>
                      <span className="pastilla">
                        {cubiertos}/{MODULOS.length} módulos
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </main>
    </>
  )
}
