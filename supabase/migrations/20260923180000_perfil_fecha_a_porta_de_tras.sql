-- O PERFIL ESTAVA ABERTO PARA QUEM NEM ENTROU.
--
-- `anon` — o papel da chave que vai dentro do bundle, que qualquer pessoa
-- extrai — tinha UPDATE, DELETE, TRUNCATE, TRIGGER e REFERENCES em
-- `public.user_profiles`. Isso inclui `wallet`, `gold`, `nobility`,
-- `is_premium` e `role`.
--
-- Hoje a RLS segura o UPDATE e o DELETE, porque a politica exige
-- `auth.uid() = id` e `auth.uid()` e nulo para anon. Mas o privilegio estar la
-- e uma arma carregada apontada para o pe: no dia em que alguem desligar a RLS
-- para depurar alguma coisa, a tabela inteira fica gravavel pela chave publica.
--
-- E TRUNCATE nao e segurado por RLS de jeito nenhum. Ele nao passa por
-- politica: apaga a tabela toda. Nada no Glyph trunca perfil, nem deveria.
--
-- Esta migracao nao mexe em NADA que o aplicativo faca hoje. Ela so tira de
-- `anon` privilegios que ele nunca usou, e tira dos dois papeis as operacoes
-- que o aplicativo nunca faz. O que o cliente pode ESCREVER continua igual —
-- isso e o proximo passo, e precisa de caminho de servidor para cada coisa que
-- ele legitimamente muda.

begin;

-- --------------------------------------------------------------------------
-- 1. A CHAVE PUBLICA NAO ESCREVE PERFIL.
-- --------------------------------------------------------------------------
--
-- O cadastro nao precisa disto: quando o perfil e inserido, a pessoa ja tem
-- sessao, e a politica de INSERT exige `auth.uid() = id`. Anon nunca satisfaz
-- essa condicao, entao nada que funciona hoje depende deste privilegio.
revoke all on table public.user_profiles from anon;

-- Ler continua valendo: a tela de login e o convite mostram perfil antes da
-- sessao existir, e a politica de SELECT decide o que aparece.
grant select on table public.user_profiles to anon;

-- --------------------------------------------------------------------------
-- 2. NINGUEM TRUNCA, NINGUEM CRIA GATILHO.
-- --------------------------------------------------------------------------
--
-- TRUNCATE ignora RLS. TRIGGER deixa pendurar codigo que roda como o dono da
-- tabela. REFERENCES deixa criar chave estrangeira que espia existencia de
-- linha. Nenhum dos tres e usado pelo aplicativo.
revoke truncate, trigger, references on table public.user_profiles from authenticated;

-- DELETE tambem sai: apagar conta passa pela funcao propria, que cuida do
-- resto do dado junto. Hoje nem ha politica de DELETE, entao a RLS ja recusa —
-- e o privilegio sobrando so servia para confundir quem fosse auditar.
revoke delete on table public.user_profiles from authenticated;

commit;
