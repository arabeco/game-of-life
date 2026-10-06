import assert from 'node:assert/strict';
import { notaDoCiclo, bauDaNota } from '../utils/cycleGrade.js';

/**
 * A NOTA DO CICLO: UMA TABELA, TRES COLUNAS.
 *
 * Desenhada com o Afonso em 06/10/2026. Cada placa pede conclusao, dias e horas,
 * e a nota e a mais alta em que o ciclo cumpre a linha inteira:
 *
 *   placa  conclusao  dias  horas
 *   SSS      100%      28+   200h  + impecavel
 *   SS        98%      28+   180h
 *   S         95%      14+    90h
 *   A         90%       7+    35h
 *   B         70%        -    20h
 *   C         50%        -    10h
 *   D         30%        -     5h
 *   E        o resto
 *
 * B e bom, A e excelente, S e excepcional, SS e quase perfeito, SSS e perfeito.
 *
 * Antes a nota saia so da porcentagem, com o porte como teto, e o S nunca vinha
 * da execucao: a escada pulava de A (85%) direto para SS (95%). E um ciclo
 * perfeito de duas horas valia o mesmo que um mes inteiro — a cor nao dizia o
 * tamanho do ciclo, que e o que ela deve dizer.
 */

const nota = (conclusaoPct, dias, horas, extra = {}) => notaDoCiclo({ conclusaoPct, dias, horas, ...extra }).nota;

const impecavel = {
    acoesPlanejadas: 120,
    acoesConcluidas: 120,
    metasSeladas: 7,
    metasPlanejadas: 7,
    diasZerados: 0,
    areasAtivas: 5,
};

// --- 1. os exemplos que decidiram a tabela ---------------------------------

{
    assert.equal(nota(86, 7, 52), 'B', '7 dias, 52h, 86%: falta conclusao para o A');
    assert.equal(nota(91, 7, 52), 'A');
    assert.equal(nota(94, 14, 110), 'A', '14 dias, 110h, 94%: falta conclusao para o S');
    assert.equal(nota(96, 14, 110), 'S');
    assert.equal(nota(97, 28, 210), 'S', '28 dias, 210h, 97%: falta conclusao para o SS');
    assert.equal(nota(99, 28, 210), 'SS');
    assert.equal(nota(100, 28, 210, impecavel), 'SSS');
}

// --- 2. o SET 1 nao muda ----------------------------------------------------
//
// 7 dias, 52 horas, 66 de 66 acoes — a missao de temporada fora da conta. Era A
// na regua antiga e continua A: o teto de uma semana e o ouro.

{
    assert.equal(nota(100, 7, 52), 'A');
    assert.equal(bauDaNota('A'), 'Raro');
}

// --- 3. cada coluna segura uma coisa ----------------------------------------

{
    // A CONCLUSAO segura quem faz muito e deixa tudo pela metade.
    assert.equal(nota(50, 7, 45), 'C', '45 horas com 50% nao pode valer ouro');
    assert.equal(nota(29, 28, 400), 'E', 'horas nenhuma compram conclusao');

    // As HORAS dizem o tamanho: ciclo perfeito e pequeno continua pequeno.
    assert.equal(nota(100, 7, 12), 'C', 'semana perfeita de 12 horas e bronze');
    assert.equal(nota(100, 3, 2), 'E', 'tres dias e duas horas nao chegam nas 5h do D');
    assert.equal(nota(95, 7, 30), 'B', '95% numa semana de 30h: faltam horas para o A');
    assert.equal(nota(91, 7, 36), 'A');

    // Os DIAS sao o teto de sempre.
    assert.equal(nota(100, 6, 100), 'B', 'menos de 7 dias para no B, com qualquer volume');
    assert.equal(nota(100, 13, 200), 'A', 'faltou um dia para o S');
    assert.equal(nota(100, 27, 300), 'S', 'faltou um dia para o SS');
}

// --- 4. os degraus, um a um -------------------------------------------------
//
// Cada placa no limite exato, e um passo abaixo dele.

