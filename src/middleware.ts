import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PUBLICAS = ['/login', '/auth', '/_next', '/favicon.ico', '/manifest.webmanifest']

export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Sin configuración la app arranca igual: sirve para revisar la interfaz.
  if (!url || !anon) return NextResponse.next()

  let respuesta = NextResponse.next({ request: req })
  const sb = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(nuevas) {
        for (const { name, value } of nuevas) req.cookies.set(name, value)
        respuesta = NextResponse.next({ request: req })
        for (const { name, value, options } of nuevas) respuesta.cookies.set(name, value, options)
      },
    },
  })

  const { data } = await sb.auth.getUser()
  const ruta = req.nextUrl.pathname
  const publica = PUBLICAS.some((p) => ruta.startsWith(p))
  if (!data.user && !publica) {
    const destino = req.nextUrl.clone()
    destino.pathname = '/login'
    destino.searchParams.set('vuelve', ruta)
    return NextResponse.redirect(destino)
  }
  return respuesta
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
}
