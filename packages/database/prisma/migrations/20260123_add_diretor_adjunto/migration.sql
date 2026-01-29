-- Migration: Add diretor_adjunto to prod_unidade_turistica
ALTER TABLE prod_unidade_turistica
  ADD COLUMN diretor_adjunto VARCHAR(255) DEFAULT NULL;

-- Note: if you're using prisma migrate, run the appropriate migrate command or apply this SQL to the database.
