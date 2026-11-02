import React from 'react';
import { ValorIcon } from './ValorIcon';

/**
 * EXP COMO NO MODAL DE RECOMPENSA (02/11/2026): o simbolo da EXP colado ao
 * numero, em vez de "+0,5 mil EXP" ou "+2400 XP" escritos. O numero vai
 * inteiro, com ponto de milhar (500, 1.000, 6.000).
 */
export const ExpValor: React.FC<{ exp: number; tamanho?: number; className?: string }> = ({ exp, tamanho = 16, className = '' }) => (
    <span className={`inline-flex items-center gap-1.5 tabular-nums ${className}`} aria-label={`${exp.toLocaleString('pt-BR')} de EXP`}>
        <ValorIcon valor="exp" tamanho={tamanho} rotulo="" />
        <span aria-hidden="true">{exp.toLocaleString('pt-BR')}</span>
    </span>
);
