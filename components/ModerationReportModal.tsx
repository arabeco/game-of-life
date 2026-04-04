import React, { useMemo, useState } from 'react';
import type { ModerationReportReason } from '../types';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';
import { XIcon } from './Icons';

const REPORT_REASON_OPTIONS: { value: ModerationReportReason; label: string; description: string }[] = [
    { value: 'abuse', label: 'Abuso', description: 'Agressao, ataque pessoal ou comportamento abusivo.' },
    { value: 'harassment', label: 'Assedio', description: 'Perseguicao, insistencia ou constrangimento.' },
    { value: 'spam', label: 'Spam', description: 'Mensagens repetidas, propaganda ou flood.' },
    { value: 'sexual_content', label: 'Sexual', description: 'Conteudo sexual ou inapropriado.' },
    { value: 'hate', label: 'Odio', description: 'Discurso de odio ou ataque a grupo protegido.' },
    { value: 'impersonation', label: 'Imitacao', description: 'Se passando por outra pessoa.' },
    { value: 'other', label: 'Outro', description: 'Outro motivo que precisa de revisao.' },
];

interface ModerationReportModalProps {
    open: boolean;
    title: string;
    subjectLabel: string;
    submitting?: boolean;
    onClose: () => void;
    onSubmit: (payload: { reason: ModerationReportReason; details: string }) => Promise<void> | void;
}

export const ModerationReportModal: React.FC<ModerationReportModalProps> = ({
    open,
    title,
    subjectLabel,
    submitting = false,
    onClose,
    onSubmit,
}) => {
    const [reason, setReason] = useState<ModerationReportReason>('abuse');
    const [details, setDetails] = useState('');

    const selectedReason = useMemo(
        () => REPORT_REASON_OPTIONS.find((option) => option.value === reason) || REPORT_REASON_OPTIONS[0],
        [reason],
    );

    if (!open) return null;

    return (
        <Portal>
            <div className="ui-modal-backdrop" onClick={onClose}>
                <GlassCard variant="neutral" className="ui-modal-panel max-w-md p-0" onClick={(event) => event.stopPropagation()}>
                    <div className="ui-modal-panel-content ui-modal-stack">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Moderacao</div>
                                <h2 className="ui-modal-title">{title}</h2>
                                <p className="ui-modal-copy">Alvo: <span className="font-bold text-white">{subjectLabel}</span></p>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-full border border-white/10 bg-black/20 p-2 text-white/70 transition-colors hover:bg-black/35 hover:text-white"
                            >
                                <XIcon className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Motivo</div>
                            <div className="grid grid-cols-2 gap-2">
                                {REPORT_REASON_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setReason(option.value)}
                                        className={`rounded-xl border px-3 py-2 text-left transition-all ${
                                            reason === option.value
                                                ? 'border-[var(--skin-accent-color)] bg-[var(--skin-accent-color)]/12 text-white'
                                                : 'border-white/10 bg-black/20 text-white/72 hover:border-white/20 hover:text-white'
                                        }`}
                                    >
                                        <div className="text-[11px] font-black uppercase tracking-[0.14em]">{option.label}</div>
                                        <div className="mt-1 text-[10px] leading-relaxed text-white/52">{option.description}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-[11px] leading-relaxed text-gray-300">
                            {selectedReason.description}
                        </div>

                        <div className="space-y-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Detalhes opcionais</div>
                            <textarea
                                value={details}
                                onChange={(event) => setDetails(event.target.value)}
                                rows={4}
                                maxLength={300}
                                placeholder="Contexto curto para ajudar na revisao."
                                className="min-h-[92px] w-full rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/28 focus:border-[var(--skin-accent-color)]/45"
                            />
                            <div className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-white/32">
                                {details.trim().length}/300
                            </div>
                        </div>

                        <div className="ui-modal-actions">
                            <button type="button" onClick={onClose} className="ui-modal-button luxe-button-secondary" disabled={submitting}>
                                CANCELAR
                            </button>
                            <button
                                type="button"
                                onClick={() => void onSubmit({ reason, details })}
                                className="ui-modal-button luxe-skin-button"
                                disabled={submitting}
                            >
                                {submitting ? 'ENVIANDO...' : 'ENVIAR DENUNCIA'}
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </Portal>
    );
};
