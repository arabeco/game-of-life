# Temporadas integradas e revisão das pontas soltas

Conferido em 12/10/2026 no checkout compartilhado com Claude. Este documento atualiza os recados antigos, sem regravar as listas da PRANCHETA.

## Entrega desta rodada

- 12 artes: borda, banner e insígnia de Zênite I, Eclipse I, Égide I e Aurora II.
- Produção: **690.824 bytes (675 KiB / 0,69 MB)**, antes 2.095.954 bytes. Redução de 67%. WEBP qualidade 90, dimensões mantidas, alpha idêntico pixel a pixel. Compressão RGB com perdas; mestres sem perdas preservados fora de public.
- Bordas/insígnias 500×500; banners 1020×170. Centro das bordas continua transparente. Galeria conferida nos tamanhos de uso e em 390/1280 px, claro/escuro.
- Arquivos em `public/assets/catalog/interface/`; catálogo e chaves de temporada ligados; manifesto regenerado. Pasta completa do catálogo: aproximadamente **15,5 MiB**, abaixo do teto existente de 18 MiB.
- Aurora conserva os três IDs e a chave `aurora_1_2026`. URLs antigas locais e do Storage resolvem para a arte nova, sem mexer nos uploads pessoais.
- Zênite/Eclipse/Égide têm três peças cadastradas no cliente. Skin e tema seguem vazios; não inventamos recompensas nem missões para fechar a coleção.
- SQL manual: `sql/temporadas-2027-artes.sql`. Atualiza as três artes de Aurora, cadastra nove peças futuras desligadas; preserva economia/ativação anterior no conflito. **Não executado no Supabase.** Antes da ativação, completar cinco peças e revisar missões/pool.
- O teste antigo que exigia baú dos planos foi atualizado para executar a regressão vigente de pagamento/renovação sem baús. O SMOKETEST agora informa marco 1/5/10, compartilhamento sem link público e build 111 pendente.

## Validação

Passaram: TypeScript; `npx vite build` (app web principal); item-art; egress-estatico; reward-routing, incluindo memberships-without-chests; ligações coleção/item/arquivo; 12 aliases de Aurora; correspondência binária entre release e public; galeria Playwright. SQL executado duas vezes em PostgreSQL local PGlite com 12 alvos, nove novos inativos e valores anteriores preservados.

Isso não comprova execução no Supabase, entrega de prêmio real, aparência no Android ou novo AAB. Nenhum commit, push, deploy ou AAB feito nesta rodada.

## Pendências de implementação e publicação

