import React from 'react';

/**
 * Os simbolos de valor: EXP, ouro, fragmento, acoes, sequencia, meta.
 *
 * Ate aqui ouro e fragmento eram os emoji 🪙 e 💎, e EXP era a palavra "EXP"
 * depois do numero. Emoji muda de desenho em cada fabricante de Android — o
 * mesmo saldo aparecia com um cofre num aparelho e uma moeda noutro — e a
 * palavra ao lado de dois emoji fazia a linha parecer montada por engano.
 *
 * Sao PNG com cor propria, entao entram como <img> e nao herdam a cor do texto:
 * ouro e dourado, fragmento e roxo, acoes e verde, sequencia e laranja, meta e
 * vermelho. E a cor que faz cada um ser reconhecido a 16px, mais do que a forma.
 *
 * 16px e o tamanho real de uso — colado ao numero, dentro do slot de recompensa.
 * Os arquivos sao 512x512 para aguentar tela densa, e foram desenhados com
 * silhueta fechada justamente para sobreviver a essa reducao.
 */

export type Valor = 'exp' | 'ouro' | 'fragmento' | 'acoes' | 'sequencia' | 'meta';

interface ValorIconProps {
    valor: Valor;
    className?: string;
    /** Lado do quadrado, em pixels. */
    tamanho?: number;
    /** Como leitor de tela anuncia. Vazio quando o texto ao lado ja diz. */
    rotulo?: string;
}

const NOMES: Record<Valor, string> = {
    exp: 'experiência',
    ouro: 'ouro',
    fragmento: 'fragmentos',
    acoes: 'ações concluídas',
    sequencia: 'sequência',
    meta: 'meta',
};

export const ValorIcon: React.FC<ValorIconProps> = ({ valor, className = '', tamanho = 16, rotulo }) => (
    <img
        src={`/assets/icons/${valor}.png`}
        alt={rotulo === '' ? '' : (rotulo || NOMES[valor])}
        aria-hidden={rotulo === '' ? true : undefined}
        width={tamanho}
        height={tamanho}
        className={`inline-block shrink-0 select-none align-[-0.15em] ${className}`}
        style={{ width: tamanho, height: tamanho, objectFit: 'contain' }}
        draggable={false}
    />
);
