# LEGAL REVIEW - GLYPH

Revisado em: 2026-03-12
Escopo: este arquivo resume o estado atual do app, os principais gaps de compliance e o passo a passo tecnico para adequar termos, privacidade e direitos do usuario sem mudar a UI neste momento.

Aviso rapido: isto nao substitui assessoria juridica formal. E um mapa tecnico-operacional para reduzir risco e alinhar o produto ao que o codigo realmente faz hoje.

## 1. O que o app faz hoje

Pelo codigo atual, o GLYPH:

- cria conta por email/senha e por Google OAuth;
- armazena perfil, nickname, avatar, configuracoes e progresso em Supabase;
- sincroniza arenas, acoes, tarefas, ciclos, relatorios, inventario e outros dados no servidor;
- possui recursos sociais como amizades, claas, mentoria e mensagens diretas;
- permite upload de imagens e hoje gera URL publica para esses arquivos;
- envia contexto do Oraculo para um fornecedor externo de IA via OpenRouter;
- processa pagamentos por Mercado Pago e grava compras no backend.

Resumo pratico: o produto nao e "somente local". Ele e um app com sincronizacao em nuvem, recursos sociais, IA terceirizada, uploads e pagamentos.

## 2. Principais gaps de compliance

### 2.1 O selo atual promete mais do que o app entrega

O texto atual do pacto fala em:

- "local-first" de forma absoluta;
- nao minerar a vida do usuario;
- exclusao definitiva "sem rastro";
- visualizacao parcial e controlada na mentoria.

Hoje o codigo mostra um cenario diferente:

- ha sincronizacao ampla no servidor;
- ha compartilhamento social por recursos de amizade, mentoria, claas e DMs;
- uploads geram URL publica;
- o botao de deletar conta ainda nao apaga a conta de verdade;
- o Oraculo envia prompt/contexto para terceiro.

Conclusao: o texto atual precisa sair dos absolutos e passar a funcionar como resumo honesto de aceite.

### 2.2 Nao existe politica de privacidade publicada de verdade

Hoje:

- a tela de configuracoes mostra "Privacidade", mas abre placeholder;
- o login e cadastro coletam dados antes de exibir links claros para termos e politica;
- nao ha pagina publica/canonica de termos e politica no app.

### 2.3 O aceite nao e auditavel

Atualmente o aceite e tratado como flag de perfil. Falta:

- versao do texto aceito;
- data e hora do aceite;
- log minimo de prova;
- separacao entre aceite do resumo curto e referencia aos documentos completos.

### 2.4 O fluxo de exclusao nao honra o que promete

Hoje o botao "Deletar Conta" apenas mostra um alert. Isso e especialmente perigoso porque o texto atual promete exclusao completa e imediata.

### 2.5 O app nao explica bem compartilhamentos com terceiros

Pontos que precisam estar claros para o usuario:

- Supabase como infraestrutura, banco, auth e storage;
- Google como provedor de login, quando usado;
- OpenRouter/modelo de IA no Oraculo, quando habilitado;
- Mercado Pago no fluxo de pagamento;
- possivel exposicao por link de arquivos enviados para buckets publicos.

### 2.6 O texto atual nao identifica controlador nem contato

Para um app em operacao real, faltam no minimo:

- nome/razao do responsavel pelo app;
- email ou canal de contato de privacidade;
- informacao sobre direitos do titular;
- explicacao resumida de retencao e exclusao.

## 3. Fontes legais de referencia

- Marco Civil da Internet - Lei 12.965/2014:
  https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm
- LGPD - Lei 13.709/2018:
  https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- ANPD - orientacoes sobre aviso de privacidade:
  https://www.gov.br/anpd/pt-br/acesso-a-informacao/aviso-de-privacidade

## 4. Passo a passo do que precisa mudar no app

Este e o plano tecnico recomendado para "honrar" privacidade, aceite e transparencia no produto.

### Passo 1 - Publicar documentos canonicos

Objetivo:
- ter Termos de Uso e Politica de Privacidade completos, acessiveis e versionados.

O que fazer:
- criar paginas ou rotas publicas para `Termos de Uso` e `Politica de Privacidade`;
- incluir versao e data em cada documento;
- identificar controlador, contato, parceiros, direitos, retencao, pagamento e regras de uso.

Onde mexer:
- `public/` ou rotas equivalentes;
- links a partir de `views/LoginView.tsx`;
- links a partir de `views/SettingsView.tsx`;
- referencia no resumo curto de `components/AppRuntimeOverlays.tsx`.

### Passo 2 - Trocar o texto do selo por um resumo honesto

Objetivo:
- manter a experiencia ritualistica sem criar promessa juridica falsa.

O que fazer:
- substituir o texto atual do overlay por um resumo curto;
- parar de usar frases absolutas como "sem rastro", "so local", "nao mineramos sua vida" sem lastro tecnico;
- deixar claro que o selo e resumo e que os documentos completos seguem disponiveis.

Onde mexer:
- `components/AppRuntimeOverlays.tsx`.

### Passo 3 - Registrar aceite com versao, data e origem

Objetivo:
- provar o que foi aceito e quando.

O que fazer:
- adicionar colunas como:
  - `terms_version`
  - `terms_accepted_at`
  - `privacy_version`
  - `privacy_accepted_at`
- opcionalmente registrar tambem:
  - `terms_accept_source`
  - `privacy_accept_source`
- gravar esses dados no momento do aceite.

