import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ORACLE_SPEECH_LIBRARY } from '../constants/oracleSpeechLibrary.ts';

/**
 * O Oraculo passou a enxergar o pacto.
 *
 * Antes disto ele oferecia a missao, a pessoa aceitava, e ele esquecia na hora:
 * o pacto nao aparecia no contexto operacional, entao nenhuma fala sobre o
 * compromisso aceito tinha de onde nascer. Este teste guarda as tres pecas
 * dessa ligacao — o contexto ver, a fala existir nos quatro tons, e o gatilho
 * disparar no lugar certo.
 */

const TONS = ['neutro', 'calmo', 'coach', 'reflexivo'];
const EVENTOS = ['pact_progress', 'pact_last_one', 'pact_completed'];

// 1. As falas existem, nos quatro tons, com variantes de verdade.
for (const evento of EVENTOS) {
    const porTom = ORACLE_SPEECH_LIBRARY[evento];
    assert.ok(porTom, `${evento} precisa existir na biblioteca`);
    for (const tom of TONS) {
        const linhas = porTom[tom];
        assert.ok(Array.isArray(linhas) && linhas.length >= 3,
            `${evento}.${tom} precisa de ao menos 3 variantes`);
        assert.equal(new Set(linhas).size, linhas.length,
            `${evento}.${tom} tem variante repetida — repetir nao e variar`);
    }
}

/**
 * 2. Marcador escrito errado nao quebra nada: ele aparece cru na tela, como
 * "{aren}". Por isso a lista de marcadores permitidos e fechada.
 */
const PERMITIDOS = new Set(['arena', 'count', 'target', 'remaining', 'dias']);
for (const evento of EVENTOS) {
    for (const tom of TONS) {
        for (const linha of ORACLE_SPEECH_LIBRARY[evento][tom]) {
            for (const achado of linha.matchAll(/\{([a-z_]+)\}/g)) {
                assert.ok(PERMITIDOS.has(achado[1]),
                    `${evento}.${tom}: marcador desconhecido {${achado[1]}} em "${linha}"`);
            }
        }
    }
}

/**
 * 3. `pact_completed` nao pode prometer numero que o gatilho nao passa quando o
 * pacto fecha — e nao deve falar de prazo, porque prazo acabou de virar passado.
 */
for (const tom of TONS) {
    for (const linha of ORACLE_SPEECH_LIBRARY.pact_completed[tom]) {
        assert.ok(!linha.includes('{dias}'),
            `pact_completed.${tom} nao deve falar de prazo: "${linha}"`);
        assert.ok(!linha.includes('{remaining}'),
            `pact_completed.${tom} nao tem restante: "${linha}"`);
    }
}

const contexto = readFileSync(new URL('../utils/oracleOperationalContext.ts', import.meta.url), 'utf8');
const dominio = readFileSync(new URL('../contexts/gameDomains/taskDomain.ts', import.meta.url), 'utf8');
const tipos = readFileSync(new URL('../types.ts', import.meta.url), 'utf8');

// 4. O contexto operacional carrega o pacto — sem isto o resto e decoracao.
for (const campo of ['pactArenaName', 'pactGoal', 'pactCurrent', 'pactRemaining', 'pactDaysRemaining', 'pactCompleted']) {
    assert.match(tipos, new RegExp(`${campo}\\??:`), `OracleContext precisa de ${campo}`);
    assert.match(contexto, new RegExp(`${campo}:`), `o contexto precisa preencher ${campo}`);
}

/**
 * 5. Prazo so existe no pacto de volume. Nos outros `endsOn` e null, e dizer
 * "faltam X dias" onde nao ha prazo inventa urgencia que a pessoa nao aceitou.
 */
assert.match(contexto, /activeArenaPact\?\.endsOn[\s\S]{0,220}?: null/,
    'pactDaysRemaining precisa ser null quando o pacto nao tem prazo');

/**
 * 6. O pacto fala ANTES da meta do ciclo.
 *
 * Meta de ciclo e estrutura que a pessoa montou; pacto e promessa que ela
 * aceitou de viva voz. Quando as duas avancam na mesma conclusao, quem ela
 * escolheu conscientemente leva o comentario.
 */
const ordemPacto = dominio.indexOf('maybeTriggerPactProgressAttention(action, completedTask)');
const ordemCiclo = dominio.indexOf('maybeTriggerActionCycleProgressAttention(action, completedTask, previousTasks');
assert.ok(ordemPacto > 0 && ordemCiclo > 0, 'os dois gatilhos precisam existir');
assert.ok(ordemPacto < ordemCiclo, 'o pacto precisa ser consultado antes da meta do ciclo');

// 7. Quem nao aceitou pacto nenhum nunca ouve nada disto.
assert.match(dominio, /if \(!pacto \|\| !progresso\) return false;/,
    'sem pacto ativo o gatilho precisa sair calado');
// 8. Janela vencida nao comemora nem cobra.
assert.match(dominio, /progresso\.windowEnded && !progresso\.completed/,
    'pacto com janela vencida e sem cumprir nao deve falar');

console.log('Pact speech: o Oraculo enxerga o pacto, fala nos quatro tons, e o pacto vem antes da meta do ciclo.');
