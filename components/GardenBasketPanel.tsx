import { useEffect, useRef, useState } from 'react';
import type { GardenBasketDelivery, GardenBasketReceipt } from '../services/gardenBasket';
import { RewardPackModal } from './RewardPackModal';
import { ValorIcon } from './ValorIcon';

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
  useEffect(() => { panel.current?.focus(); }, []);
  const collect = async () => {
    const delivery = deliveries[0];
    if (!delivery || inFlight.current) return;
    inFlight.current = true; setBusy(true); setError('');
    try { const result = await claim(delivery.id); setReceipt(result); onClaimed(delivery.id); }
    catch { setError('Não foi possível confirmar a coleta. Tente novamente; ela não será entregue duas vezes.'); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const rewardOpen = Boolean(receipt?.awarded);
  return <><div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-5" onClick={() => { if (!busy && !rewardOpen) onClose(); }}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Presente do jardim" onClick={e => e.stopPropagation()}
      onKeyDown={e => {
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!busy) onClose(); }
        if (e.key === 'Tab') {
          const controls = Array.from(panel.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
          const first = controls[0], last = controls[controls.length - 1];
          if (!first) { e.preventDefault(); return; }
          if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { e.preventDefault(); first.focus(); }
        }
      }}
      className="relative w-full max-w-xs overflow-hidden rounded-2xl border border-[#d5ad56]/35 bg-[#101318] p-6 text-center shadow-[0_20px_70px_rgba(0,0,0,.62)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_50%_0%,rgba(213,173,86,.22),transparent_70%)]" />
      <button disabled={busy} aria-label="Fechar presente" className="absolute right-2 top-2 h-11 w-11" onClick={onClose}>×</button>
      <div aria-hidden="true" className="relative my-3 text-5xl drop-shadow-[0_0_14px_rgba(213,173,86,.42)]">🧺</div>
      <p className="relative text-[9px] font-black uppercase tracking-[.25em] text-[#d9bd7a]">Jardim Zen</p>
      <h2 className="relative text-lg font-semibold">{deliveries.length > 1 ? `${deliveries.length} presentes na cesta` : 'Presente do jardim'}</h2>
      <p role="status" className="my-4 text-sm leading-relaxed text-stone-300">{receipt
        ? !receipt.awarded ? 'Esta entrega já foi recolhida.' : receipt.chest ? 'Um baú Comum! Ele está nos seus baús.' : `+${receipt.fragments} fragmentos adicionados à sua carteira.`
        : deliveries.length ? 'Suas ações deixaram um pequeno presente por aqui.' : 'Por enquanto, a cesta está vazia. De vez em quando, suas ações trazem um presente.'}</p>
      {error && <p role="alert" className="mb-3 text-sm text-amber-200">{error}</p>}
      {deliveries.length > 0
        ? <button disabled={busy || rewardOpen} className="luxe-skin-button min-h-11 w-full rounded-xl px-4 text-sm font-semibold" onClick={collect}>{busy ? 'Recolhendo…' : 'Recolher presente'}</button>
        : <button className="luxe-skin-button min-h-11 w-full rounded-xl px-4 text-sm" onClick={onClose}>Voltar ao jardim</button>}
    </div>
  </div>
  <RewardPackModal open={rewardOpen} onClose={() => { setReceipt(null); if (deliveries.length <= 1) onClose(); }} tom="213,173,86" emblema={<ValorIcon valor="fragmento" tamanho={42} rotulo="" />} fallbackEyebrow="JARDIM ZEN" fallbackTitle="Presente recolhido" fallbackSummary={receipt?.chest ? 'Um baú Comum foi guardado nos seus baús.' : 'A energia das suas ações virou fragmentos para sua jornada.'} fallbackButtonLabel="Continuar" fallbackMetricCards={receipt?.chest ? [] : [{ label: 'Fragmentos', value: `+${receipt?.fragments ?? 0}`, simbolo: 'fragmento' }]} />
  </>;
}
