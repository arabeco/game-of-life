import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';
import { Directory, Filesystem } from '@capacitor/filesystem';

interface ExportElementOptions {
    fileName?: string;
    title?: string;
    backgroundColor?: string;
    preferShare?: boolean;
    pixelRatio?: number;
    fontFamily?: string;
}

interface ExportSequenceItem extends ExportElementOptions {
    elementId: string;
}

type ToastTone = 'success' | 'error' | 'warning' | 'info';
type ToastFn = (message: string, type?: ToastTone) => void;
type NativeShareResult = 'shared' | 'cancelled' | 'unavailable';

export type ShareResult = 'shared' | 'cancelled';
export type ShareWithFeedbackResult = ShareResult | 'error';
export type ExportElementResult = 'shared' | 'downloaded' | 'cancelled';

interface ShareWithFeedbackOptions {
    title?: string;
    /**
     * A legenda que vai junto da imagem.
     *
     * Opcional porque nem todo destino a usa: varios apps descartam o texto
     * quando ha arquivo anexado, e o compartilhador nao devolve qual fez o que.
     * Ela e um acrescimo para onde funciona, e nunca o recado — a imagem tem de
     * se explicar sozinha.
     */
    text?: string;
    preparingMessage?: string;
    sharedMessage?: string;
    cancelledMessage?: string;
    unsupportedMessage?: string;
    errorMessage?: string;
}

const CAPTURE_DELAY_MS = 800;
let toPngLoader: null | ((node: HTMLElement, options?: Record<string, unknown>) => Promise<string>) = null;

const waitForCapture = () => new Promise(resolve => setTimeout(resolve, CAPTURE_DELAY_MS));

export const shouldPreferNativeShare = () => (
    typeof navigator !== 'undefined'
    && typeof navigator.share === 'function'
    && (navigator.maxTouchPoints > 0 || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
);

const loadToPng = async () => {
    if (toPngLoader) return toPngLoader;
    const module = await import('html-to-image');
    toPngLoader = module.toPng;
    return toPngLoader;
};

const getTargetElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error('Elemento para exportacao não encontrado.');
    }
    return element;
};

const shouldSkipFontEmbedding = (): boolean => {
    try {
        return Array.from(document.styleSheets).some((sheet) => typeof sheet.href === 'string' && sheet.href.includes('fonts.googleapis.com'));
    } catch {
        return true;
    }
};

const captureElementBlob = async (
    element: HTMLElement,
    backgroundColor: string,
    {
        pixelRatio = 2,
        fontFamily,
    }: Pick<ExportElementOptions, 'pixelRatio' | 'fontFamily'> = {}
) => {
    await waitForCapture();
    const toPng = await loadToPng();
    const skipFonts = shouldSkipFontEmbedding();

    const captureOptions = {
        cacheBust: true,
        pixelRatio,
        backgroundColor,
        skipFonts,
        filter: (node: Node) => {
            if (node instanceof HTMLElement && node.hasAttribute('data-html2canvas-ignore')) {
                return false;
            }
            return true;
        },
        style: fontFamily ? { fontFamily } : undefined,
    };

    let dataUrl: string;
    try {
        dataUrl = await toPng(element, captureOptions);
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const shouldRetryWithoutFonts = !skipFonts
            && (message.includes('cssRules') || message.includes('Cannot access rules') || message.includes('Failed to read'));

        if (!shouldRetryWithoutFonts) {
            throw error;
        }

        dataUrl = await toPng(element, {
            ...captureOptions,
            skipFonts: true,
        });
    }

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (!blob) {
        throw new Error('Falha ao gerar blob da imagem.');
    }
    return blob;
};

const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
};

/**
 * NO ANDROID, `navigator.share` NAO EXISTE.
 *
 * O app roda dentro de uma WebView do Capacitor, e a Web Share API e recurso do
 * Chrome — a WebView nao a implementa. O codigo antigo chamava `navigator.share`
 * direto e, quando ele faltava, lancava erro: TODO botao de exportar imagem do
 * app mostrava "compartilhamento nao disponivel neste aparelho" e nao fazia
 * nada. Painel diario, legado, perfil, conquista — todos passam por aqui, entao
 * todos estavam quebrados no produto de verdade.
 *
 * O caminho nativo e em duas etapas porque o plugin recebe CAMINHO, nao blob:
 * grava a imagem no cache do app e manda a uri. Cache nao pede permissao
 * nenhuma no Android, e o proprio plugin cuida do FileProvider que transforma
 * aquilo em algo que o WhatsApp consegue ler.
 */
const blobParaBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onerror = () => reject(leitor.error || new Error('Falha ao ler a imagem.'));
    leitor.onload = () => {
        const resultado = String(leitor.result || '');
        // readAsDataURL devolve "data:image/png;base64,XXXX"; o plugin quer so o XXXX.
        const virgula = resultado.indexOf(',');
        resolve(virgula >= 0 ? resultado.slice(virgula + 1) : resultado);
    };
    leitor.readAsDataURL(blob);
});

const compartilharNativo = async (blob: Blob, title: string, fileName: string, text?: string): Promise<NativeShareResult> => {
    if (!Capacitor.isNativePlatform()) return 'unavailable';

    try {
        const base64 = await blobParaBase64(blob);
        // Nome unico: o cache guarda o arquivo anterior, e sobrescrever enquanto
        // outro app ainda le a uri antiga rende imagem trocada.
        const nome = `${Date.now()}-${fileName}`;
        const { uri } = await Filesystem.writeFile({
            path: nome,
            data: base64,
            directory: Directory.Cache,
        });

        /* `text` vai junto quando existe. Nem todo destino usa: varios apps
           descartam a legenda quando ha arquivo anexado, e o compartilhador nao
           conta qual fez o que. Entao ela e um acrescimo, nunca a mensagem —
           a imagem tem de se explicar sozinha. */
        await CapacitorShare.share({ title, text, files: [uri], dialogTitle: title });
        return 'shared';
    } catch (error) {
        if (isShareCancelledError(error)) return 'cancelled';
        console.error('Compartilhamento nativo falhou:', error);
        return 'unavailable';
    }
};

