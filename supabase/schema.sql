-- CIX Foresight · Guía de campo T1
-- Esquema de la fase Campo. Se aplica entero desde el editor SQL de Supabase.
-- Contempla Validación, Experimentación y Análisis para no migrar después,
-- pero la interfaz de esta fase solo toca: entidades, visitas, capturas, fotos,
-- items, estado_negocio, contadores e hipotesis.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── tipos

do $$ begin
  create type origen_dato as enum ('persona', 'ia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type origen_hipotesis as enum ('escritorio', 'campo');
exception when duplicate_object then null; end $$;

do $$ begin
  create type veredicto_hipotesis as enum ('abierta', 'confirmada', 'refutada', 'no_observada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type estado_captura as enum ('vacia', 'en_curso', 'cubierta', 'cubierta_con_pendientes');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────────────────── equipo y personas

create table if not exists equipos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  created_at timestamptz not null default now()
);

-- Un perfil por usuario de Auth. El nombre es el que se ve en la barra superior.
create table if not exists perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  equipo_id uuid references equipos(id) on delete set null,
  nombre text,
  correo text,
  -- 'lab' o 'agencia': las agencias externas capturan pero no exportan el corpus.
  rol text not null default 'lab',
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────── entidad y visita

create table if not exists entidades (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos(id) on delete cascade,
  nombre text not null,
  sub_segmento text,
  zona text,
  -- Estado de la unidad: deja abierta la puerta al análisis de supervivencia.
  estado text,
  notas text,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists entidades_equipo_idx on entidades (equipo_id, created_at desc);

create table if not exists visitas (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references entidades(id) on delete cascade,
  -- levantamiento · intervención · medición posterior
  tipo text not null default 'levantamiento',
  fecha date not null default (now() at time zone 'America/Lima')::date,
  recolector uuid references auth.users(id),
  cerrada_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists visitas_entidad_idx on visitas (entidad_id, fecha desc);

-- ─────────────────────────────────────────────────────────── captura

-- Una fila por módulo. `datos` es jsonb porque modulos-campo.json va a seguir
-- cambiando con cada salida a campo: una columna por campo obligaría a migrar
-- la base cada vez que se agrega un contador.
create table if not exists capturas (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  modulo text not null,
  datos jsonb not null default '{}'::jsonb,
  -- índices de los no negociables marcados, contra el orden de modulos-campo.json
  no_negociables jsonb not null default '[]'::jsonb,
  -- lo que falta, declarado sin bloquear
  hueco text,
  estado estado_captura not null default 'vacia',
  estructurado_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (visita_id, modulo)
);
create index if not exists capturas_visita_idx on capturas (visita_id);

create table if not exists fotos (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  modulo text not null,
  -- ruta dentro del bucket privado `fotos`: <visita_id>/<modulo>/<uuid>.jpg
  path text not null,
  pie text,
  bytes integer,
  ancho integer,
  alto integer,
  subida_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists fotos_visita_idx on fotos (visita_id, modulo);

-- ─────────────────────────────────────────────────────────── lo que se consulta entre visitas

-- Procesos, herramientas, intenciones, flujos, círculos, preguntas, señales,
-- huérfanos. `tipo` es el `tkey` del campo en modulos-campo.json.
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  modulo text not null,
  tipo text not null,
  texto text not null,
  atributos jsonb not null default '{}'::jsonb,
  origen origen_dato not null default 'persona',
  created_at timestamptz not null default now()
);
create index if not exists items_visita_idx on items (visita_id, tipo);
create index if not exists items_tipo_idx on items (tipo, created_at desc);

-- Nueve dimensiones, escala 0–4 con anclajes conductuales en taxonomias.json.
-- Instrumento v0 hipotético: no hay ponderación validada.
create table if not exists estado_negocio (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  dimension text not null,
  valor smallint check (valor between 0 and 4),
  -- una puntuación sin cita es una opinión
  evidencia text,
  origen origen_dato not null default 'persona',
  updated_at timestamptz not null default now(),
  unique (visita_id, dimension)
);

-- Contadores creados en campo, fuera de los que trae el instrumento.
create table if not exists contadores (
  id uuid primary key default gen_random_uuid(),
  visita_id uuid not null references visitas(id) on delete cascade,
  modulo text not null,
  clave text not null,
  etiqueta text not null,
  valor integer not null default 0,
  ventana_seg integer,
  created_at timestamptz not null default now(),
  unique (visita_id, modulo, clave)
);

-- ─────────────────────────────────────────────────────────── entidad: escritorio e hipótesis

create table if not exists documentos (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references entidades(id) on delete cascade,
  titulo text not null,
  fuente text,
  url text,
  contenido text,
  bytes integer,
  created_at timestamptz not null default now()
);

-- Los veredictos se acumulan en la entidad, con referencia a la visita que los produjo.
create table if not exists hipotesis (
  id uuid primary key default gen_random_uuid(),
  entidad_id uuid not null references entidades(id) on delete cascade,
  texto text not null,
  origen origen_hipotesis not null default 'campo',
  -- nace en un módulo concreto cuando es de campo
  visita_id uuid references visitas(id) on delete set null,
  modulo text,
  confirma text,
  tumba text,
  veredicto veredicto_hipotesis not null default 'abierta',
  evidencia text,
  veredicto_visita_id uuid references visitas(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists hipotesis_entidad_idx on hipotesis (entidad_id, veredicto);

-- Variables abiertas: se crean desde Análisis y aparecen en el cierre.
create table if not exists variables_abiertas (
  id uuid primary key default gen_random_uuid(),
  equipo_id uuid not null references equipos(id) on delete cascade,
  clave text not null,
  etiqueta text not null,
  tipo text not null default 'texto',
  opciones jsonb not null default '[]'::jsonb,
  activa boolean not null default true,
  created_at timestamptz not null default now(),
  unique (equipo_id, clave)
);

-- ─────────────────────────────────────────────────────────── updated_at

create or replace function tocar_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists capturas_touch on capturas;
create trigger capturas_touch before update on capturas
  for each row execute function tocar_updated_at();

drop trigger if exists estado_negocio_touch on estado_negocio;
create trigger estado_negocio_touch before update on estado_negocio
  for each row execute function tocar_updated_at();

-- ─────────────────────────────────────────────────────────── seguridad por fila

-- Todo cuelga del equipo. Estas funciones evitan denormalizar equipo_id en
-- cada tabla y evitan la recursión de políticas que se lee a sí misma.
create or replace function mi_equipo() returns uuid
language sql stable security definer set search_path = public as $$
  select equipo_id from perfiles where id = auth.uid()
$$;

create or replace function equipo_de_entidad(e uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select equipo_id from entidades where id = e
$$;

create or replace function equipo_de_visita(v uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select e.equipo_id from visitas vi join entidades e on e.id = vi.entidad_id where vi.id = v
$$;

alter table equipos             enable row level security;
alter table perfiles            enable row level security;
alter table entidades           enable row level security;
alter table visitas             enable row level security;
alter table capturas            enable row level security;
alter table fotos               enable row level security;
alter table items               enable row level security;
alter table estado_negocio      enable row level security;
alter table contadores          enable row level security;
alter table documentos          enable row level security;
alter table hipotesis           enable row level security;
alter table variables_abiertas  enable row level security;

drop policy if exists equipos_lectura on equipos;
create policy equipos_lectura on equipos
  for select using (id = mi_equipo());

drop policy if exists perfiles_propio on perfiles;
create policy perfiles_propio on perfiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists perfiles_equipo_lectura on perfiles;
create policy perfiles_equipo_lectura on perfiles
  for select using (equipo_id = mi_equipo());

drop policy if exists entidades_equipo on entidades;
create policy entidades_equipo on entidades
  for all using (equipo_id = mi_equipo()) with check (equipo_id = mi_equipo());

drop policy if exists visitas_equipo on visitas;
create policy visitas_equipo on visitas
  for all using (equipo_de_entidad(entidad_id) = mi_equipo())
  with check (equipo_de_entidad(entidad_id) = mi_equipo());

drop policy if exists documentos_equipo on documentos;
create policy documentos_equipo on documentos
  for all using (equipo_de_entidad(entidad_id) = mi_equipo())
  with check (equipo_de_entidad(entidad_id) = mi_equipo());

drop policy if exists hipotesis_equipo on hipotesis;
create policy hipotesis_equipo on hipotesis
  for all using (equipo_de_entidad(entidad_id) = mi_equipo())
  with check (equipo_de_entidad(entidad_id) = mi_equipo());

drop policy if exists variables_equipo on variables_abiertas;
create policy variables_equipo on variables_abiertas
  for all using (equipo_id = mi_equipo()) with check (equipo_id = mi_equipo());

do $$
declare t text;
begin
  foreach t in array array['capturas','fotos','items','estado_negocio','contadores'] loop
    execute format('drop policy if exists %I on %I', t || '_equipo', t);
    execute format(
      'create policy %I on %I for all using (equipo_de_visita(visita_id) = mi_equipo())
       with check (equipo_de_visita(visita_id) = mi_equipo())', t || '_equipo', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────── perfil automático

create or replace function crear_perfil() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfiles (id, correo, nombre)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function crear_perfil();

-- ─────────────────────────────────────────────────────────── storage

-- Crear el bucket privado `fotos` antes de correr esto (Storage → New bucket).
-- La ruta es <visita_id>/<modulo>/<uuid>.jpg: el primer segmento decide el acceso.
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

drop policy if exists fotos_equipo_lectura on storage.objects;
create policy fotos_equipo_lectura on storage.objects
  for select using (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );

drop policy if exists fotos_equipo_escritura on storage.objects;
create policy fotos_equipo_escritura on storage.objects
  for insert with check (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );

drop policy if exists fotos_equipo_borrado on storage.objects;
create policy fotos_equipo_borrado on storage.objects
  for delete using (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );

-- ─────────────────────────────────────────────────────────── arranque
--
-- Un equipo y el enganche del primer usuario. Correr una vez, con tu correo:
--
--   insert into equipos (nombre) values ('CIX Foresight Lab');
--   update perfiles set equipo_id = (select id from equipos limit 1)
--    where correo = 'tu@correo.pe';
