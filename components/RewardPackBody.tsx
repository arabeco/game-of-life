import React, { useMemo } from 'react';
import { resolveItemDef } from '../constants/items';
import { getRarityVisual } from '../constants/rarityVisuals';
import { ValorIcon } from './ValorIcon';
import { Check, Gift } from 'lucide-react';
import type { RewardHighlightLine, RewardMetricCard, RewardModalPayload } from '../types';

/**
 * O miolo de TODA tela de recompensa: brasao, titulo, quadradinhos de valor,
 * faixa de destaque, itens recebidos e vantagens.
 *
 * As medidas vem de `docs/drafts/reward-modal-4-direcoes.html`, bloco
 * `.monolith` — a direcao B aprovada. Crest de 84px com PNG de 66, metrica de
 * 94x94 com o simbolo dentro do proprio nicho de fio, item de 68px em duas
 * colunas com arte de 46 e borda so embaixo. Nao sao numeros escolhidos aqui:
 * sao os da sheet, e trocar um deles quebra a familia.
 *
 * O miolo existia duas vezes. O RewardPackModal desenhava assim e o
 * AchievementModal desenhava a mesma coisa com outro codigo — a letra "G" no
 * lugar do simbolo de ouro, um "?" no de EXP, emoji no lugar da arte e nenhuma
 * cor de raridade. Toda melhoria feita num deles nao chegava no outro.
 *
 * Aqui nao ha Portal, backdrop nem botao: quem chama monta a placa e o rodape.
 * E por isso que o modal de feito ainda pode ter o video antes e o botao de
 * compartilhar depois, sem duplicar nada disto.
 */

/**
 * O que a peca e, em portugues.
 *
 * A linha abaixo do nome mostrava `{itemDef.category} T{itemDef.tier}`, e saia
 * literalmente "border T2": o slug interno em ingles e o patamar cru. Quem
 * acabou de ganhar o item nao sabe o que e "border", e "T2" nao diz se aquilo e
 * bom. Categoria em portugues mais o nome da raridade dizem as duas coisas.
 */
const NOME_DA_CATEGORIA: Record<string, string> = {
    skin: 'Skin',
    hair: 'Cabelo',
    border: 'Borda',
    banner: 'Banner',
    glyph: 'Glifo',
    aura: 'Aura',
    ui_skin: 'Tema',
    artifact: 'Artefato',
    orb: 'Orbe',
    plate: 'Placa',
    chest: 'Baú',
    insignia: 'Insígnia',
    insignias: 'Insígnia',
};

/**
 * O nome ja diz a categoria?
 *
 * "Insígnia do Cavaleiro" com a linha "INSÍGNIA · INCOMUM" embaixo repete a
 * palavra e ainda estoura a largura do card, virando "INSÍGNIA INCOMU…". Quando
 * o nome ja carrega a categoria, so a raridade importa.
 */
const semAcento = (valor: string) => valor.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const categoriaJaEstaNoNome = (nome: string, categoria: string) =>
    semAcento(nome).includes(semAcento(categoria));

const rewardHighlightToneStyles: Record<NonNullable<RewardHighlightLine['tone']>, string> = {
  gold: 'border-yellow-500/18 bg-yellow-500/[0.06] text-yellow-100',
  emerald: 'border-emerald-500/18 bg-emerald-500/[0.06] text-emerald-100',
  cyan: 'border-cyan-500/18 bg-cyan-500/[0.06] text-cyan-100',
  violet: 'border-violet-500/18 bg-violet-500/[0.08] text-violet-100',
};

const benefitToneRgb = {
  gold: '214,177,92',
  emerald: '52,211,153',
  cyan: '34,211,238',
  violet: '167,139,250',
} as const;

/** Rotulo de secao: texto a esquerda e um fio que corre ate a borda. */
const TituloDeSecao: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="mb-[9px] mt-[18px] flex items-center gap-[10px] text-[9px] font-black uppercase tracking-[0.23em] text-[#aaadb4]">
    {children}
    <span className="h-px flex-1 bg-[#303238]" />
  </div>
);

export interface RewardPackBodyProps {
  payload?: RewardModalPayload | null;
  fallbackEyebrow: string;
  fallbackTitle: string;
  fallbackSummary: string;
  fallbackItemSectionTitle?: string;
  fallbackEmptyMessage?: string;
  fallbackMetricCards?: RewardMetricCard[];
  /**
   * O emblema no topo da placa. String = caminho de PNG (a tabela em
   * constants/rewardEmblems.ts); qualquer outro no e desenhado como esta —
   * emoji, por exemplo, enquanto um acontecimento ainda nao tem arte.
   */
  emblema?: React.ReactNode;
  /**
   * RGB do acontecimento ("245,158,11"). Aqui ele so tinge a borda do crest:
   * o reflexo grande e da placa, e quem desenha a placa e quem chama.
   */
  tom?: string;
  /** Estilo do suporte do emblema, vindo da direcao escolhida. */
  estiloDoCrest?: React.CSSProperties;
}

