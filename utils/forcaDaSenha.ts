/**
 * A REGRA DA SENHA, UMA SO (26/11/2026).
 *
 * O cadastro pedia 8 caracteres com numero ou simbolo; a tela de redefinir
 * senha aceitava 6. Quem esquecia a senha saia com uma mais fraca do que a do
 * cadastro, e o minimo do Supabase nao podia subir para 8 sem quebrar essa tela.
 * As duas telas usam esta regra.
 */
export const SENHA_MINIMA = 8;
export const MENSAGEM_SENHA_FRACA = 'A senha deve ter pelo menos 8 caracteres e incluir um número ou caractere especial.';

export const forcaDaSenha = (senha: string) => {
    if (senha.length === 0) return { score: 0, label: '', color: 'bg-gray-800' };
    if (senha.length < SENHA_MINIMA) return { score: 1, label: 'RUIM', color: 'bg-red-500' };

    const temNumero = /\d/.test(senha);
    const temSimbolo = /[!@#$%^&*(),.?":{}|<>]/.test(senha);

    if (temNumero || temSimbolo) return { score: 3, label: 'FORTE', color: 'bg-green-500' };
    return { score: 2, label: 'MÉDIA', color: 'bg-yellow-500' };
};

export const senhaAceita = (senha: string) => forcaDaSenha(senha).score >= 3;
