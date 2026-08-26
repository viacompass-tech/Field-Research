import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Guía de campo T1 · CIX Foresight',
  description: 'Instrumento de etnografía para micronegocios del comercio informal peruano.',
}

export const viewport: Viewport = {
  themeColor: '#0B1990',
  width: 'device-width',
  initialScale: 1,
  // Se usa parado en la calle: que el sistema no reescale al enfocar.
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
