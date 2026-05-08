import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { CodexCatalogItem, UserCodex } from '../../types';
import { Portal } from '../Portal';
import { CATEGORY_LABELS, resolveTemplateCampaignMeta, type CampaignThemeId, type CampaignTypeId } from '../../utils/campaignCatalogMeta';
import { hasCompletedFreeCampaignQuiz, markFreeCampaignQuizCompleted } from '../../utils/campaignQuiz';
import './CampaignRecommendationQuiz.css';

type QuizAnswerKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type QuizQuestionId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7';
type QuizAnswers = Partial<Record<QuizQuestionId, QuizAnswerKey>>;
type QuizMode = 'free' | 'medium' | 'full';

type QuizOption = { key: QuizAnswerKey; title: string; subtitle: string };
type QuizQuestion = { id: QuizQuestionId; title: string; subtitle: string; options?: QuizOption[]; getOptions?: (answers: QuizAnswers) => QuizOption[] };
type CampaignEntry = {
    catalog: CodexCatalogItem;
    title: string;
    normalizedTitle: string;
    durationDays: number;
    typeId: CampaignTypeId;
    typeLabel: string;
    themeId: CampaignThemeId | null;
    isFree: boolean;
    priceGold: number;
    primaryAssetId: string | null;
    description: string;
    tierRank: number;
};
type CampaignRecommendation = { entry: CampaignEntry; upgradeNote: string | null; desiredDuration: number };

const TOTAL_QUESTIONS = 7;

const normalizeToken = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const tierFromDuration = (days: number) => (days >= 21 ? 3 : days >= 14 ? 2 : 1);

const q2Options: Record<string, QuizOption[]> = {
    A: [
        { key: 'A', title: 'Como eu me movo e treino', subtitle: 'Treino, forca, intensidade e consistencia corporal.' },
        { key: 'B', title: 'Como eu me alimento', subtitle: 'Escolhas alimentares, clareza nutricional e relacao com comida.' },
        { key: 'C', title: 'Como eu recupero e durmo', subtitle: 'Sono, recuperacao e energia restaurada.' },
        { key: 'D', title: 'Como eu me sinto dia a dia', subtitle: 'Disposicao, ritmo e sensacao corporal geral.' },
    ],
    B: [
        { key: 'A', title: 'Como eu foco e tomo decisoes', subtitle: 'Clareza, prioridade e presenca mental.' },
        { key: 'B', title: 'Como eu organizo meu espaco e rotina', subtitle: 'Ambiente, sistema e estrutura operacional.' },
    ],
    C: [
        { key: 'A', title: 'Como eu executo no dia a dia', subtitle: 'Acao concreta, ritmo e producao real.' },
        { key: 'B', title: 'Como eu planejo e estrategio', subtitle: 'Visao, organizacao e pensamento de estrutura.' },
    ],
    D: [{ key: 'A', title: 'Como eu controlo e construo', subtitle: 'Controle, direcao e construcao financeira.' }],
    E: [{ key: 'A', title: 'Como eu me conecto e me faco presente', subtitle: 'Vinculo, presenca e contato intencional.' }],
    F: [
        { key: 'A', title: 'Como eu me entendo', subtitle: 'Autopercepcao, leitura interna e clareza do eu.' },
        { key: 'B', title: 'Como eu construo quem quero ser', subtitle: 'Identidade deliberada, direcao e proposito.' },
    ],
};

