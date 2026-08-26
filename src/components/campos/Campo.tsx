'use client'

import type { Almacen } from '@/lib/almacen'
import type { CampoDef, FotoRef } from '@/lib/tipos'
import {
  CampoArea, CampoCaptura, CampoChecks, CampoInterpretacion, CampoRepetible,
  CampoSeleccion, CampoTexto,
} from './Basicos'
import { CampoContador, CampoCronometro } from './Contadores'
import { CampoFotos } from './Fotos'
import {
  CampoEmpatia, CampoEscala, CampoEtiquetado, CampoHallazgos, CampoMapa, CampoNueve,
  CampoSupuestos, CampoVariables,
} from './Estructura'

export type Variable = { clave: string; etiqueta: string; tipo: string; opciones: string[] }

/**
 * El renderizador: lee un campo de modulos-campo.json y lo pinta. No hay lógica
 * por módulo en ninguna parte — un campo nuevo en el JSON aparece solo.
 */
export function Campo({
  campo,
  almacen,
  visita,
  modulo,
  fotos,
  variables,
}: {
  campo: CampoDef
  almacen: Almacen
  visita: string
  modulo: string
  fotos: FotoRef[]
  variables: Variable[]
}) {
  switch (campo.t) {
    case 'text':
      return <CampoTexto campo={campo} almacen={almacen} />
    case 'textarea':
      return <CampoArea campo={campo} almacen={almacen} />
    case 'select':
      return <CampoSeleccion campo={campo} almacen={almacen} />
    case 'checks':
      return <CampoChecks campo={campo} almacen={almacen} />
    case 'repeat':
      return <CampoRepetible campo={campo} almacen={almacen} />
    case 'cap':
      return <CampoCaptura campo={campo} almacen={almacen} />
    case 'tally':
      return <CampoContador campo={campo} almacen={almacen} />
    case 'chrono':
      return <CampoCronometro campo={campo} almacen={almacen} />
    case 'fotos':
      return <CampoFotos campo={campo} visita={visita} modulo={modulo} iniciales={fotos} />
    case 'nine':
      return <CampoNueve campo={campo} almacen={almacen} />
    case 'empathy':
      return <CampoEmpatia campo={campo} almacen={almacen} />
    case 'tagged':
      return <CampoEtiquetado campo={campo} almacen={almacen} />
    case 'findings':
      return <CampoHallazgos campo={campo} almacen={almacen} />
    case 'scale':
      return <CampoEscala campo={campo} almacen={almacen} />
    case 'interp':
      return <CampoInterpretacion campo={campo} almacen={almacen} />
    case 'supuestos':
      return <CampoSupuestos campo={campo} almacen={almacen} />
    case 'openvars':
      return <CampoVariables campo={campo} almacen={almacen} variables={variables} />
    case 'mapa':
      return <CampoMapa campo={campo} almacen={almacen} />
    default:
      return null
  }
}
