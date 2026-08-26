import Anthropic from '@anthropic-ai/sdk'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'
import { NextResponse } from 'next/server'
import * as z from 'zod/v4'
import { modulo as definicion, TAX } from '@/lib/datos'
import type { CampoDef, Datos, ModuloDef } from '@/lib/tipos'
import { clienteServidor, sesion } from '@/lib/supabase/servidor'

// La estructura la propone la IA, después. Lee la captura y las fotos de un
// módulo y devuelve JSON validado. Nada se guarda desde acá: vuelve al cliente,
// que solo llena vacíos y lo deja marcado como borrador.

export const maxDuration = 120

const MODELO = process.env.ANTHROPIC_MODEL ?? 'claude-opus-5'
const MAX_FOTOS = 6

const Pedido = z.object({ visita: z.string().uuid(), modulo: z.string() })

const clave = () => crypto.randomUUID().slice(0, 8)

/** El esquema de salida sale del módulo: un campo nuevo en el JSON viaja solo. */
function esquemaDe(def: ModuloDef) {
  const forma: Record<string, z.ZodType> = {}
  for (const campo of def.campos) {
    if (!campo.id || !campo.ai) continue
    switch (campo.t) {
      case 'nine':
        forma[campo.id] = z.object(
          Object.fromEntries(
            TAX.dimensiones_escenario.map((d) => [d.id, z.string().describe(d.n)]),
          ),
        )
        break
      case 'interp':
        forma[campo.id] = z.string()
        break
      case 'empathy':
        forma[campo.id] = z.array(
          z.object({
            nombre: z.string(),
            dims: z.object(
              Object.fromEntries(
                TAX.dimensiones_percepcion.map((d) => [d.id, z.string().describe(d.n)]),
              ),
            ),
          }),
        )
        break
      case 'tagged':
        forma[campo.id] = z.array(
          z.object({
            texto: z.string(),
            attrs: z.object(
              Object.fromEntries(
                (campo.cols ?? []).map((c) => [
                  c.id,
                  z.enum(c.opts as [string, ...string[]]).describe(c.l),
                ]),
              ),
            ),
          }),
        )
        break
      case 'findings':
        forma[campo.id] = z.array(z.object({ texto: z.string(), fuentes: z.array(z.string()) }))
        break
      case 'scale':
        forma[campo.id] = z.object(
          Object.fromEntries(
            TAX.salud.map((d) => [
              d.id,
              z.object({
                valor: z.number().int().min(0).max(4).nullable(),
                evidencia: z.string(),
              }),
            ]),
          ),
        )
        break
      default:
        break
    }
  }
  return z.object(forma)
}

/** Del JSON del modelo a la forma que guarda la captura, todo marcado como IA. */
function aDatos(def: ModuloDef, crudo: Record<string, unknown>): Datos {
  const salida: Datos = {}
  for (const campo of def.campos) {
    if (!campo.id || !campo.ai) continue
    const v = crudo[campo.id]
    if (v === undefined || v === null) continue
    switch (campo.t) {
      case 'nine': {
        const dims = v as Record<string, string>
        salida[campo.id] = Object.fromEntries(
          Object.entries(dims)
            .filter(([, texto]) => texto?.trim())
            .map(([id, texto]) => [id, { texto, origen: 'ia' }]),
        )
        break
      }
      case 'interp':
        if (String(v).trim()) salida[campo.id] = { texto: String(v), origen: 'ia' }
        break
      case 'empathy':
        salida[campo.id] = (v as { nombre: string; dims: Record<string, string> }[])
          .filter((a) => a.nombre?.trim())
          .map((a) => ({ k: clave(), nombre: a.nombre, dims: a.dims ?? {}, origen: 'ia' }))
        break
      case 'tagged':
        salida[campo.id] = (v as { texto: string; attrs: Record<string, string> }[])
          .filter((f) => f.texto?.trim())
          .map((f) => ({ k: clave(), texto: f.texto, attrs: f.attrs ?? {}, origen: 'ia' }))
        break
      case 'findings':
        salida[campo.id] = (v as { texto: string; fuentes: string[] }[])
          .filter((h) => h.texto?.trim())
          .map((h) => ({
            k: clave(),
            texto: h.texto,
            fuentes: h.fuentes ?? [],
            triangulado: (h.fuentes ?? []).length >= 2,
            origen: 'ia',
          }))
        break
      case 'scale': {
        const puntos = v as Record<string, { valor: number | null; evidencia: string }>
        salida[campo.id] = Object.fromEntries(
          Object.entries(puntos)
            .filter(([, p]) => p && p.valor !== null)
            .map(([id, p]) => [id, { valor: p.valor, evidencia: p.evidencia ?? '', origen: 'ia' }]),
        )
        break
      }
      default:
        break
    }
  }
  return salida
}

function loEscrito(def: ModuloDef, datos: Datos): string {
  const partes: string[] = []
  for (const campo of def.campos) {
    if (!campo.id || !campo.t) continue
    if (['cap', 'textarea', 'text', 'select', 'checks', 'repeat', 'tally'].includes(campo.t)) {
      const v = datos[campo.id]
      if (v === undefined || v === null || v === '') continue
      const texto = Array.isArray(v) ? v.join(' · ') : String(v)
      if (!texto.trim()) continue
      partes.push(`${campo.l ?? campo.id}: ${texto}`)
    }
  }
  return partes.join('\n\n')
}

