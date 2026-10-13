# Glyph — quatro coleções de temporada

Entrega de arte em 12/10/2026: **12 peças**, uma borda, um banner e uma insígnia para cada uma das próximas quatro temporadas. Geradas com a ferramenta integrada `image_gen`; prompts completos em `prompts.json`.

Abra `galeria.html` para comparar temas claro/escuro, ligar/desligar o avatar sob as bordas, ver tamanhos reais e baixar arquivos individuais.

| Temporada | Janela no código | Prefixo dos arquivos | Paleta e símbolo |
|---|---|---|---|
| Zênite I | 01/01 a 20/03/2027 | `zenite-i` | Marfim, ouro e bronze; sol |
| Eclipse I | 20/03 a 21/06/2027 | `eclipse-i` | Obsidiana, prata e vinho; eclipse |
| Égide I | 21/06 a 23/09/2027 | `egide-i` | Aço, azul profundo e branco frio; escudo |
| Aurora II | 23/09 a 21/12/2027 | `aurora-ii` | Jade fumê, prata e esmeralda; folhas e gema |

## Arquivos finais

Para cada prefixo, existem `borda-{prefixo}`, `banner-{prefixo}` e `insignia-{prefixo}`:

- `png/`: 12 PNGs com alpha, bordas e insígnias 500×500; banners 1020×170.
- `webp/`: os mesmos 12 arquivos em WEBP **lossless**, aproximadamente 2 MiB no total. Comparação de pixels visíveis e do alpha passou contra os PNGs finais.
- `sources/`: 12 originais grandes da geração, preservados.
- `qa/`: screenshots em 1280 e 390 px, claro/escuro e tamanhos reais; avatar de referência recortado de um corpo do projeto, não uma foto de usuário.
- `validation.json`: dimensões, tamanhos, transparência e igualdade entre as exportações.

`prepare.mjs` reproduz a preparação usando Sharp: redimensionamento proporcional, margens de segurança, limpeza apenas do ruído de alpha 1/255 e exportação. Não redesenha os itens. `gallery.mjs` gera a galeria; `verify.mjs` verifica a galeria local com Playwright.

## Conferências realizadas

- As quatro bordas têm alpha 0 no centro; também foram verificados todos os pixels de um círculo central de 200 px de diâmetro, sem nenhum pixel opaco. Há uma abertura maior em cada desenho; o círculo testado é uma região conservadora da janela.
- Preview com avatar embaixo confirma que o centro não é um disco preto. A foto mostrada na galeria não está gravada nos assets.
- Nomes dos banners conferidos visualmente: **ZÊNITE I**, **ECLIPSE I**, **ÉGIDE I**, **AURORA II**.
- Leitura inspecionada em bordas de 48 px, insígnias de 40 px e banners com caixa de 52 px de altura.
- Galeria sem overflow a 390/1280 px; arquivos carregam, troca de tema e controle da foto funcionam.

## Integração e versão leve

As 12 artes estão no catálogo local e em public/assets/catalog/interface. Aurora mantém IDs e URLs antigas compatíveis. As outras três coleções têm borda/banner/insígnia; skin, tema e missões continuam pendentes.

release/ contém os WEBPs de produção: 690.824 bytes no total (675 KiB), qualidade 90 e alpha preservado pixel a pixel. Mestres em png/, webp/ e sources/ não são incluídos em public. compress-release.mjs reproduz essa exportação; release-manifest.json registra pesos e dimensões.

SQL manual ainda NÃO aplicado: sql/temporadas-2027-artes.sql. Nove novos itens entram desligados; Aurora preserva economia/ativação. integrate.mjs valida ligações, aliases e arquivos e gera esse SQL limitado aos 12 IDs.

Relatório e pontas soltas: docs/2026-10-12-temporadas-integracao-e-pontas-soltas.md. Galeria e testes locais não comprovam aparência no Android nem entrega no Supabase.

12/10: Afonso confirmou execução do SQL no Supabase. O cadastro não ativa as nove peças futuras. Originais de geração em sources/ continuam preservados localmente; o checkpoint versiona os mestres reduzidos e as versões de produção.
