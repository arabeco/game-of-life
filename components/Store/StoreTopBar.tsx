import React from 'react';
import { useGame } from '../../contexts/GameContext';
import { GlassCard } from '../GlassCard';

/**
 * A aba Forja saiu.
 *
 * Ela guardava quatro coisas, e nenhuma era dela: quebrar item (agora no proprio
 * item), forjar exato (no modal do item, onde a vontade nasce ao ver a colecao),
 * sortear na categoria (virou bau, na aba de Itens) e vender campanha por
 * fragmento (na aba de Campanhas, ao lado do preco em ouro).
 *
 * Nenhuma acao foi perdida; todas passaram a morar onde a pessoa ja esta.
 */
export type StoreTab = 'store' | 'codexes' | 'items';

type StoreTopBarProps = {
    activeTab: StoreTab;
    onTabChange: (tab: StoreTab) => void;
};

const STORE_TABS: Array<{ id: StoreTab; label: string; icon: string }> = [
    { id: 'codexes', label: 'Campanhas', icon: '\u{1F4DA}' },
    { id: 'items', label: 'Itens', icon: '\u{1F6E1}\u{FE0F}' },
    { id: 'store', label: 'Ouro', icon: '\u{1FA99}' },
];

export const StoreTopBar: React.FC<StoreTopBarProps> = ({ activeTab, onTabChange }) => {
    const { userProfile, showToast } = useGame();
    const { gold, fragments } = userProfile.wallet || { gold: 0, fragments: 0 };

    return (
        // Ela e `sticky` sobre conteudo que rola por baixo, entao a opacidade nao
        // e enfeite: com bg-black/40 o titulo da secao aparecia POR TRAS da caixa
        // de moedas — "Pacotes de Ouro" e "FORJA" liam-se atraves dela.
        <GlassCard className="sticky top-0 z-50 mb-3 border-white/10 bg-black/80 p-1.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5">
                {/* Ouro e fragmentos LADO A LADO.
                    Empilhados, eles sozinhos definiam a altura da barra inteira:
                    duas linhas de texto mais o respiro entre elas, e as abas
                    tinham de crescer junto para nao ficarem tortas. Em linha, a
                    barra cabe na altura de um botao. */}
                {/* As moedas explicam o que sao ao serem tocadas.
                    Elas apareciam como emoji e numero, sem rotulo em lugar nenhum —
                    e "fragmento" ainda por cima ja significa outra coisa no app, a
                    categoria "Fragmentos de Sabedoria" do Oraculo. Quem chega
                    encontra um diamante com um numero do lado e nenhuma pista de
                    para que serve nem de onde vem.
                    Em celular nao ha `title` que se leia: tocar e o unico gesto
                    disponivel, e a resposta cabe num toast. */}
                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
                    <button
                        type="button"
                        onClick={() => showToast('Ouro: compra itens e campanhas, e vem dos pacotes.', 'info')}
                        className="flex items-center gap-1 text-[11px] font-black leading-none text-[var(--skin-accent-color)]"
                        aria-label={`Ouro: ${gold}`}
                    >
                        <span className="text-[13px]">{'\u{1FA99}'}</span>
                        {gold.toLocaleString('pt-BR')}
                    </button>
                    <span className="h-3 w-px bg-white/10" />
                    <button
                        type="button"
                        onClick={() => showToast('Fragmentos: você ganha quebrando itens que não usa. Compram baús, campanhas e a forja do item exato.', 'info')}
                        className="flex items-center gap-1 text-[11px] font-black leading-none text-cyan-400"
                        aria-label={`Fragmentos: ${fragments}`}
                    >
                        <span className="text-[13px]">{'\u{1F48E}'}</span>
                        {fragments.toLocaleString('pt-BR')}
                    </button>
                </div>

                <div
                    className="store-subtab-strip grid flex-1 gap-1 rounded-xl bg-black/30 p-1"
                    style={{ gridTemplateColumns: `repeat(${STORE_TABS.length}, minmax(0, 1fr))` }}
                >
                    {STORE_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onTabChange(tab.id)}
                            className={`store-subtab-button min-h-[30px] rounded-lg px-1 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition-all ${activeTab === tab.id ? 'luxe-skin-button store-subtab-button-active' : 'luxe-button-secondary store-subtab-button-inactive'}`}
                            aria-label={tab.label}
                            title={tab.label}
                        >
                            <span className="text-[15px] leading-none">{tab.icon}</span>
                        </button>
                    ))}
                </div>
            </div>
        </GlassCard>
    );
};
