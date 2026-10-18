import { useEffect, useRef, useState } from 'react';
import type { GardenBasketDelivery, GardenBasketReceipt } from '../services/gardenBasket';

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
  return <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 p-5" onClick={() => { if (!busy) onClose(); }}>
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
      className="relative w-full max-w-xs rounded-2xl border border-white/20 bg-[#121611] p-6 text-center shadow-2xl">
      <button disabled={busy} aria-label="Fechar presente" className="absolute right-2 top-2 h-11 w-11" onClick={onClose}>×</button>
      <div aria-hidden="true" className="my-3 text-5xl">🧺</div>
      <h2 className="text-lg font-semibold">{receipt ? 'Um presente do jardim' : 'Presente do jardim'}</h2>
      <p role="status" className="my-4 text-sm leading-relaxed text-stone-300">{receipt
        ? !receipt.awarded ? 'Esta entrega já foi recolhida.' : receipt.chest ? 'Um baú Comum! Ele está nos seus baús.' : `+${receipt.fragments} fragmentos adicionados à sua carteira.`
        : deliveries.length ? 'Suas ações deixaram um pequeno presente por aqui.' : 'Por enquanto, a cesta está vazia. De vez em quando, suas ações trazem um presente.'}</p>
      {error && <p role="alert" className="mb-3 text-sm text-amber-200">{error}</p>}
      {deliveries.length > 0
        ? <button disabled={busy} className="luxe-skin-button min-h-11 w-full rounded-xl px-4 text-sm font-semibold" onClick={collect}>{busy ? 'Recolhendo…' : receipt ? 'Recolher outra entrega' : 'Recolher presente'}</button>
        : <button className="luxe-skin-button min-h-11 w-full rounded-xl px-4 text-sm" onClick={onClose}>Voltar ao jardim</button>}
    </div>
  </div>;
}
