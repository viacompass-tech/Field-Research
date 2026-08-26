import { MODULOS, TAX } from './datos'
import type { Actor, CampoDef, Datos, Fila, Hallazgo, Puntuacion, Supuesto, Texto } from './tipos'

export type VisitaExport = {
  visita: { id: string; fecha: string; tipo: string }
  entidad: { nombre: string; sub_segmento: string | null; zona: string | null }
  capturas: Record<string, { datos: Datos; no_negociables: number[]; hueco: string | null; estado: string }>
  fotos: { modulo: string; path: string }[]
  hipotesis: { texto: string; confirma: string | null; tumba: string | null; veredicto: string }[]
}

function valor(campo: CampoDef, v: unknown, datos: Datos): string[] {
  if (v === undefined || v === null || v === '') return []
  switch (campo.t) {
    case 'checks':
      return (v as string[]).map((x) => `- ${x}`)
    case 'repeat':
      return (v as string[]).map((x) => `> ${x}`)
    case 'tally': {
      // El porcentaje se deriva, nunca se pide: acá también.
      const base = campo.of ? Number(datos[campo.of] ?? 0) : 0
      if (campo.of && base > 0) {
        return [`${v} de ${base} · ${Math.round((Number(v) / base) * 100)}%`]
      }
      return [String(v)]
    }
    case 'chrono': {
      const vueltas = (v as { vueltas: number[] }).vueltas ?? []
      if (vueltas.length === 0) return []
      const prom = vueltas.reduce((a, b) => a + b, 0) / vueltas.length / 1000
      return [`${vueltas.length} vueltas · promedio ${prom.toFixed(1)} s`]
    }
    case 'interp': {
      const t = v as Texto
      if (!t.texto) return []
      return [t.origen === 'ia' ? `${t.texto}\n\n_(borrador de IA, sin revisar)_` : t.texto]
    }
    case 'nine': {
      const dims = v as Record<string, Texto>
      return TAX.dimensiones_escenario
        .filter((d) => dims[d.id]?.texto)
        .map((d) => `- **${d.n}** — ${dims[d.id].texto}${dims[d.id].origen === 'ia' ? ' _(IA)_' : ''}`)
    }
    case 'empathy':
      return (v as Actor[]).flatMap((a) => [
        `**${a.nombre || 'Actor sin nombre'}**`,
        ...TAX.dimensiones_percepcion
          .filter((d) => a.dims[d.id])
          .map((d) => `- ${d.n}: ${a.dims[d.id]}`),
      ])
    case 'tagged':
      return (v as Fila[])
        .filter((f) => f.texto?.trim())
        .map((f) => {
          const etiquetas = (campo.cols ?? [])
            .map((c) => f.attrs[c.id])
            .filter(Boolean)
            .join(' · ')
          return `- ${f.texto}${etiquetas ? ` — ${etiquetas}` : ''}${f.origen === 'ia' ? ' _(IA)_' : ''}`
        })
    case 'findings':
      return (v as Hallazgo[])
        .filter((h) => h.texto?.trim())
        .map(
          (h) =>
            `- ${h.texto} — ${h.triangulado ? 'triangulado' : 'una sola fuente'}${
              h.fuentes.length ? ` (${h.fuentes.join(', ')})` : ''
            }`,
        )
    case 'scale': {
      const puntos = v as Record<string, Puntuacion>
      return TAX.salud
        .filter((d) => puntos[d.id]?.valor !== null && puntos[d.id]?.valor !== undefined)
        .map((d) => {
          const p = puntos[d.id]
          return `- **${d.n}** ${p.valor}/4 — ${d.a[p.valor!]}${p.evidencia ? `\n  Evidencia: ${p.evidencia}` : ''}`
        })
    }
    case 'supuestos': {
      const s = v as Record<number, Supuesto>
      return TAX.territorio.supuestos
        .map((texto, i) => {
          const marca = s[i]
          if (!marca) return null
          const n = { confirmada: 'lo sostiene', refutada: 'lo contradice', no_observada: 'no se pudo ver' }[
            marca.veredicto
          ]
          return `- ${texto} → **${n}**${marca.evidencia ? ` · ${marca.evidencia}` : ''}`
        })
        .filter(Boolean) as string[]
    }
    case 'openvars':
      return Object.entries(v as Record<string, string>).map(([k, val]) => `- ${k}: ${val}`)
    case 'mapa':
      return []
    default:
      return [String(v)]
  }
}

export function aMarkdown(e: VisitaExport): string {
  const l: string[] = []
  l.push(`# ${e.entidad.nombre}`)
  l.push('')
  l.push(
    [e.entidad.sub_segmento, e.entidad.zona, `visita ${e.visita.tipo}`, e.visita.fecha]
      .filter(Boolean)
      .join(' · '),
  )
  l.push('')
  l.push(`Territorio 1 · ${TAX.territorio.n}`)
  l.push('')

  for (const m of MODULOS) {
    const c = e.capturas[m.id]
    if (!c) continue
    l.push(`## ${m.code} · ${m.nombre}`)
    l.push('')
    const total = m.nn?.length ?? 0
    if (total > 0) {
      const pendientes = total - c.no_negociables.length
      l.push(
        `_No negociables: ${c.no_negociables.length}/${total}${
          pendientes > 0 ? ` · ${pendientes} pendientes` : ''
        }_`,
      )
      if (c.hueco) l.push(`_Hueco declarado: ${c.hueco}_`)
      l.push('')
    }
    for (const campo of m.campos) {
      if (!campo.id || !campo.t) continue
      const lineas = valor(campo, c.datos[campo.id], c.datos)
      if (lineas.length === 0) continue
      l.push(`### ${campo.l ?? campo.id}`)
      l.push('')
      l.push(...lineas)
      l.push('')
    }
    const fotos = e.fotos.filter((f) => f.modulo === m.id)
    if (fotos.length > 0) {
      l.push(`### Fotos`)
      l.push('')
      l.push(...fotos.map((f) => `- ${f.path}`))
      l.push('')
    }
  }

  if (e.hipotesis.length > 0) {
    l.push('## Hipótesis de la entidad')
    l.push('')
    for (const h of e.hipotesis) {
      l.push(`- **${h.texto}** — ${h.veredicto}`)
      if (h.confirma) l.push(`  - la confirma: ${h.confirma}`)
      if (h.tumba) l.push(`  - la tumba: ${h.tumba}`)
    }
    l.push('')
  }

  return l.join('\n')
}
