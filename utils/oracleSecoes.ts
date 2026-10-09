/**
 * EM QUE SUB-ABA DO ORACULO CADA MENSAGEM MORA.
 *
 * Saiu de components/OracleChat.tsx em 09/10/2026, quando as sub-abas ganharam a
 * bolinha de nao lido: o filtro que mostra a mensagem e a bolinha que avisa dela
 * precisam ler a mesma regra, senao uma aba acende por algo que mora na outra.
 */

/**
 * Leitura nao e sabedoria.
 *
 * As abas se dividiam por CANAL de entrega — tudo que chegava pelo feed caia em
 * Sabedoria. So que a leitura do ciclo tambem chega pelo feed, e ela fala do
 * SEU dia e do SEU ciclo: o lugar dela e a primeira aba, junto dos dois botoes
 * que produzem a mesma coisa a pedido. Sabedoria fica com o que ela sempre
 * quis ser: card de conteudo, que nao depende do seu estado. A divisao passa a
 * ser por ASSUNTO, e as duas pontas (hidratacao e filtro) leem daqui para nao
 * discordarem de novo.
 *
 * O card automatico furava essa regra por um detalhe: ele ESCOLHE um tema da
 * biblioteca (Carta inspiradora, Fragmento de sabedoria) e depois escreve texto
 * de CONTEXTO, sobre os seus numeros. Roteado pela categoria, ele caia em
 * Sabedoria com etiqueta de sabedoria e corpo de relatorio. Por isso o assunto
 * agora tambem se le no proposito: quem fala do seu ciclo diz isso de si mesmo,
 * em vez de deixar a categoria mentir pelos dois.
 */
const CATEGORIAS_DE_LEITURA = new Set(['analise_padroes']);
const ehLeitura = (category?: string | null) => Boolean(category && CATEGORIAS_DE_LEITURA.has(category));

/**
 * SABEDORIA E SO O CARD TEMATICO, E A LISTA E DE PERMISSAO.
 *
 * A regra era por EXCLUSAO: tudo que nao fosse leitura de ciclo caia em
 * Sabedoria. Funcionava enquanto so existissem dois tipos de card — e parou de
 * funcionar quando o coach passou a falar. "Voce ja provou que consegue" e
 * sobre os seus numeros, nao e tema nenhum, e mesmo assim entrava ali, porque
 * nao era leitura de ciclo.
 *
 * Uma aba definida pelo que ela NAO tem herda tudo o que nascer depois. Entao
 * ela passa a ser definida pelo que tem: card que saiu da BIBLIOTECA, que e o
 * unico que e tema de verdade. Qualquer coisa nova que fale da pessoa nasce em
 * "Dia e ciclo" sem ninguem precisar lembrar de exclui-la daqui.
 */
const PROPOSITOS_DE_BIBLIOTECA = new Set(['premium_content_card']);

export const ehCardDeBiblioteca = (
    deliveryType?: string | null,
    category?: string | null,
    purpose?: string | null,
) => {
    if (deliveryType !== 'feed') return false;
    // Card gravado antes de o proposito existir na coluna: sem ele nao da para
    // saber a origem, e mandar o historico inteiro para a outra aba seria pior
    // que o defeito. Ali vale a regra antiga.
    if (!purpose) return !ehLeitura(category);
    return PROPOSITOS_DE_BIBLIOTECA.has(purpose);
};


export type SecaoDoOraculo = 'guidance' | 'mission' | 'wisdom';

export interface MensagemComSecao {
    deliveryType?: string | null;
    category?: string | null;
    read?: boolean | null;
    /** So o `purpose` importa aqui; o resto do snapshot varia por tipo de mensagem. */
    contextSnapshot?: object | null;
}

/**
 * A sub-aba de uma mensagem gravada. A missao individual tem o seu painel; o card
 * de biblioteca vai para Sabedoria; o resto — leitura, falas — e "Dia e ciclo".
 */
export const secaoDaMensagem = (mensagem: MensagemComSecao): SecaoDoOraculo => {
    const purpose = (mensagem.contextSnapshot as { purpose?: string | null } | null | undefined)?.purpose;
    if (purpose === 'individual_mission') return 'mission';
    if (purpose !== 'oracle_speech' && ehCardDeBiblioteca(mensagem.deliveryType, mensagem.category, purpose)) return 'wisdom';
    return 'guidance';
};

/** As sub-abas que tem pelo menos uma mensagem nao lida. */
export const secoesComNaoLidas = (mensagens: MensagemComSecao[]): Set<SecaoDoOraculo> =>
    new Set(mensagens.filter((mensagem) => !mensagem.read).map(secaoDaMensagem));
