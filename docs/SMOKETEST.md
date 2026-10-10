# Teste de fumaça do Glyph

O que ainda não foi testado do começo ao fim num celular de verdade. Cada item diz **o que fazer** e **o que tem de acontecer**. Se acontecer outra coisa, tire um print e anote o horário — o horário ajuda a achar o que deu errado.

Atualizado em 10/10/2026.

## Antes de começar

- **Versão do app:** os testes de **convite** (seção 5) precisam da versão **110 ou mais nova**. O resto vale na 109.
- **Duas contas:** a sua, novinha (criada no dia do teste), e a de outra pessoa (pode ser a do Afonso). O convite só funciona em conta com até 7 dias de criada.
- **Notificações ligadas** para o Glyph, e o Oráculo com avisos ativos (Config › Oráculo & Alertas).
- Alguns itens levam **dias** (marcados com ⏳). Faça o resto no primeiro dia e volte nesses.

---

## 1. Abrir e entrar

- [ ] **Abrir o app depois de instalar.** Esperado: o vídeo de abertura toca e o app chega na tela de login sem fechar sozinho.
- [ ] **Criar conta e entrar** (Google ou e-mail). Esperado: entra direto, sem erro.
- [ ] **Onboarding de primeiro uso.** Esperado: o app guia a criação da primeira arena; cada aba mostra uma dica curta na primeira vez que você entra nela, e não repete depois.

## 2. Planner

- [ ] **Abrir a aba PLANNER.** Esperado: ele já aparece parado na hora atual — não rola sozinho, não treme para os lados.
- [ ] Se tremer: **grave a tela** (gravador do Android) abrindo o planner e mande o vídeo.
- [ ] **Widget** na tela inicial do celular (se usar). Esperado: mostra o dia do ciclo igual ao app (ex.: "Dia 3/7").

## 3. Missões

- [ ] **MUNDO › Temporada.** Esperado: em "Para começar" aparece **"Sete dias no Glyph"** com **1/7 dias**.
- [ ] ⏳ **Abrir o app em outros dias** (não precisa ser seguido). Esperado: o contador sobe um por dia, e abrir duas vezes no mesmo dia conta uma só.
- [ ] ⏳ **No 7º dia.** Esperado: aparece o modal com **"MISSÃO INICIAL"** em cima, o nome da missão e a descrição; entram **10 de ouro**.
- [ ] **Qualquer outra missão inicial** que você completar (ex.: criar a primeira arena). Esperado: modal com "MISSÃO INICIAL" em cima e a descrição da missão embaixo — não "A recompensa desta missão já entrou".
- [ ] **Missão individual:** abra o Oráculo, peça uma missão e aceite. Cumpra o que ela pede. Esperado:
  - ela **não** se completa sozinha: o Oráculo avisa, e a aba **Missão** dele ganha uma bolinha;
  - a contagem para no alvo (ex.: 10/10, nunca 12/10);
  - ao receber, o modal mostra **"MISSÃO DO ORÁCULO"** e a descrição igual à do cartão (ex.: "Conclua 5 ações em Treino em 7 dias").
- [ ] **Faixas das missões** em MUNDO › Temporada. Esperado: faixas finas, todas do mesmo tamanho; tocar abre o detalhe com as recompensas.
- [ ] **Aviso de baú.** Quando ganhar um baú, o aviso deve dizer só "+1 baú raro" (sem "adicionado").

## 4. Cupons

Config › Suporte › **Resgatar código**.

- [ ] **Código que não existe** (ex.: `TESTE123`). Esperado: "Código não encontrado." — em português, não "CODE_NOT_FOUND".
- [ ] **`VANGUARDA25`** (só se ainda tiver vaga — são 25). Esperado: modal com **+25 de ouro**, **baú Incomum** e o kit da Vanguarda (borda, banner e itens), textos com acento.
- [ ] **O mesmo código de novo.** Esperado: "Você já resgatou este código."

## 5. Convite de amigo (versão 110+)

No mesmo modal do cupom, embaixo do OK.

- [ ] **Seu código aparece** (ex.: `SEUNOME-7K2`) com **Copiar** e **Enviar**, e uma barrinha com bolinha no **5** e no **10**.
- [ ] **Copiar.** Esperado: aviso "Código copiado."
- [ ] **Enviar.** Esperado: abre o compartilhar do celular com uma mensagem que tem o link da Play Store e o código escrito.
- [ ] **Usar o próprio código.** Esperado: "Esse é o seu código. Mande para um amigo usar."
- [ ] **Usar o código da outra pessoa** (na sua conta nova). Esperado: **+10 de ouro**, aviso "Você e (nome) agora são amigos", e os dois aparecem na lista de amigos um do outro.
- [ ] **Usar um segundo código de convite.** Esperado: "Você já usou um código de convite."
- [ ] **Conta antiga** (mais de 7 dias) tentando usar um código. Esperado: "Código de convite vale só para contas criadas há até 7 dias."
- [ ] ⏳ **Barrinha de quem convidou:** o amigo só conta depois de completar os 7 dias no app. Esperado: "1 completou os 7 dias" e a barra anda um risquinho.
- [ ] **Convite pelo link (sem digitar):** num celular **sem o Glyph instalado**, abra o link que veio no "Enviar" do outro jogador, instale pela Play Store e crie uma conta nova. Esperado: sem digitar nada, aparece "+10 de ouro. Você e (nome) agora são amigos." Se o app já estava instalado, o link só abre a loja — aí o código é digitado no campo de cupom, como antes.

## 6. Oráculo e notificações

- [ ] ⏳ **Push da manhã** (depois das 7h). Esperado: título **"Seu ciclo hoje"**, texto sobre o ciclo, sem imagem; a cor de destaque aparece na notificação.
- [ ] ⏳ **Push da Sabedoria.** Esperado: o título é o título do card (não "O Oráculo deixou um card"), e o texto é só o do card.
- [ ] **Tema claro do celular:** com o celular em modo claro, a notificação continua legível (a cor neutra não some no fundo branco).
- [ ] **Sub-abas do Oráculo:** quando chega algo novo, a aba onde ele está ganha uma bolinha, que some quando você abre.
- [ ] **Concluir uma ação no planner.** Esperado: o Oráculo reage dizendo quanto falta; avanço em **verde**, meta cumprida em **dourado**.

## 7. Amigos, clã e parceria

- [ ] **MUNDO › Social.** Esperado: seus amigos aparecem com nome e foto — nenhum "jogador desconhecido".
- [ ] **Clã e parceria** (se tiver). Esperado: membros e parceiro com nome e foto, não "fantasma".

## 8. Visual

- [ ] **Fundos de patente** e **borda Soberano** aparecem no perfil (não ficam só na cor lisa).
- [ ] **Roupas no avatar** (ex.: Chuva): a roupa assenta no corpo, sem pedaço do corpo aparecendo por baixo.

## 9. Testes finais — só com o Afonso junto

Estes mexem com dinheiro ou apagam coisas. Faça com uma conta de teste e combine antes.

- [ ] **Compra real no Google Play** (a mais barata). Esperado: o app confirma a compra e libera o que foi comprado.
- [ ] **Pedir reembolso** dessa compra pelo Google Play. Anote o que acontece no app depois.
- [ ] **Excluir conta:** Config › editor do perfil › **Deletar Conta**. Esperado: pede confirmação, apaga e volta para o login; entrar de novo com o mesmo login começa do zero.

---

## Como mandar o resultado

Para cada item que falhou: **número do item**, **o que aconteceu**, **print** e **horário**. O que passou, só marcar ✅.
