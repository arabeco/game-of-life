/**
 * O PORTEIRO DA FALA DE IA (02/11/2026, com o Afonso).
 *
 * O Oraculo nao usa IA para decidir o que dizer: isso continua em
 * oracleCoach/oracleMasterState, que sao deterministicos. A IA entra so como
 * VOZ — recebe os fatos ja calculados e escreve a frase.
 *
 * Este arquivo e a rede de seguranca dessa troca. Ele nao confia no modelo:
 * confere mecanicamente o que voltou e reprova o que nao presta. Reprovado, o
 * chamador usa a frase canonica de sempre. Por isso o pior caso da IA e
 * exatamente o app de hoje, nunca pior.
 *
 * A regra que mais importa e a do numero: o modelo so pode repetir numero que
 * recebeu. Nao pode somar, nao pode estimar, nao pode arredondar. Se uma frase
 * boa precisa de "faltam 8", quem calcula o 8 e o servidor, que o manda dentro
 * dos fatos — nao o modelo.
 */

export type FatosDaFala = Record<string, string | number | null | undefined>;

export type VeredictoDaFala =
  | { ok: true; texto: string }
  | { ok: false; motivo: string };

/** Maximo de frases. As falas da biblioteca tem uma ou duas; tres ja e texto. */
const MAX_FRASES = 2;
/** Teto de tamanho. A fala mais longa da biblioteca nao passa de 130. */
const MAX_CARACTERES = 240;

/**
 * Economia e elogio generico ficam de fora.
 *
 * A economia porque uma promessa alucinada de ouro ou bau vira ticket de
 * suporte e sensacao de golpe — o Oraculo nao distribui premio, quem distribui
 * e o motor de recompensa. O elogio generico porque a propria biblioteca ja o
 * recusa: "elogio de tamanho unico e o mesmo que nao comentar".
 */
const PROIBIDAS = [
  'exp', 'xp', 'ouro', 'moeda', 'moedas', 'bau', 'baus', 'item', 'itens',
  'recompensa', 'recompensas', 'premio', 'premios', 'fragmento', 'fragmentos',
  'trofeu', 'trofeus', 'skin', 'skins',
  'parabens', 'mandou bem', 'voce consegue', 'arrasou', 'orgulho',
  'continue assim', 'nao desista', 'foco total', 'bora',
];

/** Por extenso tambem e numero. Sem isto, "faltam oito" passaria batido. */
const POR_EXTENSO: Record<string, string> = {
  zero: '0', um: '1', uma: '1', dois: '2', duas: '2', tres: '3', quatro: '4',
  cinco: '5', seis: '6', sete: '7', oito: '8', nove: '9', dez: '10',
  onze: '11', doze: '12', treze: '13', catorze: '14', quatorze: '14',
  quinze: '15', dezesseis: '16', dezessete: '17', dezoito: '18',
  dezenove: '19', vinte: '20', trinta: '30', quarenta: '40', cinquenta: '50',
  sessenta: '60', setenta: '70', oitenta: '80', noventa: '90', cem: '100',
};

const semAcento = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Todo numero que o modelo pode repetir.
 *
 * Entram os valores numericos dos fatos e tambem os numeros escritos dentro de
 * texto — uma arena chamada "Projeto 2026" torna 2026 legitimo, e reprovar isso
 * seria reprovar o nome que a propria pessoa deu.
 */
export const numerosPermitidos = (fatos: FatosDaFala): Set<string> => {
  const permitidos = new Set<string>();
  for (const valor of Object.values(fatos)) {
    if (valor === null || valor === undefined) continue;
    for (const achado of String(valor).match(/\d+/g) || []) {
      permitidos.add(String(Number(achado)));
    }
  }
  return permitidos;
};

/** Numeros que a fala afirma, em digito ou por extenso. */
const numerosDaFala = (texto: string): string[] => {
  const limpo = semAcento(texto);
  const digitos = (limpo.match(/\d+/g) || []).map((n) => String(Number(n)));
  const extensos = (limpo.match(/[a-z]+/g) || [])
    .filter((p) => p in POR_EXTENSO)
    .map((p) => POR_EXTENSO[p]);
  return [...digitos, ...extensos];
};

const contarFrases = (texto: string) =>
  texto.split(/[.!?…]+/).filter((p) => p.trim().length > 0).length;

/**
 * Aprova ou reprova a fala que o modelo devolveu.
 *
 * Reprovar nao e erro: e o caminho normal quando o modelo escorrega. O chamador
 * cai na frase canonica e a pessoa nem percebe. A taxa de reprovacao e que
 * precisa ser olhada — alta quer dizer prompt ruim, nao modelo ruim.
 */
export const validarFala = (bruto: string, fatos: FatosDaFala): VeredictoDaFala => {
  const texto = (bruto || '').trim();

  if (!texto) return { ok: false, motivo: 'vazia' };
  if (texto.length > MAX_CARACTERES) return { ok: false, motivo: `passou de ${MAX_CARACTERES} caracteres` };
  if (contarFrases(texto) > MAX_FRASES) return { ok: false, motivo: `passou de ${MAX_FRASES} frases` };
  if (/!/.test(texto)) return { ok: false, motivo: 'ponto de exclamacao' };
  if (/\p{Extended_Pictographic}/u.test(texto)) return { ok: false, motivo: 'emoji' };

  const limpo = semAcento(texto);
  for (const palavra of PROIBIDAS) {
    const alvo = palavra.includes(' ')
      ? new RegExp(palavra.replace(/ /g, '\\s+'))
      : new RegExp(`\\b${palavra}\\b`);
    if (alvo.test(limpo)) return { ok: false, motivo: `palavra proibida: ${palavra}` };
  }

  const permitidos = numerosPermitidos(fatos);
  for (const numero of numerosDaFala(texto)) {
    if (!permitidos.has(numero)) return { ok: false, motivo: `numero inventado: ${numero}` };
  }

  return { ok: true, texto };
};
