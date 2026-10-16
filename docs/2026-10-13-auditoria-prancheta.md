# Conciliação da prancheta — 13/10/2026

Afonso pediu conferir o que já foi feito e atualizar a lista principal. Isso autoriza a consolidação local, substituindo a orientação anterior de escrever apenas recados. A cópia do claude.ai não foi alterada.

## Evidência consultada

- `docs/PRANCHETA.md`: listas e histórico completo de atualizações.
- Conversa “Corrigir contagem dos dias do ciclo”: últimos dez turnos, incluindo confirmação de SQL, autorização/resultado de push e AAB, conquistas, itens repetidos e gestos.
- Checkpoint `docs/2026-10-12-checkpoint-aab-111.md`, documentos de e-mails, integração de temporadas e handoff das dicas do Oráculo.
- Git local até `7a80616`; alterações ainda não commitadas preservadas.
- Arquivo AAB 111: SHA-256 recalculado, `0D2288FB17C42F0A1BB3B8A8CC04D209370B96403AB8B2E4623767CE4DD406A2`, igual ao checkpoint. Assinatura/manifesto são evidências do checkpoint anterior, não novamente executadas nesta auditoria.
- Leitura HTTP direta de `https://www.glyph.life/`: Home, `termos.html`, `script.js`, `novidades.html` e `exclusao.html` retornaram 200. Todos correspondem aos arquivos locais, normalizadas as quebras de linha; script, Novidades e exclusão também coincidem literalmente. A ferramenta de pesquisa havia retornado uma Home antiga em cache; a comparação HTTP direta resolveu essa divergência.
- Código local do `account-delete`, página de exclusão, fluxo da missão do clã e documentação das temporadas.
- TypeScript e `tests/planner-gestures.browser.mjs` passaram novamente nesta conversa. O teste do navegador precisou executar fora do sandbox, onde o Edge inicialmente fechava antes do teste.

## Reconciliação das 27 caixas antigas

| Item antigo | Resultado da revisão |
|---|---|
| Idade nos Termos | Concluído: texto publicado e reconferido. |
| Reembolso nos Termos | Concluído: texto publicado e reconferido; não é teste de reembolso. |
| Compra/recibo Google Play | Confirmação externa, separada sem cobrança agora. |
| Banner de cookies | Mantido fora da rodada por decisão anterior. |
| Contador da fila | Correção publicada: script chama `get_waitlist_count`. Total atual do banco não consultado. |
| Teste final de excluir conta | Confirmação externa, separada. |
| Exclusão completa app/site | Parcial: permissões/e-mails/tratamento já existem; página ainda abre `mailto:` e falta recuperação da limpeza parcial. |
| Teste de reembolso | Confirmação externa, separada. |
| Resend/cobrança/configuração | Etapa encerrada pelos registros de painel, esclarecimento de Afonso e deploy. Entrega real separada. |
| Revisão/publicação do site | Publicado; arquivos reconferidos. Não confundir com o fluxo de exclusão ainda incompleto. |
| Recuperação de senha real | Confirmação externa, separada. |
| Tremor horizontal do Planner | Mantido: existe correção antiga marcada feita e relato posterior reaberto; falta prova de resolução desse relato específico. |
| Fluidez/haptics do Planner | Implementação concluída; teste de gestos reconferido. Sensação física separada. |
| Gerar AAB 111 | Concluído, hash confirmado. Removida atribuição incorreta de mudanças posteriores. |
| Mexer no clã | Implementação de missão/tela concluída; aviso do Oráculo ao atingir meta passa a item específico. |
| Rankings/interatividade | Decisão ainda aberta nos registros, sem inferir solução a partir da tela de clã. |
| Jardim progressivo | Ideia futura, mantida. |
| Ordem do feed Reino | Melhoria futura, mantida; feed com duas abas já existe. |
| Comparação com média de EXP | Ideia futura, mantida; sem evidência de conclusão nos registros consultados. |
| Link/tag de perfil | Ideia futura, mantida. |
| Push com título/cor no celular | Confirmação externa, separada. |
| Cor neutra no Android | Confirmação externa, separada. |
| Gerar artes futuras | 12 bordas/banners/insígnias concluídas e integradas; escopo explicitado. Conteúdo incompleto das temporadas separado. |
| Ajustar skins futuras | Pendente conforme material de revisão, sem encaixe final aprovado. |
| Cupons novos | Cofre preparado; escolha/ativação mantida pendente, nenhuma ativação nesta revisão. |
| Segredos no marketing | Mantido como decisão de marketing. |
| Artes Instagram/TikTok | Mantido; artes de catálogo não comprovam esta entrega. |

## O que a lista principal não mostrava

- Conquistas secretas por evento e apresentação de itens repetidos: implementadas localmente, com testes anteriores registrados. Não estão no AAB 111.
- Zoom 1x e widget Resumo/Planner: commits `185428e` e `0c157c0`, descendentes do release `ce54428`, portanto posteriores ao pacote existente. O hash preservado confirma que não houve substituição desse artefato pelo checkout atual.
- Ajustes posteriores de planos/EXP, coroas, mentoria e busca de campanhas; clã em três abas. Implementação local registrada, sem inferir implantação remota das mudanças de servidor.
- Handoff de dicas do Oráculo: especificação existente, implementação do motor não encontrada. Buscar campanha já existe e não deve ser refeito.
- Futuras temporadas: artes de interface entregues não completam skins, temas e jornadas.
- Próximo checkpoint/AAB listado como acompanhamento; nenhum build, commit, push ou publicação executado nesta revisão.

## Critério para manter uma caixa aberta

Não transformar ausência de prova em afirmação de falha. Afonso pediu “relaxa sobre isso” ao ser perguntado sobre Play, compra/reembolso, recuperação, exclusão e push: essas confirmações ficam separadas, sem cobrança agora e sem marcar como testadas por inferência.

Resultado: 16 itens abertos de implementação/decisão (incluem ideias futuras e cookies fora da rodada), 67 caixas concluídas e 8 confirmações externas. Contagens são de caixas, não de funcionalidades únicas; os itens históricos preservados podem se sobrepor. O cabeçalho anterior dizia 78, mas havia 81 caixas antes desta consolidação.

Nenhuma conta real alterada, e-mail enviado, SQL aplicado, configuração de serviço modificada ou arquivo de produção editado. Apenas documentação local foi consolidada.

## Ajuste posterior de Afonso em 13/10

A contagem de 16/67 acima é o retrato da primeira consolidação. Após a orientação seguinte: ranking/interatividade e média de EXP viraram um único item para a mesma rodada; feed atual foi confirmado pronto; avaliação do perfil foi encerrada com recomendação de usar o nickname e o compartilhamento já existentes. Contagem atual: **13 itens abertos, 69 concluídos e 8 confirmações externas**. Busca por ID não foi encontrada no fluxo atual; cartão compartilhado não equivale a link direto para abrir o perfil. Apenas documentação alterada.
