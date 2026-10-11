import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { medirFetch, pesoAteAgora, pesoDaAberturaAnterior } from '../utils/medidorDeAbertura.ts';

/**
 * O PESO DE CADA ABERTURA (11/10/2026) — passo 0 do egress de abertura.
 *
 * O pedido do Afonso foi "adiantar, mas nao pode dar erro". Entao o que este
 * teste guarda e, antes de tudo, que o medidor e INVISIVEL para o app: a
 * resposta que volta e a mesma, o corpo continua legivel, e erro de rede passa
 * adiante sem ser engolido nem inventado.
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const esperar = () => new Promise((resolver) => setTimeout(resolver, 20));

// ============================== 1. invisivel para o app
const corpo = JSON.stringify({ tarefas: Array.from({ length: 50 }, (_, i) => ({ id: i, nome: 'Treino' })) });
const original = new Response(corpo, { headers: { 'content-type': 'application/json' } });
const medido = medirFetch(async () => original);
const resposta = await medido('https://exemplo.supabase.co/rest/v1/scheduled_tasks');
assert.equal(resposta, original, 'o medidor trocou a resposta — o app receberia outra coisa');
assert.equal(await resposta.text(), corpo, 'o corpo deixou de ser legivel pelo app depois da medicao');

await esperar();
const depois = pesoAteAgora();
assert.equal(depois.pedidos, 1);
assert.equal(depois.bytes, Buffer.byteLength(corpo), 'o tamanho medido nao bate com o que veio');
console.log('ok - a resposta volta a mesma, o corpo continua legivel, e o tamanho e somado de uma copia');

// ============================== 2. erro de rede passa adiante igual
const falha = new TypeError('Failed to fetch');
await assert.rejects(medirFetch(async () => { throw falha; })('https://x/rest/v1/a'), (erro) => erro === falha,
  'o medidor engoliu ou trocou um erro de rede');

// Resposta cuja copia nao pode ser feita: o app recebe a resposta mesmo assim.
const usada = new Response('ja lido');
await usada.text();
const devolvida = await medirFetch(async () => usada)('https://x/rest/v1/b');
assert.equal(devolvida, usada, 'uma copia impossivel derrubou o pedido');
console.log('ok - erro de rede passa igual, e uma copia impossivel nao derruba nada');

// ============================== 3. sem armazenamento, sem drama
assert.equal(pesoDaAberturaAnterior(), null, 'sem localStorage (ou sem medicao anterior) tem de ser nulo, sem erro');

// ============================== 4. ligado onde deve
const cliente = ler('supabaseClient.ts');
assert.match(cliente, /createCoalescedFetch\(medirFetch\(\(input, init\) => fetch\(input, init\)\), new URL\(supabaseUrl\)\.origin\)/,
  'o medidor saiu de dentro do coalescer — passaria a contar copias em vez da rede');
const metricas = ler('services/AppRuntimeMetricsService.ts');
assert.match(metricas, /\.\.\.\(pesoDaAberturaAnterior\(\) \|\| \{\}\),/, 'o peso deixou de ir junto do registro de abertura');
const medidor = ler('utils/medidorDeAbertura.ts');
assert.match(medidor, /const JANELA_MS = 30_000;/);
console.log('ok - o medidor fica por dentro do coalescer e o peso vai no registro da proxima abertura');

console.log('Medidor de abertura: observa sem tocar, e cada abertura vira numero.');
