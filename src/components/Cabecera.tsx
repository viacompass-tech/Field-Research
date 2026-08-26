import Link from 'next/link'
import { salir } from '@/app/acciones'

export function Cabecera({ nombre, sub }: { nombre?: string | null; sub?: React.ReactNode }) {
  return (
    <header
      className="pegajoso top-0 border-b px-4 py-3"
      style={{ background: 'color-mix(in srgb, var(--canvas) 88%, transparent)', borderColor: 'var(--line)' }}
    >
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href="/" className="kicker enlace-suave">Guía de campo T1</Link>
          <p className="truncate text-[14px] font-semibold">{sub ?? nombre ?? 'Sin sesión'}</p>
        </div>
        {nombre && (
          <form action={salir}>
            <button className="boton boton-fantasma text-[13px]">Salir · {nombre}</button>
          </form>
        )}
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
