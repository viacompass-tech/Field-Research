'use client'

import { leerRecolector } from '@/components/Recolector'
import type { Datos } from './tipos'

// El almacén de una captura. Existe para una sola cosa: que escribir en un
// campo no repinte el módulo (regla 2). Los campos leen su valor inicial una
// vez, escriben acá, y solo el indicador de guardado se suscribe a los cambios.

export type EstadoGuardado =
  | 'limpio' | 'escribiendo' | 'guardando' | 'guardado' | 'pendiente' | 'error' | 'revision'

export type Instantanea = {
  estado: EstadoGuardado
  error: string | null
  ultimo: number | null
  enCola: number
}

const RETARDO = 900
const PREFIJO = 'cix.cola.'

function claveCola(visita: string, modulo: string) {
  return `${PREFIJO}${visita}.${modulo}`
}

function enCola(): number {
  if (typeof localStorage === 'undefined') return 0
  let n = 0
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i)?.startsWith(PREFIJO)) n++
  }
  return n
}

export type Carga = {
  visita: string
  modulo: string
  datos: Datos
  no_negociables: number[]
  hueco: string | null
  /** Quién está capturando, según el dispositivo. Sin sesión no hay otra firma. */
  recolector: string | null
}

async function enviar(carga: Carga): Promise<void> {
  const r = await fetch('/api/captura', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(carga),
  })
  if (!r.ok) {
    const cuerpo = await r.text()
    throw new Error(cuerpo || `HTTP ${r.status}`)
  }
}

/** Sube lo que quedó en el dispositivo cuando no había señal. */
export async function vaciarCola(): Promise<number> {
  if (typeof localStorage === 'undefined') return 0
  const claves: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIJO)) claves.push(k)
  }
  let subidas = 0
  for (const k of claves) {
    const crudo = localStorage.getItem(k)
    if (!crudo) continue
    try {
      await enviar(JSON.parse(crudo) as Carga)
      localStorage.removeItem(k)
      subidas++
    } catch {
      break // sigue sin señal: se intenta después
    }
  }
  return subidas
}

export class Almacen {
  readonly visita: string
  readonly modulo: string
  /** Sin Supabase configurado nada sube: la pantalla sirve para revisar, no para capturar. */
  readonly revision: boolean
  datos: Datos
  nn: number[]
  hueco: string | null

  private oyentes = new Set<() => void>()
  private instantanea: Instantanea = { estado: 'limpio', error: null, ultimo: null, enCola: 0 }
  private temporizador: ReturnType<typeof setTimeout> | null = null
  private volando = false
  private sucio = false

  constructor(
    visita: string,
    modulo: string,
    datos: Datos,
    nn: number[],
    hueco: string | null,
    revision = false,
  ) {
    this.visita = visita
    this.modulo = modulo
    this.revision = revision
    if (revision) this.instantanea = { ...this.instantanea, estado: 'revision' }
    this.datos = { ...datos }
    this.nn = [...nn]
    this.hueco = hueco
  }

  // ── lectura por campo ────────────────────────────────────────────────
  get<T>(id: string, porDefecto: T): T {
    const v = this.datos[id]
    return (v === undefined || v === null ? porDefecto : v) as T
  }

  set(id: string, valor: unknown) {
    this.datos[id] = valor
    this.marcar()
  }

  setNN(lista: number[]) {
    this.nn = lista
    this.marcar()
  }

  setHueco(texto: string | null) {
    this.hueco = texto
    this.marcar()
  }

  /** Lo que devuelve la IA no pisa lo que ya escribió una persona. */
  fusionar(propuesta: Datos, puedePisar: (id: string) => boolean) {
    for (const [id, valor] of Object.entries(propuesta)) {
      if (!puedePisar(id)) continue
      this.datos[id] = valor
    }
    this.marcar()
    this.volcar()
  }

  private marcar() {
    if (this.revision) return
    this.sucio = true
    this.publicar({ estado: 'escribiendo', error: null })
    if (this.temporizador) clearTimeout(this.temporizador)
    this.temporizador = setTimeout(() => void this.volcar(), RETARDO)
  }

  async volcar(): Promise<void> {
    if (this.revision) return
    if (this.temporizador) { clearTimeout(this.temporizador); this.temporizador = null }
    if (!this.sucio || this.volando) return
    this.volando = true
    this.sucio = false
    const carga: Carga = {
      visita: this.visita,
      modulo: this.modulo,
      datos: this.datos,
      no_negociables: this.nn,
      hueco: this.hueco,
      recolector: leerRecolector(),
    }
    this.publicar({ estado: 'guardando', error: null })
    try {
      await enviar(carga)
      localStorage.removeItem(claveCola(this.visita, this.modulo))
      this.publicar({ estado: 'guardado', error: null, ultimo: Date.now(), enCola: enCola() })
    } catch (e) {
      // Sin señal: queda en el dispositivo y sube cuando vuelve la red.
      try {
        localStorage.setItem(claveCola(this.visita, this.modulo), JSON.stringify(carga))
        this.publicar({
          estado: navigator.onLine ? 'error' : 'pendiente',
          error: navigator.onLine ? (e as Error).message : null,
          enCola: enCola(),
        })
      } catch (guardado) {
        this.publicar({ estado: 'error', error: (guardado as Error).message })
      }
    } finally {
      this.volando = false
      if (this.sucio) void this.volcar()
    }
  }

  // ── suscripción (solo para el indicador) ─────────────────────────────
  suscribir = (fn: () => void) => {
    this.oyentes.add(fn)
    return () => { this.oyentes.delete(fn) }
  }

  leer = (): Instantanea => this.instantanea

  private publicar(parche: Partial<Instantanea>) {
    this.instantanea = { ...this.instantanea, ...parche }
    for (const fn of this.oyentes) fn()
  }
}
