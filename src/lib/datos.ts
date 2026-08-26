import modulosJson from '@/data/modulos-campo.json'
import taxJson from '@/data/taxonomias.json'
import type { CampoDef, Datos, ModuloDef } from './tipos'

export const MODULOS = modulosJson as unknown as ModuloDef[]
export const TAX = taxJson as {
  territorio: {
    n: string
    pregunta: string
    frontera: string
    riesgo: string
    sub: string[]
    supuestos: string[]
  }
  capas: string[]
  flujos: string[]
  dimensiones_escenario: { id: string; n: string }[]
  dimensiones_percepcion: { id: string; n: string }[]
  salud: { id: string; n: string; a: string[] }[]
}

export function modulo(id: string): ModuloDef | undefined {
  return MODULOS.find((m) => m.id === id)
}

export function indiceModulo(id: string): number {
  return MODULOS.findIndex((m) => m.id === id)
}

// ── bandas ────────────────────────────────────────────────────────────────
// El orden es el del plan: no negociables · qué mirar · contar · fotografiar ·
// escribir · estructura. La banda sale del tipo de campo, no de una lista por
// módulo: así un campo nuevo en el JSON cae solo donde le toca.

export const BANDAS = ['mirar', 'contar', 'fotografiar', 'escribir', 'estructura'] as const
export type Banda = (typeof BANDAS)[number]

export const NOMBRE_BANDA: Record<Banda, string> = {
  mirar: 'Qué mirar',
  contar: 'Contar',
  fotografiar: 'Fotografiar',
  escribir: 'Escribir',
  estructura: 'Estructura',
}

const BANDA_POR_TIPO: Record<string, Banda> = {
  tally: 'contar',
  chrono: 'contar',
  fotos: 'fotografiar',
  checks: 'mirar',
  cap: 'escribir',
  textarea: 'escribir',
  text: 'escribir',
  select: 'escribir',
  repeat: 'escribir',
  aiblock: 'estructura',
  nine: 'estructura',
  empathy: 'estructura',
  tagged: 'estructura',
  findings: 'estructura',
  scale: 'estructura',
  interp: 'estructura',
  mapa: 'estructura',
  supuestos: 'estructura',
  openvars: 'estructura',
}

export function bandaDe(c: CampoDef): Banda {
  // `band: "ficha"` en el JSON son datos de contexto que acompañan al baseline.
  if (c.band === 'ficha' || c.base) return 'contar'
  if (c.t === 'checks' && c.id?.startsWith('fotos')) return 'fotografiar'
  return BANDA_POR_TIPO[c.t ?? ''] ?? 'escribir'
}

/** Campos que solo existen después de estructurar (regla 3). */
export const TIPOS_ESTRUCTURA = new Set([
  'nine', 'empathy', 'tagged', 'findings', 'scale', 'interp', 'mapa',
])

export type CampoEnBanda = CampoDef & { sub?: string }

/**
 * Reagrupa los campos del módulo en bandas conservando el orden interno y las
 * etiquetas `sec` del JSON como subtítulos, cuando siguen aplicando.
 */
export function bandas(m: ModuloDef): { banda: Banda; campos: CampoEnBanda[] }[] {
  const acc = new Map<Banda, CampoEnBanda[]>()
  // Una etiqueta `sec` pertenece a la banda del primer campo que la sigue. Al
  // reagrupar, los campos que caen en otra banda la pierden: «Captura visual»
  // encima del botón de la IA no dice nada.
  const casa = new Map<string, Banda>()
  let sec: string | undefined
  for (const c of m.campos) {
    if (c.sec) { sec = c.sec; continue }
    if (!c.t) continue
    const b = bandaDe(c)
    if (sec && !casa.has(sec)) casa.set(sec, b)
    const lista = acc.get(b) ?? []
    lista.push({ ...c, sub: sec && casa.get(sec) === b ? sec : undefined })
    acc.set(b, lista)
  }
  // El botón de la IA va al inicio de estructura: pegado al final de la captura,
  // nunca arriba de todo.
  const estructura = acc.get('estructura')
  if (estructura) {
    estructura.sort((a, b) => Number(b.t === 'aiblock') - Number(a.t === 'aiblock'))
  }
  return BANDAS.filter((b) => acc.has(b)).map((b) => ({ banda: b, campos: acc.get(b)! }))
}

// ── progreso ──────────────────────────────────────────────────────────────

export function vacio(v: unknown): boolean {
  if (v === null || v === undefined) return true
  if (typeof v === 'string') return v.trim() === ''
  if (typeof v === 'number') return false
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>
    if ('texto' in o) return vacio(o.texto)
    if ('vueltas' in o) return vacio(o.vueltas)
    return Object.values(o).every(vacio)
  }
  return false
}

export type Progreso = {
  llenos: number
  total: number
  pct: number
  nnPendientes: number
  reqPendientes: string[]
}

export function progreso(m: ModuloDef, datos: Datos, nn: number[]): Progreso {
  const campos = m.campos.filter((c) => c.id && c.t && c.t !== 'aiblock' && c.t !== 'openvars')
  const llenos = campos.filter((c) => !vacio(datos[c.id!])).length
  const reqPendientes = campos
    .filter((c) => c.req && vacio(datos[c.id!]))
    .map((c) => c.l ?? c.id!)
  const total = campos.length || 1
  return {
    llenos,
    total,
    pct: Math.round((llenos / total) * 100),
    nnPendientes: (m.nn?.length ?? 0) - nn.length,
    reqPendientes,
  }
}
