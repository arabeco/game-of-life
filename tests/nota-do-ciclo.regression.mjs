import assert from 'node:assert/strict';
import { notaDoCiclo, bauDaNota } from '../utils/cycleGrade.js';

/**
 * A NOTA SAI DA CONCLUSAO, E O PORTE DO CICLO DIZ ATE ONDE ELA PODE SUBIR.
 *
 * Antes havia TRES reguas medindo a mesma coisa. O score de 100 pontos somava
 * cinco criterios; a nota era uma faixa desse score; e o bau era outra faixa,
 * com limites proprios de EXP e de dias. Cada uma com trava sua, nenhuma na
 * tela.
 *
 * O resultado de um ciclo real: 99 pontos, nota A, nenhum bau. Tres regras
 * diferentes pegaram a pessoa de uma vez e nenhuma se explicou.
 *
 * Agora e uma so. A nota sai da PORCENTAGEM DE CONCLUSAO, e o PORTE do ciclo
 * limita o teto — sem isso, uma semana perfeita e um mes perfeito valeriam o
 * mesmo, e o bau viraria torneira. O bau sai da nota, direto.
 *
 * S e SS aceitam ate 5% de falhas. SSS exige acoes e metas completas,
 * presenca diaria e as cinco areas vivas no ciclo.
 */

// --- 1. os tres casos que decidiram o desenho -------------------------------

{
    // Cem por cento numa semana: o teto de sete dias e A.
    assert.equal(notaDoCiclo({ conclusaoPct: 100, dias: 7 }).nota, 'A');
    assert.equal(bauDaNota('A'), 'Raro');

    // A mesma perfeicao em cinco dias nao alcanca o teto de A.
    assert.equal(notaDoCiclo({ conclusaoPct: 100, dias: 5 }).nota, 'B');

    // E oitenta por cento numa semana tambem e B — a semana da o teto, nao a nota.
    assert.equal(notaDoCiclo({ conclusaoPct: 80, dias: 7 }).nota, 'B');
}

// --- 2. as faixas de conclusao ---------------------------------------------

{
    const comFolga = (pct) => notaDoCiclo({ conclusaoPct: pct, dias: 28, horas: 180 }).nota;
    assert.equal(comFolga(100), 'SS');
    assert.equal(comFolga(96), 'SS');
    assert.equal(comFolga(95), 'SS');
    assert.equal(comFolga(94), 'A');
    assert.equal(comFolga(85), 'A');
    assert.equal(comFolga(84), 'B');
    assert.equal(comFolga(70), 'B');
    assert.equal(comFolga(69), 'C');
    assert.equal(comFolga(50), 'C');
    assert.equal(comFolga(49), 'D');
    assert.equal(comFolga(30), 'D');
    assert.equal(comFolga(29), 'E');
    assert.equal(comFolga(0), 'E');
}

// --- 3. o porte e um TETO, nunca um empurrao --------------------------------
//
// Um ciclo de um ano com 40% de conclusao continua sendo D. Tempo nao compra
// nota: ele so autoriza a nota que a execucao ja conquistou.

{
    assert.equal(notaDoCiclo({ conclusaoPct: 40, dias: 365, horas: 2000 }).nota, 'D');
    assert.equal(notaDoCiclo({ conclusaoPct: 95, dias: 13 }).nota, 'A', 'faltou um dia para o teto de S');
    assert.equal(notaDoCiclo({ conclusaoPct: 95, dias: 14, horas: 60 }).nota, 'S');
    assert.equal(notaDoCiclo({ conclusaoPct: 95, dias: 14, horas: 59 }).nota, 'A');
    assert.equal(notaDoCiclo({ conclusaoPct: 95, dias: 28, horas: 179 }).nota, 'S');
    assert.equal(notaDoCiclo({ conclusaoPct: 95, dias: 28, horas: 180 }).nota, 'SS');
    assert.equal(notaDoCiclo({ conclusaoPct: 85, dias: 6 }).nota, 'B', 'faltou um dia para o teto de A');
}

// --- 4. o SSS, e as portas que ele tem de atravessar ------------------------

const ssPerfeito = {
    conclusaoPct: 100,
    dias: 28,
    horas: 200,
    acoesPlanejadas: 120,
    acoesConcluidas: 120,
    metasSeladas: 7,
    metasPlanejadas: 7,
    diasZerados: 0,
    areasAtivas: 5,
};

{
    assert.equal(notaDoCiclo(ssPerfeito).nota, 'SSS');

    const semUma = (mudanca, porque) => {
        const nota = notaDoCiclo({ ...ssPerfeito, ...mudanca }).nota;
        assert.notEqual(nota, 'SSS', `SSS passou ${porque}`);
        return nota;
    };

    semUma({ conclusaoPct: 99 }, 'com uma acao falhada');
    semUma({ acoesConcluidas: 119 }, 'com uma acao faltando e percentual arredondado em 100');
    semUma({ dias: 27 }, 'com 27 dias');
    semUma({ horas: 199 }, 'com 199 horas');
    semUma({ horas: 199.9 }, 'com horas arredondadas para 200');
    semUma({ metasSeladas: 6 }, 'com uma meta aberta');
    semUma({ diasZerados: 1 }, 'com um dia zerado');
    semUma({ areasAtivas: 4 }, 'com uma area abandonada');
}

// --- 5. cair do SSS para SS --------------------------------------------------
//
// Quem fez 100% em 28 dias e falhou so a area perde o SSS, mas preserva SS.

{
    assert.equal(notaDoCiclo({ ...ssPerfeito, areasAtivas: 4 }).nota, 'SS');
    assert.equal(notaDoCiclo({ ...ssPerfeito, diasZerados: 2 }).nota, 'SS');
}

// --- 6. o bau sai da nota, e so dela ----------------------------------------

{
    assert.equal(bauDaNota('SSS'), 'Lendário');
    assert.equal(bauDaNota('SS'), 'Lendário');
    assert.equal(bauDaNota('S'), 'Épico');
    assert.equal(bauDaNota('A'), 'Raro');
    assert.equal(bauDaNota('B'), 'Incomum');
    assert.equal(bauDaNota('C'), 'Comum');
    assert.equal(bauDaNota('D'), null);
    assert.equal(bauDaNota('E'), null);
}

// --- 7. o motivo do teto sai junto, para a tela poder dizer -----------------
//
// Era isso que faltava: a pessoa via 99, A e nenhum bau sem saber por que. A
// nota agora volta com o que a segurou.

{
    const capado = notaDoCiclo({ conclusaoPct: 100, dias: 5 });
    assert.equal(capado.nota, 'B');
    assert.equal(capado.notaPelaConclusao, 'SSS');
    assert.ok(capado.motivoDoTeto, 'a nota foi limitada e nao disse por que');
    assert.match(capado.motivoDoTeto, /dias/i);

    const livre = notaDoCiclo({ conclusaoPct: 72, dias: 28, horas: 200 });
    assert.equal(livre.nota, 'B');
    assert.equal(livre.motivoDoTeto, null, 'nada segurou esta nota; o teto nao devia ser citado');
}

console.log('nota-do-ciclo: ok');
