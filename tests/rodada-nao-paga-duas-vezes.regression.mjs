import assert from 'node:assert/strict';
import { primeiroDiaInteiroDaRodada } from '../utils/freeProgressScope.ts';

/**
 * A EXPERIENCIA DA RODADA CONTA POR DIA INTEIRO, E NUNCA DUAS VEZES.
 *
 * A regra do livro-caixa esta no tests/exp-ledger: O DIA DEPOSITA, O FECHO
 * PAGA. Julgar um dia grava `exp_deposited` e soma no recipiente; quem credita
 * em `nobility.exp` e o fecho da rodada. Segue dai que um dia pertence a UMA
 * rodada so — se pertencesse a duas, seria pago duas vezes.
 *
 * O `refreshRoundExpBonus` reconstroi o acumulado somando `exp_deposited` a
 * partir da marca, e a marca e um INSTANTE enquanto o deposito e um DIA. Quando
 * a marca cai no meio de um dia, o dia fica dos dois lados.
 *
 * Era o que acontecia ao concluir a rodada: `concludeFreeRound` paga o
 * acumulado e carimba com `new Date()`. Se o dia ja tinha sido julgado, o
 * deposito dele acabava de ser pago — e a releitura, com `gte('date', marca
 * recortada em dez caracteres)`, o somava de novo. O proximo "Concluir rodada"
 * pagava o mesmo dia pela segunda vez. Experiencia creditada nao volta: o
 * proprio codigo diz que devolver rebaixaria patente.
 *
 * A saida nao e trocar `gte` por `gt`. As duas marcas que existem querem coisas
 * diferentes:
 *
 *   - a de "continuar sem ciclo" nasce na zero hora do primeiro dia da rodada,
 *     e esse dia TEM de contar;
 *   - a de "concluir rodada" nasce no meio de um dia ja liquidado, e esse dia
 *     NAO pode contar.
 *
 * A regra que serve as duas: a experiencia conta a partir do primeiro dia
 * INTEIRO depois da marca. Marca na virada do dia — o dia dela conta. Marca no
 * meio — so o dia seguinte.
 *
 * As contas sao em hora LOCAL de proposito: `daily_commitments.date` e gravado
 * com `getLocalDateString()`, e comparar um com o outro em UTC erraria por um
 * dia em todo fuso a oeste de Greenwich.
 */

const local = (ano, mes, dia, hora = 0, minuto = 0) =>
    new Date(ano, mes - 1, dia, hora, minuto, 0, 0).toISOString();

// 1. Marca na virada do dia: o proprio dia conta.
//
// E a marca de quem fechou o ciclo e clicou em Continuar. Ela ja nasce apontando
// para o primeiro dia da rodada nova, e esse dia nao pode ser pulado.
{
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 9, 21)), '2026-09-21');
}

// 2. Marca no meio do dia: so o dia seguinte conta.
//
// E a marca de "Concluir rodada". O dia de hoje acabou de ser liquidado — ele
// pertence a rodada que fechou.
{
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 9, 21, 14, 30)), '2026-09-22');
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 9, 21, 0, 1)), '2026-09-22');
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 9, 21, 23, 59)), '2026-09-22');
}

// 3. A virada do mes e a do ano nao podem quebrar a conta.
{
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 9, 30, 12, 0)), '2026-10-01');
    assert.equal(primeiroDiaInteiroDaRodada(local(2026, 12, 31, 18, 0)), '2027-01-01');
}

// 4. Sem marca, a rodada alcanca tudo — e como quem nunca concluiu uma.
{
    assert.equal(primeiroDiaInteiroDaRodada(null), '1970-01-01');
    assert.equal(primeiroDiaInteiroDaRodada(''), '1970-01-01');
    assert.equal(primeiroDiaInteiroDaRodada('nao e data'), '1970-01-01');
}

// 5. O DIA LIQUIDADO NAO VOLTA. A prova do bug, escrita como conta.
//
// Concluir a rodada as 14h30 do dia 21, depois de o dia 21 ja ter sido julgado:
// o deposito do dia 21 foi pago agora. A soma da rodada nova comeca no dia 22,
// entao ele nao entra de novo.
{
    const marcaDoFecho = local(2026, 9, 21, 14, 30);
    const desde = primeiroDiaInteiroDaRodada(marcaDoFecho);

    const depositos = [
        { date: '2026-09-20', exp: 120 },
        { date: '2026-09-21', exp: 200 }, // julgado e pago no fecho das 14h30
        { date: '2026-09-22', exp: 90 },  // a rodada nova comeca aqui
    ];
    const naRodadaNova = depositos.filter((d) => d.date >= desde);

    assert.deepEqual(naRodadaNova.map((d) => d.date), ['2026-09-22']);
    assert.equal(
        naRodadaNova.reduce((soma, d) => soma + d.exp, 0),
        90,
        'a rodada nova nasceu devendo experiencia que ja tinha sido paga',
    );
}

console.log('rodada-nao-paga-duas-vezes: ok');
