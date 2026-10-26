import { useEffect, useRef, useState } from 'react';
import type { GardenBasketDelivery, GardenBasketReceipt } from '../services/gardenBasket';
import { RewardPackModal } from './RewardPackModal';
import { ValorIcon } from './ValorIcon';
import './garden-basket.css';

/** A cesta seleciona o presente do topo e entrega um por vez. */
export function GardenBasketPanel({ deliveries, claim, onClose, onClaimed }: {
  deliveries: GardenBasketDelivery[];
  claim: (id: string) => Promise<GardenBasketReceipt>;
  onClose: () => void;
  onClaimed: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<GardenBasketReceipt | null>(null);
  const inFlight = useRef(false);
  const panel = useRef<HTMLDivElement>(null);
  const delivery = deliveries[0];

  useEffect(() => { panel.current?.focus(); }, []);

  const collect = async () => {
    if (!delivery || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await claim(delivery.id);
      setReceipt(result);
      onClaimed(delivery.id);
    } catch {
      setError('Não foi possível confirmar a coleta. Tente novamente; ela não será entregue duas vezes.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const rewardOpen = Boolean(receipt?.awarded);
  const remainingLabel = deliveries.length > 1 ? `${deliveries.length} prêmios na cesta` : '1 prêmio na cesta';

  return <>
    <div className="garden-basket-overlay" onClick={() => { if (!busy && !rewardOpen) onClose(); }}>
      <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Cesta de recompensas do jardim" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) { event.preventDefault(); onClose(); }
      }} className="garden-basket-plate">
        <div className="garden-basket-rivet garden-basket-rivet--left" aria-hidden="true" />
        <div className="garden-basket-rivet garden-basket-rivet--right" aria-hidden="true" />
        <button disabled={busy} aria-label="Fechar cesta" className="garden-basket-close" onClick={onClose}>×</button>
        <div className="garden-basket-eyebrow">JARDIM ZEN</div>
        <h2>Recompensas na cesta</h2>
        <p className="garden-basket-summary">{deliveries.length ? 'Escolha o presente que está no topo da cesta e recolha-o para ver sua recompensa.' : 'A cesta está vazia por enquanto. Suas ações podem deixar novos presentes aqui.'}</p>

        {delivery ? <>
          <div className="garden-basket-selection" aria-label={remainingLabel}>
            <div className={`garden-basket-gift garden-basket-gift--${delivery.score > 15 ? 'gold' : delivery.score >= 10 ? 'blue' : 'green'}`} aria-hidden="true"><span>✦</span><span>🧺</span><span>✦</span></div>
            <div className="garden-basket-current"><span>SELECIONADO</span><strong>Presente do jardim</strong><small>{remainingLabel}</small></div>
          </div>
          {error && <p role="alert" className="garden-basket-error">{error}</p>}
          <button disabled={busy} className="luxe-skin-button garden-basket-collect" onClick={collect}>{busy ? 'RECOLHENDO…' : 'COLETAR PRESENTE'}</button>
          {deliveries.length > 1 && <p className="garden-basket-queue">Depois, o próximo presente aparecerá aqui.</p>}
        </> : <button className="luxe-skin-button garden-basket-collect" onClick={onClose}>VOLTAR AO JARDIM</button>}
      </div>
    </div>
    <RewardPackModal open={rewardOpen} onClose={() => {
      const wasLast = deliveries.length <= 1;
      setReceipt(null);
      if (wasLast) onClose();
    }} tom="213,173,86" emblema={<ValorIcon valor="fragmento" tamanho={42} rotulo="" />} fallbackEyebrow="JARDIM ZEN" fallbackTitle="Presente recolhido" fallbackSummary={receipt?.chest ? 'Um baú Comum foi guardado nos seus baús.' : 'A energia das suas ações virou fragmentos para sua jornada.'} fallbackButtonLabel="Continuar" fallbackMetricCards={receipt?.chest ? [{ label: 'Baú', value: 'Comum', simbolo: 'meta' }] : [{ label: 'Fragmentos', value: `+${receipt?.fragments ?? 0}`, simbolo: 'fragmento' }]} />
  </>;
}
