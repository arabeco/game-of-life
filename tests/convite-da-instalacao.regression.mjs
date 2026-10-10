import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { conviteDeveSerEsquecido, extrairCodigoDoReferrer } from '../utils/referrerDoConvite.ts';

/**
 * CONVITE, ETAPA 2 (10/10/2026): quem instala pelo link nao digita o codigo.
 *
 * O link leva `referrer=convite%3DCODIGO` para a Play Store; a Install Referrer
 * API devolve isso ao app na primeira abertura; o app guarda e usa quando a
 * conta existir. Dois cuidados, os que a outra IA apontou: nao perder o convite
 * durante o cadastro (fica guardado ate o servidor responder) e nao pagar duas
 * vezes (o servidor aceita um convite por conta).
 */

const ler = (caminho) => readFileSync(new URL(`../${caminho}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. o codigo dentro do referrer
assert.equal(extrairCodigoDoReferrer('convite=AFONSO-7K2'), 'AFONSO-7K2');
assert.equal(extrairCodigoDoReferrer('convite%3Dafonso-7k2'), 'AFONSO-7K2', 'referrer ainda codificado tambem vale');
assert.equal(extrairCodigoDoReferrer('utm_source=x&convite=GLYPH-AB2'), 'GLYPH-AB2');
assert.equal(extrairCodigoDoReferrer('utm_source=google-play&utm_medium=organic'), null, 'instalacao sem link nao e convite');
assert.equal(extrairCodigoDoReferrer(''), null);
assert.equal(extrairCodigoDoReferrer(null), null);
assert.equal(extrairCodigoDoReferrer('convite=<script>'), null, 'so entra o formato do codigo de convite');
assert.equal(extrairCodigoDoReferrer('convite=%E0%A4%A'), null, 'referrer quebrado nao derruba nada');

// O link que o app compartilha e o que o app sabe ler.
const convites = ler('utils/convites.ts');
assert.match(convites, /referrer=\$\{encodeURIComponent\(`convite=\$\{codigo\}`\)\}/);
const link = `https://play.google.com/store/apps/details?id=life.glyph.app&referrer=${encodeURIComponent('convite=MISTERX-7K2')}`;
assert.equal(extrairCodigoDoReferrer(new URL(link).searchParams.get('referrer')), 'MISTERX-7K2', 'o link e a leitura falam a mesma lingua');
console.log('ok - o codigo sai do referrer da Play, codificado ou nao, e o resto e ignorado');

// ============================== 2. guardar ate o servidor responder
assert.equal(conviteDeveSerEsquecido({ ok: true }), true);
assert.equal(conviteDeveSerEsquecido({ ok: false, definitivo: true }), true, 'um "nao" do servidor nao muda tentando de novo');
assert.equal(conviteDeveSerEsquecido({ ok: false, definitivo: false }), false, 'falha de rede guarda o convite');
assert.equal(conviteDeveSerEsquecido({ ok: false }), false);

const contexto = ler('contexts/GameContext.tsx');
const usar = contexto.slice(contexto.indexOf('const usarCodigoDeConvite = async'), contexto.indexOf('const conviteDaInstalacaoTentadoRef'));
assert.match(usar, /if \(error\) return \{ ok: false, erro: mensagemDoErroDeCodigo\(error\.message\), definitivo: false \};/,
  'falha de rede voltou a contar como resposta definitiva — o convite se perderia');
assert.match(usar, /definitivo: true \};/);
const efeito = contexto.slice(contexto.indexOf('const conviteDaInstalacaoTentadoRef'), contexto.indexOf('const buscarMeusConvites'));
assert.match(efeito, /await lerConviteDaInstalacao\(\);/);
assert.match(efeito, /if \(conviteDeveSerEsquecido\(resultado\)\) esquecerConviteDaInstalacao\(\);/,
  'o convite guardado deixou de esperar a resposta do servidor para ser esquecido');

const instalacao = ler('utils/conviteDaInstalacao.ts');
assert.match(instalacao, /if \(Capacitor\.getPlatform\(\) !== 'android'\) return;/);
assert.match(instalacao, /if \(passageiro\) return;/, 'servico da Play fora do ar passou a marcar o referrer como lido');
console.log('ok - o convite fica guardado ate o servidor responder, e falha de rede tenta de novo na proxima abertura');

// ============================== 3. o lado nativo
const plugin = ler('android/app/src/main/java/life/glyph/app/InstallReferrerPlugin.java');
assert.match(plugin, /@CapacitorPlugin\(name = "InstallReferrer"\)/);
assert.doesNotMatch(plugin, /call\.reject/, 'o plugin nunca rejeita: convite e bonus e nao pode travar a abertura');
assert.match(plugin, /respondido\.compareAndSet\(false, true\)/, 'o plugin pode responder duas vezes a mesma chamada');
assert.match(ler('android/app/src/main/java/life/glyph/app/MainActivity.java'), /registerPlugin\(InstallReferrerPlugin\.class\);/);
assert.match(ler('android/app/build.gradle'), /implementation "com\.android\.installreferrer:installreferrer:2\.2"/);
assert.match(ler('android/app/proguard-rules.pro'), /-keep class com\.android\.installreferrer\.\*\* \{ \*; \}/,
  'sem o keep, o R8 pode quebrar a ponte com a Play Store');
console.log('ok - o plugin nativo esta registrado, protegido do R8 e nunca rejeita');

console.log('Convite da instalacao: o link traz o codigo, o app guarda, o servidor confirma uma vez.');
