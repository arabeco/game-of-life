# Estudo de copa cheia — evidências locais

## PASS

- `npx tsc -p tools/zen-quality/tsconfig.json`.
- `npm run build:garden-experiment` (aviso de chunk Three.js acima de 500 KB).
- `node tools/zen-quality/pipeline/verify.mjs`, nos fontes e com `--embedded`.
- `npm run test:egress-estatico`; build experimental: 12.715.379 bytes,
  abaixo do teto existente de 14 MiB. Inclui as quatro qualidades para comparação.
- Renderização WebGL observada no navegador: duas árvores novas, rocha, sulcos e
  bosque com variações. A copa foi revisada após uma primeira candidata ficar rala;
  a ampliação final é 2,65 / 3,45 por folha. A aparência tem folhas maiores e continua
  sujeita à escolha visual do Afonso.
- Bosque principal: seis árvores/nove pedras, seis geometrias e 18 texturas GPU,
  dez chamadas de desenho incluindo sombras. Alternar para a outra árvore levou a
  nove geometrias, mantendo 18 texturas: as duas malhas têm imagens compartilhadas.
- Interface verificada em viewport estreito; controles de qualidade/composição,
  medições e movimento funcionaram. Não é teste de aparelho físico.
- Build embutido aberto em `/tools/garden-experiment-check.html` no servidor principal
  (porta 3000): Original → Meio-termo anterior → Mais leve carregaram corretamente;
  bosque e movimento ativados; Voltar ao app incrementou o contador de fechamentos
  para 1; reabertura voltou à candidata principal. Nenhum erro de console observado.

## Limites da evidência

- Não foi gerado nem instalado APK/AAB nesta etapa.
- Não houve medição de memória em bytes, temperatura, bateria ou FPS no Android.
- O harness prova o modal e seu ciclo, não a acessibilidade do botão no perfil autenticado.
- Não houve integração das novas malhas com inventário, persistência ou demais itens.
- As nove texturas da árvore são compartilhadas entre versões/instâncias. Ainda não
  há um novo atlas abrangendo famílias distintas de modelos.
- Os GLBs anteriores permanecem para comparação; a redução por modelo ainda não
  significa redução do pacote total enquanto as referências antigas forem incluídas.

## Arquivos

`pipeline/build.mjs`: geração reproduzível a partir dos GLBs locais preservados.
`assets/light/report.json`: medições exatas dos recursos únicos.
`pipeline/verify.mjs`: limites de bytes, decodificação e integridade de referências.
`main.ts`: comparação, instâncias, cache compartilhado, areia localizada e descarregamento.
