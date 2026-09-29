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
 * A placa tem uma caixa fixa no celular. Por isso o miolo trabalha com medidas
 * compactas e constantes: ele nao cresce conforme o texto ou transforma a
 * recompensa em uma lista com barra de rolagem.
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
    aura: 'Aura',
    ui_skin: 'Tema',
    artifact: 'Artefato',
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
  <div className="mb-[6px] mt-[10px] flex items-center gap-[10px] text-[9px] font-black uppercase tracking-[0.23em] text-[#aaadb4]">
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
  fallbackEmptyMessage = 'Seu pacote já foi integrado ao Arsenal.',
  fallbackMetricCards = [],
  emblema,
  tom,
  estiloDoCrest,
}) => {
  const itemIds = payload?.itemIds || [];
  const metricCards = payload?.metricCards?.length ? payload.metricCards : fallbackMetricCards;
  const rewardHighlights = payload?.rewardHighlights || [];
  const activeBenefits = payload?.activeBenefits || [];
  const titulo = payload?.title || fallbackTitle;
  const eyebrow = payload?.eyebrow ?? fallbackEyebrow;
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
  /* Baú é item recebido. `rewardHighlights` também carrega créditos e outros
     avisos, mas só as linhas com arte entram na mesma lista dos cosméticos. */
  const itemHighlights = rewardHighlights.filter((highlight) => Boolean(highlight.imageUrl));
  const informationalHighlights = rewardHighlights.filter((highlight) => !highlight.imageUrl);
  const receivedItemCount = visibleRewardItems.length + itemHighlights.length;
  const showReceivedItems = receivedItemCount > 0;
  const emptyMessage = payload?.emptyMessage ?? fallbackEmptyMessage;

  return (
    <>
      <div className="reward-pack-heading shrink-0 text-center">
        {emblema && (
          // O suporte octogonal: quadrado com os quatro cantos cortados,
          // moldura de fio, dois aneis por dentro e sombra solida deslocada.
          // O losango girado saiu com a direcao antiga.
          <div
            className="reward-pack-crest mx-auto mb-[10px] grid h-[68px] w-[68px] place-items-center text-3xl"
            style={estiloDoCrest || {
              border: `1px solid ${tom ? `rgba(${tom},.55)` : '#5b5e62'}`,
              background: 'linear-gradient(135deg, #191c20, #07090b 68%)',
              boxShadow: 'inset 0 0 0 5px #080a0c, inset 0 0 0 6px #30343a, 5px 6px 0 #050607',
              clipPath: 'polygon(18% 0, 82% 0, 100% 18%, 100% 82%, 82% 100%, 18% 100%, 0 82%, 0 18%)',
            }}
          >
            {typeof emblema === 'string' && emblema.startsWith('/') ? (
              <img src={emblema} alt="" className="h-[52px] w-[52px] object-contain drop-shadow-[0_3px_8px_#000]" />
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
        <h2 className={`reward-title-metal mb-[4px] ${eyebrow ? 'mt-[6px]' : 'mt-0'} text-balance font-serif text-[26px] font-black uppercase leading-[1.02] tracking-[0.055em]`}>
          {titulo}
        </h2>
        {/* O SUBTITULO E O NOME PROPRIO: qual arena, qual missao, qual patente.
            Ele continua menor que o titulo — a regra da placa e que o
            acontecimento e grande e o nome proprio e pequeno, e o
            tests/reward-modal.regression.mjs guarda essa hierarquia nos tres
            modais de uma vez.

            Mas "pequeno" estava sendo 9px em #b7b2a8, com o mesmo tamanho e
            quase a mesma cor da sobrancelha logo acima — e a sobrancelha diz de
            onde o feito veio, que e a parte que a pessoa ja sabe. Os dois
            viravam a mesma sussurrada, e quem subia de patente lia "NOVA
            PATENTE!" em 34px dourado sem conseguir ver ATE ONDE subiu.

            Treze pixels e quase branco ainda deixam o titulo mandando, e tiram
            o nome proprio do empate com a sobrancelha. */}
        {payload?.subtitle && (
          <div className="mb-1.5 text-[12px] font-black uppercase tracking-[0.14em] text-[#e8e2d4]">
            {payload.subtitle}
          </div>
        )}
        {(payload?.summary || fallbackSummary) && (
          <p className="mx-auto mb-[10px] max-w-[300px] text-[10px] leading-[1.4] text-[#9ca0a8]">
            {payload?.summary || fallbackSummary}
          </p>
        )}
      </div>

      <div className="reward-pack-body shrink-0 overflow-hidden">
        {featuredRewardItem && (() => {
          const raridade = getRarityVisual(featuredRewardItem.itemDef.rarity);
          return (
            <div className="mb-1 text-center">
              <TituloDeSecao>Destaque da temporada</TituloDeSecao>
              <div
                className="relative mx-auto grid min-h-[100px] place-items-center overflow-hidden"
                style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(${raridade.rgb},.22), transparent 66%)`,
                }}
              >
                <img src={featuredRewardItem.itemDef.imageUrl} alt={featuredRewardItem.itemDef.name} className="h-[88px] w-[88px] object-contain drop-shadow-[0_9px_16px_#000]" />
              </div>
            </div>
          );
        })()}

        {metricCards.length > 0 && (
          /* Só o símbolo recebe quadrado. EXP e ouro são valores rápidos; uma
             moldura grande ao redor deles fazia parecer que eram dois itens. */
          <div className={`grid ${metricCards.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {metricCards.map((card, index) => (
              <div
                key={`${card.label}-${index}`}
                className="flex min-w-0 items-center justify-center gap-2 px-3 py-2 text-center"
                style={{ borderLeft: index > 0 ? `1px solid rgba(${tomDaPlaca},.22)` : undefined }}
              >
                {card.simbolo && (
                  <span className="grid h-9 w-9 shrink-0 place-items-center border border-[#3a3e47] bg-[#07090c]">
                    <ValorIcon valor={card.simbolo} tamanho={22} rotulo="" />
                  </span>
                )}
                <span className="min-w-0 text-left">
                  <span className={`block font-black leading-none tabular-nums text-[#f5f3ed] ${card.value.length > 8 ? 'text-[12px]' : 'text-[17px]'}`}>{card.value}</span>
                  <span className="mt-1 block text-[8px] font-black uppercase leading-tight tracking-[0.14em] text-[#858a93]">{card.label}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {informationalHighlights.length > 0 && (
          <div className={metricCards.length > 0 ? 'mt-4' : ''}>
            <TituloDeSecao>{payload?.rewardHighlightsTitle || 'Entregue agora'}</TituloDeSecao>
            <div className="space-y-2">
              {informationalHighlights.map((highlight, index) => {
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
                  <div key={`${highlight.label}-${index}`} className={`border px-2.5 py-2 ${toneClass}`} style={rarityStyle}>
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center overflow-hidden border border-white/10 bg-black/30">
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

        {showReceivedItems ? (
          <div>
            <TituloDeSecao>{featuredRewardItem ? 'Também recebido' : (payload?.itemSectionTitle || fallbackItemSectionTitle)}</TituloDeSecao>
            <div className={`grid gap-[7px] ${receivedItemCount === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {itemHighlights.map((highlight, index) => (
                <div
                  key={`highlight-${highlight.value}-${index}`}
                  className="grid h-[54px] grid-cols-[36px_minmax(0,1fr)] items-center gap-2 overflow-hidden border bg-[rgba(18,18,19,.78)] p-2"
                  style={{
                    borderColor: highlight.rarityRgb ? `rgba(${highlight.rarityRgb},.42)` : 'rgba(255,255,255,.14)',
                    borderLeft: highlight.rarityRgb ? `3px solid rgba(${highlight.rarityRgb},.9)` : undefined,
                  }}
                >
                  <div className="grid h-[36px] w-[36px] place-items-center overflow-hidden border border-white/10 bg-black/30">
                    <img src={highlight.imageUrl} alt="" className="h-full w-full object-contain p-0.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[10px] font-bold leading-[1.15] text-[#f5f3ed]">{highlight.value}</div>
                    <div className="mt-[5px] truncate text-[7px] font-black uppercase tracking-[0.13em]" style={{ color: highlight.rarityRgb ? `rgb(${highlight.rarityRgb})` : '#9ca3af' }}>{highlight.detail || highlight.label}</div>
                  </div>
                </div>
              ))}
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
                    className="grid h-[54px] grid-cols-[36px_minmax(0,1fr)] items-center gap-2 overflow-hidden border border-[#302f2c] bg-[rgba(18,18,19,.78)] p-2"
                  >
                    <div
                      className="grid h-[36px] w-[36px] place-items-center overflow-hidden"
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
