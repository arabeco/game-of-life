import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ler = (relativo) => fs.readFileSync(path.join(root, relativo), 'utf8');

// 1. Existe UM desenho de recompensa, e os dois modais usam ele.
//
// O modal de feito e o de recompensa diziam a mesma frase — "voce ganhou isto"
// — com codigo diferente. O de feito tinha a letra "G" no lugar do simbolo de
// ouro, um "?" no de EXP, emoji no lugar da arte e nenhuma cor de raridade.
// Nao era escolha de desenho: era codigo que nasceu antes e nunca recebeu as
// correcoes feitas do outro lado. Toda melhoria precisava ser feita duas vezes,
// e na pratica so era feita uma.
{
    const feito = ler('components/AchievementModal.tsx');
    const recompensa = ler('components/RewardPackModal.tsx');

    for (const [nome, fonte] of [['AchievementModal', feito], ['RewardPackModal', recompensa]]) {
        assert.match(fonte, /RewardPackBody/, `${nome} parou de usar o miolo compartilhado`);
    }

    // O miolo desenha o card do item; nenhum dos dois pode voltar a desenhar o
    // seu. `resolveItemDef` dentro do modal de feito continua valendo — ele
    // ainda monta os toasts de fechamento — mas grade de item, nao.
    assert.doesNotMatch(feito, /grid-cols-2/, 'o modal de feito voltou a desenhar a propria grade de itens');
    assert.doesNotMatch(recompensa, /grid-cols-2/, 'o modal de recompensa voltou a desenhar a propria grade de itens');
}

// 2. O simbolo de valor sai do ValorIcon, nunca de letra solta.
//
// "G" para ouro e "?" para EXP eram texto no meio do JSX. Nao davam erro,
// nao apareciam em teste, e quem jogava via uma letra onde devia ter uma moeda.
{
    const miolo = ler('components/RewardPackBody.tsx');
    assert.match(miolo, /<ValorIcon/, 'o miolo parou de desenhar o simbolo de valor');

    const feito = ler('components/AchievementModal.tsx');
    assert.doesNotMatch(feito, />G</, 'voltou a letra "G" no lugar do simbolo de ouro');
    assert.doesNotMatch(feito, /Experiencia<\/p>/, 'voltou o card de EXP desenhado a mao');
}

// 3. O payload do feito passa pelo mesmo formato do payload de recompensa.
{
    const construtor = ler('utils/achievementRewardPayload.ts');
    assert.match(construtor, /simbolo: 'exp'/, 'a EXP do feito perdeu o simbolo');
    assert.match(construtor, /simbolo: 'ouro'/, 'o ouro do feito perdeu o simbolo');
    assert.match(construtor, /getChestVisual/, 'o bau do feito voltou a mostrar a chave crua');
}

// 4. A altura do card de item e fixa.
//
// Nome de duas linhas esticava a linha da grade, o corpo crescia e o modal
// inteiro mudava de tamanho conforme o nome do item que caiu.
{
    const miolo = ler('components/RewardPackBody.tsx');
    // 68px e a medida da sheet (.monolith .item), nao um numero escolhido aqui.
    assert.match(miolo, /h-\[68px\]/, 'o card de item perdeu a altura fixa da direcao B');
    assert.match(miolo, /line-clamp-2/, 'o nome do item perdeu o limite de duas linhas');
}

