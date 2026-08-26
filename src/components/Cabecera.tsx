import Link from 'next/link'
import { Recolector } from './Recolector'

export function Cabecera({ sub }: { sub?: React.ReactNode }) {
  return (
    <header
      className="pegajoso top-0 border-b px-4 py-3"
      style={{ background: 'color-mix(in srgb, var(--canvas) 88%, transparent)', borderColor: 'var(--line)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/" className="kicker enlace-suave">Guía de campo T1</Link>
          {sub && <p className="truncate text-[14px] font-semibold">{sub}</p>}
        </div>
        <Recolector />
      </div>
    </header>
  )
}

export function AvisoConfig({ que }: { que: string }) {
  return (
    <div className="tarjeta m-4 p-4" style={{ borderColor: 'var(--orange)' }}>
      <p className="kicker" style={{ color: 'var(--orange)' }}>Falta configurar</p>
      <p className="mt-1 text-[14px]">{que}</p>
    </div>
  )
}

/**
 * El recolector tiene que saber qué está prometiendo cuando explica el
 * consentimiento en M0: hoy el corpus es público para cualquiera con la URL.
 */
export function AvisoAbierto() {
  return (
    <div className="tarjeta p-3" style={{ borderColor: 'var(--orange)' }}>
      <p className="kicker" style={{ color: 'var(--orange)' }}>Corpus abierto</p>
      <p className="mt-1 text-[13px]">
        Esta guía no pide clave: cualquiera con el enlace ve y edita todo lo capturado,
        fotos incluidas. Tenlo presente al acordar en M0 cómo se anonimiza y qué pasa
        con las fotos, y al fotografiar artefactos con datos de terceros.
      </p>
    </div>
  )
}
