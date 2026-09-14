# Mundo — experimento standalone

Um diorama vertical com cinco destinos e interfaces fictícias. Todo o experimento está nesta pasta: não importa componentes, rotas, autenticação, dados ou assets do aplicativo nem do Jardim Zen3D.

## Abrir

Com Node.js instalado, execute na raiz do repositório:

```powershell
node mundo-experimento/serve.mjs
```

Abra **http://localhost:3022/**. O servidor atende somente os arquivos desta pasta. Não precisa instalar dependências nem executar o aplicativo. Para trocar a porta no PowerShell, defina `$env:MUNDO_PORT = '3023'` antes do comando.

O `index.html` também foi organizado para abertura direta: scripts clássicos, Three.js incluído e nenhum carregamento remoto. Essa modalidade `file://` não foi validada pela automação, cujo navegador bloqueia esse esquema; a execução verificada foi por HTTP local.

Para testar em um celular na mesma rede, pare o servidor anterior e execute:

```powershell
node mundo-experimento/serve.mjs --lan
```

Abra `http://IP-LOCAL-DO-COMPUTADOR:3022/` no celular. A disponibilidade depende da rede e do firewall local. `Ctrl+C` encerra o servidor.

## Roteiro de teste

1. **Entrar no Mundo:** toque no nome ou na estrutura de um destino e depois na seta de entrada. Arraste suavemente o mapa; use os controles de zoom e centralização.
2. **Jardim do Silêncio:** experimente Construir, Explorar e Coleção. São entradas conceituais: Construir mostra uma composição local e Explorar permite olhar ao redor em primeira pessoa. Não há edição nem caminhada neste experimento. O Jardim funcional anterior continua separado.
3. **Loja:** alterne categorias, abra um item e marque uma ideia. A marcação existe somente na memória da página; não compra, equipa ou salva nada.
4. **Social:** percorra Descobrir, Amigos e Jardins. Visite Pátio de Âmbar, Entre Brumas e Jardim da Aurora; alterne entre vista geral e visão de perto. Em Clã, veja os quatro membros fictícios e visite o espaço coletivo. O botão de retorno recupera a aba Clã.
5. **Hall da Fama:** confira Ranking, Destaques e Conquistas demonstrativos.
6. **Temporada:** abra os detalhes das missões e confira Eventos e Recompensas. Não há registro, resgate ou progressão.

Use a seta de retorno para voltar um nível. `Escape` também retorna. Os painéis têm contenção de foco e a animação respeita a preferência de movimento reduzido.

## Arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `index.html` | Página standalone e camadas da interface |
| `styles.css` | Composição vertical, controles de toque e interfaces 2D |
| `app.js` | Navegação local, painéis, seleção e retornos |
| `data.js` | Destinos, catálogo, membros e três composições fictícias |
| `scene.js` | Geometria procedural, câmeras, animação e descarte gráfico |
| `vendor/three.local.js` | Biblioteca Three.js r185 incluída localmente |
| `vendor/THREE-LICENSE.txt` | Licença MIT da biblioteca |
| `vendor-entry.mjs` | Lista dos exports usados para gerar a biblioteca local; não é carregado pela página |
| `serve.mjs` | Servidor estático opcional, sem dependências |

## Separação e desempenho

- O mapa usa um lote simplificado; as visitas constroem composições próprias a partir de dados locais.
- Um único renderer e uma única cena de conteúdo por vez. Geometrias, materiais e instâncias são descartados nas trocas.
- Folhagem, pedras das bordas e caminhos usam instancing. DPR limitado a 1,25; animação limitada a aproximadamente 30 atualizações por segundo; sombras de 1024 px atualizadas na montagem da cena.
- A renderização contínua pausa nos painéis 2D e com a página oculta. Sem pós-processamento, texturas externas, modelos comprados ou comunicação remota.
- A composição parte do retrato, inclusive em desktop. Não existem banco, Supabase, autenticação, persistência, economia, chat ou multiplayer.

## Verificação realizada

Navegação dos cinco destinos, categorias e detalhes, Coleção, três visitas a jardins, visão ao nível do chão, Clã e retorno foram exercitados no navegador local. Revisão visual em 390 × 844 e 360 × 640 (9:16), sem avisos ou erros de console nas verificações realizadas. Sintaxe dos scripts verificada com Node.js.

O hub apresentou aproximadamente 131 draw calls e 39 mil triângulos; duas visitas amostradas apresentaram 58–64 draw calls, 26–28 mil triângulos e 28 geometrias. Esses contadores indicam custo de renderização, não garantem FPS. Fluidez, consumo e temperatura em um celular físico ainda precisam ser medidos.
