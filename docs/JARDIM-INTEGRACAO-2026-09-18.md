# Jardim principal: materiais aprovados e areia com cache

O acesso normal do perfil continua usando Garden3DModal e o protocolo de conta
existente. O botão experimental foi removido. A cena principal passou a usar
QualityGardenProvider/QualityGardenObjects: árvore full, rocha leve, caminhos,
bambu, lanterna e ponte derivados das fontes aprovadas do estudo. Os temas
starter/luxury/genesis compartilham arquivos e variam materiais; as miniaturas
do inventário usam o mesmo renderizador. Água, terreno, artefatos e as demais
peças continuam seguindo a geometria funcional do jardim principal.

Os quatro modelos principais, posições e dimensões dos jardins existentes foram
preservados; não há migração destrutiva dos desenhos nem conversão dos jardins
salvos para o retângulo fixo do estudo. Novos jardins começam com areia clara e
ambiente aberto; escolhas salvas são respeitadas. O modo externo, entrada,
caminhada, edição, compras e salvamento continuam no fluxo existente.

## Areia

- Um desenho restaurado e intocado devolve suas URLs originais ao salvar. Isso
  evita exportar/recomprimir o canvas e reenviar PNGs depois de reabrir.
- Ao desenhar, o canvas exporta os PNGs. O upload usa SHA-256, com 64 bits em
  decimal na versão da URL, compatível com o SQL atual (até 20 algarismos).
- O hash anterior era FNV em base 36, incompatível com a expressão numérica
  do validador SQL. A correção não exige nova migração.
- Mesmo hash na sessão reutiliza URLs; falha de upload não marca sucesso.
- Arquivos continuam nos dois caminhos por usuário, com cache de um ano e
  versão por conteúdo. Não houve mudança de bucket, RLS ou RPC.

## Verificação local

- TypeScript do jardim e regressões de modelos/colisão: aprovados.
- Fluxo de conta no navegador: inventário, bloqueios de bases/coleções, editar,
  salvar, reabrir desenho exato e recuperar falha: aprovado com conta fictícia.
- Coleções e posicionamento: aprovados.
- Documento compilado: modelos locais, três temas, URLs da areia intocada,
  desenho alterado e visita somente leitura: aprovados sem erros de página.
- Hash/upload mockado: versão numérica, repetição sem upload, URLs persistidas,
  alteração e nova tentativa após falha: aprovados.
- Build completo e orçamento de assets do jardim principal (2 MiB, sem contar
  o acervo preexistente de artefatos): aprovados.

Esses testes não são uma validação em Android nem uma gravação real no Supabase.
