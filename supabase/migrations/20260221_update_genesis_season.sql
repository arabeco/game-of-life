-- Update Genesis Season
UPDATE seasons
SET 
    lore_text = 'No princípio, ergue-se o Império. A Era Genesis marca o alvorecer de nossa soberania, onde cada tijolo assentado é um pacto com a eternidade. Construa seus castelos, fortifique sua mente e corpo. O destino não é sorte, é arquitetura.',
    background_png_url = 'https://images.unsplash.com/photo-1533158326339-bef1176d7635?auto=format&fit=crop&q=80&w=1920'
WHERE name ILIKE '%Genesis%' OR id = 'season-01';

-- Ensure it exists if not found (fallback insert for dev environment)
INSERT INTO seasons (id, name, start_date, end_date, is_active, lore_text, background_png_url)
SELECT 'season-01', 'Genesis', '2024-01-01', '2024-12-31', true, 
       'No princípio, ergue-se o Império. A Era Genesis marca o alvorecer de nossa soberania, onde cada tijolo assentado é um pacto com a eternidade. Construa seus castelos, fortifique sua mente e corpo. O destino não é sorte, é arquitetura.',
       'https://images.unsplash.com/photo-1533158326339-bef1176d7635?auto=format&fit=crop&q=80&w=1920'
WHERE NOT EXISTS (SELECT 1 FROM seasons WHERE name ILIKE '%Genesis%' OR id = 'season-01');