| Frente | Estado verificado / próximo trabalho | Responsável |
|---|---|---|
| Artes das quatro temporadas | Cliente ligado; aplicar o SQL acima. Não ativar temporadas incompletas. | Codex / Afonso SQL |
| Skins | Cinco propostas ainda com encaixe de mangas/calçados pendente; Guardião atual preservado. Prancheta atribui revisão ao Claude após 13/10. | Claude |
| Conteúdo das temporadas | Zênite I/Eclipse I/Égide I: faltam skin, tema e jornadas; Zênite II continua apenas calendário/proposta de skin. Fundos atuais reutilizados. Aurora II já tem jornadas e não tem mais a antiga jornada de clã. | Decisão de conteúdo + implementação |
| Exclusão pelo site | `glyph-landing/exclusao.html` ainda abre `mailto:`. Não cria uma solicitação comprovada nem acompanha estado. Precisa finalizar fluxo com identidade e tabela oficial. | Codex |
| Exclusão no app/servidor | `account-delete` registra `cleanup_pending` quando Storage falha. Falta concluir recuperação/retentativa das etapas parciais; não confundir com fluxo integral finalizado. | Codex |
| E-mails essenciais | SQL confirmado e deploy registrados na prancheta; recuperação e confirmação ainda sem prova de entrega real. Novidades por e-mail ficam para depois. Cobrança antiga de US$ 10 já removida pelo Afonso. Não houve nova consulta ao painel nesta rodada. | Codex / teste próprio |
| Site | Termos 13 anos/7 dias, posts, contadores e acessos Em breve preparados localmente; publicação pendente. Entrar significa versão web. Lançamento segue rascunho, sem Play pública. | Codex |
| Cupom VANGUARDA25 | SQL recente remove programa de 14 dias e fixa 25 ouro, preservando demais chaves. Post local ainda anuncia kit e baú Incomum: conferir payload real antes de anunciar, não concluir que o SQL removeu esses itens. | Codex / conferência do banco |
| Convite antes do lançamento | `utils/convites.ts` com flag pública falsa, mensagem só com código. Continua modificado localmente: incluir no checkpoint. Liberação do link exige página pública Play confirmada. | Codex |
| Haptics/fluidez do Planner | Revisão de agendar, segurar, arrastar e concluir ainda pendente; esta rodada não a implementou. Tremor horizontal está com Claude, aguardando evidência. | Codex / Claude |
| Clã | Prancheta registra SQL conferido e implementação; falta aviso do Oráculo quando grupo atinge meta. Não reimplementar a missão. | Claude |
| Feed | Limite dos 80 posts mais recentes pode esconder posts de amigos; priorização do clã/antiflood é futuro. | Claude |
| Rankings/interação | Decisão de produto ainda com Afonso/Claude. Comparativo diário em produção precisa confirmação antes de anúncio. | Afonso / Claude |
| Jardim progressivo e link de perfil | Ideias futuras, não bloqueiam esta entrega. | Afonso |
| Novos cupons e marketing | Cofre de cupons segue desligado; não ativar automaticamente. Artes sociais/marketing dos segredos continuam futuros. | Afonso / artista |
| Cookies | Fora desta rodada por decisão explícita; não reabrir como bloqueio. | Fora de escopo |

## Itens resolvidos que não devem voltar para a fila

- Contadores: Afonso confirmou SQL que inclui GM; usar maestria total, não o antigo nível armazenado. Prancheta mais recente registra fechamento. Não repetir valores antigos como leitura de hoje.
- Planos sem baús e renovação com ouro: dez verificações retornadas OK pelo Afonso; teste local agora também passa.
- Limpeza Supabase: Afonso confirmou dez alvos e função antiga. Não apagar novas tabelas por estarem vazias.
- Virada de ciclo às 4h e dia inicial 1: registrados no AAB 110; nenhuma mudança nesta rodada.
- Onboarding: identidade/faixa etária antes do propósito registrados no 110. Não equivale a comprovação documental da idade.

## Testes de aparelho/conta separados da implementação

Permanecem na lista humana: compra/recibo Google Play, reembolso, push/cor neutra nos temas Android, sensação dos haptics e encaixe das skins no app. Recuperação precisa conta própria com senha (a conta Google não demonstra esse fluxo); exclusão final exige uma conta descartável e fluxo concluído. Não enviados e-mails nem apagadas contas nesta revisão.

## Próximo checkpoint, push e AAB

Afonso pediu expressamente que incluam também o trabalho da outra IA. Conferir todos os commits e alterações dos dois agentes no checkout antes de fechar a versão. Não fazer commit seletivo que deixe funcionalidades necessárias fora do build; separar arquivos fonte/arte final de originais de geração e capturas. Preservar alterações alheias.

AAB 111 continua pendente. A compilação desta rodada foi web, não Android. Na hora do release: estabilizar checkout, conferir SQLs/deploys necessários, rodar build completo/sync/Gradle, verificar versão, assinatura e hash; só então informar o artefato. Não publicar a landing com link Play ou web inventado.

## Atualização de release

Após a revisão, Afonso confirmou que executou sql/temporadas-2027-artes.sql e autorizou commit, push e AAB 111 com as mudanças dos dois agentes. O resultado do build e hash ficam em docs/2026-10-12-checkpoint-aab-111.md. As indicações anteriores de SQL não aplicado descrevem a etapa anterior à confirmação.
