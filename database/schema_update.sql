-- ============================================
-- ACTUALIZACIÓN DE BASE DE DATOS — Rancho Ovino v2
-- Ejecuta en Supabase > SQL Editor
-- ============================================

-- Agregar nuevos campos a la tabla animales
ALTER TABLE animales 
  ADD COLUMN IF NOT EXISTS estado_productivo text 
    CHECK (estado_productivo IN ('gestante','parida','servicio','primala','cordera','lactando','destetada','semental','engorda')),
  ADD COLUMN IF NOT EXISTS numero_partos int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tipo_nacimiento text 
    CHECK (tipo_nacimiento IN ('sencillo','doble','triple')),
  ADD COLUMN IF NOT EXISTS notas text,
  ADD COLUMN IF NOT EXISTS nombre_padre text,
  ADD COLUMN IF NOT EXISTS nombre_madre text,
  ADD COLUMN IF NOT EXISTS peso_inicial numeric(6,2);

-- Actualizar el CHECK de estado para incluir más opciones
-- (el estado original activo/vendido/muerto se mantiene igual)

-- Crear tabla de razas personalizadas
CREATE TABLE IF NOT EXISTS razas (
  id uuid primary key default gen_random_uuid(),
  nombre text unique not null,
  created_at timestamp default now()
);

-- Insertar razas base
INSERT INTO razas (nombre) VALUES 
  ('Pelibuey'),('Dorper'),('Blackbelly'),('Suffolk'),
  ('Rambouillet'),('Katahdin'),('Merino'),('Corriedale')
ON CONFLICT (nombre) DO NOTHING;

-- RLS para razas
ALTER TABLE razas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "permitir todo razas" ON razas FOR ALL USING (true) WITH CHECK (true);

-- Agregar campos a ventas
ALTER TABLE ventas
  ADD COLUMN IF NOT EXISTS notas text;

-- Agregar campos a detalle_venta  
ALTER TABLE detalle_venta
  ADD COLUMN IF NOT EXISTS notas text;

-- Agregar campos a salud
ALTER TABLE salud
  ADD COLUMN IF NOT EXISTS notas text;

-- Agregar campos a reproduccion
ALTER TABLE reproduccion
  ADD COLUMN IF NOT EXISTS notas text;

SELECT '✅ Actualización completada' as resultado;