const questions: QuizQuestion[] = [
    { id: 'p1', title: 'Quando voce para e olha para a sua vida agora, onde esta o maior peso?', subtitle: 'Nao o que voce acha mais importante. O que esta pesando de verdade hoje.', options: [
        { key: 'A', title: 'No meu corpo', subtitle: 'Energia baixa, saude negligenciada, corpo que nao acompanha a mente' },
        { key: 'B', title: 'Na minha cabeca', subtitle: 'Pensamentos acumulados, foco quebrado, ambiente mental pesado' },
        { key: 'C', title: 'No que eu produzo', subtitle: 'Metas que nao saem do papel, rotina que nao rende, trabalho empacado' },
        { key: 'D', title: 'No meu dinheiro', subtitle: 'Controle inexistente, gastos que somem, futuro financeiro sem clareza' },
        { key: 'E', title: 'Nas minhas relacoes', subtitle: 'Vinculos rasos, presenca dividida, comunicacao que nao chega' },
        { key: 'F', title: 'Em quem eu estou me tornando', subtitle: 'Identidade turva, proposito sem forma, sensacao de estar a deriva' },
    ]},
    { id: 'p2', title: 'O que dentro dessa area doi mais quando voce para para pensar?', subtitle: 'As opcoes se adaptam ao que voce escolheu antes.', getOptions: (answers) => q2Options[answers.p1 || ''] || [] },
    { id: 'p3', title: 'Quando voce aprende algo novo, o que faz mais sentido pra voce?', subtitle: 'Nao tem certo ou errado. E sobre como sua mente funciona melhor.', options: [
        { key: 'A', title: 'Jogar direto na pratica', subtitle: 'Fazer, errar, ajustar. Teoria so depois de sentir na pele' },
        { key: 'B', title: 'Entender antes de agir', subtitle: 'Ler, entender o porque, entao aplicar com consciencia' },
        { key: 'C', title: 'Sustentar o que ja funciona', subtitle: 'Nao preciso de novidade. Preciso de consistencia no que ja sei' },
        { key: 'D', title: 'Criar e expressar', subtitle: 'Aprendo produzindo. Escrita, forma e expressao sao meu caminho' },
    ]},
    { id: 'p4', title: 'Quanto tempo voce consegue honestamente comprometer com um ciclo agora?', subtitle: 'Seja real. Um ciclo curto concluido vale mais do que um longo abandonado.', options: [
        { key: 'A', title: '7 dias', subtitle: 'Uma semana. Curto, intenso, sem desculpa' },
        { key: 'B', title: '14 dias', subtitle: 'Duas semanas. Tempo suficiente para progressao real' },
        { key: 'C', title: '21 dias ou mais', subtitle: 'Tres semanas. Transformacao mais profunda, exige mais comprometimento' },
    ]},
    { id: 'p5', title: 'Como esta o seu ritmo hoje, honestamente?', subtitle: 'Isso ajuda o sistema a calibrar o nivel de exigencia da sua campanha.', options: [
        { key: 'A', title: 'No caos', subtitle: 'Cada dia e diferente do anterior, nada tem forma ainda' },
        { key: 'B', title: 'Tentando, mas quebrando', subtitle: 'Tenho intencao de rotina mas ela nao segura' },
        { key: 'C', title: 'Estavel, mas estagnado', subtitle: 'Tenho rotina mas sinto que nao estou evoluindo' },
        { key: 'D', title: 'Em movimento', subtitle: 'Estou bem, mas quero subir o nivel' },
    ]},
    { id: 'p6', title: 'O que geralmente te tira do caminho quando voce comeca algo?', subtitle: 'Nao o que voce gostaria de dizer. O que realmente acontece.', options: [
        { key: 'A', title: 'Perco o foco no meio do caminho', subtitle: 'Comeco bem, mas disperso depois de alguns dias' },
        { key: 'B', title: 'A vida bate e eu desisto', subtitle: 'Eventos externos quebram meu ritmo e eu nao volto' },
        { key: 'C', title: 'Nao sei por onde comecar de verdade', subtitle: 'A intencao existe mas a acao concreta trava' },
        { key: 'D', title: 'Fico num ciclo de planejar e nao executar', subtitle: 'Organizo tudo, mas na hora de fazer, travo' },
    ]},
    { id: 'p7', title: 'O que te faz sentir que valeu a pena no final de um ciclo?', subtitle: 'A ultima pergunta. O que importa pra voce quando olha para tras.', options: [
        { key: 'A', title: 'Ver o quanto avancei em relacao a quem eu era', subtitle: 'Progresso acumulado, historico, comparacao com o passado' },
        { key: 'B', title: 'Ter cumprido o que eu prometi pra mim mesmo', subtitle: 'Consistencia, aderencia, nao ter quebrado o compromisso' },
        { key: 'C', title: 'Sentir que mudei algo concreto na minha vida', subtitle: 'Resultado tangivel, mudanca real, algo diferente que posso apontar' },
        { key: 'D', title: 'Ter construido algo que vai durar alem do ciclo', subtitle: 'Habito instalado, sistema criado, legado que continua' },
    ]},
];

const desiredTypeByP3: Partial<Record<QuizAnswerKey, CampaignTypeId>> = { A: 'pratica', B: 'aprendizado', C: 'manutencao' };
const desiredDurationByP4: Partial<Record<QuizAnswerKey, number>> = { A: 7, B: 14, C: 21 };

