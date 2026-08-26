'use client'

import type { CampoDef } from '@/lib/tipos'

export function Marco({
  campo,
  extra,
  children,
}: {
  campo: CampoDef
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="tarjeta p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-tight">
            {campo.l}
            {campo.req && (
              <span title="No debería quedar vacío" style={{ color: 'var(--orange)' }}> ·</span>
            )}
          </h3>
          {campo.help && (
            <p className="mt-1 text-[13px]" style={{ color: 'var(--ink-soft)' }}>
              {campo.help}
            </p>
          )}
        </div>
        {extra}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

export function PastillaIA({ visible }: { visible: boolean }) {
  if (!visible) return null
  return <span className="pastilla pastilla-ia">borrador de IA</span>
}
