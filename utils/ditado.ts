import { Capacitor } from '@capacitor/core';
import { SpeechRecognition } from '@capacitor-community/speech-recognition';

/**
 * FALAR EM VEZ DE DIGITAR (02/11/2026): a pergunta ao Oraculo por voz.
 *
 * No celular, o reconhecimento de voz do proprio Android (plugin). No
 * navegador, o do Chrome (webkitSpeechRecognition). Sem nenhum dos dois, o
 * botao nem aparece. O audio nao passa pelo Glyph: volta so o texto.
 */
type ReconhecedorWeb = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((evento: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
    onerror: ((evento: { error?: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
};

const reconhecedorDoNavegador = (): (new () => ReconhecedorWeb) | null => {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { SpeechRecognition?: new () => ReconhecedorWeb; webkitSpeechRecognition?: new () => ReconhecedorWeb };
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
};

export const ditadoDisponivel = async (): Promise<boolean> => {
    if (Capacitor.isNativePlatform()) {
        try { return (await SpeechRecognition.available()).available; } catch { return false; }
    }
    return Boolean(reconhecedorDoNavegador());
};

/** Ouve uma frase e devolve o texto ("" se nada foi entendido). */
export const ouvirUmaFrase = async (): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
        const permissao = await SpeechRecognition.requestPermissions();
        if (permissao.speechRecognition !== 'granted') throw new Error('SEM_PERMISSAO');
        const { matches } = await SpeechRecognition.start({
            language: 'pt-BR',
            maxResults: 1,
            prompt: 'Pergunte ao Oráculo',
            partialResults: false,
            popup: true,
        });
        return (matches?.[0] || '').trim();
    }
    const Reconhecedor = reconhecedorDoNavegador();
    if (!Reconhecedor) throw new Error('SEM_DITADO');
    return new Promise<string>((resolver, rejeitar) => {
        const rec = new Reconhecedor();
        let texto = '';
        rec.lang = 'pt-BR';
        rec.interimResults = false;
        rec.maxAlternatives = 1;
        rec.onresult = (evento) => { texto = evento.results[0]?.[0]?.transcript || ''; };
        rec.onerror = (evento) => rejeitar(new Error(evento.error === 'not-allowed' ? 'SEM_PERMISSAO' : 'FALHOU'));
        rec.onend = () => resolver(texto.trim());
        rec.start();
    });
};
