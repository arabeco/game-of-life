import React from 'react';
import { SovereignConfig } from '../types';
import { SOVEREIGN_ASSETS } from '../constants/avatar';
import { CanvasAvatar } from './CanvasAvatar';
import { EditIcon } from './Icons';

/**
 * O SOBERANO COMO ELE E VISTO, ANTES DE SER MEXIDO.
 *
 * Esta tela nao existia. Clicar no proprio soberano caia direto no editor, com
 * seletor de corpo, cabelo, pele e roupa abertos de uma vez — nao havia onde
 * so OLHAR o que se montou. E clicar no soberano de outra pessoa, no perfil ou
 * na lista do grupo, nao fazia nada: o que os outros montaram era visivel
 * apenas no tamanho de uma unha.
 *
 * Os TRES SLOTS de artefato nascem aqui, e nao no perfil. No perfil eles
 * ficariam do tamanho de um selo, e um artefato que ninguem consegue ver e um
 * artefato que nao vale a pena ter. Aqui eles tem palco — e o perfil continua
 * mostrando so o de destaque, que e o que cabe la.
 *
 * O botao de editar so aparece quando a vitrine e sua. Sem ele, a mesma tela
 * serve para ver a de qualquer um, sem nenhum caminho que leve a mexer no que
 * nao e seu.
 */

const SLOTS = 3;

const urlDoArtefato = (id?: string) => {
    if (!id || id === 'none') return undefined;
    try {
        return SOVEREIGN_ASSETS.artifacts?.find((item) => item.id === id)?.url;
    } catch {
        return undefined;
    }
};

const nomeDoArtefato = (id?: string) => {
    if (!id || id === 'none') return '';
    try {
        return SOVEREIGN_ASSETS.artifacts?.find((item) => item.id === id)?.name || '';
    } catch {
        return '';
    }
};

export const SovereignVitrine: React.FC<{
    config: SovereignConfig;
    nickname?: string;
    /** Presente = a vitrine e sua. Ausente = so de ver. */
    onEditar?: () => void;
}> = ({ config, nickname, onEditar }) => {
    /*
     * A ORDEM DOS SLOTS: o destaque primeiro, sempre.
     *
     * `artifact` e o que o perfil mostra, entao ele ocupa a primeira vaga e a
     * vitrine diz isso em voz alta. Os outros dois vem de `extraArtifacts`, e
     * as vagas que faltarem ficam vazias em vez de sumir — tres molduras
     * dizem quantas existem; duas dizem que o slot e o que voce tem.
     */
    const artefatos = [
        config.artifact,
        ...(config.extraArtifacts || []),
    ].slice(0, SLOTS);

    while (artefatos.length < SLOTS) artefatos.push('none');

    return (
        <div className="flex flex-col items-center gap-3">
            {/* O soberano, sem artefato nem placa: ele e o assunto, e as pecas
                dos outros modos competiriam com ele dentro da propria moldura. */}
            <div
                className="relative w-44 h-64 overflow-hidden rounded-2xl border-2 bg-black/45"
                style={{ borderColor: 'var(--skin-accent-color)' }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-black/80" />
                <CanvasAvatar
                    sovereignConfig={{
                        ...config,
                        artifact: 'none',
                        artifactPlate: 'none',
                    }}
                    width={280}
                    height={420}
                    className="relative h-full w-full object-contain"
                />
                {nickname && (
                    <div className="absolute inset-x-0 bottom-0 bg-black/65 px-2 py-1 text-center text-[10px] font-black uppercase tracking-[0.14em] text-white/85">
                        {nickname}
                    </div>
                )}
            </div>

            <div className="flex items-start gap-2">
                {artefatos.map((id, indice) => {
                    const url = urlDoArtefato(id);
                    const nome = nomeDoArtefato(id);
                    const ehDestaque = indice === 0;

                    return (
                        <div key={`slot-${indice}`} className="flex w-[4.75rem] flex-col items-center gap-1">
                            <div
                                className={`relative grid h-[4.75rem] w-[4.75rem] place-items-center overflow-hidden rounded-xl border bg-black/40 ${
                                    ehDestaque ? 'border-[var(--skin-accent-color)]/70' : 'border-white/12'
                                }`}
                            >
                                {url ? (
                                    <img
                                        src={url}
                                        alt={nome || 'Artefato'}
                                        className="h-full w-full object-contain p-1"
                                        crossOrigin="anonymous"
                                    />
                                ) : (
                                    /* Vazio com cara de vaga, e nao de erro: a moldura
                                       tracejada diz "cabe algo aqui" sem pedir nada. */
                                    <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/22">
                                        Vazio
                                    </span>
                                )}
                            </div>
                            <span
                                className={`w-full truncate text-center text-[8.5px] font-black uppercase tracking-[0.1em] ${
                                    ehDestaque ? 'text-[var(--skin-accent-color)]' : 'text-white/38'
                                }`}
                            >
                                {ehDestaque ? 'Destaque' : (nome || ' ')}
                            </span>
                        </div>
                    );
                })}
            </div>

            {onEditar && (
                <button
                    type="button"
                    onClick={onEditar}
                    className="luxe-skin-button mt-1 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-[11px] font-black uppercase tracking-[0.14em]"
                >
                    <EditIcon className="h-3.5 w-3.5" />
                    Editar
                </button>
            )}
        </div>
    );
};

/**
 * A vitrine de OUTRA pessoa, num modal.
 *
 * Nao recebe `onEditar` e nao tem como receber: e a diferenca entre ver e
 * mexer, e ela fica no tipo em vez de num `if` que alguem possa esquecer.
 */
export const SovereignVitrineModal: React.FC<{
    config?: SovereignConfig | null;
    nickname?: string;
    onClose: () => void;
}> = ({ config, nickname, onClose }) => {
    if (!config) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="w-full max-w-sm rounded-3xl border-2 bg-[#141414] p-5 shadow-2xl"
                style={{ borderColor: 'var(--skin-accent-color)' }}
                onClick={(event) => event.stopPropagation()}
            >
                <SovereignVitrine config={config} nickname={nickname} />
                <button
                    type="button"
                    onClick={onClose}
                    className="mt-4 w-full rounded-xl bg-gray-800 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-gray-700"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};
