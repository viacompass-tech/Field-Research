# Plan de build · fase Campo

Ocho pasos. Cada uno se verifica en un celular real antes de pasar al siguiente.

## Paso 1 · Esqueleto y acceso

Next.js con App Router, Tailwind con los tokens, Supabase conectado, login por correo.
Rutas: `/` (entidades), `/e/[entidad]` (visitas), `/v/[visita]` (índice de módulos),
`/v/[visita]/[modulo]`.

**Verificable:** entras con tu correo y ves una pantalla vacía con tu nombre.

## Paso 2 · Entidades y visitas

Crear entidad (nombre, sub-segmento de la lista de 22, zona). Listar entidades como
tarjetas con número de visitas y progreso. Abrir la última visita o crear una nueva.

**Verificable:** creas NatuSeeds desde el celular y abres su primera visita.

## Paso 3 · Renderizador de módulos

Lo más importante de la fase. Un componente que lee `modulos-campo.json` y pinta
cualquier módulo sin lógica específica por módulo.

Tipos de campo: `text`, `textarea`, `select`, `checks`, `repeat`, `cap`, `fotos`,
`tally`, `chrono`, `nine`, `empathy`, `tagged`, `findings`, `scale`, `interp`, `aiblock`.

Se agrupan en bandas por tipo, en este orden: no negociables · qué mirar · contar ·
fotografiar · escribir · estructura.

**Verificable:** los once módulos se pintan y guardan, sin código particular para ninguno.

## Paso 4 · Guardado sin fricción

Estado local por campo con guardado diferido a Supabase. Indicador de guardado en la
barra superior.

Aquí se juega la regla 2: escribir en un textarea no puede repintar el módulo. Estado
local del componente, sincronización en segundo plano, y ninguna operación que reordene el
DOM mientras hay foco en un campo.

**Verificable:** escribes 500 caracteres, tocas un contador, sigues escribiendo donde ibas.
El scroll no se mueve.

## Paso 5 · Contadores, cronómetros y fotos

Contadores con botones de 60px y vibración. Ventanas de tiempo de 10 y 30 minutos con
cuenta regresiva. Cronómetro por vueltas que promedia solo. Porcentajes derivados de dos
contadores, nunca pedidos.

Fotos: comprimir a 900px y JPEG 55% antes de subir a Storage. Miniaturas con quitar.
Contador nuevo en campo, guardado en la tabla `contadores`.

**Verificable:** cuentas 40 negocios y 12 con pago digital, y aparece 30% solo. Subes seis
fotos desde la cámara del celular.

## Paso 6 · Estructuración por IA

`POST /api/estructurar` con `{visita, modulo}`. Lee la captura y las fotos del módulo,
llama al modelo con el prompt del módulo, devuelve JSON validado con Zod.

Los campos de estructura permanecen ocultos hasta que responde o hasta que se pide
llenarlos a mano. Nunca sobrescribe texto existente.

Empieza por tres módulos: entorno, artefactos y cierre. Los demás siguen el mismo patrón.

**Verificable:** escribes tres párrafos en M1, pulsas *estructurar* y aparecen las
dimensiones llenas y una interpretación en borrador, editable.

## Paso 7 · No negociables e hipótesis de campo

Checklist por módulo con contador, persistido en `capturas.no_negociables`. Al marcar un
módulo como cubierto con pendientes, se declara el hueco sin bloquear.

Hipótesis nacidas en campo: alta desde cualquier módulo, con qué la confirmaría y qué la
tumbaría.

**Verificable:** el índice muestra "M5 · 3 no negociables pendientes".

## Paso 8 · Exportar y modo avión

Exportar la visita en Markdown y JSON. Cola local para cuando no hay señal: la captura se
guarda en el dispositivo y sube cuando vuelve la red.

**Verificable:** pones el celular en modo avión, capturas un módulo entero, vuelves a
conectarte y aparece en Supabase.

## Después de esta fase

Validación (subir el desk research y cruzarlo contra el campo), Experimentación y Análisis.
El prototipo ya los tiene resueltos funcionalmente: sirven de referencia de comportamiento.
