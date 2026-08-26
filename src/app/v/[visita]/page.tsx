import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Cabecera } from '@/components/Cabecera'
import { MODULOS, progreso } from '@/lib/datos'
import type { Datos } from '@/lib/tipos'
import { clienteServidor, hayConfig, perfil } from '@/lib/supabase/servidor'

export const dynamic = 'force-dynamic'

export default async function IndiceVisita({ params }: { params: Promise<{ visita: string }> }) {
  const { visita } = await params

  // Sin Supabase el índice existe igual, vacío: es la puerta al modo revisión.
  if (!hayConfig) {
    return (
      <>
        <Cabecera sub="Modo revisión" />
        <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
          <p className="text-[13px]" style={{ color: 'var(--orange)' }}>
            Nada de lo que toques acá se guarda.
          </p>
          <ListaModulos visita={visita} capturas={new Map()} />
        </main>
      </>
    )
  }

  const yo = await perfil()
  if (!yo) redirect('/login')

  const sb = await clienteServidor()
  const { data } = await sb
    .from('visitas')
    .select('id, tipo, fecha, entidades(id, nombre, zona), capturas(modulo, datos, no_negociables, estado)')
    .eq('id', visita)
    .maybeSingle()
  if (!data) notFound()

  const entidad = data.entidades as unknown as { id: string; nombre: string; zona: string | null }
  const capturas = new Map(
    ((data.capturas ?? []) as CapturaFila[]).map((c) => [c.modulo, c]),
  )

  const { count: hipotesisAbiertas } = await sb
    .from('hipotesis')
    .select('id', { count: 'exact', head: true })
    .eq('entidad_id', entidad.id)
    .eq('veredicto', 'abierta')

  return (
    <>
      <Cabecera nombre={yo.nombre} sub={`${entidad.nombre} · ${data.fecha}`} />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href={`/e/${entidad.id}`} className="kicker enlace-suave">← visitas</Link>
          <span className="flex gap-2">
            {typeof hipotesisAbiertas === 'number' && hipotesisAbiertas > 0 && (
              <span className="pastilla pastilla-naranja">{hipotesisAbiertas} hipótesis por validar</span>
            )}
            <a className="pastilla" href={`/api/exportar/${visita}?formato=md`}>Exportar</a>
          </span>
        </div>

        <ListaModulos visita={visita} capturas={capturas} />

        <div className="flex gap-2">
          <a className="boton" href={`/api/exportar/${visita}?formato=md`}>Markdown</a>
          <a className="boton" href={`/api/exportar/${visita}?formato=json`}>JSON</a>
        </div>
      </main>
    </>
  )
}

type CapturaFila = { modulo: string; datos: Datos; no_negociables: number[]; estado: string }

function ListaModulos({
  visita,
  capturas,
}: {
  visita: string
  capturas: Map<string, CapturaFila>
}) {
  return (
        <ul className="flex flex-col gap-3">
          {MODULOS.map((m) => {
            const c = capturas.get(m.id)
            const p = progreso(m, c?.datos ?? {}, c?.no_negociables ?? [])
            return (
              <li key={m.id}>
                <Link href={`/v/${visita}/${m.id}`} className="tarjeta block p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="kicker">{m.code}{m.opcional ? ' · opcional' : ''}</p>
                      <h2 className="font-semibold leading-tight">{m.nombre}</h2>
                      <p className="text-[13px]" style={{ color: 'var(--ink-soft)' }}>{m.dur}</p>
                    </div>
                    <span className={`pastilla ${c?.estado?.startsWith('cubierta') ? 'pastilla-ok' : ''}`}>
                      {p.pct}%
                    </span>
                  </div>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--line-soft)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${p.pct}%`, background: 'var(--blue)' }}
                    />
                  </div>

                  {(p.nnPendientes > 0 || p.reqPendientes.length > 0) && (
                    <p className="mt-2 text-[13px]" style={{ color: 'var(--orange)' }}>
                      {[
                        p.nnPendientes > 0
                          ? `${p.nnPendientes} ${p.nnPendientes === 1 ? 'no negociable pendiente' : 'no negociables pendientes'}`
                          : null,
                        p.reqPendientes.length > 0 ? `falta ${p.reqPendientes.join(', ').toLowerCase()}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
  )
}