function instruccion(def: ModuloDef, campos: CampoDef[]): string {
  const l: string[] = []
  l.push(
    'Eres parte de un equipo de etnografía de campo del CIX Foresight Lab, en Lima.',
    `Territorio 1: ${TAX.territorio.n}. ${TAX.territorio.pregunta}`,
    `Frontera del territorio: ${TAX.territorio.frontera}`,
    '',
    `Módulo: ${def.code} · ${def.nombre}. ${def.obj ?? ''}`,
  )
  if (def.mira?.length) l.push('', 'Lo que el recolector fue a mirar:', ...def.mira.map((m) => `- ${m}`))
  if (def.guard?.length) l.push('', 'Advertencias del instrumento:', ...def.guard.map((g) => `- ${g}`))
  l.push(
    '',
    'Tu trabajo es ordenar lo que el recolector escribió y fotografió. Reglas:',
    '- No inventes nada. Si algo no se observó, deja el texto vacío o el valor en null.',
    '- No conviertas observación en interpretación: la interpretación va solo en su campo.',
    '- Escribe en español peruano, directo, sin adornos y sin nombres propios de personas.',
    '- Usa las palabras del propio sujeto cuando las haya.',
    '- Una puntuación sin evidencia citada de la captura no se pone: se deja en null.',
  )
  if (campos.some((c) => c.t === 'scale')) {
    l.push('', 'Anclajes de las nueve dimensiones del estado del negocio (0 a 4):')
    for (const d of TAX.salud) {
      l.push(`- ${d.id} · ${d.n}: ${d.a.map((a, i) => `${i}=${a}`).join(' | ')}`)
    }
  }
  return l.join('\n')
}

export async function POST(req: Request) {
  const usuario = await sesion()
  if (!usuario) return NextResponse.json({ error: 'Sin sesión' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'Falta ANTHROPIC_API_KEY en el servidor. La estructura se puede llenar a mano.' },
      { status: 503 },
    )
  }

  const cuerpo = Pedido.safeParse(await req.json())
  if (!cuerpo.success) {
    return NextResponse.json({ error: cuerpo.error.issues[0].message }, { status: 400 })
  }
  const { visita, modulo } = cuerpo.data
  const def = definicion(modulo)
  if (!def) return NextResponse.json({ error: `No existe el módulo ${modulo}` }, { status: 400 })

  const camposIA = def.campos.filter((c) => c.id && c.ai)
  if (camposIA.length === 0) {
    return NextResponse.json({ error: 'Este módulo no tiene campos que estructurar' }, { status: 400 })
  }

  const sb = await clienteServidor()
  const { data: captura } = await sb
    .from('capturas')
    .select('datos')
    .eq('visita_id', visita)
    .eq('modulo', modulo)
    .maybeSingle()

  const datos = (captura?.datos ?? {}) as Datos
  const escrito = loEscrito(def, datos)

  const { data: fotos } = await sb
    .from('fotos')
    .select('path')
    .eq('visita_id', visita)
    .eq('modulo', modulo)
    .limit(MAX_FOTOS)

  const imagenes: Anthropic.ImageBlockParam[] = []
  for (const f of fotos ?? []) {
    const { data: blob } = await sb.storage.from('fotos').download(f.path as string)
    if (!blob) continue
    const b64 = Buffer.from(await blob.arrayBuffer()).toString('base64')
    imagenes.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: b64 },
    })
  }

  if (!escrito.trim() && imagenes.length === 0) {
    return NextResponse.json(
      { error: 'No hay nada que leer todavía: escribe la captura o sube fotos.' },
      { status: 400 },
    )
  }

  const Esquema = esquemaDe(def)
  const cliente = new Anthropic()

  try {
    const respuesta = await cliente.messages.parse({
      model: MODELO,
      max_tokens: 16000,
      system: instruccion(def, camposIA),
      messages: [
        {
          role: 'user',
          content: [
            ...imagenes,
            {
              type: 'text',
              text: escrito.trim()
                ? `Esto es lo que se capturó en el módulo:\n\n${escrito}`
                : 'No hay texto todavía: estructura solo lo que se vea en las fotos.',
            },
          ],
        },
      ],
      output_config: { format: zodOutputFormat(Esquema) },
    })

    if (respuesta.stop_reason === 'refusal') {
      return NextResponse.json(
        { error: `El modelo se detuvo: ${respuesta.stop_details?.explanation ?? 'refusal'}` },
        { status: 502 },
      )
    }
    if (!respuesta.parsed_output) {
      return NextResponse.json(
        { error: 'El modelo respondió algo que no encaja con el esquema del módulo.' },
        { status: 502 },
      )
    }

    const campos = aDatos(def, respuesta.parsed_output as Record<string, unknown>)
    await sb
      .from('capturas')
      .update({ estructurado_at: new Date().toISOString() })
      .eq('visita_id', visita)
      .eq('modulo', modulo)

    return NextResponse.json({ campos })
  } catch (e) {
    // El error real, no "algo salió mal".
    const mensaje = e instanceof Anthropic.APIError ? `${e.status} · ${e.message}` : (e as Error).message
    return NextResponse.json({ error: mensaje }, { status: 502 })
  }
}
