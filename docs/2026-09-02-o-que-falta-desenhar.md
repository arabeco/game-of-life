O que falta desenhar
Isto não é chute: veio de contar o ITEMS_DB inteiro. 143 itens, 35 sem imageUrl — e quando não há imagem o ItemArt cai no emoji, que muda de desenho em cada Android. Somando os símbolos de valor e os baús, dá 44 desenhos.

Grupo	Qtd	O que é	Hoje
A. Valor	5	EXP, ouro, fragmento, ações, sequência	EXP é a palavra; ouro e fragmento são emoji
B. Baú fechado	5	normal, prata, ouro, épico, lendário	emoji: 📤 🎁 🗳️ 🌟 👑
C. Insígnia	16	10 de patente + 6 de conquista	emoji, todas as 16
D. Cabelo	8	miniatura para a grade do Arsenal	emoji, todos os 8
E. Buracos	3	2 skins e 1 borda que ficaram sem PNG	emoji
F. Fallback	7	ícone por categoria, para quando faltar arte	não existe
A · Símbolos de valor 5
Aparecem em todo modal de recompensa, colados no número. São os primeiros porque são os mais vistos.

#	Asset	Hoje	Onde aparece
1	EXP	não existe — é a palavra "EXP" depois do número	toda recompensa do jogo
2	Ouro	emoji 🪙, 6 usos	missão do sistema, loja, comprar item
3	Fragmento	emoji 💎, 6 usos	baú, quebrar, forjar, resgate diário
4	Ações concluídas	não existe	resumo de ontem
5	Sequência	não existe	resumo de ontem, alerta de risco
Os três primeiros aparecem lado a lado no mesmo slot. Se EXP virar SVG e ouro e fragmento continuarem emoji, o modal mostra dois desenhos do sistema operacional ao lado de um seu. Ou os três viram SVG, ou nenhum. Compartilhar já existe como ShareIcon e não entra na conta.
B · Baús 5
O tipo tem 8 valores — Comum, Incomum, Raro, Épico, Lendário, Season, Ciclo, Skin Comum — mas o ChestOpeningModal já os agrupa em 5 vídeos. A arte fechada deve seguir o mesmo agrupamento: 5 desenhos, não 8.

#	Arte	Cobre	Vídeo	Emoji hoje
6	Baú normal	Comum, Incomum, Skin Comum	chest_normal.mp4	📤 caixa de saída
7	Baú prata	Raro, Ciclo	chest_silver.mp4	🎁 presente
8	Baú ouro	Épico	chest_gold.mp4	🗳️ urna de votação
9	Baú épico	Season	chest_epic.mp4	🌟 estrela
10	Baú lendário	Lendário	chest_legendary.mp4	👑 coroa
Nenhum desses emoji é um baú. 📤 é caixa de saída de e-mail, 🗳️ é urna de votação, 🌟 é uma estrela e 👑 é uma coroa. A coroa ainda é usada por duas insígnias de patente ao mesmo tempo — o baú lendário, a Insígnia do Barão e a Insígnia do Rei são o mesmo desenho na tela.
Os nomes dos vídeos não batem com os tipos e vão confundir na hora de trocar: chest_gold é o épico, chest_epic é o season. Renomear é barato agora e caro depois.
C · Insígnias 16
Nenhuma das 16 tem arte. É a categoria mais exposta do jogo — a insígnia aparece no perfil, na grade do Arsenal e em todo modal de recompensa — e é 100 % emoji.

#	Insígnia	Raridade	Emoji hoje
11	do Vagante	Comum	⚪
12	do Escudeiro	Comum	🛡️
13	do Cavaleiro	Incomum	⚔️
14	do Lorde	Raro	🏰
15	do Barão	Épico	👑 = baú lendário
16	do Conde	Épico	📜 = Relatório de Ciclo
17	do Duque	Lendário	💎 = fragmento
18	do Príncipe	Lendário	🌟 = baú season
19	do Rei	Lendário	👑 = Barão
20	do Soberano	Lendário	🔱
21	de Relatório de Ciclo	Comum	📜 = Conde
22	de Missão Incomum	Incomum	🎖️
23	de Patente Rara	Raro	⭐
24	de Mestre de Quests	Raro	🏆
25	Gênesis	Mítico	🌌 = Aurora I
26	Aurora I	Mítico	🌌 = Gênesis
Cinco pares de emoji repetidos. Rei e Barão são a mesma coroa. Conde e Relatório de Ciclo são o mesmo pergaminho. Gênesis e Aurora I são a mesma galáxia — e são as duas míticas, as mais raras do jogo, indistinguíveis no perfil. A Insígnia do Duque é o mesmo 💎 que representa fragmento.
As 10 de patente pedem um sistema, não 10 desenhos soltos. Uma silhueta de escudo comum, com o interior e o metal mudando de Vagante a Soberano. Fica coerente e é mais barato do que 10 ideias diferentes.
D · Cabelos 8
Todos os 8 sem imageUrl. O cabelo é desenhado no avatar, mas na grade do Arsenal ele precisa de miniatura própria — hoje aparece 〰️, 💇, ✂️, 🧶, 💈, ⚡, 👑 e ✨ no lugar do penteado: Cachos, Médio Reto, Texturizado, Dreads, Mullet Top, Anime Spiky, Princesa e Fluxo Espiritual.

O ⚡ do "Anime Spiky" é o mesmo raio que vira o símbolo de EXP, e o 👑 da "Princesa" é a mesma coroa do baú lendário e de duas insígnias de patente. Quatro coisas sem relação, um desenho só.
E · Buracos pontuais 3
#	Item	Categoria	Raridade	Emoji hoje
27	Entidade de Luz	skin	Lendário	✨
28	Empreendedor	skin	Épico	💼
29	Soberano	border	Épico	👑
São os únicos furos em categorias que já estão quase cobertas: skin tem 18 de 20 e border tem 15 de 16. Custam pouco e fecham duas categorias inteiras.
F · Ícone de categoria 7
Rede de segurança: quando um item novo entrar sem arte, o ItemArt mostra o ícone da categoria em vez de um emoji aleatório. Sete cobrem tudo que não está nos grupos acima: artefato (29 itens), skin (20), borda (16), banner (15), glifo (10), orbe (7), placa (6).

Fora da lista, de propósito
Auras (8) não precisam de arte. getAuraBackground gera o visual em CSS a partir do nome. É procedural e funciona — não desenhe.
Moldura de raridade não é asset. É borda e gradiente com o hex da raridade, que já existe em rarityVisuals.ts. Só falta escrever o caso do mítico na escala de medalha.
Insígnia de bronze para missão individual: não existe como item. Não é só desenhar — precisa entrar no ITEMS_DB primeiro. Hoje a insígnia mais baixa de missão é a Incomum, que é prata.
Por onde começar
Se der para fazer só uma parte: A + B são 10 desenhos e aparecem em toda recompensa do jogo — é o maior salto por desenho feito. C são 16 e resolvem os cinco pares repetidos. D, E, F podem esperar.
