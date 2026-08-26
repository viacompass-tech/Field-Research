# Guía de campo T1 · CIX Foresight Lab

Instrumento de etnografía para micronegocios del comercio informal peruano.
Territorio 1: ¿puede el banco ser el sistema operativo del comercio informal?
Fase actual: solo Campo.

## Contenido

| Ruta | Qué hay |
| --- | --- |
| `CLAUDE.md` | instrucciones de trabajo — léelo primero |
| `docs/02-modelo-datos.md` | jerarquía y decisiones de esquema |
| `docs/03-ux-reglas.md` | reglas de interacción y por qué existen |
| `docs/04-plan-de-build.md` | ocho pasos verificables |
| `docs/05-arquitectura.md` | cómo está armado el código |
| `supabase/schema.sql` | tablas, tipos y seguridad por fila |
| `src/data/modulos-campo.json` | once módulos con sus campos, no negociables y sondas |
| `src/data/taxonomias.json` | territorio, capas, flujos, dimensiones, sub-segmentos |
| `src/styles/tokens.css` | paleta y tipografía |

## El instrumento en una línea

Once módulos que van de fuera hacia dentro y de observar a hablar: la cuadra, el negocio
por fuera, la operación, el contacto incógnito, la conversación, los clientes, el
acompañamiento, los artefactos, el sistema de flujos y el cierre.
Ninguno bloquea a otro. El orden se sostiene por argumento, no por candados.

## Correr el proyecto

```bash
npm install
cp .env.example .env.local   # y llena las tres claves
npm run dev
```

Sin `.env.local` la aplicación arranca igual y avisa en pantalla qué falta configurar:
sirve para revisar la interfaz, no para capturar.

El esquema de la base se aplica una sola vez, desde el editor SQL de Supabase:

```bash
supabase/schema.sql
```

Storage: crear un bucket privado llamado `fotos`. Las políticas están al final del
esquema.
