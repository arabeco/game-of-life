-- 1. REVIVER SLOTS: Atualiza qualquer slot com saúde 0 (ou negativa) para 100%
UPDATE clan_aldeia_slots 
SET health = 100 
WHERE health <= 0;

-- 2. PREENCHER SLOTS FALTANTES: Garante que todos os clãs tenham os 6 slots com 100% de saúde
INSERT INTO clan_aldeia_slots (clan_id, slot_id, health, streak_good, streak_bad)
SELECT c.id, s.slot_id, 100, 0, 0
FROM clans c
CROSS JOIN (
    VALUES ('fogueira'), ('forja'), ('torre'), ('horta'), ('altar'), ('trono')
) AS s(slot_id)
WHERE NOT EXISTS (
    SELECT 1 FROM clan_aldeia_slots cas 
    WHERE cas.clan_id = c.id AND cas.slot_id = s.slot_id
);

-- 3. CONFIRMAÇÃO: Mostra quantos slots existem agora por clã (deve ser 6 para todos)
SELECT c.name as clan_name, count(cas.id) as slots_count, avg(cas.health) as avg_health
FROM clans c
LEFT JOIN clan_aldeia_slots cas ON c.id = cas.clan_id
GROUP BY c.name;
