/**
 * OS AVISOS DO ORACULO COM IA, NA VOZ DELE (03/11/2026, com o Afonso).
 *
 * Quando a pergunta nao vira resposta, quem avisa e o proprio Oraculo, no
 * chat: sem internet, erro, ou as conversas do dia acabaram. Um texto pronto
 * por tom (sem chamar a IA). So o gratis que esgotou ganha o botao do Premium;
 * quem ja paga nao recebe propaganda.
 */
/**
 * AS MENSAGENS QUE RESTAM, PERTO DA CAIXA (04/11/2026, com o Afonso). Em cima de
 * tudo "(45)" parecia nao lida; aqui, junto de onde se escreve, diz o que e.
 */
export const textoDasRestantes = (restam: number): string =>
    `${restam} ${restam === 1 ? 'mensagem restante' : 'mensagens restantes'} hoje`;

export type MotivoDoAviso = 'SEM_INTERNET' | 'FALHOU' | 'LIMITE';
export type TomDoAviso = 'neutro' | 'coach' | 'reflexivo' | 'calmo';

const SEM_INTERNET: Record<TomDoAviso, string> = {
    neutro: 'Estou sem internet agora, então não consegui pensar na sua pergunta. Ela continua na caixa: quando a conexão voltar, é só mandar de novo. Essa não contou.',
    coach: 'Caiu a conexão. A pergunta ficou na caixa; volta a internet, manda de novo. Essa não contou.',
    reflexivo: 'Fiquei sem internet bem na hora. Sua pergunta ficou guardada na caixa, e vale mandar quando a conexão voltar. Essa não contou.',
    calmo: 'Sem internet por agora, sem problema. Sua pergunta ficou na caixa para quando a conexão voltar. Essa não contou.',
};

const FALHOU: Record<TomDoAviso, string> = {
    neutro: 'Me perdi nessa agora. Tenta de novo em instantes; essa não gastou nada.',
    coach: 'Travei nessa. Manda de novo em instantes, que essa não gastou nada.',
    reflexivo: 'Não consegui organizar o pensamento nessa. Tenta de novo daqui a pouco? Essa não gastou nada.',
    calmo: 'Não saiu nada agora, tudo bem. Tenta de novo daqui a pouco; essa não gastou nada.',
};

const LIMITE_GRATIS: Record<TomDoAviso, string> = {
    neutro: 'Por hoje nossa conversa acabou. Amanhã tem outra. No Premium são 5 conversas por dia, e eu respondo no tom que você escolher.',
    coach: 'A conversa de hoje acabou. Amanhã tem mais. Se quiser treinar comigo todo dia, o Premium dá 5 conversas por dia.',
    reflexivo: 'Nossa conversa de hoje chegou ao fim. Amanhã tem outra. No Premium são 5 por dia, para pensar junto sempre que precisar.',
    calmo: 'Por hoje é isso, e está tudo bem. Amanhã tem outra conversa. No Premium são 5 por dia, quando quiser.',
};

const LIMITE_PAGO: Record<TomDoAviso, (limite: number) => string> = {
    neutro: (n) => `Você usou as ${n} conversas de hoje. Amanhã eu volto com a cabeça fresca.`,
    coach: (n) => `As ${n} conversas de hoje acabaram. Agora é executar; amanhã a gente revê.`,
    reflexivo: (n) => `As ${n} conversas de hoje acabaram. Fica com o que surgiu nelas até amanhã.`,
    calmo: (n) => `As ${n} conversas de hoje acabaram. Descansa a cabeça; amanhã eu estou aqui.`,
};

export const avisoDoOraculo = (
    motivo: MotivoDoAviso,
    contexto: { gratis: boolean; limite?: number; tom?: string },
): { texto: string; premium: boolean } => {
    const tom: TomDoAviso = (['neutro', 'coach', 'reflexivo', 'calmo'] as const).includes(contexto.tom as TomDoAviso)
        ? (contexto.tom as TomDoAviso)
        : 'neutro';
    if (motivo === 'SEM_INTERNET') return { texto: SEM_INTERNET[tom], premium: false };
    if (motivo === 'FALHOU') return { texto: FALHOU[tom], premium: false };
    if (contexto.gratis) return { texto: LIMITE_GRATIS[tom], premium: true };
    return { texto: LIMITE_PAGO[tom](contexto.limite ?? 5), premium: false };
};
