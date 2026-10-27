import { useEffect, useState } from 'react';

/**
 * MODO ESCURO DOS LEITORES (27/10/2026).
 *
 * Uma escolha so para o leitor de aula e o leitor do diario, lembrada no
 * aparelho. Quem le a noite nao toma o papel claro na cara. O tema mora em
 * components/leitor.css (classes `leitor-*` sob `.leitor-escuro`).
 */
const CHAVE = 'glyph-leitor-escuro';
const EVENTO = 'glyph:leitor-escuro';

const ler = (): boolean => {
    try { return localStorage.getItem(CHAVE) === '1'; } catch { return false; }
};

export const useLeitorEscuro = (): [boolean, () => void] => {
    const [escuro, setEscuro] = useState(ler);
    useEffect(() => {
        const sincronizar = () => setEscuro(ler());
        window.addEventListener(EVENTO, sincronizar);
        return () => window.removeEventListener(EVENTO, sincronizar);
    }, []);
    const alternar = () => {
        const proximo = !ler();
        try { localStorage.setItem(CHAVE, proximo ? '1' : '0'); } catch { /* sem armazenamento: vale so agora */ }
        setEscuro(proximo);
        window.dispatchEvent(new Event(EVENTO));
    };
    return [escuro, alternar];
};