const freeTitles = (answers: QuizAnswers) => {
    switch (answers.p1) {
        case 'A': return answers.p2 === 'A' ? ['Fundamentos da Calistenia', 'HIIT Express (Queima Rapida)'] : answers.p2 === 'B' ? ['Bussola Nutricional (Basico)'] : ['Manha Energetica'];
        case 'B': return answers.p2 === 'B' && (answers.p5 === 'A' || answers.p5 === 'B') ? ['Manutencao da Base (Casa)'] : ['Foco Basico (Anti-Distracao)'];
        case 'C': return answers.p2 === 'B' ? ['Diario de Bordo (Journaling)'] : ['Motor de Produtividade'];
        case 'D': return ['Radar Financeiro'];
        case 'E': return ['Sincronia de Rede'];
        case 'F': return ['Diario de Bordo (Journaling)'];
        default: return ['Motor de Produtividade'];
    }
};

const fullTitles = (answers: QuizAnswers) => {
    switch (answers.p1) {
        case 'A':
            if (answers.p2 === 'A') return ['Fundamentos da Calistenia', 'HIIT Express (Queima Rapida)', 'Corpo em Movimento', 'Mobilidade e Flexibilidade', 'Despertar de Ferro', 'Corpo de Elite'];
            if (answers.p2 === 'B') return ['Bussola Nutricional (Basico)', 'Reset Dopaminergico', 'Manha Energetica'];
            if (answers.p2 === 'C') return ['Sono de Elite', 'Manha Energetica', 'Corpo de Elite'];
            return ['Manha Energetica', 'Corpo em Movimento', 'Sono de Elite'];
        case 'B':
            return answers.p2 === 'A'
                ? ['Foco Basico (Anti-Distracao)', 'Leitura Ativa', 'Detox Digital', 'Estoicismo Aplicado', 'Foco Blindado']
                : ['Manutencao da Base (Casa)', 'Logistica de Vanguarda', 'Foco Basico (Anti-Distracao)', 'Detox Digital'];
        case 'C':
            return answers.p2 === 'B'
                ? ['Diario de Bordo (Journaling)', 'Logistica de Vanguarda', 'Construcao de Identidade', 'Lideranca sem Cargo']
                : ['Motor de Produtividade', 'Criatividade em Sprint', 'Expressao Criativa', 'Foco Blindado'];
        case 'D': return ['Radar Financeiro', 'Controle de Impulsos', 'Financas com Intencao', 'Maestria Financeira'];
        case 'E': return ['Sincronia de Rede', 'Presenca Real', 'Voz e Presenca', 'Construcao de Cla'];
        case 'F': return answers.p2 === 'B'
            ? ['Construcao de Identidade', 'Estoicismo Aplicado', 'Lideranca sem Cargo']
            : ['Diario de Bordo (Journaling)', 'Estoicismo Aplicado', 'Construcao de Identidade'];
        default: return ['Motor de Produtividade', 'Diario de Bordo (Journaling)'];
    }
};

const buildEntry = (catalog: CodexCatalogItem): CampaignEntry | null => {
    if (!catalog.template) return null;
    const meta = resolveTemplateCampaignMeta(catalog.id, catalog.template);
    const priceGold = Number(catalog.price_gold ?? Math.round(catalog.price_brl ?? 0));
    const durationDays = Number(catalog.duration_days ?? catalog.template.durationDays ?? 7);
    const typeId = meta.campaignType || 'pratica';
    return {
        catalog,
        title: catalog.title,
        normalizedTitle: normalizeToken(catalog.title),
        durationDays,
        typeId,
        typeLabel: CATEGORY_LABELS[typeId],
        themeId: meta.campaignTheme || null,
        isFree: priceGold <= 0,
        priceGold,
        primaryAssetId: meta.primaryAssetId || null,
        description: catalog.description || catalog.template.description || 'Campanha pronta para instalar.',
        tierRank: tierFromDuration(durationDays),
    };
};

