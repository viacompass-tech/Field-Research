'use client'

import { useEffect, useState } from 'react'
import { agregarFoto, borrarFoto, fotosPendientes, urlFirmada } from '@/lib/fotos'
import type { CampoDef, FotoRef } from '@/lib/tipos'
import { AvisoDeshacer, BotonBorrar, useDeshacer } from '../Borrar'

export function CampoFotos({
  campo,
  visita,
  modulo,
  iniciales,
}: {
  campo: CampoDef
  visita: string
  modulo: string
  iniciales: FotoRef[]
}) {
  const [fotos, setFotos] = useState<FotoRef[]>(iniciales)
  const [subiendo, setSubiendo] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const { aviso, ejecutar } = useDeshacer()

  useEffect(() => {
    let vivo = true
    void (async () => {
      const firmadas = await Promise.all(
        iniciales.map(async (f) => ({ ...f, url: f.url ?? (await urlFirmada(f.path)) ?? undefined })),
      )
      const enCola = await fotosPendientes(visita, modulo)
      if (vivo) setFotos([...firmadas, ...enCola])
    })()
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visita, modulo])

  const tomar = async (archivos: FileList | null) => {
    if (!archivos?.length) return
    setError(null)
    setSubiendo(archivos.length)
    for (const archivo of Array.from(archivos)) {
      try {
        const nueva = await agregarFoto(visita, modulo, archivo)
        if (!nueva.url && nueva.path) nueva.url = (await urlFirmada(nueva.path)) ?? undefined
        setFotos((antes) => [...antes, nueva])
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setSubiendo((n) => n - 1)
      }
    }
  }

  return (
    <section className="tarjeta p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold">{campo.l}</h3>
        <span className="pastilla">{fotos.length}</span>
      </div>

      <label className="boton boton-primario mt-3 w-full cursor-pointer">
        {subiendo > 0 ? `Subiendo ${subiendo}…` : 'Tomar o elegir fotos'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="sr-only"
          onChange={(e) => { void tomar(e.target.files); e.target.value = '' }}
        />
      </label>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
        Se comprimen a 900 px antes de subir. Sin señal quedan en el celular y suben solas.
      </p>
      {error && (
        <p className="mt-2 text-[13px]" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {fotos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {fotos.map((f) => (
            <li key={f.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={f.url}
                alt=""
                className="aspect-square w-full rounded-xl object-cover"
                style={{ border: '1px solid var(--line)' }}
              />
              {f.pendiente && (
                <span className="pastilla pastilla-naranja absolute left-1 top-1">en cola</span>
              )}
              <div className="mt-1">
                <BotonBorrar
                  que="esta foto"
                  onConfirmar={() => {
                    const previa = fotos
                    ejecutar(
                      'Se quitó una foto',
                      () => setFotos(fotos.filter((x) => x.id !== f.id)),
                      () => setFotos(previa),
                      () => borrarFoto(f),
                    )
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
      <AvisoDeshacer aviso={aviso} />
    </section>
  )
}
