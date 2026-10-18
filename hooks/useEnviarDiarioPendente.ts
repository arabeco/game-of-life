import { useEffect, useRef } from 'react';
import { anexarEntrada } from '../services/JournalService';
import { enviarPendentes, lerPendentes } from '../utils/diarioPendente';

/** Avisado a cada envio da fila, para quem mostra a contagem se atualizar. */
export const DIARIO_PENDENTE_EVENTO = 'glyph:diario-pendente';

/**
 * ESVAZIA A FILA DO DIARIO (ver utils/diarioPendente.ts).
 *
 * Tenta ao abrir o app, quando o aparelho diz que a rede voltou, quando o app
 * volta do fundo e, enquanto houver algo na fila, a cada minuto — porque o
 * "online" do navegador mente: o celular pode estar no Wi-Fi sem internet.
 *
 * A entrada soma na pagina lida NA HORA do envio (anexarEntrada), entao nunca
 * grava por cima. O humor da entrada vira um ponto na linha do tempo quando ela
 * sai; o humor atual do perfil nao muda, porque a pessoa pode ja estar em outro.
 */
export const useEnviarDiarioPendente = (
  userId: string | null | undefined,
  registrarHumor: (valor: number) => Promise<void>,
) => {
  // A funcao do contexto muda a cada render; a fila so depende da conta.
  const humorRef = useRef(registrarHumor);
  humorRef.current = registrarHumor;

  useEffect(() => {
    if (!userId) return;
    let vivo = true;

    const tentar = async () => {
      if (!vivo || !lerPendentes(userId).length) return;
      const enviadas = await enviarPendentes(userId, async (entrada) => {
        const ok = await anexarEntrada(userId, entrada.cabecalho, entrada.texto, entrada.destino);
        if (ok && entrada.humor !== null) {
          try { await humorRef.current(entrada.humor); } catch { /* a entrada ja saiu; o ponto e extra */ }
        }
        return ok;
      });
      if (enviadas > 0) window.dispatchEvent(new Event(DIARIO_PENDENTE_EVENTO));
    };

    const aoVoltar = () => { if (document.visibilityState === 'visible') void tentar(); };
    void tentar();
    window.addEventListener('online', tentar);
    document.addEventListener('visibilitychange', aoVoltar);
    const minuto = window.setInterval(() => void tentar(), 60_000);
    return () => {
      vivo = false;
      window.removeEventListener('online', tentar);
      document.removeEventListener('visibilitychange', aoVoltar);
      window.clearInterval(minuto);
    };
  }, [userId]);
};
