-- Agregar la columna football_type a la tabla teams
ALTER TABLE public.teams ADD COLUMN IF NOT EXISTS football_type integer DEFAULT 7;

-- Comentario para el usuario:
-- Ejecuta este script en el Editor SQL de Supabase para habilitar la nueva funcionalidad.
