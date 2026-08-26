-- Acceso abierto · CIX Foresight · Guía de campo T1
--
-- Reemplaza la seguridad por equipo por acceso anónimo. Después de correr esto,
-- CUALQUIERA con la URL lee y escribe el corpus completo, incluidas las fotos
-- de artefactos con datos de terceros. Es una decisión deliberada del equipo,
-- tomada el 2026-08-26 para desbloquear a los recolectores cuando el envío de
-- correos de Supabase falló.
--
-- Para volver atrás está `supabase/acceso-por-equipo.sql`.

-- Las tablas siguen con RLS activa, pero la política ya no mira el equipo.
do $$
declare t text;
begin
  foreach t in array array[
    'entidades','visitas','capturas','fotos','items','estado_negocio',
    'contadores','documentos','hipotesis','variables_abiertas','equipos'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_equipo', t);
    execute format('drop policy if exists %I on %I', t || '_lectura', t);
    execute format('drop policy if exists %I on %I', t || '_abierto', t);
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true)',
      t || '_abierto', t);
  end loop;
end $$;

-- Las fotos, igual: el bucket sigue privado, pero cualquiera puede firmar URLs.
drop policy if exists fotos_equipo_lectura on storage.objects;
drop policy if exists fotos_equipo_escritura on storage.objects;
drop policy if exists fotos_equipo_borrado on storage.objects;

drop policy if exists fotos_abierto_lectura on storage.objects;
create policy fotos_abierto_lectura on storage.objects
  for select to anon, authenticated using (bucket_id = 'fotos');

drop policy if exists fotos_abierto_escritura on storage.objects;
create policy fotos_abierto_escritura on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'fotos');

drop policy if exists fotos_abierto_borrado on storage.objects;
create policy fotos_abierto_borrado on storage.objects
  for delete to anon, authenticated using (bucket_id = 'fotos');

-- Sin sesión no hay usuario que firme las visitas, así que el nombre de quien
-- captura viaja como texto, guardado en el dispositivo. Sin esto el corpus no
-- puede responder quién estuvo ahí.
alter table visitas add column if not exists recolector_nombre text;

-- El equipo tiene que existir: la aplicación cuelga de él aunque ya nadie
-- pertenezca a ninguno.
insert into equipos (nombre)
select 'CIX Foresight Lab'
where not exists (select 1 from equipos where nombre = 'CIX Foresight Lab');

select nombre, id from equipos;
