import React, { useEffect, useRef, useState } from 'react';
import { Portal } from './Portal';

/** Standalone visual study: no account, inventory or garden-save integration. */
export function GardenExperimentModal({ onClose }: { onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [isClosing, setClosing] = useState(false);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    setClosing(true);
    frame.current?.contentWindow?.postMessage({ type: 'glyph-experiment-dispose' }, location.origin);
    timer.current = setTimeout(() => onCloseRef.current(), 500);
  };
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === 'glyph-experiment-exit') close();
      if (event.data?.type === 'glyph-experiment-disposed' && closing.current) {
        if (timer.current) clearTimeout(timer.current);
        onCloseRef.current();
      }
    };
    window.addEventListener('message', receive);
    return () => {
      window.removeEventListener('message', receive);
      if (timer.current) clearTimeout(timer.current);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return <Portal>
    <dialog data-garden-experiment aria-label="Jardim experimental" ref={node => { if (node && !node.open) node.showModal(); }}
      onCancel={event => { event.preventDefault(); close(); }}
      style={{ position: 'fixed', inset: 0, margin: 0, width: '100%', height: '100dvh', maxWidth: 'none', maxHeight: 'none', padding: 0, border: 0, background: '#e5dfce', color: '#34413b' }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingTop: 'var(--safe-area-top, env(safe-area-inset-top, 0px))', paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '8px 14px', flexShrink: 0, borderBottom: '1px solid #34413b22' }}>
          <div><strong style={{ fontSize: 13 }}>Jardim experimental</strong><p style={{ fontSize: 10, margin: '2px 0 0' }}>Cena de teste · seu jardim permanece como está</p></div>
          <button onClick={close} disabled={isClosing} style={{ minHeight: 44, padding: '0 15px', border: '1px solid #34413b44', borderRadius: 12, fontSize: 12, flexShrink: 0 }}>{isClosing ? 'Fechando…' : 'Voltar ao app'}</button>
        </header>
        <iframe ref={frame} title="Teste de qualidade do jardim" src={`${import.meta.env.BASE_URL}garden-experiment/index.html`}
          style={{ width: '100%', flex: 1, minHeight: 0, border: 0 }} />
      </div>
    </dialog>
  </Portal>;
}
