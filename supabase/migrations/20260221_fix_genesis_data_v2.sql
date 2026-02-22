
-- Update Genesis Season End Date and Metadata
UPDATE seasons
SET 
    end_date = '2026-03-20',
    background_png_url = COALESCE(NULLIF(background_png_url, ''), 'https://images.unsplash.com/photo-1468657988500-aca2be09f4c6?q=80&w=2070&auto=format&fit=crop'),
    lore_text = COALESCE(NULLIF(lore_text, ''), 'O Império Genesis se ergue. Castelos de cristal e fortalezas de aço dominam o horizonte. É hora de construir seu legado.'),
    theme = 'Império'
WHERE id = 'season-01' OR name ILIKE '%Genesis%';
