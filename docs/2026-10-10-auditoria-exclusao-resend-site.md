# Revisão: exclusão, Resend e glyph.life — 10/10/2026

## Escopo e evidência

App: `C:/Users/Afonso/Downloads/GOL1.006`. Site: `C:/Users/Afonso/Desktop/glyph-landing`.
Leitura do código e inspeção direta do site publicado no navegador. Sem envio de pedidos, exclusão de contas, e-mails, mudanças de plano ou deploy.
`node tests/apagar-conta.regression.mjs` passou; é teste de código, não prova de exclusão em produção.
O painel Resend abriu no login. Plano contratado, consumo, domínio verificado, fatura de US$10 e entrega real de e-mail permanecem não verificados.

## 1. Exclusão: o que existe e o que falta

- `views/SettingsView.tsx`: exige confirmação digitada, chama `deleteMyAccount`, só informa sucesso após resposta da função e encerra a sessão.
- `supabase/functions/account-delete/index.ts`: autentica o usuário, registra pedido, tenta limpar Storage, executa limpeza SQL, remove Auth e tenta enviar confirmação. Falha de e-mail não bloqueia a exclusão.
- A limpeza de arquivos falha de forma tolerada. Porém o resultado registra `completed` mesmo se houve falhas no Storage; não encontrei nesse fluxo fila persistida com os objetos pendentes para retentativa. O texto do e-mail afirma exclusão de todos os dados associados, mais forte do que a evidência desse caminho.
- A limpeza SQL e a remoção em Auth são passos separados. Se Auth falhar depois do SQL, pode sobrar uma identidade sem os dados do perfil. Precisa retentativa por etapa e prova final, não só um booleano.
- O formulário LOCAL de `exclusao.html` insere em `account_deletion_web_requests`. Faz até quatro tentativas com colunas diferentes, sem chave idempotente. Essa compatibilidade improvisada não é um contrato estável; erro de conexão após gravação pode provocar duplicação.
- A página PUBLICADA `/exclusao.html` redirecionou para `/exclusao` e mostrou orientações e e-mail, SEM formulário. Não confundir o arquivo local com o serviço disponível ao usuário.
- Não foi localizado processador de `account_deletion_web_requests` nos caminhos pesquisados do app. O formulário, sozinho, é recebimento de pedido; não é exclusão automática.

### Integração proposta

1. Uma fila administrativa com protocolo e estados explícitos: recebido, aguardando comprovação, autorizado, processando, limpeza pendente e concluído.
2. Pedido autenticado usa a identidade da sessão; pedido público nunca apaga só por conhecer o endereço de e-mail. Comprovação por sessão autenticada, link de uso único ou atendimento quando a pessoa perdeu acesso ao e-mail.
3. Uma rotina comum executa a exclusão autorizada. Cada etapa tem resultado persistido e retentativa idempotente. Storage pendente deve permanecer acompanhável mesmo após apagar o usuário.
4. O site recebe um protocolo opaco e uma resposta genérica, sem revelar se aquele e-mail possui conta. Aplicar limites contra abuso e não tornar a fila consultável anonimamente.
5. Confirmação de recebimento e confirmação de conclusão são mensagens diferentes. E-mail é canal auxiliar, nunca a condição para finalizar uma exclusão já autorizada.
6. Validar em conta descartável: conta comum, líder de clã, uploads, registros de competição, falha de e-mail, falha de Storage, repetição de pedido e interrupção entre SQL/Auth. Definir dados legalmente retidos e separá-los da promessa de eliminação.

## 2. Resend

No código atual, a função `resend` aceita envio apenas de `account_deleted` com as flags de confirmação. Nos emissores pesquisados, o uso direto encontrado é a confirmação de exclusão. Isso não comprova a configuração de SMTP do Supabase Auth nem outros projetos da mesma conta Resend.

Pontos técnicos a corrigir antes de considerar fechado:
- O handler não faz sua própria autorização de chamador; verificar a configuração implantada do gateway e limitar a execução a backend autorizado. Não assumir que JWT válido equivale a permissão para enviar para qualquer destinatário.
- A reserva de `notification_email_dispatches` acontece antes do envio. Uma falha posterior deixa a reserva; a próxima tentativa pode virar `duplicate_dispatch` e nunca reenviar. Precisa estado de tentativa/entrega e retentativa, não apenas existência da chave.
- A resposta da API comprova aceitação do envio, não entrega na caixa postal. Nomear o estado adequadamente ou acompanhar eventos do provedor.

