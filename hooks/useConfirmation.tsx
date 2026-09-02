import React, { useCallback, useState } from 'react';
import { ConfirmationModal } from '../components/ConfirmationModal';

export type ConfirmationRequest = {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'default' | 'danger';
};

type PendingConfirmation = ConfirmationRequest & { resolve: (accepted: boolean) => void };

/**
 * Substituto de `window.confirm` com o visual do app.
 *
 * O dialogo nativo do Android chega cinza, fora do tema, com o nome do pacote em
 * cima — e some ao girar a tela, levando junto a decisao que a pessoa ainda nao
 * tinha tomado. Ele tambem trava a thread: nada mais na tela responde enquanto
 * estiver aberto.
 *
 * `ConfirmationModal` ja existia e ja era usado em 19 lugares. Faltava uma forma
 * de chama-lo de dentro de um handler sem espalhar `useState` por todo
 * componente — e e isso que este hook e.
 *
 * Uso:
 *   const { confirm, confirmationElement } = useConfirmation();
 *   ...
 *   if (!(await confirm({ title: 'Excluir?', message: '...', variant: 'danger' }))) return;
 *   ...
 *   return (<>{...}{confirmationElement}</>);
 *
 * O modal se desenha num Portal proprio, entao `confirmationElement` pode ficar
 * em qualquer ponto do JSX de quem chama.
 */
export const useConfirmation = () => {
    const [pending, setPending] = useState<PendingConfirmation | null>(null);

    const confirm = useCallback((request: ConfirmationRequest) => (
        new Promise<boolean>((resolve) => {
            setPending({ ...request, resolve });
        })
    ), []);

    // Responder e fechar sao o mesmo ato. Separa-los deixaria a promise pendurada
    // se o modal fechasse por outro caminho — e um `await` que nunca resolve
    // congela o handler sem deixar rastro.
    const settle = useCallback((accepted: boolean) => {
        pending?.resolve(accepted);
        setPending(null);
    }, [pending]);

    const confirmationElement = pending ? (
        <ConfirmationModal
            title={pending.title}
            message={pending.message}
            confirmLabel={pending.confirmLabel}
            cancelLabel={pending.cancelLabel}
            variant={pending.variant}
            onConfirm={() => settle(true)}
            onCancel={() => settle(false)}
        />
    ) : null;

    return { confirm, confirmationElement };
};
