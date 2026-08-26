# Cómo está armado

Ocho pasos del plan, un solo repo. Esto es dónde vive cada cosa y por qué ahí.

## El renderizador

`src/components/Modulo.tsx` es la única pantalla de captura que existe. Lee la
definición del módulo de `src/data/modulos-campo.json` y arma la pantalla:

1. `src/lib/datos.ts` agrupa los campos en bandas — **no negociables · qué mirar ·
   contar · fotografiar · escribir · estructura** — según el tipo de campo, no
   según una lista por módulo. Un campo nuevo en el JSON cae solo donde le toca.
2. `src/components/campos/Campo.tsx` despacha cada tipo a su componente.
3. Las etiquetas `sec` del JSON sobreviven como subtítulos dentro de su banda.

No hay una línea de código particular de M1, ni de M9. Los once módulos salen del
mismo camino.

## Por qué el scroll no salta

`src/lib/almacen.ts`. Cada campo guarda su valor en estado local de React y lo
empuja al almacén; el almacén no notifica a nadie salvo al indicador de guardado,
que se suscribe con `useSyncExternalStore`. Escribir en un textarea no repinta el
módulo, no reordena el DOM y no toca el scroll.

La única vez que la pantalla cambia de forma es cuando aparece la estructura —
después de pulsar *estructurar* o *llenar a mano*. Ahí sí se remonta la lista de
campos, con `version` en la `key`, para que cada uno vuelva a leer del almacén.

Si algún día alguien sube el valor de un campo al padre en cada tecla, el bug
vuelve idéntico. Esa es la regla, no el detalle.

## Guardado y modo avión

El almacén manda la captura entera a `POST /api/captura` con 900 ms de retardo.
Siempre el blob completo: así la cola es idempotente y no hay que resolver
conflictos campo por campo.

Sin señal, la carga queda en `localStorage` bajo `cix.cola.<visita>.<modulo>` y
las fotos en IndexedDB (`cix-campo`, tienda `fotos`). Al volver la red —evento
`online` o al abrir cualquier módulo— se vacían las dos colas.

`POST /api/captura` además materializa lo que se consulta entre visitas: los
campos `tagged` y `findings` van a `items`, el campo `scale` va a
`estado_negocio`. La captura sigue siendo la fuente; esas tablas son el índice.

## La IA

`POST /api/estructurar` arma el esquema de salida **desde el módulo**: cada campo
con `ai: true` aporta su forma a un objeto de Zod, y el modelo responde contra ese
esquema (`messages.parse` con `zodOutputFormat`). Lee la captura escrita y hasta
seis fotos del módulo. La clave vive solo en el servidor.

Lo que vuelve llega marcado con `origen: 'ia'` y el cliente lo fusiona **solo en
los campos vacíos**. Editar un borrador de IA lo vuelve de la persona. Cuando
falla, la pantalla muestra el error real del modelo, no un mensaje genérico.

Sin `ANTHROPIC_API_KEY` el endpoint responde 503 con una frase que dice qué falta,
y la estructura se puede llenar a mano igual.

## Datos

`supabase/schema.sql` se aplica de una vez. Todo cuelga del equipo y la seguridad
por fila se resuelve con tres funciones (`mi_equipo`, `equipo_de_entidad`,
`equipo_de_visita`) en vez de denormalizar `equipo_id` en cada tabla.

Las fotos van a un bucket privado con la ruta `<visita>/<modulo>/<uuid>.jpg`: el
primer segmento es lo que decide el acceso.

## Lo que no está construido

Validación, Experimentación y Análisis. El esquema los contempla —`documentos`,
`variables_abiertas`, el veredicto de las hipótesis en la entidad— pero la
interfaz no los expone. El campo `openvars` del cierre ya lee
`variables_abiertas`: cuando Análisis cree una, aparece sola.

## Modo revisión

Sin `.env.local`, `/v/<lo-que-sea>/<modulo>` pinta el módulo con un almacén que no
sube nada y lo dice en la barra superior. Sirve para discutir el instrumento en
una pantalla, no para capturar.
