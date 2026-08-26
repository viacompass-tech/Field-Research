import { NextResponse } from 'next/server'
import { aMarkdown, type VisitaExport } from '@/lib/exportar'
import type { Datos } from '@/lib/tipos'
import { clienteServidor, sesion } from '@/lib/supabase/servidor'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ visita: string }> },
) {
  const usuario = await sesion()
  if (!usuario) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })
  const { visita } = await params
  const formato = new URL(req.url).searchParams.get('formato') ?? 'md'

  const sb = await clienteServidor()
  const { data, error } = await sb
    .from('visitas')
    .select(
      'id, tipo, fecha, entidades(nombre, sub_segmento, zona), capturas(modulo, datos, no_negociables, hueco, estado), fotos(modulo, path)',
    )
    .eq('id', visita)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data) return NextResponse.json({ error: 'No existe esa visita' }, { status: 404 })

  const entidad = data.entidades as unknown as {
    nombre: string
    sub_segmento: string | null
    zona: string | null
  }
  const { data: hipotesis } = await sb
    .from('hipotesis')
    .select('texto, confirma, tumba, veredicto, entidad_id, visita_id')
    .eq('visita_id', visita)

  type CapturaFila = {
    modulo: string
    datos: Datos
    no_negociables: number[]
    hueco: string | null
    estado: string
  }

  const paquete: VisitaExport = {
    visita: { id: data.id as string, fecha: data.fecha as string, tipo: data.tipo as string },
    entidad,
    capturas: Object.fromEntries(
      ((data.capturas ?? []) as CapturaFila[]).map((c) => [
        c.modulo,
        { datos: c.datos, no_negociables: c.no_negociables, hueco: c.hueco, estado: c.estado },
      ]),
    ),
    fotos: (data.fotos ?? []) as { modulo: string; path: string }[],
    hipotesis: (hipotesis ?? []) as VisitaExport['hipotesis'],
  }

  const base = `${entidad.nombre.replace(/[^\w\-]+/g, '-').toLowerCase()}-${paquete.visita.fecha}`

  if (formato === 'json') {
    return new NextResponse(JSON.stringify(paquete, null, 2), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'content-disposition': `attachment; filename="${base}.json"`,
      },
    })
  }

  return new NextResponse(aMarkdown(paquete), {
    headers: {
      'content-type': 'text/markdown; charset=utf-8',
      'content-disposition': `attachment; filename="${base}.md"`,
    },
  })
}
