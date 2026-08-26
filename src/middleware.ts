import { NextResponse, type NextRequest } from 'next/server'

// Acceso abierto: no hay sesión que refrescar ni ruta que proteger. Es una
// decisión deliberada del equipo, tomada el 2026-08-26 para desbloquear a los
// recolectores cuando falló el envío de correos de Supabase.
//
// Lo que implica: cualquiera con la URL lee y escribe el corpus completo,
// incluidas las fotos de artefactos con datos de terceros.
//
// Para volver atrás: `supabase/acceso-por-equipo.sql` y el historial de este
// archivo, que tenía la comprobación de sesión.
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