const isShareCancelledError = (error: unknown) => {
    const name = error instanceof DOMException ? error.name : (error as { name?: string } | null)?.name || '';
    const message = error instanceof Error ? error.message : String(error || '');
    const normalized = `${name} ${message}`.toLowerCase();

    return normalized.includes('aborterror')
        || normalized.includes('cancel')
        || normalized.includes('canceled')
        || normalized.includes('cancelled')
        || normalized.includes('dismiss')
        || normalized.includes('aborted a request');
};

const tryShareFile = async (file: File, title: string, text?: string) => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
        return 'unavailable' as NativeShareResult;
    }

    try {
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            return 'unavailable' as NativeShareResult;
        }
        await navigator.share({
            files: [file],
            title,
            ...(text ? { text } : {}),
        });
        return 'shared' as NativeShareResult;
    } catch (error) {
        if (isShareCancelledError(error)) {
            console.info('Share cancelled by user', error);
            return 'cancelled' as NativeShareResult;
        }
        throw error;
    }
};

export const handleShare = async (
    elementId: string,
    title: string = 'Meu Progresso - GLYPH',
    text?: string
): Promise<ShareResult> => {
    /*
     * A CAPTURA VEM PRIMEIRO, e a guarda de navigator.share saiu daqui.
     *
     * Ela abortava tudo na primeira linha — e como a WebView do Android nao tem
     * navigator.share, nenhum botao de imagem do app chegava sequer a desenhar a
     * figura. Agora tenta o caminho nativo, que e o que existe no aparelho, e so
     * entao o da web.
     */
    const element = getTargetElement(elementId);
    const blob = await captureElementBlob(element, '#101010');

    const nativo = await compartilharNativo(blob, title, 'glyph.png', text);
    if (nativo === 'shared' || nativo === 'cancelled') return nativo;

    const file = new File([blob], 'share.png', { type: 'image/png' });
    const web = await tryShareFile(file, title);
    if (web === 'shared' || web === 'cancelled') return web;

    /*
     * Ultimo recurso: baixar. No desktop e o comportamento certo; num aparelho
     * sem bandeja nativa, e melhor que o aviso seco de antes — a pessoa fica com
     * a imagem e decide o que fazer com ela.
     */
    downloadBlob(blob, 'glyph.png');
    return 'shared';
};

export const shareElementWithFeedback = async (
    showToast: ToastFn,
    elementId: string,
    {
        title = 'Meu Progresso - Life OS',
        text,
        preparingMessage = 'Preparando compartilhamento...',
        sharedMessage = 'Imagem compartilhada.',
        cancelledMessage = 'Compartilhamento cancelado.',
        unsupportedMessage = 'O compartilhamento não esta disponível neste aparelho.',
        errorMessage = 'Não foi possível preparar a imagem para compartilhar.',
    }: ShareWithFeedbackOptions = {}
): Promise<ShareWithFeedbackResult> => {
    showToast(preparingMessage, 'info');

    try {
        const result = await handleShare(elementId, title, text);
        if (result === 'cancelled') {
            showToast(cancelledMessage, 'info');
            return result;
        }

        showToast(sharedMessage, 'success');
        return result;
    } catch (error) {
        console.error('Erro ao compartilhar imagem:', error);
        const message = error instanceof Error ? error.message : String(error || '');
        const isUnavailable = message.toLowerCase().includes('não e suportada')
            || message.toLowerCase().includes('indisponível neste aparelho');

        showToast(isUnavailable ? unsupportedMessage : errorMessage, isUnavailable ? 'warning' : 'error');
        return 'error';
    }
};

export const exportElementAsImage = async (
    elementId: string,
    {
        fileName = 'glyph-export.png',
        title = 'Glyph Export',
        backgroundColor = '#050505',
        preferShare = false,
        pixelRatio = 2,
        fontFamily,
    }: ExportElementOptions = {}
): Promise<ExportElementResult> => {
    const element = getTargetElement(elementId);
    const blob = await captureElementBlob(element, backgroundColor, { pixelRatio, fontFamily });
    const normalizedFileName = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
    const file = new File([blob], normalizedFileName, { type: 'image/png' });

    if (preferShare) {
        const shareResult = await tryShareFile(file, title);
        if (shareResult === 'shared') return 'shared';
        if (shareResult === 'cancelled') return 'cancelled';
    }

    downloadBlob(blob, normalizedFileName);
    return 'downloaded';
};

export const exportElementsAsImageSequence = async (items: ExportSequenceItem[]) => {
    const sequence = items.filter((item) => item.elementId);
    if (sequence.length === 0) {
        throw new Error('Nenhum slide encontrado para exportacao.');
    }

    for (const item of sequence) {
        const element = getTargetElement(item.elementId);
        const blob = await captureElementBlob(element, item.backgroundColor || '#050505', {
            pixelRatio: item.pixelRatio ?? 3,
            fontFamily: item.fontFamily,
        });
        const normalizedFileName = (item.fileName || item.elementId).toLowerCase().endsWith('.png')
            ? (item.fileName || item.elementId)
            : `${item.fileName || item.elementId}.png`;
        downloadBlob(blob, normalizedFileName);
        await new Promise((resolve) => setTimeout(resolve, 180));
    }

    return sequence.length;
};

export const exportLegadoKit = async (items: ExportSequenceItem[]) => exportElementsAsImageSequence(items);
