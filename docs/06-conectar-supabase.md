# Conectar Supabase

Del modo revisión al instrumento de verdad. Son seis pasos y el orden importa:
el enganche del primer usuario solo funciona **después** de que esa persona haya
entrado una vez.

## 1 · Crear el proyecto

En [supabase.com](https://supabase.com) → **New project**.

- **Name**: `cix-campo-t1`
- **Database password**: genérala y guárdala en el gestor del equipo. No se usa
  desde la aplicación, pero sin ella no hay acceso directo a la base después.
- **Region**: `South America (São Paulo)`. Es la más cercana a Lima; con la de
  Virginia cada guardado se va a unos 150 ms más.

Tarda un par de minutos en levantar.

## 2 · Correr el esquema

**SQL Editor** → **New query** → pega el contenido entero de
[`supabase/schema.sql`](../supabase/schema.sql) → **Run**.

Crea las doce tablas, los tipos, los disparadores, la seguridad por fila y el
bucket privado `fotos`. Es idempotente: si lo corres dos veces no rompe nada.

**No corras todavía** el bloque de arranque comentado al final. Ese va en el paso 6.

Para comprobar: **Table Editor** debe listar `entidades`, `visitas`, `capturas`,
`fotos`, `items`, `estado_negocio`, `contadores`, `hipotesis`, `documentos`,
`variables_abiertas`, `equipos` y `perfiles`. Y **Storage** debe mostrar el bucket
`fotos` marcado como privado.

## 3 · Copiar las dos claves

**Project Settings → API** (en el panel nuevo puede llamarse *API Keys*).

| Lo que dice el panel | La variable |
| --- | --- |
| Project URL — `https://xxxxx.supabase.co` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public`, o *Publishable key* (`sb_publishable_…`) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

La **anon** es pública por diseño: viaja al navegador y por eso lleva el prefijo
`NEXT_PUBLIC_`. Lo que la protege es la seguridad por fila del esquema, no el
secreto de la clave.

La que dice `service_role` **no se usa en este proyecto**. Salta la seguridad por
fila entera. Si termina en Vercel, cualquiera con la aplicación abierta puede leer
el corpus completo.

## 4 · Decirle a Supabase a dónde volver

**Authentication → URL Configuration**. El acceso es por enlace al correo, y sin
esto el enlace no regresa a ninguna parte:

- **Site URL**: `https://field-research-nine.vercel.app`
- **Redirect URLs**, una por línea:
  ```
  https://field-research-nine.vercel.app/auth/callback
  http://localhost:3000/auth/callback
  ```

La segunda es para desarrollo local. El correo que manda Supabase por defecto
tiene un tope de unos pocos envíos por hora: para el equipo entero hace falta
conectar un proveedor propio en **Authentication → Emails**.

## 5 · Poner las variables en Vercel

Proyecto **field-research** → **Settings → Environment Variables**. Tres, marcadas
para *Production*, *Preview* y *Development*:

| Nombre | Valor |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | la URL del paso 3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | la clave anon del paso 3 |
| `ANTHROPIC_API_KEY` | de [console.anthropic.com](https://console.anthropic.com) |

`ANTHROPIC_API_KEY` va **sin** el prefijo `NEXT_PUBLIC_`. Con el prefijo se
publica en el navegador y la clave queda a la vista de cualquiera. Sin ella todo
funciona igual; solo el botón *estructurar* responde que falta configurarla.

Las variables se leen al construir, así que hay que redesplegar:
**Deployments** → el último → **⋯ → Redeploy**.

## 6 · Entrar y engancharte al equipo

Ahora sí, en este orden:

1. Abre la aplicación. Ya no dice «Falta configurar»: te manda a **/login**.
2. Escribe tu correo y abre el enlace que llega, **en el mismo dispositivo**.
3. Vas a entrar y ver: *«Tu usuario existe pero no está en ningún equipo»*. Es lo
   esperado. Recién ahora existe tu fila en `perfiles` — la crea un disparador
   cuando nace el usuario de Auth.
4. Vuelve al **SQL Editor** y corre esto con tu correo:

   ```sql
   insert into equipos (nombre) values ('CIX Foresight Lab');

   update perfiles set equipo_id = (select id from equipos limit 1)
    where correo = 'tu@correo.pe';
   ```

5. Recarga la aplicación. Ya puedes crear entidades.

Para sumar a alguien más —otro recolector, la agencia— repite solo el paso 4 con
su correo, **después** de que haya entrado una vez. Comparten equipo, así que ven
las mismas entidades.

## Comprobar que quedó

1. Crea la entidad **NatuSeeds**, sub-segmento *Tienda naturista / orgánica*.
2. Abre una visita y entra a **M1 · Entorno**.
3. Escribe dos líneas en la captura y mira la barra superior: *escribiendo…* y
   después *guardado*.
4. En Supabase, **Table Editor → capturas**: hay una fila con tu texto dentro de
   `datos`.
5. Sube una foto desde la cámara y confirma que aparece en **Storage → fotos**,
   bajo `<id-de-visita>/entorno/`.
6. Pulsa *estructurar* y espera las dimensiones en borrador morado.

Si algo falla, la pantalla muestra el error real de Supabase o del modelo, no un
mensaje genérico. Ese texto es lo que hay que leer.

## Errores típicos

| Lo que ves | Qué pasó |
| --- | --- |
| El enlace del correo lleva a `localhost` | Falta el paso 4: *Site URL* quedó en el valor por defecto |
| Entras pero no ves nada y no puedes crear | Falta el paso 6: tu perfil no tiene equipo |
| «Tu usuario todavía no está en un equipo» al crear una entidad | Lo mismo |
| La barra dice *no subió* con un error de permisos | El esquema no llegó a correr entero: vuelve a correrlo |
| Las fotos suben pero no se ven | El bucket `fotos` quedó como público, o falta correr las políticas de Storage del final del esquema |
| Sigue diciendo «Falta configurar» | Pusiste las variables pero no redesplegaste |

## Para desarrollo local

```bash
cp .env.example .env.local   # y pega las mismas tres claves
npm run dev
```

Es la misma base que producción: lo que captures probando queda en el mismo
corpus. Si eso estorba, crea un segundo proyecto de Supabase para pruebas y usa
sus claves en `.env.local`.