Preços públicos consultados em 10/10/2026:
- Free transacional: 100 e-mails por dia e 3.000 por mês; enviados e recebidos contam. Cada destinatário conta. Limite diário reinicia em UTC.
- Free: até 3 domínios verificados. Marketing tem cota distinta de contatos; não é necessário contratar marketing para confirmar exclusões pela API `/emails`.
- A página de preços descreve excedentes pagos como opção de plano pago, configurável em Transactional Overages. Conferir isso na conta, não inferir a configuração pela documentação.
- US$10 relatados pelo usuário não identificam o produto cobrado. Não atribuir a add-on específico sem fatura.

Recomendação: manter só envio transacional necessário, sem add-ons ou excedente pago se o volume couber no Free. Confirmar plano/fatura/consumo e SMTP antes de remover Resend. Para excluir dentro do app, e-mail não é requisito técnico; para confirmar identidade sem login, é uma opção útil, com alternativa de atendimento.

Fontes: https://resend.com/pricing ; https://resend.com/docs/knowledge-base/account-quotas-and-limits

## 3. Site: apresentação e prints

### Confirmado

- Manifesto `assets/current/screens/manifest.json`: versão 1.0.98, 02/10/2026, 430×932, dados sintéticos/interceptados. Os caminhos dessa série são usados na Home publicada. Não são prova do Android atual.
- A Home repete Arenas e Planner nas etapas de apresentação e na seção seguinte; depois dá grande espaço à placa e ao veredito.
- Abertura ocupa a primeira tela com marca/slogan; o produto aparece depois. A marca pode permanecer, mas precisa dividir espaço com uma prova visual legível do uso.
- “17 frentes do produto” é linguagem interna e sinal de complexidade; não comunica resultado para o visitante.
- Textos “Reserve tempo para fazer”, “O Planner dá hora às ações” e “Encaixe ações nos horários disponíveis” omitem a conclusão sem agendamento. A apresentação do ciclo também parece uma etapa obrigatória.
- Waitlist publicada mostra `-- pessoas na fila`. O código local consulta a tabela diretamente e não apresenta estado de falha útil; a causa exata no backend não foi comprovada.
- Rodapé da Home tem links sociais `#`; os Termos têm URLs reais. Rodapé da Home não apresenta acesso direto à exclusão e suporte.
- O CTA principal abre `app.glyph.life`; a constante local chamada `PLAY_STORE_URL` também aponta para o app web. Não rotular esse caminho como instalação Android.

### Direção editorial proposta

Manter a identidade escura/dourada e a ideia de império, mas explicar o uso em linguagem cotidiana.

**Título sugerido:** “Dê direção ao seu dia. Veja seu progresso ganhar forma.”

**Texto de apoio:** “Organize o que importa, conclua ações no seu ritmo e acompanhe sua evolução. Agende quando ajudar — ou faça direto do estoque.”

Sequência da Home:
1. Uma captura atual do Planner/estoque com uma ação compreensível, texto curto e CTA real.
2. Organizar prioridades nas Arenas; uma captura específica e distinta.
3. “Com ou sem ciclo”: progresso livre e ciclo como período escolhido para acompanhar metas.
4. Oráculo: leitura útil, reação a avanço e Sabedoria; captura atual da nova marca, sem promessa de assistente irrestrito.
5. Personalização/progresso: perfil, patente e recompensa como expressão da jornada, não uma página inteira de julgamento.
6. Social/convites e perguntas práticas; só então catálogo detalhado de recursos em Descubra.

Capturas a renovar: Planner com estoque e horários; Arenas com resumo do ciclo; Oráculo com régua atual; Mundo/temporadas; perfil com fundos e Soberano atuais; um fechamento representativo. Identificar dados demonstrativos e indicar a plataforma. Usar recortes legíveis, sem reproduzir a mesma tela em três seções.

