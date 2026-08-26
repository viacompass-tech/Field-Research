-- Volver a cerrar el acceso · CIX Foresight · Guía de campo T1
--
-- Deshace `acceso-abierto.sql`: el corpus vuelve a exigir sesión y pertenecer
-- al equipo. Correr esto ANTES de que el código vuelva a pedir login, o nadie
-- podrá entrar.
--
-- Después de correrlo hay que volver a enganchar a cada persona:
--
--   update perfiles
--      set equipo_id = (select id from equipos where nombre = 'CIX Foresight Lab')
--    where correo in ('...');

do $$
declare t text;
begin
  foreach t in array array[
    'entidades','visitas','capturas','fotos','items','estado_negocio',
    'contadores','documentos','hipotesis','variables_abiertas','equipos'
  ] loop
    execute format('drop policy if exists %I on %I', t || '_abierto', t);
  end loop;
end $$;

drop policy if exists equipos_lectura on equipos;
create policy equipos_lectura on equipos
  for select using (id = mi_equipo());

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

drop policy if exists fotos_abierto_lectura on storage.objects;
drop policy if exists fotos_abierto_escritura on storage.objects;
drop policy if exists fotos_abierto_borrado on storage.objects;

create policy fotos_equipo_lectura on storage.objects
  for select using (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );

create policy fotos_equipo_escritura on storage.objects
  for insert with check (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );

create policy fotos_equipo_borrado on storage.objects
  for delete using (
    bucket_id = 'fotos'
    and equipo_de_visita(((storage.foldername(name))[1])::uuid) = mi_equipo()
  );
