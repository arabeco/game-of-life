import { OracleCategory, OracleContext, OracleMode, OraclePreferences } from '../types';
import {
    ORACLE_BASE_UNIVERSAL,
    ORACLE_MODE_PROMPT_BLOCKS,
} from '../supabase/functions/_shared/oracle-host-voice.ts';

export type OracleAttentionProfile = 'essencial' | 'equilibrado' | 'ativo';
export type OracleAutomationProfile = 'quieto' | 'equilibrado' | 'proativo';

export interface OracleAutomaticCategoryProfile {
    low: OracleCategory;
    medium: OracleCategory;
    high: OracleCategory;
    critical: OracleCategory;
}

export interface OracleModeConfig {
    id: OracleMode;
    name: string;
    description: string;
    cardSummary: string;
    notificationSummary: string;
    pushSummary: string;
    attentionProfile: OracleAttentionProfile;
    pushProfile: OracleAttentionProfile;
    automationProfile: OracleAutomationProfile;
    automaticCategories: OracleAutomaticCategoryProfile;
    systemPromptTemplate: (data: OracleContext) => string;
}

const buildBaseContext = (data: OracleContext) => JSON.stringify(data, null, 2);

export const ORACLE_MODES: Record<OracleMode, OracleModeConfig> = {
    neutro: {
        id: 'neutro',
        name: 'Neutro',
        description: 'Equilibrado e util (Free)',
        cardSummary: 'Alterna leitura de contexto com orientacao pratica.',
        notificationSummary: 'Mostra essenciais, acionaveis e progresso.',
        pushSummary: 'Leva para fora do app o que pede resposta ou fechamento.',
        attentionProfile: 'equilibrado',
        pushProfile: 'equilibrado',
        automationProfile: 'equilibrado',
        automaticCategories: {
            low: 'dicas_produtividade',
            medium: 'analise_padroes',
            high: 'dicas_produtividade',
            critical: 'provocacoes',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.neutro}

            ${buildBaseContext(data)}
        `,
    },
    calmo: {
        id: 'calmo',
        name: 'Calmo',
        description: 'Sereno e reposicionador',
        cardSummary: 'Entrega pulsos leves, rituais simples e reposicionamento.',
        notificationSummary: 'Mostra o essencial sem poluir a leitura.',
        pushSummary: 'Empurra so o que for realmente critico.',
        attentionProfile: 'essencial',
        pushProfile: 'essencial',
        automationProfile: 'quieto',
        automaticCategories: {
            low: 'rituais_lifestyle',
            medium: 'analise_padroes',
            high: 'dicas_produtividade',
            critical: 'dicas_produtividade',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.calmo}

            ${buildBaseContext(data)}
        `,
    },
    reflexivo: {
        id: 'reflexivo',
        name: 'Reflexivo',
        description: 'Questionador e util',
        cardSummary: 'Puxa leitura de padrao e pergunta util antes da acao.',
        notificationSummary: 'Mostra essenciais, acionaveis e progresso util.',
        pushSummary: 'Empurra so o que merece sua atencao imediata.',
        attentionProfile: 'equilibrado',
        pushProfile: 'essencial',
        automationProfile: 'quieto',
        automaticCategories: {
            low: 'reflexoes_filosoficas',
            medium: 'analise_padroes',
            high: 'analise_padroes',
            critical: 'dicas_produtividade',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.reflexivo}

            ${buildBaseContext(data)}
        `,
    },
    tatico: {
        id: 'tatico',
        name: 'Tatico',
        description: 'Objetivo e imediato',
        cardSummary: 'Vai para execucao curta, risco e proximo movimento.',
        notificationSummary: 'Abre tudo o que mexe na operacao atual.',
        pushSummary: 'Empurra alertas acionaveis e chamadas do Oraculo.',
        attentionProfile: 'ativo',
        pushProfile: 'ativo',
        automationProfile: 'proativo',
        automaticCategories: {
            low: 'dicas_produtividade',
            medium: 'dicas_produtividade',
            high: 'provocacoes',
            critical: 'provocacoes',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.tatico}

            ${buildBaseContext(data)}
        `,
    },
    estrategico: {
        id: 'estrategico',
        name: 'Estrategico',
        description: 'Analitico e de longo prazo',
        cardSummary: 'Le o padrao, a consequencia e o risco do que esta em curso.',
        notificationSummary: 'Abre o panorama inteiro para leitura de fase.',
        pushSummary: 'Empurra o que altera risco, decisao ou fechamento.',
        attentionProfile: 'ativo',
        pushProfile: 'equilibrado',
        automationProfile: 'equilibrado',
        automaticCategories: {
            low: 'analise_padroes',
            medium: 'analise_padroes',
            high: 'analise_padroes',
            critical: 'provocacoes',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.estrategico}

            ${buildBaseContext(data)}
        `,
    },
    coach: {
        id: 'coach',
        name: 'Coach',
        description: 'Comando operacional',
        cardSummary: 'Entrega prioridade, risco e comando claro sem rodeio.',
        notificationSummary: 'Abre tudo o que pede resposta, progresso e ajuste.',
        pushSummary: 'Empurra alertas acionaveis e chamadas do Oraculo.',
        attentionProfile: 'ativo',
        pushProfile: 'ativo',
        automationProfile: 'proativo',
        automaticCategories: {
            low: 'dicas_produtividade',
            medium: 'dicas_produtividade',
            high: 'provocacoes',
            critical: 'provocacoes',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.coach}

            ${buildBaseContext(data)}
        `,
    },
    personalizado: {
        id: 'personalizado',
        name: 'Personalizado',
        description: 'Definido por voce',
        cardSummary: 'Mantem a cadencia equilibrada e respeita o tom definido por voce.',
        notificationSummary: 'Mostra essenciais, acionaveis e progresso.',
        pushSummary: 'Empurra o que pede resposta ou fechamento.',
        attentionProfile: 'equilibrado',
        pushProfile: 'equilibrado',
        automationProfile: 'equilibrado',
        automaticCategories: {
            low: 'dicas_produtividade',
            medium: 'analise_padroes',
            high: 'dicas_produtividade',
            critical: 'provocacoes',
        },
        systemPromptTemplate: (data) => `
            ${ORACLE_BASE_UNIVERSAL}

            ${ORACLE_MODE_PROMPT_BLOCKS.personalizado}

            Instrucoes do usuario:
            ${data.customModeInstructions || 'Sem instrucoes especificas.'}

            ${buildBaseContext(data)}
        `,
    },
};

export const getOracleModeConfig = (mode: OracleMode): OracleModeConfig => ORACLE_MODES[mode] || ORACLE_MODES.neutro;

export const deriveLegacySentinelMode = (
    mode: OracleMode,
    iaEnabled = true,
): NonNullable<OraclePreferences['sentinelMode']> => {
    if (!iaEnabled) return 'nao_ia';
    if (mode === 'calmo' || mode === 'reflexivo') return 'apenas_necessarias';
    return 'soberano_ativo';
};
