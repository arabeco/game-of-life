/**
 * OS AVISOS DO ORACULO COM IA, NA VOZ DELE (03/11/2026, com o Afonso).
 *
 * Quando a pergunta nao vira resposta, quem avisa e o proprio Oraculo, no
 * chat: sem internet, erro, ou as conversas do dia acabaram. So o gratis que
 * esgotou ganha o botao do Premium; quem ja paga nao recebe propaganda.
 */
export type MotivoDoAviso = 'SEM_INTERNET' | 'FALHOU' | 'LIMITE';

export const avisoDoOraculo = (
    motivo: MotivoDoAviso,
    contexto: { gratis: boolean; limite?: number },
): { texto: string; premium: boolean } => {
    if (motivo === 'SEM_INTERNET') {
        return { texto: 'Estou sem internet agora, então não consegui pensar na sua pergunta. Ela continua na caixa: quando a conexão voltar, é só mandar de novo. Essa não contou.', premium: false };
    }
    if (motivo === 'FALHOU') {
        return { texto: 'Me perdi nessa agora. Tenta de novo em instantes; essa não gastou nada.', premium: false };
    }
    if (contexto.gratis) {
        return { texto: 'Por hoje nossa conversa acabou. Amanhã tem outra. No Premium são 5 conversas por dia, e eu respondo no tom que você escolher.', premium: true };
    }
    const limite = contexto.limite ?? 5;
    return { texto: `Você usou as ${limite} conversas de hoje. Amanhã eu volto com a cabeça fresca.`, premium: false };
};
