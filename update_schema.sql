-- Actualización de esquema para Roles y Equipos (Ultimate Team)

-- 1. Crear la tabla de equipos
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  admin_id uuid, -- FK a players(id) agregado después
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificar la tabla de jugadores para incluir el rol y el equipo
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS role text DEFAULT 'player';
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id);

-- 3. Establecer las relaciones (Opcional, si players.id es uuid)
-- ALTER TABLE public.teams ADD CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES public.players(id);

-- 4. Actualizar el usuario administrador de prueba existente
UPDATE public.players SET role = 'admin' WHERE username = 'admin';

-- 5. Crear el superadmin inicial (Contraseña: superadmin123, en producción debería estar hasheada o manejada por Supabase Auth)
-- Revisa si el id es uuid o int en tu esquema antes de usar gen_random_uuid() para insertar. Asumimos uuid por defecto en Supabase.
INSERT INTO public.players (full_name, username, password, role, is_admin)
VALUES ('Super Administrador', 'superadmin', 'superadmin123', 'superadmin', true)
ON CONFLICT (username) DO UPDATE SET role = 'superadmin';
