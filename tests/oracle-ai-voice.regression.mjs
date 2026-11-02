import assert from 'node:assert/strict';
import { validarFala, numerosPermitidos } from '../supabase/functions/_shared/oracle-ai-voice.ts';

/**
 * O PORTEIRO DA FALA DE IA (02/11/2026).
 *
 * A IA so escreve a frase; quem decide o que dizer continua deterministico. Este
 * teste fixa o que o porteiro reprova, porque e ele que garante que o pior caso
 * da IA seja a frase canonica de hoje, e nunca uma besteira na tela da pessoa.
 */

const FATOS_A = {
  estado: 'em_risco', arena: 'Leitura', feitas: 4, prometidas: 12,
  dias_restantes_no_ciclo: 7, projecao_no_ritmo_atual: 6,
  dia_do_ciclo: 21, total_de_dias_do_ciclo: 28,
};

// A fala honesta passa: todo numero dela veio dos fatos.
assert.deepEqual(
  validarFala('Leitura está em 4 de 12, e faltam 7 dias. No ritmo atual você fecha com 6.', FATOS_A),
  { ok: true, texto: 'Leitura está em 4 de 12, e faltam 7 dias. No ritmo atual você fecha com 6.' },
);

// O NUMERO DEDUZIDO E O PERIGO PRINCIPAL. 12 - 4 = 8, mas 8 nao esta nos fatos:
// quem precisa dessa frase manda o 8 dentro dos fatos, nao deixa o modelo somar.
assert.equal(validarFala('Faltam 8 leituras para o combinado.', FATOS_A).motivo, 'numero inventado: 8');
// 4/12 = 33%, e a mesma armadilha com outra roupa.
assert.equal(validarFala('Você está em 33% do combinado.', FATOS_A).motivo, 'numero inventado: 33');
// Por extenso tambem e numero, senao bastaria escrever para escapar da regra.
assert.equal(validarFala('Faltam oito para fechar o combinado.', FATOS_A).motivo, 'numero inventado: 8');
// Mas por extenso de numero que VEIO nos fatos e legitimo: 4 esta la.
assert.equal(validarFala('Leitura parou em quatro.', FATOS_A).ok, true);

// Numero que mora no nome da arena e da pessoa, nao do modelo.
assert.equal(validarFala('Projeto 2026 fechou o ciclo.', { arena: 'Projeto 2026' }).ok, true);

// Economia nunca: promessa alucinada de premio vira ticket de suporte.
for (const fala of ['Isso rende 300 EXP.', 'Vale um baú raro.', 'Você ganha ouro por isso.', 'Tem recompensa esperando.']) {
  assert.equal(validarFala(fala, FATOS_A).ok, false, `devia reprovar: ${fala}`);
}

// Elogio generico a propria biblioteca ja recusa: "elogio de tamanho unico e o
// mesmo que nao comentar".
assert.equal(validarFala('Parabéns pelo esforço.', FATOS_A).motivo, 'palavra proibida: parabens');
assert.equal(validarFala('Continue assim.', FATOS_A).motivo, 'palavra proibida: continue assim');

// "experiencia" contem "exp", e reprovar isso seria falso positivo.
assert.equal(validarFala('A experiência do ciclo mudou.', FATOS_A).ok, true);

// Forma: a voz do Oraculo e seca.
assert.equal(validarFala('Boa! Muito bem.', FATOS_A).motivo, 'ponto de exclamacao');
assert.equal(validarFala('Leitura andou. 👏', FATOS_A).motivo, 'emoji');
assert.equal(validarFala('Leitura andou. Falta pouco. Segue.', FATOS_A).motivo, 'passou de 2 frases');
assert.equal(validarFala('a '.repeat(200), FATOS_A).motivo, 'passou de 240 caracteres');
assert.equal(validarFala('   ', FATOS_A).motivo, 'vazia');

// Os permitidos saem dos fatos, numeros repetidos entram uma vez so.
assert.deepEqual(numerosPermitidos({ a: 4, b: '4', c: null, d: undefined }), new Set(['4']));

console.log('Porteiro da fala de IA: numero deduzido, economia, elogio generico e forma OK.');
