-- ============================================
-- POLICIES PARA SUPABASE STORAGE
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Abra o Supabase Dashboard
-- 2. Vá em "SQL Editor" (no menu lateral)
-- 3. Cole este código completo
-- 4. Clique em "Run" ou pressione Ctrl+Enter
-- 5. Pronto! As policies serão criadas automaticamente
--
-- ============================================

-- Policy para permitir leitura pública de banners
CREATE POLICY "Allow public read banners"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'banners');

-- Policy para permitir leitura pública de bordas
CREATE POLICY "Allow public read borders"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'borders');

-- ============================================
-- VERIFICAÇÃO (opcional - execute depois)
-- ============================================
-- Para verificar se as policies foram criadas:
-- SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects';