Não foi feita auditoria exaustiva de cada funcionalidade anunciada, nem geradas novas capturas do app nesta rodada.

## 4. Termos: redação preparada, não publicada

Confirmado na versão publicada: falta idade mínima; não há procedimento claro de arrependimento/reembolso; foro contém literalmente `PREENCHER`.

Idade escolhida pelo usuário: **13 anos**.

**Minuta de elegibilidade, sujeita à adequação do produto:** “O Glyph destina-se a pessoas com 13 anos ou mais. O uso por menores de 18 anos deve contar com a participação e autorização do responsável legal, observadas as regras aplicáveis e as medidas de proteção adotadas pelo serviço. Não é permitido cadastrar pessoas com menos de 13 anos.”

Não apresentar essa cláusula como solução completa. Avaliar cadastro/idade, privacidade, contato entre adultos e adolescentes e compras. A Lei 15.211/2025, art. 2º, IV, define caixa de recompensa com aquisição **mediante pagamento** e conteúdo aleatório; o art. 20 restringe essas caixas nos jogos abrangidos. A mera existência de baús gratuitos não permite concluir esse enquadramento. Tampouco foi concluído aqui o enquadramento do Glyph como jogo para essa finalidade.

Conferência adicional dos caminhos de aquisição (código local, sem compra real ou verificação das funções implantadas):
- `constants/billingCatalog.ts`: produtos por dinheiro são pacotes de ouro e planos Premium/Platinum; não há SKU de baú avulso.
- `supabase/functions/google-play-purchase/index.ts`: o pagamento do plano chama `process_approved_membership_payment`. A definição encontrada em `20260402113000_add_direct_membership_pix_checkout.sql` concede Raro ao Premium e Season + Raro ao Platinum. O catálogo `constants/goldCatalog.ts` anuncia Lendário + Raro ao Platinum: divergência a conferir, sem presumir equivalência entre Season e Lendário.
- `components/Store/ItemsStore.tsx` oferece baús por fragmentos, usando `buy_chest_with_fragments`: Comum 24, Incomum 72, Raro 240, Épico 720, Lendário 2400. Não é venda direta por reais; não foi concluído nesta checagem o rastreamento de todas as origens/conversões de fragmentos.
- A questão jurídica específica é a recompensa aleatória vinculada ao plano pago e eventuais caminhos indiretos de pagamento, não todo baú recebido por uso. Chamar a recompensa de bônus não estabelece, por si só, uma exceção legal. Exige avaliação do enquadramento; nenhuma irregularidade foi concluída nesta auditoria.

**Minuta de arrependimento:** “Nas contratações abrangidas pelo art. 49 do Código de Defesa do Consumidor, você poderá exercer o direito de arrependimento no prazo de 7 dias, contado da contratação ou do recebimento do produto ou serviço, conforme aplicável. Para solicitar, utilize o fluxo de reembolso do Google Play ou contate glyph.life.app@gmail.com, informando o identificador do pedido e a data da compra. Nunca envie senha ou dados completos do cartão. O suporte auxiliará no processamento pelo canal de pagamento. Esta disposição não limita outros direitos previstos em lei.”

Complementar: cancelamento de renovação, pedido de reembolso e exclusão da conta são operações diferentes. Não prometer que excluir a conta cancela uma assinatura sem comprovar a integração com a loja. Não condicionar o direito legal a um prazo menor do fluxo padrão da Play nem afirmar perda automática desse direito por ativação de conteúdo digital. Revisão jurídica recomendada antes da publicação final.

Para foro, substituir o placeholder por redação que respeite a competência legal e os direitos do consumidor; não inventar comarca.

Fontes: https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm (art. 49); https://support.google.com/googleplay/answer/2479637?hl=pt-BR ; https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15211.htm

## Ordem de execução sugerida

1. Conferir conta Resend e configurar gasto previsível; não remover e-mail de autenticação por acidente.
2. Fechar fila/verificação/retentativa da exclusão e testar conta descartável de ponta a ponta.
3. Publicar a página de exclusão correspondente ao fluxo validado.
4. Revisar Termos/Privacidade e alinhar a implementação ao público 13+.
5. Atualizar capturas e narrativa da landing; validar links/CTA/contador em desktop e celular antes de publicar.
