import html2canvas from 'html2canvas';

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
        // Give the browser a moment to ensure all assets (especially cross-origin images) are rendered.
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(element, {
            backgroundColor: '#101010',
            scale: 2,
            useCORS: true,
            // Force the canvas to use the element's actual dimensions, ignoring viewport constraints.
            width: element.offsetWidth,
            height: element.offsetHeight,
            windowWidth: element.offsetWidth,
            windowHeight: element.offsetHeight,
        });
        
        canvas.toBlob(async (blob) => {
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
            }
        }, 'image/png');
    } catch (error) {
        console.error('Erro ao gerar imagem para compartilhar:', error);
        alert('Ocorreu um erro ao tentar compartilhar.');
    }
};
