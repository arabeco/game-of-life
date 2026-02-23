-- Atualizar Slots da Aldeia para 50% de saúde (considerando max=100)
-- E marcar como calculado hoje para evitar decaimento imediato
UPDATE clan_aldeia_slots 
SET health = 50,
    last_decay_calculation = CURRENT_DATE;

-- Atualizar Estatísticas do Santuário para 50% (considerando max=28800 segundos definido no GameContext)
UPDATE sanctuary_area_stats SET total_seconds = 14400;
