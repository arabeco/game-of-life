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
        throw new Error('Elemento para exportacao nao encontrado.');
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

const tryShareFile = async (file: File, title: string) => {
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
    title: string = 'Meu Progresso - Life OS'
): Promise<ShareResult> => {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
        throw new Error('A funcao de compartilhar nao e suportada neste navegador.');
    }

    const element = getTargetElement(elementId);
    const blob = await captureElementBlob(element, '#101010');
    const file = new File([blob], 'share.png', { type: 'image/png' });
    const result = await tryShareFile(file, title);

    if (result === 'unavailable') {
        throw new Error('Compartilhamento indisponivel neste aparelho.');
    }

    return result;
};

export const shareElementWithFeedback = async (
    showToast: ToastFn,
    elementId: string,
    {
        title = 'Meu Progresso - Life OS',
        preparingMessage = 'Preparando compartilhamento...',
        sharedMessage = 'Imagem compartilhada.',
        cancelledMessage = 'Compartilhamento cancelado.',
        unsupportedMessage = 'O compartilhamento nao esta disponivel neste aparelho.',
        errorMessage = 'Nao foi possivel preparar a imagem para compartilhar.',
    }: ShareWithFeedbackOptions = {}
): Promise<ShareWithFeedbackResult> => {
    showToast(preparingMessage, 'info');

    try {
        const result = await handleShare(elementId, title);
        if (result === 'cancelled') {
            showToast(cancelledMessage, 'info');
            return result;
        }

        showToast(sharedMessage, 'success');
        return result;
    } catch (error) {
        console.error('Erro ao compartilhar imagem:', error);
        const message = error instanceof Error ? error.message : String(error || '');
        const isUnavailable = message.toLowerCase().includes('nao e suportada')
            || message.toLowerCase().includes('indisponivel neste aparelho');

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
