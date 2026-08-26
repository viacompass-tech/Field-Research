import { NextResponse, type NextRequest } from 'next/server'
import { clienteServidor } from '@/lib/supabase/servidor'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const vuelve = url.searchParams.get('vuelve') ?? '/'
  if (!code) return NextResponse.redirect(new URL('/login', url.origin))

  const sb = await clienteServidor()
  const { error } = await sb.auth.exchangeCodeForSession(code)
  if (error) {
    const destino = new URL('/login', url.origin)
    destino.searchParams.set('error', error.message)
    return NextResponse.redirect(destino)
  }
  return NextResponse.redirect(new URL(vuelve, url.origin))
}
