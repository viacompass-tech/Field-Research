'use client'

import { clienteNavegador } from './supabase/cliente'
import type { FotoRef } from './tipos'

// 900px y JPEG 55%: una foto de cuaderno de fiado sigue siendo legible y pesa
// lo que una conexión de mercado puede subir.
const LADO_MAX = 900
const CALIDAD = 0.55

export async function comprimir(archivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(archivo)
  const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * escala)
  const h = Math.round(bitmap.height * escala)
  const lienzo = document.createElement('canvas')
  lienzo.width = w
  lienzo.height = h
  const ctx = lienzo.getContext('2d')
  if (!ctx) throw new Error('El navegador no permite procesar la imagen')
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()
  const blob = await new Promise<Blob | null>((res) => lienzo.toBlob(res, 'image/jpeg', CALIDAD))
  if (!blob) throw new Error('No se pudo comprimir la foto')
  return blob
}

// ── cola local de fotos (modo avión) ──────────────────────────────────────

const BD = 'cix-campo'
const TIENDA = 'fotos'

function abrir(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const pedido = indexedDB.open(BD, 1)
    pedido.onupgradeneeded = () => {
      const db = pedido.result
      if (!db.objectStoreNames.contains(TIENDA)) db.createObjectStore(TIENDA, { keyPath: 'k' })
    }
    pedido.onsuccess = () => res(pedido.result)
    pedido.onerror = () => rej(pedido.error)
  })
}

type FotoEnCola = { k: string; visita: string; modulo: string; blob: Blob; creado: number }

async function conTienda<T>(modo: IDBTransactionMode, fn: (t: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await abrir()
  return new Promise<T>((res, rej) => {
    const tx = db.transaction(TIENDA, modo)
    const pedido = fn(tx.objectStore(TIENDA))
    pedido.onsuccess = () => res(pedido.result as T)
    pedido.onerror = () => rej(pedido.error)
  })
}

async function encolar(f: FotoEnCola) {
  await conTienda('readwrite', (t) => t.put(f))
}

async function pendientes(): Promise<FotoEnCola[]> {
  return conTienda<FotoEnCola[]>('readonly', (t) => t.getAll())
}

async function quitarDeCola(k: string) {
  await conTienda('readwrite', (t) => t.delete(k))
}

async function subir(visita: string, modulo: string, blob: Blob, k: string): Promise<FotoRef> {
  const sb = clienteNavegador()
  const path = `${visita}/${modulo}/${k}.jpg`
  const { error } = await sb.storage.from('fotos').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw new Error(error.message)
  const { data, error: errorFila } = await sb
    .from('fotos')
    .insert({ visita_id: visita, modulo, path, bytes: blob.size })
    .select('id, path')
    .single()
  if (errorFila) throw new Error(errorFila.message)
  return { id: data.id as string, path: data.path as string }
}

/** Comprime y sube; si no hay señal, guarda en el dispositivo. */
export async function agregarFoto(
  visita: string,
  modulo: string,
  archivo: File,
): Promise<FotoRef> {
  const blob = await comprimir(archivo)
  const k = crypto.randomUUID()
  try {
    if (!navigator.onLine) throw new Error('sin señal')
    return await subir(visita, modulo, blob, k)
  } catch {
    await encolar({ k, visita, modulo, blob, creado: Date.now() })
    return { id: k, path: '', url: URL.createObjectURL(blob), pendiente: true }
  }
}

export async function vaciarColaFotos(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0
  let subidas = 0
  for (const f of await pendientes()) {
    try {
      await subir(f.visita, f.modulo, f.blob, f.k)
      await quitarDeCola(f.k)
      subidas++
    } catch {
      break
    }
  }
  return subidas
}

export async function fotosPendientes(visita: string, modulo: string): Promise<FotoRef[]> {
  if (typeof indexedDB === 'undefined') return []
  const todas = await pendientes()
  return todas
    .filter((f) => f.visita === visita && f.modulo === modulo)
    .map((f) => ({ id: f.k, path: '', url: URL.createObjectURL(f.blob), pendiente: true }))
}

export async function borrarFoto(foto: FotoRef): Promise<void> {
  if (foto.pendiente) {
    await quitarDeCola(foto.id)
    return
  }
  const sb = clienteNavegador()
  await sb.storage.from('fotos').remove([foto.path])
  await sb.from('fotos').delete().eq('id', foto.id)
}

export async function urlFirmada(path: string): Promise<string | null> {
  const sb = clienteNavegador()
  const { data } = await sb.storage.from('fotos').createSignedUrl(path, 60 * 60)
  return data?.signedUrl ?? null
}
