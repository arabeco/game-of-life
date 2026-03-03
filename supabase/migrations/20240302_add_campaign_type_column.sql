-- Adiciona coluna 'type' para campanhas (sequential, parallel)
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "type" text DEFAULT 'sequential';

-- Adiciona colunas de ordenação e prioridade caso não existam
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS "order" int4 DEFAULT 0,
ADD COLUMN IF NOT EXISTS "priority" text DEFAULT 'media',
ADD COLUMN IF NOT EXISTS "priority_order" int4 DEFAULT 0;

-- Atualiza registros existentes para ter um valor padrão
UPDATE campaigns SET "type" = 'sequential' WHERE "type" IS NULL;
UPDATE campaigns SET "order" = 0 WHERE "order" IS NULL;
UPDATE campaigns SET "priority_order" = 0 WHERE "priority_order" IS NULL;
UPDATE campaigns SET "priority" = 'media' WHERE "priority" IS NULL;
