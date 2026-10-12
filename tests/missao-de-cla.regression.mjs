import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lerStatusDaMissao, rotuloDaMissao, metaBatida, podeReceber, deveRecolher, mensagemDoErroDaMissao, assinaturaDaMissao } from '../utils/missaoDoCla.ts';

/** MISSAO DE CLA NO APP (12/10/2026). Desenho: docs/superpowers/specs/2026-10-12-missao-de-cla-design.md */
const ler = (c) => readFileSync(new URL(`../${c}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

// ============================== 1. ler o status
const bruto = { quest_id: 'clan-genesis-socializar', goal: 20, total: 23, ends_on: '2026-12-31', expired: false, joined: true, claimed: false, has_clan: true,
  members: [{ user_id: 'a', nickname: 'Ana', done: 15 }, { user_id: 'b', nickname: 'Beto', done: 8 }] };
const s = lerStatusDaMissao(bruto);
assert.equal(rotuloDaMissao(s), '20/20', 'o rotulo passou da meta');
assert.equal(metaBatida(s), true);
assert.equal(podeReceber(s), true);
assert.equal(podeReceber({ ...s, recebi: true }), false);
assert.equal(podeReceber({ ...s, entrei: false }), false, 'quem nao entrou nao recebe');
assert.deepEqual(s.membros.map((m) => m.feito), [15, 8]);
assert.equal(lerStatusDaMissao(null), null);
assert.equal(lerStatusDaMissao({ goal: 20 }), null, 'sem quest_id nao e status');
console.log('ok - o status vira X/Y, e so quem entrou pode receber');

// ============================== 2. recolher so a vencida sem meta (risco 4)
assert.equal(deveRecolher({ ...s, vencida: true, total: 5 }), true);
assert.equal(deveRecolher({ ...s, vencida: true, total: 20 }), false, 'concluida fica no ArenasView');
assert.equal(deveRecolher({ ...s, vencida: false, total: 0 }), false);
assert.equal(deveRecolher({ ...s, temCla: false, vencida: false, total: 0 }), false, 'sem cla ainda nao recolhe nada');
assert.equal(mensagemDoErroDaMissao('MISSAO_VENCIDA'), 'Esta missão já venceu.');
assert.equal(mensagemDoErroDaMissao('SEM_CLA'), 'Entre num clã para participar da missão.');
const tarefas = [{ actionId: 'x', completed: true }, { actionId: 'x', completed: false }, { actionId: 'y', completed: true }];
assert.equal(assinaturaDaMissao(tarefas, new Set(['x'])), 'x:1');
assert.notEqual(assinaturaDaMissao([{ actionId: 'x', completed: true }, { actionId: 'x', completed: true }], new Set(['x'])), 'x:1', 'marcar mais uma nao mudou a assinatura');
console.log('ok - so a vencida sem meta se recolhe, e a assinatura muda quando a missao muda');

// ============================== 3. os dados da temporada e a chave
const temporada = ler('constants/seasonContent.ts');
const flags = ler('constants/featureFlags.ts');
assert.match(flags, /clanSeasonQuests: true/);
assert.match(flags, /clanMissions: false/, 'a prioridade do lider voltou a ligar');
const genesis = temporada.slice(temporada.indexOf("'season-genesis-0': {"), temporada.indexOf("'season-zenite-1-2026'"));
const missao = genesis.slice(genesis.indexOf("id: 'clan-genesis-socializar'"));
assert.ok(missao.length > 0, 'a missao de teste saiu da Genesis');
assert.match(missao, /type: 'clan'/);
assert.match(missao, /goal_value: 20/);
assert.match(missao, /reward_value: 'Raro'/);
assert.match(missao.slice(0, missao.indexOf('reward_value') + 30), /reward_value: 'Raro'/, 'missao de cla nao paga bau de temporada');
const sql = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
assert.match(sql, /'clan-genesis-socializar', 'season-genesis-0', 20, date '2026-12-31', 'Raro'/, 'a meta ou o fim do app nao bate com o servidor');
console.log('ok - a missao de teste esta na Genesis, igual ao servidor, com bau Raro');
// ============================== 4. o contexto (riscos 1, 2 e 3)
const contexto = ler('contexts/GameContext.tsx');
const entrar = contexto.slice(contexto.indexOf('const entrarNaMissaoDoCla = useCallback('), contexto.indexOf('const acceptSeasonQuest = async'));
assert.match(entrar, /if \(!clan\) \{[\s\S]*?mensagemDoErroDaMissao\('SEM_CLA'\)/, 'sem cla, entrar tinha de avisar em vez de criar arena');
assert.match(entrar, /missoesDoCla\[questId\]\?\.minhaAcao/, 'entrar de novo criaria outra arena (o elo e a acao da participacao)');
assert.match(entrar, /entrandoNaMissaoRef\.current\.has\(questId\)/, 'duplo toque cria duas arenas');
assert.match(entrar, /supabase\.rpc\('entrar_na_missao_de_cla'/);
assert.match(entrar, /entrarComDesfazer<Arena, Action>\(/, 'a entrada deixou de desfazer so o que criou');
assert.match(entrar, /removerArena: \(arena\) => deleteArena\(arena\.id\)/, 'recusa do servidor deixava arena orfa');
assert.match(contexto, /supabase\.rpc\('receber_premio_da_missao_de_cla'/);
assert.match(contexto, /chestJaEntregue: resposta\.already_claimed \? null : \(resposta\.chest_type \|\| 'Raro'\)/, 'o bau do servidor nao aparece no modal');
const resgate = contexto.slice(contexto.indexOf('const claimSeasonQuest = async'), contexto.indexOf('const claimSeasonQuest = async') + 600);
assert.match(resgate, /if \(quest\.type === 'clan'\) \{\s*await receberPremioDaMissaoDoCla\(questId\);/, 'o resgate generico pagaria a missao de cla pelo cliente');
assert.doesNotMatch(contexto, /A tarefa do grupo soma sozinha/, 'a nota de 22/09 (cla nao se pega) continua barrando');
assert.match(contexto, /deveRecolher\(status\)[\s\S]{0,600}updateArena\(arena\.id, \{ isArchived: true \}\)/, 'vencida sem meta nao se recolhe');
assert.match(ler('views/SeasonView.tsx'), /PRODUCT_FEATURES\.clanSeasonQuests \|\| quest\.type !== 'clan'/);
console.log('ok - entrar trava duplo toque, exige cla, desfaz na recusa; receber mostra o bau do servidor');
// ============================== 5. a tela do cla (risco 5)
const cartao = ler('components/MissaoDoClaCard.tsx');
const barrinha = ler('components/BarrinhaDeHumor.tsx');
const visao = ler('components/ClanOverviewModal.tsx');
assert.match(cartao, /rotuloDaMissao\(status\)/, 'o cartao tem de mostrar X/Y');
assert.match(cartao, /disabled=\{ocupado\}/, 'o botao nao trava em voo');
assert.match(cartao, /podeReceber\(status\)/);
assert.match(visao, /<MissaoDoClaCard \/>/);
assert.match(visao, /<BarrinhaDeHumor mood=\{humorDoCla\[member\.id\]\} \/>/);
console.log('ok - a tela do cla mostra a missao em X/Y e o humor de cada um, que some sem registro');
// A Sede e a aba que abre (a que o Afonso veria todo dia): a missao e o humor moram nela.
const sede = visao.slice(visao.indexOf("{activeTab === 'headquarters' ? ("), visao.indexOf('Temporada atual'));
assert.match(sede, /<MissaoDoClaCard \/>/, 'a missao saiu da Sede, a aba que abre');
assert.match(sede, /<BarrinhaDeHumor mood=\{humorDoCla\[member\.id\]\} compacta \/>/, 'o humor saiu de baixo do nome no palco');
assert.match(barrinha, /compacta \? null :/, 'no palco a barrinha vai sem rotulo, para caber embaixo do nome');
console.log('ok - na Sede, a missao e o humor embaixo do nome de cada soberano');

// ============================== 6. revisao final (12/10/2026)
const { entrarComDesfazer } = await import('../utils/missaoDoCla.ts');
const montar = ({ acaoExistente = null, arenaExistente = null, rpcFalha = false, criarAcaoFalha = false } = {}) => {
  const feito = { arenasCriadas: [], acoesCriadas: [], removidas: [], arenasRemovidas: [], desarquivadas: [], rearquivadas: [] };
  const passos = {
    acaoExistente, arenaExistente,
    criarArena: async () => { const a = { id: 'arena-nova', isArchived: false }; feito.arenasCriadas.push(a.id); return a; },
    desarquivarArena: (a) => feito.desarquivadas.push(a.id),
    rearquivarArena: (a) => feito.rearquivadas.push(a.id),
    criarAcao: async () => { if (criarAcaoFalha) throw new Error('limite de arenas'); const x = { id: 'acao-nova' }; feito.acoesCriadas.push(x.id); return x; },
    removerAcao: async (x) => { feito.removidas.push(x.id); },
    removerArena: async (a) => { feito.arenasRemovidas.push(a.id); },
    registrar: async () => (rpcFalha ? { data: null, error: { message: 'MISSAO_VENCIDA' } } : { data: { quest_id: 'q' }, error: null }),
  };
  return { passos, feito };
};
{
  // acao que ja existia: recusa NUNCA apaga (C1 — perda de dados)
  const { passos, feito } = montar({ acaoExistente: { id: 'acao-velha' }, rpcFalha: true });
  const r = await entrarComDesfazer(passos);
  assert.equal(r.ok, false); assert.equal(r.erro, 'MISSAO_VENCIDA');
  assert.deepEqual(feito.removidas, [], 'a recusa apagou uma acao que ja existia, com o historico dela');
  // criou arena e acao: recusa desfaz as duas (C1 — arena orfa)
  const b = montar({ rpcFalha: true });
  await entrarComDesfazer(b.passos);
  assert.deepEqual(b.feito.removidas, ['acao-nova']);
  assert.deepEqual(b.feito.arenasRemovidas, ['arena-nova'], 'a arena criada ficou orfa depois da recusa');
  // desarquivou: recusa arquiva de novo
  const c = montar({ arenaExistente: { id: 'arena-guardada', isArchived: true }, rpcFalha: true });
  await entrarComDesfazer(c.passos);
  assert.deepEqual(c.feito.desarquivadas, ['arena-guardada']);
  assert.deepEqual(c.feito.rearquivadas, ['arena-guardada']);
  assert.deepEqual(c.feito.arenasRemovidas, [], 'apagou uma arena que ja existia');
  // criar a acao estourou: nada de rejeicao solta, e a arena criada some
  const d = montar({ criarAcaoFalha: true });
  const rd = await entrarComDesfazer(d.passos);
  assert.equal(rd.ok, false);
  assert.deepEqual(d.feito.arenasRemovidas, ['arena-nova']);
  // deu certo: nada desfeito
  const e = montar();
  const re = await entrarComDesfazer(e.passos);
  assert.equal(re.ok, true); assert.deepEqual(e.feito.removidas, []); assert.deepEqual(e.feito.arenasRemovidas, []);
}
console.log('ok - entrar desfaz so o que criou: acao antiga nunca e apagada, arena nova nunca fica orfa');

// I4: o casamento e pela participacao do servidor, nunca pelo nome
assert.equal(lerStatusDaMissao({ ...bruto, my_action_id: 'acao-x' }).minhaAcao, 'acao-x');
const dominio = ler('contexts/gameDomains/questSharedDomain.ts');
assert.match(dominio, /const getClanQuestForActionName = [\s\S]{0,500}if \(!PRODUCT_FEATURES\.clanMissions\) return null;/, 'qualquer acao chamada Socializar virou a missao');
assert.match(dominio, /acaoParaMissaoDoCla\[action\.id\]/, 'a arena da missao tinha de ser achada pela acao da participacao');
const contexto2 = ler('contexts/GameContext.tsx');
const backfill = contexto2.slice(contexto2.indexOf('const questLinkBackfillRef = useRef(false);'), contexto2.indexOf('const findSeasonQuestArenaAndAction = useCallback('));
assert.match(backfill, /candidate\.type !== 'clan'/, 'o preenchimento por nome gravava a missao de cla em acao pessoal');
assert.match(contexto2, /quest\.type === 'clan' && PRODUCT_FEATURES\.clanSeasonQuests\) \{\s*const status = missoesDoCla\[quest\.id\];\s*return Boolean\(status && podeReceber\(status\)\);/, 'o resgate automatico decidia pelo nome da acao');
assert.match(contexto2, /if \(!clan\?\.id\) \{\s*setMissoesDoCla\(\{\}\);\s*setHumorDoCla\(\{\}\);/, 'saiu do cla e o status velho ficou');
console.log('ok - a missao e reconhecida pela acao da participacao; Socializar pessoal fica pessoal');

// I3: abrir a tela recarrega
const cartao2 = ler('components/MissaoDoClaCard.tsx');
assert.match(cartao2, /useEffect\(\(\) => \{[\s\S]{0,200}atualizarMissaoDoCla\([\s\S]{0,120}carregarHumorDoCla\(\)/, 'abrir o cla nao recarrega o grupo');
assert.match(ler('views/ArenasView.tsx'), /missoesDeClaAtivas\.forEach\(\(quest\) => \{ void atualizarMissaoDoCla\(quest\.id\); \}\)/, 'abrir as arenas nao recarrega a missao');
assert.doesNotMatch(contexto2, /if \(!clan\?\.id \|\| !missoesDeClaAtivas\.length\) return;\s*missoesDeClaAtivas\.forEach[\s\S]{0,120}humor_do_meu_cla/, 'o humor so carregava se houvesse missao');
console.log('ok - abrir o cla e as arenas recarrega a missao e o humor');

// I2: Temporada com Entrar e X/Y
const temporada2 = ler('views/SeasonView.tsx');
const detalhe = ler('components/SeasonDetailModal.tsx');
assert.match(temporada2, /if \(quest\.type === 'clan' && PRODUCT_FEATURES\.clanSeasonQuests\) return Boolean\(missoesDoCla\[quest\.id\]\?\.entrei\);/, 'na Temporada, quem entrou nao aparece como dentro');
assert.match(temporada2, /progressLabel=\{missoesDoCla\[quest\.id\] \? rotuloDaMissao\(missoesDoCla\[quest\.id\]\) : undefined\}/, 'a Temporada mostra a missao de cla em %');
assert.doesNotMatch(detalhe, /Ative pelo menu do grupo/, 'a Temporada ainda manda ativar pelo grupo, sem Entrar');
assert.match(detalhe, /semCla \? \([\s\S]{0,300}Entre num clã para participar/);
assert.match(detalhe, /\{progressoTexto \?\? `\$\{Math\.round\(progress\)\}%`\}/, 'o detalhe so sabe mostrar %');
console.log('ok - na Temporada a missao de cla tem Entrar (ou o aviso sem cla) e mostra X/Y');

// I5: virada de temporada nao apaga a missao de cla
const virada = contexto2.slice(contexto2.indexOf('const staleSeasonQuests = Object.values(SEASONS)'), contexto2.indexOf('const staleSeasonQuests = Object.values(SEASONS)') + 400);
assert.match(virada, /quest\.type !== 'clan'/, 'a virada de temporada apaga as tarefas da missao de cla');
console.log('ok - a virada de temporada deixa a missao de cla em paz (quem recolhe e a varredura, arquivando)');

// I6: lista e detalhe fazem a mesma conta
assert.match(ler('views/ArenasView.tsx'), /const getArenaListMetrics = [\s\S]{0,700}forceSharedPool: isExplicitSharedArena\(arena\) \? undefined : false/, 'a lista ainda liga o pool do par sozinha');
assert.match(ler('components/ArenaDetailModal.tsx'), /isExplicitSharedArena\(arena\) \? undefined : false/, 'o detalhe ainda liga o pool do par sozinho');
console.log('ok - cartao, lista e detalhe fazem a mesma conta');

// I7: abandonar = sair da missao, sem apagar historico
const abandonar = contexto2.slice(contexto2.indexOf('const abortSeasonQuest = async'), contexto2.indexOf('const abortSeasonQuest = async') + 1600);
assert.match(abandonar, /supabase\.rpc\('sair_da_missao_de_cla'/, 'abandonar nao tira a pessoa da missao');
assert.match(abandonar, /if \(quest\.type === 'clan'\) \{[\s\S]*?updateArena\([^)]*isArchived: true/, 'abandonar a missao de cla tinha de arquivar a arena, nao apagar');
console.log('ok - abandonar a missao de cla sai dela no servidor e arquiva a arena');

// ============================== 7. pedidos do Afonso depois da revisao (12/10/2026)
// "Se depositou, ja era": quem saiu fica na lista, apagado
const comSaida = lerStatusDaMissao({ ...bruto, members: [{ user_id: 'a', nickname: 'Ana', done: 3, active: true }, { user_id: 'b', nickname: 'Beto', done: 2, active: false }] });
assert.deepEqual(comSaida.membros.map((m) => m.ativo), [true, false], 'o app nao sabe quem saiu');
assert.match(ler('components/MissaoDoClaCard.tsx'), /membro\.ativo \? '' : ' \(saiu\)'/, 'quem saiu aparece igual a quem esta dentro');

// Humor: quem nunca registrou aparece "sem dados" (transparente), nao 50
const barra = ler('components/BarrinhaDeHumor.tsx');
assert.match(barra, /if \(mood === undefined\) return null;/, 'membro sem dado nenhum ainda tinha de nao desenhar nada');
assert.match(barra, /if \(mood === null\) \{[\s\S]{0,900}Sem dados/, 'quem nunca registrou humor tinha de aparecer sem dados');
assert.match(ler('contexts/GameContext.tsx'), /linha\.registrado \? Number\(linha\.mood\) : null/, 'o 50 do cadastro aparecia como humor');

// A meta vale a do servidor
assert.match(ler('contexts/gameDomains/questSharedDomain.ts'), /metaDaMissaoDoCla\[quest\.id\]/, 'a arena usa a meta escrita no app, nao a do servidor');
assert.match(ler('views/SeasonView.tsx'), /if \(quest\.type === 'clan' && missoesDoCla\[quest\.id\]\) \{[\s\S]{0,200}missoesDoCla\[quest\.id\]\.meta/, 'a Temporada usa a meta escrita no app');

// Aurora II sem missao de cla, e toda missao de cla tem semente no servidor
const temporadas = ler('constants/seasonContent.ts');
assert.doesNotMatch(temporadas, /aurora-quest-cla-vigilia/, 'a missao de cla quebrada da Aurora II voltou');
const semente = ler('supabase/migrations/20261012200000_missao_de_cla.sql');
const missoesDeCla = [...temporadas.matchAll(/id: '([^']+)',[\s\S]{0,400}?type: 'clan'/g)].map((m) => m[1]);
assert.ok(missoesDeCla.length > 0);
for (const id of missoesDeCla) assert.ok(semente.includes(`'${id}'`), `missao de cla ${id} sem semente em clan_quests — Entrar daria MISSAO_DESCONHECIDA`);

// Entrar de novo na mesma arena guardada: desarquiva (e arquiva de volta se der errado)
{
  const ok = montar({ acaoExistente: { id: 'acao-velha' }, arenaExistente: { id: 'arena-guardada', isArchived: true } });
  await entrarComDesfazer(ok.passos);
  assert.deepEqual(ok.feito.desarquivadas, ['arena-guardada'], 'voltar para a missao deixou a arena arquivada');
  assert.deepEqual(ok.feito.removidas, []);
  const falhou = montar({ acaoExistente: { id: 'acao-velha' }, arenaExistente: { id: 'arena-guardada', isArchived: true }, rpcFalha: true });
  await entrarComDesfazer(falhou.passos);
  assert.deepEqual(falhou.feito.rearquivadas, ['arena-guardada']);
  assert.deepEqual(falhou.feito.removidas, [], 'a recusa apagou a acao antiga');
}
console.log('ok - quem saiu fica na lista, humor sem registro e "sem dados", meta do servidor, Aurora sem missao de cla, voltar desarquiva');
