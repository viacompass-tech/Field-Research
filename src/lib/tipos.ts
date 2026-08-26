// Formas de los datos del instrumento. `modulos-campo.json` es la fuente:
// estos tipos solo lo describen, no lo reemplazan.

export type TipoCampo =
  | 'text' | 'textarea' | 'select' | 'checks' | 'repeat' | 'cap' | 'fotos'
  | 'tally' | 'chrono' | 'nine' | 'empathy' | 'tagged' | 'findings'
  | 'scale' | 'interp' | 'aiblock' | 'mapa' | 'supuestos' | 'openvars'

export type ColumnaDef = { id: string; l: string; opts: string[] }

export type CampoDef = {
  id?: string
  t?: TipoCampo
  l?: string
  sec?: string
  req?: boolean
  ph?: string
  help?: string
  opts?: string[]
  cols?: ColumnaDef[]
  meta?: string
  cat?: boolean
  base?: boolean
  of?: string
  timer?: number
  band?: string
  ai?: boolean
  tkey?: string
  min?: number
  pfx?: string
  mode?: string
}

export type ModuloDef = {
  code: string
  id: string
  nombre: string
  dur?: string
  obj?: string
  ai?: string
  opcional?: boolean
  brief?: boolean
  nn?: string[]
  mira?: string[]
  guard?: string[]
  campos: CampoDef[]
}

export type Origen = 'persona' | 'ia'

/** Todo lo que la IA propone entra marcado. Editarlo lo vuelve de la persona. */
export type Texto = { texto: string; origen: Origen }

export type Fila = { k: string; texto: string; attrs: Record<string, string>; origen: Origen }
export type Hallazgo = {
  k: string
  texto: string
  fuentes: string[]
  triangulado: boolean
  origen: Origen
}
export type Actor = { k: string; nombre: string; dims: Record<string, string>; origen: Origen }
export type Puntuacion = { valor: number | null; evidencia: string; origen: Origen }
export type Cronometro = { vueltas: number[] }
export type Supuesto = { veredicto: 'no_observada' | 'confirmada' | 'refutada'; evidencia: string }

export type Datos = Record<string, unknown>

export type Captura = {
  id?: string
  visita_id: string
  modulo: string
  datos: Datos
  no_negociables: number[]
  hueco: string | null
  estado: 'vacia' | 'en_curso' | 'cubierta' | 'cubierta_con_pendientes'
  estructurado_at: string | null
}

export type FotoRef = {
  id: string
  path: string
  url?: string
  pie?: string | null
  pendiente?: boolean
}

export type Entidad = {
  id: string
  nombre: string
  sub_segmento: string | null
  zona: string | null
  estado: string | null
  created_at: string
}

export type Visita = {
  id: string
  entidad_id: string
  tipo: string
  fecha: string
  cerrada_at: string | null
  created_at: string
}