{
    // conclusao
    assert.equal(nota(98, 28, 180), 'SS');
    assert.equal(nota(97.9, 28, 180), 'S');
    assert.equal(nota(95, 14, 90), 'S');
    assert.equal(nota(94.9, 14, 90), 'A');
    assert.equal(nota(90, 7, 35), 'A');
    assert.equal(nota(89.9, 7, 35), 'B');
    assert.equal(nota(70, 0, 20), 'B');
    assert.equal(nota(69.9, 0, 20), 'C');
    assert.equal(nota(50, 0, 10), 'C');
    assert.equal(nota(49.9, 0, 10), 'D');
    assert.equal(nota(30, 0, 5), 'D');
    assert.equal(nota(29.9, 0, 5), 'E');

    // horas
    assert.equal(nota(98, 28, 179.9), 'S', 'o SS pede 180 horas');
    assert.equal(nota(95, 14, 89.9), 'A', 'o S pede 90 horas');
    assert.equal(nota(90, 7, 34.9), 'B', 'o A pede 35 horas');
    assert.equal(nota(70, 7, 19.9), 'C', 'o B pede 20 horas');
    assert.equal(nota(50, 7, 9.9), 'D', 'o C pede 10 horas');
    assert.equal(nota(30, 7, 4.9), 'E', 'o D pede 5 horas');
}

// --- 5. o SSS, e as portas que ele tem de atravessar ------------------------

const ssPerfeito = { conclusaoPct: 100, dias: 28, horas: 200, ...impecavel };

{
    assert.equal(notaDoCiclo(ssPerfeito).nota, 'SSS');

    const semUma = (mudanca, porque) => {
        const resultado = notaDoCiclo({ ...ssPerfeito, ...mudanca }).nota;
        assert.notEqual(resultado, 'SSS', `SSS passou ${porque}`);
        return resultado;
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

// --- 6. cair do SSS preserva o SS -------------------------------------------
//
// Quem fez 100% em 28 dias e 200 horas e so falhou nas frescuras perde o SSS,
// mas fica com o SS. E o CLT que so trabalhou: horas de sobra, cinco areas nao.

{
    assert.equal(notaDoCiclo({ ...ssPerfeito, areasAtivas: 4 }).nota, 'SS');
    assert.equal(notaDoCiclo({ ...ssPerfeito, diasZerados: 2 }).nota, 'SS');
    assert.equal(notaDoCiclo({ ...ssPerfeito, horas: 220, areasAtivas: 1 }).nota, 'SS',
        'o mes so de trabalho chega ao rubi; a pedra da lua pede a vida inteira');
}

// --- 7. o bau sai da nota, e so dela ----------------------------------------

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

// --- 8. o motivo sai so quando o PORTE segurou ------------------------------
//
// Porte e tudo o que nao e execucao: dias, horas e as frescuras do SSS. Quando
// foi a propria conclusao que parou a nota, nao ha motivo — explicar um limite
// que nao encostou em nada manda perseguir horas quando o que faltou foi fazer.

{
    const semana = notaDoCiclo({ conclusaoPct: 100, dias: 5, horas: 52 });
    assert.equal(semana.nota, 'B');
    assert.equal(semana.notaPelaConclusao, 'SSS');
    assert.match(semana.motivoDoTeto, /7 dias/, 'segurou pelos dias e nao disse');

    const poucasHoras = notaDoCiclo({ conclusaoPct: 95, dias: 7, horas: 30 });
    assert.equal(poucasHoras.nota, 'B');
    assert.match(poucasHoras.motivoDoTeto, /35 horas/, 'segurou pelas horas e nao disse');

    const set1 = notaDoCiclo({ conclusaoPct: 100, dias: 7, horas: 52 });
    assert.equal(set1.nota, 'A');
    assert.match(set1.motivoDoTeto, /14 dias/, 'o A da semana e teto, e o motivo diz o que o S pede');

    const execucao = notaDoCiclo({ conclusaoPct: 86, dias: 7, horas: 52 });
    assert.equal(execucao.nota, 'B');
    assert.equal(execucao.motivoDoTeto, null, 'foi a conclusao que parou; o porte nao deve ser citado');

    const metade = notaDoCiclo({ conclusaoPct: 50, dias: 28, horas: 300 });
    assert.equal(metade.nota, 'C');
    assert.equal(metade.motivoDoTeto, null);
}

console.log('nota-do-ciclo: ok');
