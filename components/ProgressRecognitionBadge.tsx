import React from 'react';
import { officialTop, type ProgressRecognition } from '../utils/progressRecognition';

export const ProgressRecognitionBadge: React.FC<{ value: ProgressRecognition | null; context: string }> = ({ value, context }) => {
    const label = officialTop(value);
    if (!label) return null;
    return <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-200/30 bg-amber-100/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100" title={`${context} · ${value?.cohortSize} participantes · posição atual, sujeita a mudança`}>
        {label}<span className="font-normal opacity-75"> · {context}</span>
    </span>;
};