const scoreFullEntry = (entry: CampaignEntry, answers: QuizAnswers, orderedTitles: Map<string, number>) => {
    let score = 0;
    const desiredType = answers.p3 ? desiredTypeByP3[answers.p3] || null : null;
    const desiredDuration = answers.p4 ? desiredDurationByP4[answers.p4] || 7 : 7;
    const desiredTier = Math.max(1, Math.min(3, (answers.p4 === 'C' ? 3 : answers.p4 === 'B' ? 2 : 1) + (answers.p5 === 'A' ? -1 : answers.p5 === 'D' ? 1 : 0) + (answers.p6 === 'C' ? -1 : 0)));
    const assetPrefs = answers.p1 === 'A' ? ['fisico'] : answers.p1 === 'B' ? ['espaco-mental', 'consciencia'] : answers.p1 === 'C' ? ['trabalho', 'consciencia'] : answers.p1 === 'D' ? ['financas'] : answers.p1 === 'E' ? ['conexoes'] : ['consciencia', 'proposito'];
    const idx = orderedTitles.get(entry.normalizedTitle);
    if (idx !== undefined) score += 120 - idx * 12;
    if (desiredType && entry.typeId === desiredType) score += 24;
    if (answers.p3 === 'D' && entry.themeId === 'expressao') score += 24;
    if (entry.durationDays === desiredDuration) score += 22; else if (Math.abs(entry.durationDays - desiredDuration) === 7) score += 10;
    score += Math.max(0, 16 - Math.abs(entry.tierRank - desiredTier) * 8);
    if (assetPrefs.includes(entry.primaryAssetId || '')) score += 10;
    if (answers.p6 === 'A' && (entry.themeId === 'produtividade' || entry.themeId === 'psicologia')) score += 10;
    if (answers.p6 === 'B' && entry.typeId === 'manutencao') score += 10;
    if (answers.p6 === 'C' && entry.typeId === 'aprendizado') score += 10;
    if (answers.p6 === 'D' && entry.typeId === 'pratica') score += 10;
    if (answers.p7 === 'B' && entry.typeId === 'manutencao') score += 8;
    if (answers.p7 === 'C' && entry.typeId === 'pratica') score += 8;
    if (answers.p7 === 'D' && (entry.typeId === 'aprendizado' || entry.typeId === 'manutencao')) score += 8;
    if (!entry.isFree) score += 3;
    return score;
};

const resolveRecommendation = (answers: QuizAnswers, entries: CampaignEntry[], mode: QuizMode): CampaignRecommendation | null => {
    const desiredType = answers.p3 ? desiredTypeByP3[answers.p3] || null : null;
    const desiredDuration = answers.p4 ? desiredDurationByP4[answers.p4] || 7 : 7;
    if (mode === 'free') {
        const titleSet = new Set(freeTitles(answers).map(normalizeToken));
        const candidates = entries.filter((entry) => titleSet.has(entry.normalizedTitle));
        const pool = candidates.length ? candidates : entries;
        const exact = pool.filter((entry) => entry.durationDays === desiredDuration);
        const sevenDay = pool.filter((entry) => entry.durationDays === 7);
        const chosenPool = exact.length ? exact : (sevenDay.length ? sevenDay : pool);
        const ordered = [...chosenPool].sort((left, right) => {
            const leftType = desiredType && left.typeId === desiredType ? 1 : 0;
            const rightType = desiredType && right.typeId === desiredType ? 1 : 0;
            if (leftType !== rightType) return rightType - leftType;
            return left.title.localeCompare(right.title);
        });
        const entry = ordered[0];
        return entry ? { entry, desiredDuration, upgradeNote: entry.durationDays < desiredDuration ? `Quer esse ciclo em ${desiredDuration} dias? Disponível na loja.` : null } : null;
    }
    const orderMap = new Map(fullTitles(answers).map((title, index) => [normalizeToken(title), index]));
    const ranked = [...entries]
        .map((entry) => ({ entry, score: scoreFullEntry(entry, answers, orderMap) }))
        .sort((left, right) => right.score - left.score || Number(left.entry.isFree) - Number(right.entry.isFree) || left.entry.priceGold - right.entry.priceGold);
    return ranked[0]?.entry ? { entry: ranked[0].entry, desiredDuration, upgradeNote: null } : null;
};

interface CampaignRecommendationQuizModalProps { onClose: () => void }