export const RewardPackBody: React.FC<RewardPackBodyProps> = ({
  payload,
  fallbackEyebrow,
  fallbackTitle,
  fallbackSummary,
  fallbackItemSectionTitle = 'Itens recebidos',
  fallbackEmptyMessage = 'Seu pacote ja foi integrado ao Arsenal.',
  fallbackMetricCards = [],
  emblema,
  tom,
  estiloDoCrest,
}) => {
  const showItems = (payload?.itemIds?.length || 0) > 0;
  const itemIds = payload?.itemIds || [];
  const metricCards = payload?.metricCards?.length ? payload.metricCards : fallbackMetricCards;
  const rewardHighlights = payload?.rewardHighlights || [];
  const activeBenefits = payload?.activeBenefits || [];
  const titulo = payload?.title || fallbackTitle;
  const eyebrow = payload?.eyebrow ?? fallbackEyebrow;
  const tituloLongo = titulo.length > 25;
  const quatroOuMaisMetricas = metricCards.length >= 4;
  const tomDaPlaca = tom || '234,179,8';

  const rewardItems = useMemo(
    () =>
      itemIds
        .map((itemId) => {
          const itemDef = resolveItemDef(itemId);
          return itemDef ? { itemId, itemDef } : null;
        })
        .filter((entry): entry is { itemId: string; itemDef: NonNullable<ReturnType<typeof resolveItemDef>> } => Boolean(entry)),
    [itemIds],
  );
  const featuredRewardItem = useMemo(() => {
    if (!payload?.featuredItemId) return null;
    const itemDef = resolveItemDef(payload.featuredItemId);
    return itemDef ? { itemId: payload.featuredItemId, itemDef } : null;
  }, [payload?.featuredItemId]);
  // Todos os itens aparecem.
  //
  // Antes o modal cortava em DOIS e resumia o resto num card "+4 itens extras".
  // Subir de patente entrega seis de uma vez — e a recompensa mais rara do jogo,
  // dez no jogo inteiro, era justamente a que mais escondia. O corpo ja rola;
  // esconder o premio para poupar rolagem troca a coisa certa pela errada.
  const visibleRewardItems = payload?.repeatFeaturedItemInList
    ? rewardItems
    : rewardItems.filter(({ itemId }) => itemId !== featuredRewardItem?.itemId);
  const itemUnico = visibleRewardItems.length === 1 && !featuredRewardItem;
  const emptyMessage = payload?.emptyMessage ?? fallbackEmptyMessage;

  return (
    <>
      <div className="shrink-0 text-center">
        {emblema && (
          // O suporte octogonal: quadrado com os quatro cantos cortados,
          // moldura de fio, dois aneis por dentro e sombra solida deslocada.
          // O losango girado saiu com a direcao antiga.
          <div
            className="mx-auto mb-[14px] grid h-[84px] w-[84px] place-items-center text-4xl"
            style={estiloDoCrest || {
              border: `1px solid ${tom ? `rgba(${tom},.55)` : '#5b5e62'}`,
              background: 'linear-gradient(135deg, #191c20, #07090b 68%)',
              boxShadow: 'inset 0 0 0 5px #080a0c, inset 0 0 0 6px #30343a, 5px 6px 0 #050607',
              clipPath: 'polygon(18% 0, 82% 0, 100% 18%, 100% 82%, 82% 100%, 18% 100%, 0 82%, 0 18%)',
            }}
          >
            {typeof emblema === 'string' && emblema.startsWith('/') ? (
              <img src={emblema} alt="" className="h-[66px] w-[66px] object-contain drop-shadow-[0_3px_8px_#000]" />
            ) : (
              emblema
            )}
          </div>
        )}
        {eyebrow && (
          <div className="text-[9px] font-black uppercase tracking-[0.34em] text-[#b7b2a8]">
            {eyebrow}
          </div>
        )}
        {/* Serifada, como na direcao B: a diferenca entre o titulo e o resto da
            placa deixa de ser so o tamanho da letra. */}
        <h2 className={`reward-title-metal mb-[5px] ${eyebrow ? 'mt-[7px]' : 'mt-0'} text-balance font-serif font-black uppercase leading-[1.02] ${tituloLongo ? 'text-[25px] tracking-[0.045em]' : 'text-[34px] tracking-[0.07em]'}`}>
          {titulo}
        </h2>
        {payload?.subtitle && (
          <div className="mb-2 text-[9px] font-black uppercase tracking-[0.24em] text-[#b7b2a8]">
            {payload.subtitle}
          </div>
        )}
        {(payload?.summary || fallbackSummary) && (
          <p className="mx-auto mb-[18px] max-w-[300px] text-[11px] leading-[1.45] text-[#9ca0a8]">
            {payload?.summary || fallbackSummary}
          </p>
        )}
      </div>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
        {featuredRewardItem && (() => {
          const raridade = getRarityVisual(featuredRewardItem.itemDef.rarity);
          return (
            <div className="mb-1 text-center">
              <TituloDeSecao>Destaque da temporada</TituloDeSecao>
              <div
                className="relative mx-auto grid min-h-[154px] place-items-center overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(${raridade.rgb},.22), transparent 66%)`,
                }}
              >
                <img src={featuredRewardItem.itemDef.imageUrl} alt={featuredRewardItem.itemDef.name} className="h-[128px] w-[128px] object-contain drop-shadow-[0_12px_22px_#000]" />
              </div>
            </div>
          );
        })()}

        {metricCards.length > 0 && (
          <div className={`flex flex-wrap justify-center ${quatroOuMaisMetricas ? 'gap-[5px]' : 'gap-[14px]'}`}>
            {metricCards.map((card, index) => (
              // 94x94, e o simbolo mora num nicho de fio proprio, acima do
              // numero. A legenda fica DENTRO do quadrado, embaixo.
              <div
                key={`${card.label}-${index}`}
                className={`flex flex-col items-center justify-center border text-center ${quatroOuMaisMetricas ? 'h-[72px] w-[72px] p-1.5' : 'h-[94px] w-[94px] p-2'}`}
                style={{
                  borderColor: `rgba(${tomDaPlaca},.28)`,
                  background: `radial-gradient(circle at 50% 0%, rgba(${tomDaPlaca},.16), transparent 54%), linear-gradient(155deg, rgba(${tomDaPlaca},.065), #0d0e11 58%, #08090b)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,.035), inset 0 0 18px rgba(${tomDaPlaca},.035)`,
                }}
              >
                <div className={`${quatroOuMaisMetricas ? 'mb-[3px] h-[25px] w-[25px]' : 'mb-[6px] h-[33px] w-[33px]'} grid place-items-center border border-[#3a3e47] bg-[#07090c]`}>
                  {card.simbolo
                    ? <ValorIcon valor={card.simbolo} tamanho={quatroOuMaisMetricas ? 18 : 23} rotulo="" />
                    : <span className="h-px w-3 bg-[#565b64]" aria-hidden="true" />}
                </div>
                <span className={`block font-black leading-none tabular-nums text-[#f5f3ed] ${card.value.length > 8 ? 'text-[12px]' : 'text-[16px]'}`}>
                  {card.value}
                </span>
                <span className="mt-[5px] block text-[7px] font-black uppercase leading-tight tracking-[0.13em] text-[#858a93]">
                  {card.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {rewardHighlights.length > 0 && (
          <div className={metricCards.length > 0 ? 'mt-4' : ''}>
            <TituloDeSecao>{payload?.rewardHighlightsTitle || 'Entregue agora'}</TituloDeSecao>
            <div className="space-y-2">
              {rewardHighlights.map((highlight, index) => {
                // A cor da raridade, quando vem, manda: e o mesmo RGB que
                // pinta o item na grade e a etiqueta no modal dele.
                const toneClass = highlight.rarityRgb ? 'border-white/10' : rewardHighlightToneStyles[highlight.tone || 'gold'];
                const rarityStyle = highlight.rarityRgb
                  ? {
                      borderColor: `rgba(${highlight.rarityRgb}, 0.24)`,
                      borderLeft: `3px solid rgba(${highlight.rarityRgb}, 0.88)`,
                      background: `linear-gradient(90deg, rgba(${highlight.rarityRgb}, 0.10), rgba(15,16,19,0.88) 42%)`,
                      // A cor pura fica no rotulo pequeno; o valor continua
                      // branco, senao a linha vira um bloco colorido e perde
                      // a hierarquia.
                      color: '#fff',
                    }
                  : undefined;
                const rarityLabelStyle = highlight.rarityRgb
                  ? { color: `rgba(${highlight.rarityRgb}, 0.95)`, opacity: 1 }
                  : undefined;
                return (
                  <div key={`${highlight.label}-${index}`} className={`border px-3 py-3 ${toneClass}`} style={rarityStyle}>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center overflow-hidden border border-white/10 bg-black/30">
                        {highlight.imageUrl
                          ? <img src={highlight.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                          : <Gift className="h-4 w-4 text-current opacity-80" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-current opacity-70" style={rarityLabelStyle}>{highlight.label}</div>
                        <div className="mt-1 text-sm font-black text-current">{highlight.value}</div>
                        {highlight.detail && <div className="mt-1 text-[11px] leading-relaxed text-current opacity-70">{highlight.detail}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showItems ? (
          <div>
            <TituloDeSecao>{featuredRewardItem ? 'Também recebido' : (payload?.itemSectionTitle || fallbackItemSectionTitle)}</TituloDeSecao>
            <div className={`grid gap-[7px] ${itemUnico ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {visibleRewardItems.map(({ itemId, itemDef }) => {
                const raridade = getRarityVisual(itemDef.rarity);
                const categoria = NOME_DA_CATEGORIA[itemDef.category] || itemDef.category;
                return (
                  // Altura fixa e borda so embaixo: o item deixou de ser cartao
                  // fechado e virou LINHA. Nome de duas linhas nao estica mais a
                  // grade, que fazia o modal inteiro mudar de tamanho conforme o
                  // nome do item que caiu.
                  <div
                    key={itemId}
                    className={`grid items-center overflow-hidden border border-[#302f2c] bg-[rgba(18,18,19,.78)] ${itemUnico ? 'h-[104px] grid-cols-[76px_minmax(0,1fr)] gap-[14px] p-3' : 'h-[68px] grid-cols-[46px_minmax(0,1fr)] gap-[9px] border-x-0 border-t-0 p-2'}`}
                  >
                    <div
                      className={`grid place-items-center overflow-hidden ${itemUnico ? 'h-[76px] w-[76px]' : 'h-[46px] w-[46px]'}`}
                      style={{
                        border: `1px solid rgba(${raridade.rgb},.48)`,
                        background: `radial-gradient(circle at 34% 27%, rgba(${raridade.rgb},.25), rgba(${raridade.rgb},.075) 48%, #07090b 82%)`,
                        boxShadow: `inset 0 0 13px rgba(${raridade.rgb},.09)`,
                      }}
                    >
                      {itemDef.imageUrl ? (
                        <img
                          src={itemDef.imageUrl}
                          alt={itemDef.name}
                          // contain, como o Arsenal e o modal do item: a arte de
                          // insignia e desenhada com margem, e cover corta
                          // justamente a borda da peca.
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-base text-white/70">{itemDef.icon || '?'}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-[10px] font-bold leading-[1.15] text-[#f5f3ed]">{itemDef.name}</div>
                      <div className="mt-[5px] flex items-baseline gap-1 overflow-hidden text-[7px] font-black uppercase tracking-[0.13em]">
                        {!categoriaJaEstaNoNome(itemDef.name, categoria) && (
                          <span className="shrink-0 text-[#6f7681]">{categoria}</span>
                        )}
                        <span className="truncate" style={{ color: raridade.hex }}>{raridade.label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          emptyMessage && (
            <div className="mt-4 border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-relaxed text-[#9ca0a8]">
              {emptyMessage}
            </div>
          )
        )}

        {activeBenefits.length > 0 && (
          <div>
            <TituloDeSecao>{payload?.activeBenefitsTitle || 'Vantagens ativadas'}</TituloDeSecao>
            <div className="grid gap-2">
              {activeBenefits.map((rawBenefit, index) => {
                const benefit = typeof rawBenefit === 'string'
                  ? { label: 'Benefício', value: rawBenefit, tone: 'emerald' as const }
                  : rawBenefit;
                const rgb = benefitToneRgb[benefit.tone || 'emerald'];
                return (
                  <div
                    key={`${benefit.label}-${benefit.value}-${index}`}
                    className="relative overflow-hidden border border-white/8 px-3 py-2.5"
                    style={{
                      borderLeft: `3px solid rgba(${rgb},.82)`,
                      background: `linear-gradient(90deg, rgba(${rgb},.12), rgba(12,13,15,.84) 42%, rgba(7,8,10,.94))`,
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border" style={{ borderColor: `rgba(${rgb},.34)`, color: `rgb(${rgb})`, background: `rgba(${rgb},.08)` }}>
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: `rgba(${rgb},.92)` }}>{benefit.label}</span>
                        <span className="mt-0.5 block text-[11px] font-semibold leading-snug text-gray-100">{benefit.value}</span>
                        {benefit.detail && <span className="mt-1 block text-[10px] leading-relaxed text-white/45">{benefit.detail}</span>}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
