# CIX Foresight · Guía de campo T1

Instrucciones de trabajo para Claude Code. Léelas antes de tocar código.

## Qué es

Instrumento de etnografía de campo para el CIX Foresight Lab (BCP). Territorio T1:
el sistema operativo del comercio informal. Se usa de pie en la calle, en un celular,
por recolectores del lab y por agencias externas contratadas.

## Alcance de esta fase

Solo **Campo**. Crear entidades, abrir visitas, recorrer los once módulos, capturar.
Nada más.

No construyas todavía: Validación, Experimentación, Análisis, cruce con desk research,
detección de variables, mapas de sistema agregados. El modelo de datos ya los contempla
para que no haya que migrar después, pero la interfaz no los expone.

## Stack

- Next.js (App Router) + TypeScript
- Supabase: Postgres, Auth, Storage para las fotos
- Tailwind con los tokens de `src/styles/tokens.css`
- Vercel

Las llamadas a la IA van por route handler del servidor. La clave nunca en el cliente.
En esta fase basta un endpoint: `POST /api/estructurar`.

## Reglas de producto que no se negocian

Salieron de iterar el prototipo contra uso real. Romperlas es regresión.

1. **Guía, no formulario.** Ningún campo bloquea a otro. Ningún módulo bloquea a otro.
   El orden se sostiene por argumento escrito, no por candados.
2. **El scroll no salta.** Cualquier interacción dentro de un módulo conserva posición de
   scroll, foco y posición del cursor. Fue el peor bug del prototipo. En React esto obliga
   a estado local por campo: si el valor sube al padre en cada tecla, el problema vuelve
   idéntico.
3. **La estructura la propone la IA, después.** El recolector escribe libre y sube fotos.
   Los campos estructurados —dimensiones, mapa de actores, procesos, herramientas, flujos,
   puntuaciones— no se muestran hasta que se pulsa *estructurar* o se pide llenarlos a
   mano. La IA nunca sobrescribe lo que ya escribió una persona: solo llena vacíos.
4. **No se piden cifras calculadas.** Nada de porcentajes. Se cuenta tocando un contador y
   el porcentaje se deriva. Los tiempos se miden con cronómetro, no se estiman.
5. **Nada destructivo a un toque.** Borrar exige confirmación explícita que diga qué se
   pierde, y deja deshacer durante nueve segundos.
6. **Entorno y negocio son cosas distintas.** M1 es la cuadra, M2 es la unidad vista desde
   afuera, M3 es la unidad operando. Mezclarlos es el error clásico de la etnografía
   comercial.
7. **Observación e interpretación se registran por separado**, y toda interpretación
   generada por IA queda marcada como borrador editable.

## Contenido curado

`src/data/modulos-campo.json` y `src/data/taxonomias.json` son el corazón del instrumento:
once módulos, 87 campos, 45 no negociables, 45 ítems de barrido, nueve dimensiones de
estado del negocio con anclajes conductuales, 22 sub-segmentos y los seis supuestos del
territorio.

Son datos, no código. Renderízalos genéricamente. Si hay que cambiar un texto, se cambia
en el JSON.

## Cómo trabajar

Un paso del plan por vez (`docs/04-plan-de-build.md`), verificable en un celular real antes
de seguir. Preferimos poco terminado y probado en campo a mucho a medias.
