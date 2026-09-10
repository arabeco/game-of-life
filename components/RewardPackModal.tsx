import React from 'react';
import { Portal } from './Portal';
import { RewardPackBody } from './RewardPackBody';
import type { RewardMetricCard, RewardModalPayload } from '../types';
import { DIRECAO_PADRAO, DIRECOES, REWARD_PLATE_VIEWPORT_STYLE, type DirecaoDaPlaca } from '../constants/rewardPlateStyles';

interface RewardPackModalProps {
  open: boolean;
  payload?: RewardModalPayload | null;
  onClose: () => void;
  fallbackEyebrow: string;
  fallbackTitle: string;
  fallbackSummary: string;
  fallbackButtonLabel: string;
  fallbackItemSectionTitle?: string;
  fallbackEmptyMessage?: string;
  fallbackMetricCards?: RewardMetricCard[];
  /** Emblema do topo. Caminho de PNG da tabela em constants/rewardEmblems.ts. */
  emblema?: React.ReactNode;
  /** RGB do acontecimento. Vira o reflexo de metal da placa. */
  tom?: string;
  /**
   * Qual das quatro direcoes desenha a placa. B e a aprovada; as outras tres
   * continuam aplicaveis para comparar no aparelho, com conteudo de verdade.
   */
  direcao?: DirecaoDaPlaca;
}

/**
 * A PLACA — direcao B, Monolito Central.
 *
 * As medidas nao sao aproximacao: sao as de
 * `docs/drafts/reward-modal-4-direcoes.html`, bloco `.monolith`. Moldura de
 * 3px, tres aneis por dentro (5/6/9px), duas sombras solidas deslocadas
 * (9x11 e 12x14) e chanfro de 28px nos quatro cantos. E isso que faz a coisa
 * parecer uma placa de metal com espessura, e nao um retangulo escuro.
 *
 * O tom do acontecimento entra em tres camadas fracas de gradiente: elipse no
 * topo, veio diagonal e brilho externo. A placa continua grafite — a cor diz o
 * que aconteceu, nao pinta a tela.
 */
export const RewardPackModal: React.FC<RewardPackModalProps> = ({
  open,
  payload,
  onClose,
  fallbackEyebrow,
  fallbackTitle,
  fallbackSummary,
  fallbackButtonLabel,
  fallbackItemSectionTitle,
  fallbackEmptyMessage,
  fallbackMetricCards,
  emblema,
  tom,
  direcao = DIRECAO_PADRAO,
}) => {
  if (!open) return null;

  const rgb = tom || '234,179,8';
  const estilo = DIRECOES[direcao];

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/88 px-4 py-5 backdrop-blur-md"
        onClick={onClose}
      >
        <div
          className={`relative flex flex-col text-[#f5f3ed] ${estilo.respiro}`}
          style={{ ...estilo.placa(rgb), ...REWARD_PLATE_VIEWPORT_STYLE }}
          onClick={(event) => event.stopPropagation()}
        >
          <RewardPackBody
            payload={payload}
            fallbackEyebrow={fallbackEyebrow}
            fallbackTitle={fallbackTitle}
            fallbackSummary={fallbackSummary}
            fallbackItemSectionTitle={fallbackItemSectionTitle}
            fallbackEmptyMessage={fallbackEmptyMessage}
            fallbackMetricCards={fallbackMetricCards}
            emblema={emblema}
            tom={rgb}
            estiloDoCrest={estilo.crest(rgb)}
          />

          {/* O botao NAO herda a raridade: e sempre o da Skin UI equipada. O
              que a direcao B muda e so o recorte — as duas pontas viram bico.

              E ele nao ocupa mais a faixa inteira: uma barra de borda a borda no
              pe da placa le como rodape, nao como saida. Do tamanho da palavra e
              centrado, ele volta a parecer um botao. */}
          <div className="mt-[17px] flex shrink-0 justify-center">
            <button
              onClick={onClose}
              className="luxe-skin-button luxe-brilho h-12 min-w-[13rem] px-10 text-[11px] font-black uppercase tracking-[0.24em]"
              style={{ ...estilo.botao, borderWidth: 2 }}
            >
              {payload?.buttonLabel || fallbackButtonLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
};