Onde mexer:
- migracao em `supabase/migrations/`;
- `components/AuthenticatedApp.tsx`;
- camada de persistencia em `services/SupabaseService.ts` ou equivalente.

### Passo 4 - Mostrar links legais antes de login e cadastro

Objetivo:
- nao coletar email, senha ou OAuth sem dar acesso facil aos documentos.

O que fazer:
- adicionar links visiveis para Termos e Politica abaixo do botao principal e do botao do Google;
- incluir frase simples do tipo:
  "Ao continuar, voce concorda com os Termos de Uso e a Politica de Privacidade."

Onde mexer:
- `views/LoginView.tsx`.

### Passo 5 - Implementar Central de Privacidade real

Objetivo:
- trocar placeholder por funcionalidade minima.

O que fazer:
- substituir o modal placeholder por uma central com:
  - links para Termos e Politica;
  - estado do aceite;
  - canal para solicitacao de acesso/correcao/exclusao;
  - informacao sobre IA, uploads e pagamentos;
  - preferencia para recursos opcionais, se aplicavel.

Onde mexer:
- `views/SettingsView.tsx`.

### Passo 6 - Implementar exclusao de conta de verdade

Objetivo:
- alinhar UX, backend e documento legal.

O que fazer:
- criar fluxo real de exclusao/anonymizacao;
- apagar ou anonimizar dados de tabelas relacionadas;
- remover ou invalidar conta em auth;
- documentar excecoes legais e tecnicas de retencao;
- registrar pedido e conclusao em log interno.

Onde mexer:
- novo endpoint/edge function em `supabase/functions/`;
- fluxos de confirmacao em `views/SettingsView.tsx`;
- possiveis utilitarios em `services/SupabaseService.ts`.

Observacao:
- se houver registros que precisem ser preservados por obrigacao legal, antifraude ou conciliacao financeira, isso deve ser descrito na politica.

### Passo 7 - Corrigir privacidade de uploads

Objetivo:
- nao prometer privacidade onde hoje existe URL publica.

O que fazer:
- revisar o bucket `user-images`;
- se o conteudo for privado, migrar para bucket privado + signed URLs;
- definir o que pode ser publico por design e avisar isso ao usuario.

Onde mexer:
- `components/inputs/ImageUploadSlot.tsx`;
- configuracoes de storage no Supabase;
- texto legal de privacidade.

### Passo 8 - Explicar e controlar o uso do Oraculo

Objetivo:
- dar transparencia ao uso de IA e a dados enviados para terceiro.

O que fazer:
- informar que prompts e contexto do usuario podem ser enviados a provedor externo de IA;
- permitir desativar IA se esse recurso for opcional;
- limitar o contexto enviado ao minimo necessario;
- revisar logs para nao armazenar mais do que o necessario.

Onde mexer:
- `components/OracleChat.tsx`;
- `components/OracleSettingsModal.tsx`;
- `supabase/functions/oracle/index.ts`;
- politica de privacidade.

### Passo 9 - Corrigir transparencia do pagamento

Objetivo:
- alinhar checkout, texto legal e fluxo financeiro.

O que fazer:
- remover dados hardcoded de sandbox em producao;
- avisar claramente que se trata de compra de item/credito digital;
- informar quando o credito entra, em que hipoteses pode haver falha e como o usuario aciona suporte;
- incluir termos comerciais minimos no documento completo.

Onde mexer:
- `components/Store/MercadoPagoBrick.tsx`;
- `supabase/functions/mercadopago/index.ts`;
- documento de Termos de Uso.

### Passo 10 - Revisar compartilhamento social e mentorias

Objetivo:
- refletir o que realmente e visivel para amigos, mentores e outros usuarios.

O que fazer:
- mapear exatamente quais campos de perfil, progresso, mensagens e relacoes sao compartilhados;
- transformar isso em regra tecnica e texto juridico;
- evitar dizer "diarios privados permanecem ocultos" sem garantir isso em todas as telas e consultas.

Onde mexer:
- `views/SettingsView.tsx`;
- consultas em `contexts/GameContext.tsx`;
- modais/fluxos de mentoria e social.

### Passo 11 - Criar trilha interna de compliance

Objetivo:
- ter log interno sem mexer na experiencia visivel agora.

O que fazer:
- registrar aceite de termos/politica;
- registrar pedidos de exclusao;
- registrar exportacoes/solicitacoes de privacidade;
- registrar versoes ativas dos documentos.

Onde mexer:
- novas tabelas ou colunas em `supabase/migrations/`;
- services/backend;
- sem necessidade de alterar UI imediatamente.

## 5. Prioridade sugerida

Ordem mais segura para execucao:

1. publicar Termos e Politica;
2. trocar o texto do selo;
3. adicionar links legais no login;
4. salvar aceite com versao e data;
5. implementar Central de Privacidade;
6. implementar exclusao real;
7. corrigir uploads publicos;
8. ajustar IA e pagamento;
9. revisar compartilhamentos sociais.

## 6. Texto curto recomendado para o selo

O resumo curto recomendado esta em `termos.md`.

## 7. Conclusao

Hoje o GLYPH ja tem um bom esqueleto de produto, mas o discurso juridico esta mais forte do que a implementacao real. O caminho correto e:

- publicar documentos completos;
- usar no selo apenas um resumo fiel;
- registrar aceite direito;
- implementar exclusao, privacidade e transparencia de terceiros de forma real.

So depois disso vale dizer que o app esta operando com base legal e com uma postura mais madura de privacidade.
