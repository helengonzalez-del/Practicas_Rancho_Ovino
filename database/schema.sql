-- =============================================
-- SCHEMA.SQL — Rancho Ovino
-- Ejecuta este archivo en Supabase > SQL Editor
-- =============================================

create extension if not exists "pgcrypto";

-- 1. USUARIOS
create table usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text,
  rol text check (rol in ('productor','veterinario','admin')),
  telefono text,
  created_at timestamp default now()
);

-- 2. ANIMALES
create table animales (
  id uuid primary key default gen_random_uuid(),
  identificador text unique not null,
  nombre text,
  especie text default 'borrego',
  raza text,
  sexo text check (sexo in ('macho','hembra')) not null,
  fecha_nacimiento date,
  fecha_ingreso date default now(),
  estado text default 'activo' check (estado in ('activo','vendido','muerto')),
  imagen_url text,
  id_padre uuid,
  id_madre uuid,
  created_at timestamp default now(),
  constraint fk_padre foreign key (id_padre) references animales(id),
  constraint fk_madre foreign key (id_madre) references animales(id)
);

-- 3. REPRODUCCIÓN
create table reproduccion (
  id uuid primary key default gen_random_uuid(),
  id_hembra uuid not null,
  id_macho uuid not null,
  fecha_empadre date not null,
  fecha_parto_estimada date,
  fecha_parto_real date,
  numero_crias int,
  estado text default 'gestando' check (estado in ('gestando','pario','fallido')),
  observaciones text,
  created_at timestamp default now(),
  constraint fk_hembra foreign key (id_hembra) references animales(id),
  constraint fk_macho  foreign key (id_macho)  references animales(id)
);

-- Trigger: calcular fecha parto automáticamente (5 meses)
create or replace function calcular_parto()
returns trigger as $$
begin
  new.fecha_parto_estimada := new.fecha_empadre + interval '5 months';
  return new;
end;
$$ language plpgsql;

create trigger trigger_calcular_parto
before insert on reproduccion
for each row execute function calcular_parto();

-- 4. PRODUCCIÓN (PESOS)
create table produccion (
  id uuid primary key default gen_random_uuid(),
  id_animal uuid not null,
  fecha date not null,
  peso numeric(6,2),
  observaciones text,
  created_at timestamp default now(),
  constraint fk_animal_produccion foreign key (id_animal) references animales(id) on delete cascade,
  constraint unique_peso_por_dia unique (id_animal, fecha)
);

-- 5. SALUD
create table salud (
  id uuid primary key default gen_random_uuid(),
  id_animal uuid not null,
  id_usuario uuid,
  fecha date not null,
  tipo text check (tipo in ('enfermedad','vacuna','tratamiento','desparasitacion')),
  diagnostico text,
  tratamiento text,
  medicamento text,
  dosis text,
  observaciones text,
  created_at timestamp default now(),
  constraint fk_animal_salud  foreign key (id_animal)  references animales(id) on delete cascade,
  constraint fk_usuario_salud foreign key (id_usuario) references usuarios(id)
);

-- 6. VENTAS
create table ventas (
  id uuid primary key default gen_random_uuid(),
  fecha date default now(),
  cliente text,
  total numeric(10,2),
  created_at timestamp default now()
);

-- 7. DETALLE DE VENTA
create table detalle_venta (
  id uuid primary key default gen_random_uuid(),
  id_venta uuid not null,
  id_animal uuid not null,
  precio numeric(10,2),
  peso numeric(6,2),
  constraint fk_venta        foreign key (id_venta)  references ventas(id)   on delete cascade,
  constraint fk_animal_venta foreign key (id_animal) references animales(id)
);

-- Trigger: marcar animal como vendido al agregarlo a una venta
create or replace function marcar_animal_vendido()
returns trigger as $$
begin
  update animales set estado = 'vendido' where id = new.id_animal;
  return new;
end;
$$ language plpgsql;

create trigger trigger_animal_vendido
after insert on detalle_venta
for each row execute function marcar_animal_vendido();

-- =============================================
-- ROW LEVEL SECURITY (modo desarrollo: todo permitido)
-- =============================================
alter table animales     enable row level security;
alter table reproduccion enable row level security;
alter table produccion   enable row level security;
alter table salud        enable row level security;
alter table ventas       enable row level security;
alter table detalle_venta enable row level security;

create policy "permitir todo animales"      on animales      for all using (true) with check (true);
create policy "permitir todo reproduccion"  on reproduccion  for all using (true) with check (true);
create policy "permitir todo produccion"    on produccion    for all using (true) with check (true);
create policy "permitir todo salud"         on salud         for all using (true) with check (true);
create policy "permitir todo ventas"        on ventas        for all using (true) with check (true);
create policy "permitir todo detalle"       on detalle_venta for all using (true) with check (true);
