import { toPng } from 'html-to-image';

export const handleShare = async (elementId: string, title: string = 'Meu Progresso - Life OS') => {
    const element = document.getElementById(elementId);
    if (!element) {
        alert('Elemento para compartilhar não encontrado.');
        return;
    }
    if (!navigator.share) {
        alert('A função de compartilhar não é suportada neste navegador.');
        return;
    }

    try {
        // Give the browser more time to ensure all assets are rendered.
        await new Promise(resolve => setTimeout(resolve, 800));

        // Using toPng instead of toBlob, as it can sometimes handle CSS rules better
        const dataUrl = await toPng(element, {
            cacheBust: true,
            pixelRatio: 2,
            backgroundColor: '#101010',
            imageTimeout: 30000,
            filter: (node) => {
                if (node instanceof HTMLElement && node.hasAttribute('data-html2canvas-ignore')) {
                    return false;
                }
                return true;
            },
            // Try to avoid the SecurityError by providing a custom style that doesn't trigger the rule access
            style: {
                // Ensure fonts are correctly rendered if we can
                'font-family': 'Inter, sans-serif'
            }
        });
        
        // Convert dataUrl to blob
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        
        if (blob) {
            const file = new File([blob], 'share.png', { type: 'image/png' });
            try {
                await navigator.share({
                    files: [file],
                    title: title,
                });
            } catch (shareError) {
                // This can happen if the user cancels the share dialog
                console.info('Share cancelled or failed', shareError);
            }
        } else {
            throw new Error('Falha ao criar blob da imagem.');
        }
    } catch (error: any) {
        console.error('Erro ao gerar imagem para compartilhar:', error);
        // Provide more context in the error message for debugging
        const errorMessage = error?.message || 'Desconhecido';
        alert(`Ocorreu um erro ao gerar a imagem (Erro: ${errorMessage}). Verifique se as imagens do perfil estão carregando corretamente.`);
    }
};
