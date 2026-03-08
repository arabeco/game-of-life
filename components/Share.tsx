import { toPng } from 'html-to-image';

interface ExportElementOptions {
    fileName?: string;
    title?: string;
    backgroundColor?: string;
    preferShare?: boolean;
}

const CAPTURE_DELAY_MS = 800;

const waitForCapture = () => new Promise(resolve => setTimeout(resolve, CAPTURE_DELAY_MS));

const getTargetElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error('Elemento para exportacao nao encontrado.');
    }
    return element;
};

const captureElementBlob = async (element: HTMLElement, backgroundColor: string) => {
    await waitForCapture();

    const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor,
        filter: (node) => {
            if (node instanceof HTMLElement && node.hasAttribute('data-html2canvas-ignore')) {
                return false;
            }
            return true;
        },
        style: {
            fontFamily: 'Inter, sans-serif'
        }
    });

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

const tryShareFile = async (file: File, title: string) => {
    if (!navigator.share) return false;

    try {
        if (navigator.canShare && !navigator.canShare({ files: [file] })) {
            return false;
        }
        await navigator.share({
            files: [file],
            title,
        });
        return true;
    } catch (error) {
        console.info('Share cancelled or unavailable', error);
        return false;
    }
};

export const handleShare = async (elementId: string, title: string = 'Meu Progresso - Life OS') => {
    if (!navigator.share) {
        alert('A funcao de compartilhar nao e suportada neste navegador.');
        return;
    }

    try {
        const element = getTargetElement(elementId);
        const blob = await captureElementBlob(element, '#101010');
        const file = new File([blob], 'share.png', { type: 'image/png' });
        const shared = await tryShareFile(file, title);
        if (!shared) {
            throw new Error('Compartilhamento indisponivel.');
        }
    } catch (error: any) {
        console.error('Erro ao gerar imagem para compartilhar:', error);
        const errorMessage = error?.message || 'Desconhecido';
        alert(`Ocorreu um erro ao gerar a imagem (Erro: ${errorMessage}). Verifique se as imagens do perfil estao carregando corretamente.`);
    }
};

export const exportElementAsImage = async (
    elementId: string,
    {
        fileName = 'glyph-export.png',
        title = 'Glyph Export',
        backgroundColor = '#050505',
        preferShare = false,
    }: ExportElementOptions = {}
) => {
    const element = getTargetElement(elementId);
    const blob = await captureElementBlob(element, backgroundColor);
    const normalizedFileName = fileName.toLowerCase().endsWith('.png') ? fileName : `${fileName}.png`;
    const file = new File([blob], normalizedFileName, { type: 'image/png' });

    if (preferShare) {
        const shared = await tryShareFile(file, title);
        if (shared) return 'shared' as const;
    }

    downloadBlob(blob, normalizedFileName);
    return 'downloaded' as const;
};
