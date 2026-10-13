/**
 * O NICKNAME (12/10/2026).
 *
 * Unico no app, sem diferenciar maiuscula de minuscula nem espacos nas pontas
 * (o banco garante: migracao 20261012210000_nickname_unico.sql). Ate 20
 * caracteres. No primeiro acesso ele vem so com o primeiro nome — o Google
 * manda o nome completo, e "João Pedro da Silva" vira "João".
 */
export const NICKNAME_MAX = 20;

export const primeiroNome = (nome: string): string => String(nome || '').trim().split(/\s+/)[0] || '';

export const validarNickname = (nome: string): 'vazio' | 'longo' | null => {
    const limpo = String(nome || '').trim();
    if (!limpo) return 'vazio';
    if (limpo.length > NICKNAME_MAX) return 'longo';
    return null;
};