// 4b. As medidas da direcao B, como estao na sheet aprovada.
//
// Elas ja foram aplicadas pela metade uma vez: chanfro e titulo serifado sim,
// metrica de 94 com nicho e item de 68 nao. Meio B nao e B.
{
    const miolo = ler('components/RewardPackBody.tsx');
    const placa = ler('components/RewardPackModal.tsx');

    assert.match(miolo, /h-\[84px\] w-\[84px\]/, 'o crest saiu dos 84px da sheet');
    assert.match(miolo, /h-\[66px\] w-\[66px\]/, 'o PNG do emblema saiu dos 66px da sheet');
    assert.match(miolo, /h-\[94px\] w-\[94px\]/, 'a metrica saiu dos 94px da sheet');
    assert.match(miolo, /h-\[33px\] w-\[33px\]/, 'o nicho do simbolo sumiu da metrica');
    assert.match(miolo, /h-\[46px\] w-\[46px\]/, 'a arte do item saiu dos 46px da sheet');
    assert.match(miolo, /font-serif/, 'o titulo perdeu a serifa');

    // As medidas da placa moram na tabela das quatro direcoes; o modal so
    // escolhe qual usar.
    const direcoes = ler('constants/rewardPlateStyles.ts');
    assert.match(direcoes, /3px solid #56585a/, 'a direcao B perdeu a moldura de 3px');
    assert.match(direcoes, /inset 0 0 0 9px #0b0d0f/, 'a direcao B perdeu os tres aneis internos');
    assert.match(direcoes, /12px 14px 0 #24272a/, 'a direcao B perdeu a sombra solida deslocada');
    assert.match(direcoes, /polygon\(0 28px, 28px 0/, 'a direcao B perdeu o chanfro de 28px');
    assert.match(direcoes, /polygon\(18px 0, calc\(100% - 18px\) 0, 100% 50%/, 'o botao da B perdeu as pontas em bico');

    // As quatro continuam vivas: comparar exige ter todas.
    for (const letra of ['A', 'B', 'C', 'D']) {
        assert.match(direcoes, new RegExp(`^    ${letra}: \{`, 'm'), `a direcao ${letra} sumiu da tabela`);
    }
    assert.match(placa, /DIRECOES\[direcao\]/, 'o modal parou de aceitar a direcao');
}

// 5. Os seis acontecimentos tem emblema, e o arquivo existe.
//
// Nao sao seis modais: e a mesma placa com seis emblemas. O
// `recompensa_geral.webp` chegou a ficar no disco com ZERO referencia no
// codigo — desenhado, entregue, e invisivel.
{
    const tabela = ler('constants/rewardEmblems.ts');
    // .webp desde 04/09: a arte de interface pesava 9,5 MB em PNG e caiu para
    // 2,0 MB sem diferenca visivel. O emblema continua sendo arquivo no disco.
    const arquivos = [...tabela.matchAll(/'([a-z0-9_]+\.webp)'/g)].map((m) => m[1]);
    assert.ok(arquivos.length >= 15, `a tabela de emblemas encolheu (${arquivos.length})`);

    const faltando = arquivos.filter(
        (arquivo) => !fs.existsSync(path.join(root, 'public', 'assets', 'catalog', 'interface', arquivo)),
    );
    assert.deepEqual(faltando, [], `emblema sem arquivo no disco: ${faltando.join(', ')}`);

    for (const esperado of [
        'recompensa_geral.webp',
        'insignia_missao_prata.webp',
        'insignia_ciclo_bronze.webp',
        'insignia_quest_temporada.webp',
        'insignia_season_genesis.webp',
    ]) {
        assert.ok(arquivos.includes(esperado), `${esperado} saiu da tabela de emblemas`);
    }

    // O geral precisa estar LIGADO em algum lugar, senao volta a ser arte morta.
    const usos = ['views/SettingsView.tsx', 'components/VanguardWelcomeModal.tsx']
        .map((arquivo) => ler(arquivo))
        .filter((fonte) => /getRewardEmblemUrl\('geral'\)/.test(fonte));
    assert.ok(usos.length >= 2, 'o emblema geral perdeu os pontos de uso');
}

// 6. O resgate de codigo termina em TELA, nao em toast.
//
// Era a unica hora do jogo em que a pessoa DIGITA algo esperando premio, e a
// resposta era uma linha de texto que some sozinha em segundos.
{
    const ajustes = ler('views/SettingsView.tsx');
    assert.match(ajustes, /buildRedeemRewardPayload/, 'o resgate voltou a terminar so em toast');
    assert.match(ajustes, /<RewardPackModal/, 'o resgate perdeu o modal de recompensa');
}

// 7. Cada acontecimento tem SEU tom, e o miolo pinta com ele.
//
// Os seis saiam com a mesma placa cinza e o mesmo reflexo dourado fixo: a
// unica diferenca entre "voce subiu de patente" e "voce resgatou um codigo"
// era o texto.
{
    const tabela = ler('constants/rewardEmblems.ts');
    const tons = [...tabela.matchAll(/'(\d{1,3},\d{1,3},\d{1,3})'/g)].map((m) => m[1]);
    assert.ok(tons.length >= 5, `a tabela de tons encolheu (${tons.length})`);
    assert.equal(new Set(tons).size, tons.length, `tom repetido entre acontecimentos: ${tons.join(' | ')}`);

    const miolo = ler('components/RewardPackBody.tsx');
    assert.match(miolo, /tom \?/, 'o miolo parou de pintar o reflexo do acontecimento');

    const moldura = ler('components/RewardPackModal.tsx');
    assert.doesNotMatch(moldura, /rgba\(234,179,8,0\.18\)/, 'voltou o reflexo dourado fixo para todo mundo');
}

// 8. Arena existe de verdade e a pessoa controla a cerimônia.
{
    const feito = ler('components/AchievementModal.tsx');
    const dominio = ler('contexts/gameDomains/taskDomain.ts');
    assert.doesNotMatch(feito, /achievement\.type !== 'ARENA_COMPLETED'/, 'a arena voltou a morrer antes de renderizar');
    assert.match(feito, /celebrationScreensEnabled: false/, 'sumiu o atalho para não mostrar celebrações');
    assert.match(feito, /label: 'Dias ativos'/, 'a arena perdeu os dados da conclusão');
    assert.match(dominio, /deliveries: entregasDaArena\.length/, 'o evento da arena deixou de carregar as entregas reais');
    assert.match(feito, /Toque para pular/, 'o vídeo voltou a prender a pessoa até o fim');
    assert.match(feito, /DIRECOES\.B/, 'o feito deixou de usar a placa B aprovada');
}

// 9. O prêmio do baú é o modal do item em modo de foco, sem carrossel.
{
    const item = ler('components/ItemDetailModal.tsx');
    const inventario = ler('components/Store/Inventory.tsx');
    assert.match(item, /focusMode/, 'o modal do item perdeu o modo de revelação do baú');
    assert.match(item, /focusMode \? 'Item recebido!' : currentItem\.name/, 'o item do baú perdeu o acontecimento grande');
    assert.match(item, /!focusMode && relatedItems\.length/, 'a Coleção voltou a aparecer sobre o prêmio do baú');
    assert.match(inventario, /focusMode=\{selectedItem\.instanceId\.startsWith\('bau-'\)\}/, 'o baú não ativa mais o foco do item');
}

// 10. Selo e jornada comum são acontecimentos diferentes e usam fundo vertical.
{
    const contexto = ler('contexts/GameContext.tsx');
    const feito = ler('components/AchievementModal.tsx');
    const temporadas = ler('constants/seasonContent.ts');
    assert.match(contexto, /seloDaTemporada: mission\.goal_type === 'quests_claimed'/, 'o selo voltou a ser indistinguível da jornada');
    assert.match(feito, /seasonBackground/, 'o selo perdeu o fundo da temporada');
    // .webp: os dois fundos pesavam 2,1 MB e 2,5 MB em PNG e caíram para 164 KB e
    // 282 KB sem diferença visível — 90% do peso, num arquivo que carrega dentro
    // de um modal, no celular. O PNG original ficou em docs/drafts.
    assert.match(temporadas, /season-genesis-background\.webp/, 'Gênesis voltou a usar o ícone quadrado como fundo');
    assert.match(temporadas, /season-aurora-i-background\.webp/, 'Aurora voltou a usar o ícone quadrado como fundo');
    for (const arquivo of ['season-genesis-background.webp', 'season-aurora-i-background.webp']) {
        assert.ok(fs.existsSync(path.join(root, 'public', 'assets', 'catalog', arquivo)), `fundo vertical ausente: ${arquivo}`);
    }
}

// 11. A passagem apresenta as três jornadas e permite abri-las.
{
    const passagem = ler('components/SeasonDetailModal.tsx');
    const temporada = ler('views/SeasonView.tsx');
    assert.match(passagem, /toSeason\.quests\.slice\(0, 3\)/, 'a passagem perdeu as três jornadas');
    assert.match(passagem, /onOpenQuest\?\.\(quest\)/, 'as faixas de jornada deixaram de ser clicáveis');
    assert.match(temporada, /setSelectedQuest\(quest\)/, 'clicar na faixa não abre mais o detalhe da jornada');
}

// 12. O baú de código fica na lista; os quadrados continuam reservados a valores.
{
    const resgate = ler('utils/redeemRewardPresentation.ts');
    const miolo = ler('components/RewardPackBody.tsx');
    assert.doesNotMatch(resgate, /metricCards\.push\(\{\s*label: 'Baú'/, 'o baú voltou para os quadrados de valor');
    assert.match(resgate, /imageUrl: getChestArtUrl/, 'o baú perdeu o PNG na lista recebida');
    assert.match(miolo, /highlight\.imageUrl/, 'a linha recebida não desenha mais a arte do baú');
    assert.match(resgate, /title: 'Recompensa entregue!'/, 'o resgate saiu da família geral de recompensa');
    assert.match(resgate, /subtitle: `Código: \$\{resultado\.code\}`/, 'o nome do código saiu de baixo do título');
}

// 13. Um prêmio vira bloco; extras de baú não repetem o item em destaque.
{
    const miolo = ler('components/RewardPackBody.tsx');
    const detalhe = ler('components/ItemDetailModal.tsx');
    const inventario = ler('components/Store/Inventory.tsx');
    assert.match(miolo, /itemUnico \? 'h-\[104px\]/, 'o item único voltou a parecer uma faixa estreita');
    assert.match(detalhe, /extrasRecebidos/, 'o destaque do baú perdeu os valores adicionais');
    assert.match(inventario, /setExtrasDoBau\(extras\)/, 'o resultado do baú não encaminha mais ouro e fragmentos extras');
}

// 14. O selo destaca a insígnia e não a repete entre os demais itens recebidos.
{
    const miolo = ler('components/RewardPackBody.tsx');
    const feito = ler('components/AchievementModal.tsx');
    assert.match(miolo, /featuredRewardItem/, 'o selo perdeu o prêmio-herói central');
    assert.match(miolo, /itemId !== featuredRewardItem\?\.itemId/, 'a insígnia em destaque voltou a ser repetida na lista');
    assert.match(feito, /featuredItemId: rewardItemIds\.find/, 'o selo deixou de escolher a insígnia sazonal como destaque');
    assert.match(feito, /emblema=\{seloDaTemporada \? undefined/, 'o topo voltou a duplicar a insígnia destacada');
}

// 15. Todo quadrado de métrica e toda placa recebem o tom do acontecimento.
{
    const miolo = ler('components/RewardPackBody.tsx');
    const feito = ler('components/AchievementModal.tsx');
    const app = ler('components/AuthenticatedApp.tsx');
    assert.match(miolo, /const tomDaPlaca = tom \|\| '234,179,8'/, 'métrica sem tom voltou ao fundo chapado');
    assert.match(miolo, /radial-gradient\(circle at 50% 0%, rgba\(\$\{tomDaPlaca\}/, 'quadrados perderam o gradiente do acontecimento');
    assert.match(feito, /rgba\(\$\{tomDoFeito\},\.82\)/, 'o miolo do feito voltou a usar a Skin UI no lugar do tom do acontecimento');
    assert.ok((app.match(/tom=\{getRewardToneRgb\('geral'\)\}/g) || []).length >= 3, 'presente, premium ou beta voltou sem tom explícito');
}

// 16. Subida de patente tem seu próprio vídeo; LEVEL_UP não duplica a cerimônia.
{
    const feito = ler('components/AchievementModal.tsx');
    const contexto = ler('contexts/GameContext.tsx');
    assert.match(feito, /isRankUp[\s\S]*levelup\.mp4/, 'a subida de patente perdeu o vídeo próprio');
    assert.doesNotMatch(contexto, /setAchievementUnlocked\(\{\s*type: 'LEVEL_UP'/, 'LEVEL_UP voltou a abrir uma segunda celebração sobre a missão');
}

// 17. Os envelopes mantêm a proporção vertical 1:1,7.
//
// No app usamos 368 x 626, reduzindo os
// dois eixos juntos quando o aparelho é menor para sempre sobrar margem.
{
    const medidas = ler('constants/rewardPlateStyles.ts');
    assert.match(medidas, /REWARD_PLATE_VIEWPORT_STYLE/, 'a proporção comum perdeu sua fonte única');
    assert.match(medidas, /aspectRatio: '10 \/ 17'/, 'a placa saiu da proporção 1:1,7');
    assert.match(medidas, /100vw - 32px/, 'a placa deixou de reservar margem lateral no celular');
    assert.match(medidas, /100svh - 40px/, 'a placa deixou de reservar margem vertical no celular');

    for (const arquivo of [
        'components/RewardPackModal.tsx',
        'components/AchievementModal.tsx',
        'components/ItemDetailModal.tsx',
        'components/SeasonDetailModal.tsx',
        'views/ProfileView.tsx',
    ]) {
        assert.match(ler(arquivo), /REWARD_PLATE_VIEWPORT_STYLE/, `${arquivo} saiu da proporção comum`);
    }

    const css = ler('index.css');
    assert.match(css, /\.reward-title-metal/, 'o teste de título metálico sumiu');
    assert.match(css, /#fffdf6[\s\S]*#aa8748/, 'o título deixou de misturar branco e ouro antigo');
    assert.match(ler('components/RewardPackBody.tsx'), /reward-title-metal/, 'o título principal não usa o metal claro');
}

// 18. O acontecimento e grande; o nome proprio e pequeno.
{
    const feito = ler('components/AchievementModal.tsx');
    assert.match(feito, /title: 'Arena concluída!'.*subtitle: data\.name/, 'arena voltou a repetir o nome grande');
    assert.match(feito, /title: 'Missão concluída!'.*subtitle: data\.title/s, 'missao perdeu a hierarquia comum');
    assert.match(feito, /title: 'Nova patente!'.*subtitle: data\.name/, 'patente perdeu a hierarquia comum');
    assert.match(feito, /seloDaTemporada \? 'Temporada concluída!' : title/, 'selo perdeu o título de temporada');
    assert.doesNotMatch(feito, /Quest de temporada concluída/, 'quest voltou a fingir que é outra categoria');
}

console.log('reward-modal: ok');
