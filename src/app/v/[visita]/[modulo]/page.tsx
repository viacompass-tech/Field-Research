import { notFound, redirect } from 'next/navigation'
import { Modulo } from '@/components/Modulo'
import { modulo as definicion } from '@/lib/datos'
import type { Datos, FotoRef } from '@/lib/tipos'
import { clienteServidor, hayConfig, perfil } from '@/lib/supabase/servidor'
import type { HipotesisFila } from '@/components/Hipotesis'

export const dynamic = 'force-dynamic'

export default async function PantallaModulo({
  params,
}: {
  params: Promise<{ visita: string; modulo: string }>
}) {
  const { visita, modulo } = await params
  const def = definicion(modulo)
  if (!def) notFound()

  // Sin Supabase la pantalla se pinta igual, en modo revisión: sirve para
  // discutir el instrumento, no para capturar.
  if (!hayConfig) {
    return (
      <Modulo
        def={def}
        visita={visita}
        entidad={{ id: 'demo', nombre: 'Sin configurar' }}
        inicial={{ datos: {}, no_negociables: [], hueco: null, estructurado_at: null }}
        fotos={[]}
        contadores={[]}
        variables={[]}
        hipotesis={[]}
        revision
      />
    )
  }

  const yo = await perfil()
  if (!yo) redirect('/login')

  const sb = await clienteServidor()
  const { data: fila } = await sb
    .from('visitas')
    .select('id, entidades(id, nombre)')
    .eq('id', visita)
    .maybeSingle()
  if (!fila) notFound()
  const entidad = fila.entidades as unknown as { id: string; nombre: string }

  const [captura, fotos, contadores, variables, hipotesis] = await Promise.all([
    sb.from('capturas')
      .select('datos, no_negociables, hueco, estructurado_at')
      .eq('visita_id', visita)
      .eq('modulo', modulo)
      .maybeSingle(),
    sb.from('fotos').select('id, path, pie').eq('visita_id', visita).eq('modulo', modulo),
    sb.from('contadores').select('id, clave, etiqueta, valor').eq('visita_id', visita).eq('modulo', modulo),
    sb.from('variables_abiertas').select('clave, etiqueta, tipo, opciones').eq('activa', true),
    sb.from('hipotesis')
      .select('id, texto, confirma, tumba, veredicto, origen')
      .eq('visita_id', visita)
      .eq('modulo', modulo),
  ])

  return (
    <Modulo
      def={def}
      visita={visita}
      entidad={entidad}
      inicial={{
        datos: (captura.data?.datos ?? {}) as Datos,
        no_negociables: (captura.data?.no_negociables ?? []) as number[],
        hueco: (captura.data?.hueco ?? null) as string | null,
        estructurado_at: (captura.data?.estructurado_at ?? null) as string | null,
      }}
      fotos={(fotos.data ?? []) as FotoRef[]}
      contadores={(contadores.data ?? []) as { id: string; clave: string; etiqueta: string; valor: number }[]}
      variables={
        (variables.data ?? []) as { clave: string; etiqueta: string; tipo: string; opciones: string[] }[]
      }
      hipotesis={(hipotesis.data ?? []) as HipotesisFila[]}
    />
  )
}