export const CampaignRecommendationQuizModal: React.FC<CampaignRecommendationQuizModalProps> = ({ onClose }) => {
    const { codexCatalog, userCodexes, userProfile, getArenas, buyCodex, installCodex, showToast } = useGame();
    const [quizMode, setQuizMode] = useState<QuizMode>('free');
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [selectedOption, setSelectedOption] = useState<QuizAnswerKey | null>(null);
    const [result, setResult] = useState<CampaignRecommendation | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isSyncingLibrary, setIsSyncingLibrary] = useState(false);
    const [installingCatalogId, setInstallingCatalogId] = useState<string | null>(null);
    const ensuredCatalogIdsRef = useRef<Set<string>>(new Set());

    const catalogEntries = useMemo(() => codexCatalog.map(buildEntry).filter((entry): entry is CampaignEntry => Boolean(entry)), [codexCatalog]);
    const freeCatalog = useMemo(() => catalogEntries.filter((entry) => entry.isFree), [catalogEntries]);
    const mediumCatalog = useMemo(
        () => catalogEntries.filter((entry) => !entry.isFree && entry.tierRank === 2),
        [catalogEntries],
    );
    const hasOwnedFreeCampaign = useMemo(() => userCodexes.some((userCodex) => {
        if (!userCodex.catalog_id) return false;
        const catalogEntry = catalogEntries.find((entry) => entry.catalog.id === userCodex.catalog_id);
        return Boolean(catalogEntry?.isFree);
    }), [catalogEntries, userCodexes]);
    const campaignQuizFreeCredits = Math.max(0, Number(userProfile.campaignQuizFreeCredits || 0));
    const campaignQuizMediumCredits = Math.max(0, Number(userProfile.campaignQuizMediumCredits || 0));
    const hasFreeQuizCredit = campaignQuizFreeCredits > 0;
    const hasMediumQuizCredit = campaignQuizMediumCredits > 0;
    const hasStarterFreeQuiz = !hasCompletedFreeCampaignQuiz() && !hasOwnedFreeCampaign;
    const canPickFreeQuiz = hasStarterFreeQuiz || hasFreeQuizCredit;
    const shouldConsumeFreeQuizCredit = quizMode === 'free' && !hasStarterFreeQuiz && hasFreeQuizCredit;

    useEffect(() => {
        if (canPickFreeQuiz) {
            setQuizMode('free');
            return;
        }
        if (hasMediumQuizCredit) {
            setQuizMode('medium');
            return;
        }
        setQuizMode('full');
    }, [canPickFreeQuiz, hasMediumQuizCredit]);

    const allArenas = getArenas();
    const installedCodexIds = useMemo(() => new Set(allArenas.map((arena) => arena.originCodexId).filter(Boolean)), [allArenas]);
    const findOwnedCodex = useCallback((catalogId: string): UserCodex | null => {
        const catalogEntry = codexCatalog.find((item) => item.id === catalogId);
        const normalizedTitle = normalizeToken(catalogEntry?.title || '');
        return userCodexes.find((userCodex) => userCodex.catalog_id === catalogId || (normalizedTitle && normalizeToken(userCodex.name) === normalizedTitle)) || null;
    }, [codexCatalog, userCodexes]);

    const currentQuestion = questions[questionIndex];
    const currentOptions = currentQuestion ? (typeof currentQuestion.getOptions === 'function' ? currentQuestion.getOptions(answers) : currentQuestion.options || []) : [];
    const progressPercent = ((Math.min(questionIndex + 1, TOTAL_QUESTIONS)) / TOTAL_QUESTIONS) * 100;
    const ownedResultCodex = result ? findOwnedCodex(result.entry.catalog.id) : null;
    const isResultInstalled = Boolean(ownedResultCodex && installedCodexIds.has(ownedResultCodex.id));
    const secondaryRecommendation = useMemo(() => {
        if (!result || quizMode !== 'free') return null;
        const premiumEntries = catalogEntries.filter((entry) => !entry.isFree && entry.catalog.id !== result.entry.catalog.id);
        return resolveRecommendation(answers, premiumEntries, 'full');
    }, [answers, catalogEntries, quizMode, result]);
    const ownedSecondaryCodex = secondaryRecommendation ? findOwnedCodex(secondaryRecommendation.entry.catalog.id) : null;
    const isSecondaryInstalled = Boolean(ownedSecondaryCodex && installedCodexIds.has(ownedSecondaryCodex.id));

    useEffect(() => {
        if (!currentQuestion) {
            setSelectedOption(null);
            return;
        }
        const savedAnswer = answers[currentQuestion.id] || null;
        const isStillValid = savedAnswer ? currentOptions.some((option) => option.key === savedAnswer) : false;
        setSelectedOption(isStillValid ? savedAnswer : null);
    }, [answers, currentOptions, currentQuestion]);

    const ensureCampaignInLibrary = useCallback(async (
        recommendation: CampaignRecommendation,
        options: { autoAcquire?: boolean; useCampaignQuizFreeCredit?: boolean; useCampaignQuizMediumCredit?: boolean } = {},
    ): Promise<UserCodex | null> => {
        const existing = findOwnedCodex(recommendation.entry.catalog.id);
        if (existing) {
            setStatusMessage(installedCodexIds.has(existing.id) ? 'Essa campanha ja esta instalada nas suas campanhas.' : 'Campanha adicionada a sua biblioteca. Ela ja aparece no menu de Campanhas.');
            return existing;
        }
        if (!options.autoAcquire) {
            setStatusMessage(
                recommendation.entry.isFree
                    ? 'Campanha gratuita pronta para entrar na sua biblioteca. Depois você instala no app quando quiser.'
                    : options.useCampaignQuizFreeCredit
                        ? 'Sua ficha grátis pode liberar essa campanha para instalar agora.'
                    : options.useCampaignQuizMediumCredit
                        ? 'Sua ficha média pode liberar essa campanha para instalar agora.'
                        : 'Campanha recomendada encontrada. Ao comprar, ela entra na sua biblioteca e depois pode ser instalada no app.',
            );
            return null;
        }
        if (ensuredCatalogIdsRef.current.has(recommendation.entry.catalog.id)) return null;
        ensuredCatalogIdsRef.current.add(recommendation.entry.catalog.id);
        setIsSyncingLibrary(true);
        setStatusMessage(
            recommendation.entry.isFree
                ? (options.useCampaignQuizFreeCredit ? 'Aplicando sua ficha grátis e liberando a campanha...' : 'Adicionando a campanha recomendada à sua biblioteca...')
                : options.useCampaignQuizMediumCredit
                    ? 'Aplicando sua ficha média e liberando a campanha...'
                    : 'Adquirindo a campanha recomendada e colocando na sua biblioteca...',
        );
        try {
            const acquired = await buyCodex(recommendation.entry.catalog.id, {
                silentSuccess: true,
                useCampaignQuizFreeCredit: options.useCampaignQuizFreeCredit,
                useCampaignQuizMediumCredit: options.useCampaignQuizMediumCredit,
            });
            const resolved = acquired || findOwnedCodex(recommendation.entry.catalog.id);
            if (resolved) {
                setStatusMessage(
                    recommendation.entry.isFree
                        ? (options.useCampaignQuizFreeCredit ? 'Campanha liberada com sua ficha grátis. Se quiser, instale agora.' : 'Campanha adicionada à sua biblioteca. Se quiser, instale agora.')
                        : options.useCampaignQuizMediumCredit
                            ? 'Campanha liberada com sua ficha média. Se quiser, instale agora.'
                            : 'Campanha adquirida e adicionada à sua biblioteca. Se quiser, instale agora.',
                );
                return resolved;
            }
            setStatusMessage('Não foi possível preparar essa campanha agora.');
            return null;
        } finally {
            setIsSyncingLibrary(false);
        }
    }, [buyCodex, findOwnedCodex, installedCodexIds]);

    useEffect(() => {
        if (!result) return;
        void ensureCampaignInLibrary(result, {
            autoAcquire: result.entry.isFree,
            useCampaignQuizFreeCredit: result.entry.isFree && shouldConsumeFreeQuizCredit,
        });
    }, [ensureCampaignInLibrary, result, shouldConsumeFreeQuizCredit]);

    useEffect(() => {
        setSelectedOption(answers[currentQuestion.id] ?? null);
    }, [answers, currentQuestion.id]);

    const handleContinue = (optionKey = selectedOption) => {
        if (!optionKey) return;
        const nextAnswers = { ...answers, [currentQuestion.id]: optionKey } as QuizAnswers;
        setAnswers(nextAnswers);
        if (questionIndex === TOTAL_QUESTIONS - 1) {
            if (quizMode === 'free' && hasStarterFreeQuiz) markFreeCampaignQuizCompleted();
            const pool = quizMode === 'free'
                ? freeCatalog
                : quizMode === 'medium'
                    ? (mediumCatalog.length ? mediumCatalog : catalogEntries.filter((entry) => !entry.isFree))
                    : catalogEntries.filter((entry) => !entry.isFree);
            setResult(resolveRecommendation(nextAnswers, pool, quizMode));
            return;
        }
        setQuestionIndex((current) => current + 1);
    };

    const handlePrevious = () => {
        if (questionIndex === 0) return;
        setQuestionIndex((current) => Math.max(0, current - 1));
    };

    const handleInstallRecommendation = async (recommendation: CampaignRecommendation | null, options: { closeOnSuccess?: boolean } = {}) => {
        if (!recommendation || installingCatalogId) return;
        const closeOnSuccess = options.closeOnSuccess ?? true;
        setInstallingCatalogId(recommendation.entry.catalog.id);
        try {
            const ownedCodex = await ensureCampaignInLibrary(recommendation, {
                autoAcquire: true,
                useCampaignQuizFreeCredit: quizMode === 'free' && shouldConsumeFreeQuizCredit,
                useCampaignQuizMediumCredit: quizMode === 'medium',
            });
            const resolved = ownedCodex || findOwnedCodex(recommendation.entry.catalog.id);
            if (!resolved) {
                showToast('Não foi possível preparar a campanha para instalação.', 'warning');
                return;
            }
            if (installedCodexIds.has(resolved.id)) {
                showToast('Essa campanha ja esta instalada nas suas campanhas.', 'info');
                if (closeOnSuccess) onClose();
                return;
            }
            await installCodex(resolved.id);
            if (closeOnSuccess) onClose();
        } finally {
            setInstallingCatalogId(null);
        }
    };

    const resultPriceLabel = quizMode === 'medium'
        ? 'Grátis com ficha'
        : shouldConsumeFreeQuizCredit
            ? 'Grátis com ficha'
        : result?.entry.isFree
            ? 'Gratuita'
            : `${result?.entry.priceGold} ouro`;
    const secondaryPriceLabel = secondaryRecommendation ? `${secondaryRecommendation.entry.priceGold} ouro` : null;
    const modeLabel = quizMode === 'free'
        ? (hasStarterFreeQuiz ? 'Primeiro quiz gratuito' : `${campaignQuizFreeCredits} ficha${campaignQuizFreeCredits === 1 ? '' : 's'} grátis disponível${campaignQuizFreeCredits === 1 ? '' : 'eis'}`)
        : quizMode === 'medium'
            ? `${campaignQuizMediumCredits} ficha${campaignQuizMediumCredits === 1 ? '' : 's'} média${campaignQuizMediumCredits === 1 ? '' : 's'} disponível${campaignQuizMediumCredits === 1 ? '' : 'eis'}`
            : 'Catálogo completo';
    const resultModeLabel = quizMode === 'free'
        ? (shouldConsumeFreeQuizCredit ? 'Resultado com ficha grátis' : 'Resultado do quiz')
        : quizMode === 'medium'
            ? 'Resultado com ficha média'
            : 'Resultado do quiz';
    const installLabel = quizMode === 'medium' || shouldConsumeFreeQuizCredit
        ? 'Liberar e instalar campanha'
        : 'Instalar campanha';

    return (
        <Portal>
            <div className="campaign-quiz-overlay" onClick={onClose}>
                <div className="campaign-quiz-shell" onClick={(event) => event.stopPropagation()}>
                    <div className="campaign-quiz-header">
                        <div>{String(Math.min(questionIndex + 1, TOTAL_QUESTIONS)).padStart(2, '0')} / 07</div>
                        <div className="campaign-quiz-progress-shell"><div className="campaign-quiz-progress-fill" style={{ width: `${progressPercent}%` }} /></div>
                        <div className="campaign-quiz-header-right">
                            <span>{result ? 'Resultado' : `Pergunta ${Math.min(questionIndex + 1, TOTAL_QUESTIONS)} de 7`}</span>
                            <button type="button" onClick={onClose} className="campaign-quiz-close" aria-label="Fechar quiz">×</button>
                        </div>
                    </div>

                    <div className="campaign-quiz-stage">
                        {!result ? (
                            <section key={`${quizMode}-${currentQuestion.id}`} className="campaign-quiz-screen">
                                <div className="campaign-quiz-scroll">
                                    <div className="campaign-quiz-meta">
                                        <div className="campaign-quiz-index">{String(questionIndex + 1).padStart(2, '0')} / 07</div>
                                        <div>{modeLabel}</div>
                                    </div>
                                    {(canPickFreeQuiz || hasMediumQuizCredit) && (
                                        <div className="flex flex-wrap gap-2">
                                            {canPickFreeQuiz && (
                                                <button
                                                    type="button"
                                                    onClick={() => setQuizMode('free')}
                                                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${quizMode === 'free' ? 'luxe-skin-button' : 'campaign-quiz-secondary'}`}
                                                >
                                                    {hasStarterFreeQuiz ? 'Quiz grátis' : `Ficha grátis · ${campaignQuizFreeCredits}`}
                                                </button>
                                            )}
                                            {hasMediumQuizCredit && (
                                                <button
                                                    type="button"
                                                    onClick={() => setQuizMode('medium')}
                                                    className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${quizMode === 'medium' ? 'luxe-skin-button' : 'campaign-quiz-secondary'}`}
                                                >
                                                    Ficha média · {campaignQuizMediumCredits}
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setQuizMode('full')}
                                                className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${quizMode === 'full' ? 'luxe-skin-button' : 'campaign-quiz-secondary'}`}
                                            >
                                                Catálogo completo
                                            </button>
                                        </div>
                                    )}
                                    <div className="campaign-quiz-copy">
                                        <h1 className="campaign-quiz-title">{currentQuestion.title}</h1>
                                        <p className="campaign-quiz-subtitle">{currentQuestion.subtitle}</p>
                                    </div>
                                    <div className={`campaign-quiz-options ${currentOptions.length <= 4 ? 'is-single-column' : ''}`}>
                                        {currentOptions.map((option) => (
                                            <button key={`${currentQuestion.id}-${option.key}`} type="button" onClick={() => setSelectedOption(option.key)} className={`campaign-quiz-option ${selectedOption === option.key ? 'is-active' : ''}`}>
                                                <span className="campaign-quiz-letter">{option.key}</span>
                                                <span>
                                                    <span className="campaign-quiz-option-main">{option.title}</span>
                                                    <span className="campaign-quiz-option-sub">{option.subtitle}</span>
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="campaign-quiz-footer">
                                    <button type="button" onClick={handlePrevious} disabled={questionIndex === 0} className="campaign-quiz-secondary min-w-[10rem] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-35">Anterior</button>
                                    <button type="button" onClick={() => handleContinue()} disabled={!selectedOption} className="luxe-skin-button min-w-[12rem] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-40">Continuar</button>
                                </div>
                            </section>
                        ) : (
                            <section className="campaign-quiz-screen">
                                <div className="campaign-quiz-scroll campaign-quiz-scroll-result">
                                    <div className="campaign-quiz-meta">
                                        <div className="campaign-quiz-index">07 / 07</div>
                                        <div>{resultModeLabel}</div>
                                    </div>
                                    <div className="campaign-quiz-result">
                                        <h1 className="campaign-quiz-result-title">Sua campanha foi identificada</h1>
                                        <p className="campaign-quiz-result-subtitle">Com base nas suas respostas, o sistema encontrou a campanha ideal para o seu momento.</p>
                                        <div className="campaign-quiz-result-name">{result.entry.title}</div>
                                        <div className="campaign-quiz-result-pills">
                                            <span className="campaign-quiz-result-pill">{result.entry.typeLabel}</span>
                                            <span className="campaign-quiz-result-pill">{result.entry.durationDays} dias</span>
                                            <span className="campaign-quiz-result-pill">{resultPriceLabel}</span>
                                        </div>
                                        <p className="campaign-quiz-result-copy">{result.entry.description}</p>
                                        {result.upgradeNote && <div className="campaign-quiz-result-note">{result.upgradeNote}</div>}
                                        {statusMessage && <div className="campaign-quiz-result-status">{statusMessage}</div>}
                                        {quizMode === 'free' && secondaryRecommendation && (
                                            <div className="campaign-quiz-see-also">
                                                <div className="campaign-quiz-see-also-label">Veja também</div>
                                                <div className="campaign-quiz-see-also-card">
                                                    <div className="campaign-quiz-see-also-header">
                                                        <div>
                                                            <div className="campaign-quiz-see-also-title">{secondaryRecommendation.entry.title}</div>
                                                            <div className="campaign-quiz-see-also-price">{secondaryPriceLabel}</div>
                                                        </div>
                                                        <div className="campaign-quiz-see-also-pills">
                                                            <span className="campaign-quiz-result-pill">{secondaryRecommendation.entry.typeLabel}</span>
                                                            <span className="campaign-quiz-result-pill">{secondaryRecommendation.entry.durationDays} dias</span>
                                                        </div>
                                                    </div>
                                                    <p className="campaign-quiz-see-also-copy">{secondaryRecommendation.entry.description}</p>
                                                    <button
                                                        type="button"
                                                        onClick={() => { void handleInstallRecommendation(secondaryRecommendation); }}
                                                        disabled={installingCatalogId !== null || isSyncingLibrary || isSecondaryInstalled}
                                                        className="campaign-quiz-secondary-cta"
                                                    >
                                                        {installingCatalogId === secondaryRecommendation.entry.catalog.id
                                                            ? 'Preparando...'
                                                            : isSecondaryInstalled
                                                                ? 'Campanha instalada'
                                                                : ownedSecondaryCodex
                                                                    ? 'Instalar esta'
                                                                    : `Comprar e instalar (${secondaryPriceLabel})`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="campaign-quiz-result-actions">
                                            <button type="button" onClick={() => { void handleInstallRecommendation(result); }} disabled={installingCatalogId !== null || isSyncingLibrary || isResultInstalled} className="luxe-skin-button w-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50">
                                                {installingCatalogId === result.entry.catalog.id ? 'Instalando...' : isResultInstalled ? 'Campanha instalada' : installLabel}
                                            </button>
                                            <button type="button" onClick={onClose} className="campaign-quiz-secondary w-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em]">Ver catálogo completo</button>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </Portal>
    );
};

