# Plano de teste e lancamento

## Visao do Glyph

O **Glyph e um sistema para transformar a vida real em progresso visivel**. A pessoa organiza o que importa em cinco areas, cria arenas e acoes, escolhe um ciclo possivel e registra o que realmente fez. No centro esta o **Oraculo**, um parceiro atento que conhece seu ritmo, percebe atrasos, reconhece conquistas e oferece o toque certo na hora certa, sem controlar sua vida. O valor nao esta apenas em planejar, mas em transformar cada acao registrada em dados pessoais, reflexoes uteis, evolucao e uma memoria bonita da propria trajetoria.

Ele deve ter a simplicidade, a forca de habito e o potencial viral que fizeram do **Duolingo** um fenomeno: progresso sempre visivel, pequenas recompensas, celebracoes, sequencias e vontade de voltar amanha. Mas essa dopamina precisa servir a vida real, nao prender a pessoa numa tela. Concluir algo deve levar segundos; fechar um ciclo deve ser emocionante; compartilhar uma conquista deve ser natural. **Menos cobranca e configuracao, mais execucao, consciencia e recompensa. O usuario nao volta para alimentar o aplicativo: volta porque o Glyph faz sua propria vida parecer mais clara, valiosa e possivel.**

## Estado confirmado em 13/08/2026

- Versao Android `1.0.57` gerada e enviada ao GitHub.
- AAB release assinado e pronto para instalar ou enviar ao teste fechado.
- SQLs e migracoes desta rodada ja foram executados no Supabase.
- A funcao `widget-action` pode ser publicada sem gerar outro AAB.

## Ordem para amanha

### 1. Teste completo em aparelho real

- Abrir o app pela tela de Ativos.
- Fazer onboarding, criar arena, criar acao e iniciar ciclo.
- Testar planner em grade e lista simples, inclusive alternando entre os modos.
- Completar, desfazer, remarcar e mover acoes, inclusive em dias anteriores.
- Confirmar que apenas acoes ja julgadas ficam travadas.
- Fechar ciclo e conferir a fila: relatorio, missao, nivel e Legado, sem sobreposicao.
- Testar Oraculo, Rest Screen e widget, incluindo concluir uma acao sem abrir o app.
- Testar exclusao de conta e novo login.

### 2. Monetizacao no teste fechado

- Comprar moedas com usuario de teste.
- Confirmar que a compra aparece no Play Console.
- Confirmar que as moedas entram uma unica vez na conta.
- Reabrir o app e verificar que o saldo permanece correto.
- Testar Premium e restauracao em um segundo aparelho ou reinstalacao.
- Nao liberar producao antes de provar cobranca, entrega, protecao contra duplicidade e restauracao.

### 3. Recursos sociais

- Testar cla com duas contas: convite, aceitar, remover e contribuicao apenas ao fechar ciclo.
- Testar mentoria: convite, aceite, visibilidade e observacao sem o mentor criar tarefas.
- Testar parceria: convite, aceite e arenas dos dois lados.
- Testar competicao: inicio, progresso, encerramento e recompensa.
- Manter escondido no lancamento qualquer fluxo que nao passar inteiro.

### 4. Retoques finais

- Primeira experiencia deve gerar algo util em poucos minutos.
- Oraculo deve falar pouco e reagir a progresso real, atraso ou arena vazia.
- Nunca mostrar dois modais importantes ao mesmo tempo.
- Conferir Legado com ciclo curto e ciclo acima de sete dias.
- Revisar caracteres quebrados, textos, botoes pequenos e areas de toque.
- Observar egress e erros durante o teste fechado antes de ampliar usuarios.

## Criterio de liberacao

O app pode seguir para producao quando o fluxo principal, monetizacao e exclusao de conta passarem em aparelho real, e quando recursos sociais que continuarem visiveis tiverem sido validados com duas contas.
