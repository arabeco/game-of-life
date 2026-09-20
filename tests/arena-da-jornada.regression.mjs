import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fonte = fs.readFileSync(path.join(root, 'contexts', 'GameContext.tsx'), 'utf8');

/**
 * A ARENA QUE A JORNADA CRIOU TEM DE SE RECOLHER SOZINHA.
 *
 * Aceitar uma jornada de temporada CRIA uma arena — nome da missao, prioridade
 * alta, uma acao dentro montada do actionTemplate. Enquanto a jornada corre
 * isso e util. Depois virava lixo: ninguem arquivava, ninguem avisava, e a
 * arena ficava no topo da lista com a acao pela metade.
 *
 * Nao trava nada, e por isso nao aparece em teste de fluxo — envenena devagar.
 * Com temporadas trimestrais, quem fica um ano acumula arenas orfas de
 * temporadas mortas sem saber por que existem nem se pode apagar.
 *
 * O teste e de FONTE porque o comportamento mora no GameContext, que so existe
 * dentro de um provider React com Supabase atras. O que da para travar aqui e
 * que os dois gatilhos continuem ligados e que o verbo continue sendo arquivar.
 */

// 1. Os dois gatilhos existem e apontam para o mesmo recolhimento.
{
    assert.match(
        fonte, /const recolherArenaDaJornada = useCallback/,
        'sumiu o recolhimento da arena da jornada',
    );

    // Jornada concluida: dentro do claimSeasonQuest, DEPOIS da recompensa.
    const claim = fonte.slice(fonte.indexOf('const claimSeasonQuest'));
    const corpoDoClaim = claim.slice(0, claim.indexOf('\n    const claimSeasonMission'));
    assert.match(
        corpoDoClaim, /recolherArenaDaJornada\(quest, 'concluida'\)/,
        'o claimSeasonQuest nao recolhe mais a arena da jornada concluida',
    );
    assert.ok(
        corpoDoClaim.indexOf('grantMissionReward') < corpoDoClaim.indexOf('recolherArenaDaJornada'),
        'a arena tem de ser recolhida DEPOIS da recompensa: se a entrega falhar, '
        + 'a arena precisa continuar onde estava para a pessoa tentar de novo',
    );

    // Temporada encerrada: a varredura das jornadas abandonadas.
    assert.match(
        fonte, /recolherArenaDaJornada\(quest, 'encerrada'\)/,
        'sumiu a varredura das jornadas que a temporada deixou para tras',
    );
}

// 2. Arquiva, nunca apaga.
//
// O trabalho feito na arena e historico: as tarefas concluidas ja contaram no
// ciclo, no relatorio e na EXP. Apagar deixaria esses registros apontando para
// o vazio — e o proprio acceptSeasonQuest conta com o arquivamento, porque
// desarquiva ao reaceitar a mesma jornada.
{
    const inicio = fonte.indexOf('const recolherArenaDaJornada');
    const corpo = fonte.slice(inicio, fonte.indexOf('\n    }, [', inicio));

    assert.match(corpo, /updateArena\([^)]*\{ isArchived: true \}\)/, 'o recolhimento tem de arquivar');
    assert.doesNotMatch(corpo, /deleteArena/, 'a arena da jornada nao pode ser apagada, so arquivada');

    assert.match(
        fonte, /updateArena\(arena\.id, \{ isArchived: false \}\)/,
        'o acceptSeasonQuest precisa continuar desarquivando ao reaceitar',
    );
}

// 3. Arena que a pessoa adotou fica onde esta.
//
// Se ela acrescentou outras acoes ali, a arena deixou de ser da jornada e
// passou a ser dela. Recolher isso seria tirar da mao de alguem uma coisa que
// estava em uso — e o estrago apareceria dias depois, sem nada na tela
// explicando para onde a arena foi.
{
    const inicio = fonte.indexOf('const recolherArenaDaJornada');
    const corpo = fonte.slice(inicio, fonte.indexOf('\n    }, [', inicio));

    assert.match(corpo, /acoesDaArena/, 'sumiu a contagem de acoes da arena');
    assert.match(
        corpo, /if \(!soTemAJornada\) return;/,
        'arena com acao alem da jornada tem de ser deixada em paz',
    );
    assert.match(
        corpo, /if \(!arena \|\| arena\.isArchived\) return;/,
        'arena ja arquivada nao deve ser tocada de novo',
    );
}

console.log('arena-da-jornada: ok');
