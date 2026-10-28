import React from 'react';
import type { ItemDaLeitura } from '../utils/leituraPremium';

/**
 * A ABA "LEITURA" DO PAINEL DO DIA (28/10/2026, com o Afonso).
 *
 * Quem assina ve a leitura inteira (utils/leituraPremium). Quem nao assina ve
 * os titulos do que existe ali, com o valor apagado, e um botao para a vitrine
 * dos planos: mostrar o que se ganha, sem fingir um dado que a pessoa nao tem.
 */
export const LeituraPremiumDoDia: React.FC<{ itens: ItemDaLeitura[]; liberada: boolean }> = ({ itens, liberada }) => {
    if (!liberada) {
        const amostra = ['Este ciclo contra o seu histórico', 'Para onde o ciclo vai no ritmo de agora', 'Seu horário e seu dia mais fortes', 'A arena em alta, a em queda e a esquecida'];
        return (
            <div className="leitura-premium">
                <p className="leitura-premium-intro">A leitura completa do seu dia e do seu ciclo fica no Premium.</p>
                <ul className="leitura-premium-lista leitura-premium-lista--trancada">
                    {amostra.map((titulo) => (
                        <li key={titulo} className="leitura-premium-item">
                            <span className="leitura-premium-titulo">{titulo}</span>
                            <span className="leitura-premium-valor" aria-hidden="true">●●●</span>
                        </li>
                    ))}
                </ul>
                <button
                    type="button"
                    className="leitura-premium-cta"
                    onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-store', { detail: { tab: 'membership', section: 'premium' } }))}
                >
                    Ver o Premium
                </button>
            </div>
        );
    }

    return (
        <div className="leitura-premium">
            <ul className="leitura-premium-lista">
                {itens.map((item) => (
                    <li key={item.id} className={`leitura-premium-item leitura-premium-item--${item.tom}`}>
                        <span className="leitura-premium-titulo">{item.titulo}</span>
                        <span className="leitura-premium-valor">{item.valor}</span>
                        <span className="leitura-premium-detalhe">{item.detalhe}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};
