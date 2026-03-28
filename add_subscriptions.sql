-- Agregar celular y fecha de vencimiento a la tabla players
ALTER TABLE public.players 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS subscription_until TIMESTAMP WITH TIME ZONE;
