import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../../contexts/GameContext';
import { CodexCatalogItem, UserCodex } from '../../types';
import { Portal } from '../Portal';
import { CATEGORY_LABELS, resolveTemplateCampaignMeta, type CampaignTypeId } from '../../utils/campaignCatalogMeta';
import './CampaignRecommendationQuiz.css';

type QuizAnswerKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
type QuizQuestionId = 'p1' | 'p2' | 'p3' | 'p4' | 'p5' | 'p6' | 'p7';
type QuizAnswers = Partial<Record<QuizQuestionId, QuizAnswerKey>>;

type QuizOption = {
    key: QuizAnswerKey;
    title: string;
    subtitle: string;
};

type QuizQuestion = {
    id: QuizQuestionId;
    title: string;
    subtitle: string;
    options?: QuizOption[];
    getOptions?: (answers: QuizAnswers) => QuizOption[];
};

type FreeCampaignEntry = {
    catalog: CodexCatalogItem;
    title: string;
    normalizedTitle: string;
    durationDays: number;
    typeId: CampaignTypeId;
    typeLabel: string;
    description: string;
};

type CampaignRecommendation = {
    entry: FreeCampaignEntry;
    upgradeNote: string | null;
    desiredDuration: number;
};

const TOTAL_QUESTIONS = 7;

const normalizeToken = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const questionTwoOptionsByArea: Record<string, QuizOption[]> = {
    A: [
        { key: 'A', title: 'Como eu me movo e treino', subtitle: 'Treino, força, intensidade e consistência corporal.' },
        { key: 'B', title: 'Como eu me alimento', subtitle: 'Escolhas alimentares, clareza nutricional e relação com comida.' },
        { key: 'C', title: 'Como eu recupero e durmo', subtitle: 'Sono, recuperação e energia restaurada.' },
        { key: 'D', title: 'Como eu me sinto dia a dia', subtitle: 'Disposição, ritmo e sensação corporal geral.' },
    ],
    B: [
        { key: 'A', title: 'Como eu foco e tomo decisões', subtitle: 'Clareza, prioridade e presença mental.' },
        { key: 'B', title: 'Como eu organizo meu espaço e rotina', subtitle: 'Ambiente, sistema e estrutura operacional.' },
    ],
    C: [
        { key: 'A', title: 'Como eu executo no dia a dia', subtitle: 'Ação concreta, ritmo e produção real.' },
        { key: 'B', title: 'Como eu planejo e estrategio', subtitle: 'Visão, organização e pensamento de estrutura.' },
    ],
    D: [
        { key: 'A', title: 'Como eu controlo e construo', subtitle: 'Controle, direção e construção financeira.' },
    ],
    E: [
        { key: 'A', title: 'Como eu me conecto e me faço presente', subtitle: 'Vínculo, presença e contato intencional.' },
    ],
    F: [
        { key: 'A', title: 'Como eu me entendo', subtitle: 'Autopercepção, leitura interna e clareza do eu.' },
        { key: 'B', title: 'Como eu construo quem quero ser', subtitle: 'Identidade deliberada, direção e propósito.' },
    ],
};

const questions: QuizQuestion[] = [
    {
        id: 'p1',
        title: 'Quando você para e olha para a sua vida agora, onde está o maior peso?',
        subtitle: 'Não o que você acha mais importante. O que está pesando de verdade hoje.',
        options: [
            { key: 'A', title: 'No meu corpo', subtitle: 'Energia baixa, saúde negligenciada, corpo que não acompanha a mente' },
            { key: 'B', title: 'Na minha cabeça', subtitle: 'Pensamentos acumulados, foco quebrado, ambiente mental pesado' },
            { key: 'C', title: 'No que eu produzo', subtitle: 'Metas que não saem do papel, rotina que não rende, trabalho empacado' },
            { key: 'D', title: 'No meu dinheiro', subtitle: 'Controle inexistente, gastos que somem, futuro financeiro sem clareza' },
            { key: 'E', title: 'Nas minhas relações', subtitle: 'Vínculos rasos, presença dividida, comunicação que não chega' },
            { key: 'F', title: 'Em quem eu estou me tornando', subtitle: 'Identidade turva, propósito sem forma, sensação de estar à deriva' },
        ],
    },
    {
        id: 'p2',
        title: 'O que dentro dessa área dói mais quando você para para pensar?',
        subtitle: 'As opções se adaptam ao que você escolheu antes.',
        getOptions: (answers) => questionTwoOptionsByArea[answers.p1 || ''] || [],
    },
    {
        id: 'p3',
        title: 'Quando você aprende algo novo, o que faz mais sentido pra você?',
        subtitle: 'Não tem certo ou errado, é sobre como sua mente funciona melhor.',
        options: [
            { key: 'A', title: 'Jogar direto na prática', subtitle: 'Fazer, errar, ajustar. Teoria só depois de sentir na pele' },
            { key: 'B', title: 'Entender antes de agir', subtitle: 'Ler, entender o porquê, então aplicar com consciência' },
            { key: 'C', title: 'Sustentar o que já funciona', subtitle: 'Não preciso de novidade. Preciso de consistência no que já sei' },
            { key: 'D', title: 'Criar e expressar', subtitle: 'Aprendo produzindo. Escrita, forma e expressão são meu caminho' },
        ],
    },
    {
        id: 'p4',
        title: 'Quanto tempo você consegue honestamente comprometer com um ciclo agora?',
        subtitle: 'Seja real. Um ciclo curto concluído vale mais do que um longo abandonado.',
        options: [
            { key: 'A', title: '7 dias', subtitle: 'Uma semana. Curto, intenso, sem desculpa' },
            { key: 'B', title: '14 dias', subtitle: 'Duas semanas. Tempo suficiente para progressão real' },
            { key: 'C', title: '21 dias ou mais', subtitle: 'Três semanas. Transformação mais profunda, exige mais comprometimento' },
        ],
    },
    {
        id: 'p5',
        title: 'Como está o seu ritmo hoje, honestamente?',
        subtitle: 'Isso ajuda o sistema a calibrar o nível de exigência da sua campanha.',
        options: [
            { key: 'A', title: 'No caos', subtitle: 'Cada dia é diferente do anterior, nada tem forma ainda' },
            { key: 'B', title: 'Tentando, mas quebrando', subtitle: 'Tenho intenção de rotina mas ela não segura' },
            { key: 'C', title: 'Estável, mas estagnado', subtitle: 'Tenho rotina mas sinto que não estou evoluindo' },
            { key: 'D', title: 'Em movimento', subtitle: 'Estou bem, mas quero subir o nível' },
        ],
    },
    {
        id: 'p6',
        title: 'O que geralmente te tira do caminho quando você começa algo?',
        subtitle: 'Não o que você gostaria de dizer, o que realmente acontece.',
        options: [
            { key: 'A', title: 'Perco o foco no meio do caminho', subtitle: 'Começo bem, mas disperso depois de alguns dias' },
            { key: 'B', title: 'A vida bate e eu desisto', subtitle: 'Eventos externos quebram meu ritmo e eu não volto' },
            { key: 'C', title: 'Não sei por onde começar de verdade', subtitle: 'A intenção existe mas a ação concreta trava' },
            { key: 'D', title: 'Fico num ciclo de planejar e não executar', subtitle: 'Organizo tudo, mas na hora de fazer, travo' },
        ],
    },
    {
        id: 'p7',
        title: 'O que te faz sentir que valeu a pena no final de um ciclo?',
        subtitle: 'A última pergunta. O que importa pra você quando olha para trás.',
        options: [
            { key: 'A', title: 'Ver o quanto avancei em relação a quem eu era', subtitle: 'Progresso acumulado, histórico, comparação com o passado' },
            { key: 'B', title: 'Ter cumprido o que eu prometi pra mim mesmo', subtitle: 'Consistência, aderência, não ter quebrado o compromisso' },
            { key: 'C', title: 'Sentir que mudei algo concreto na minha vida', subtitle: 'Resultado tangível, mudança real, algo diferente que posso apontar' },
            { key: 'D', title: 'Ter construído algo que vai durar além do ciclo', subtitle: 'Hábito instalado, sistema criado, legado que continua' },
        ],
    },
];

const typePreferenceByQuestionThree: Partial<Record<QuizAnswerKey, CampaignTypeId>> = {
    A: 'pratica',
    B: 'aprendizado',
    C: 'manutencao',
};

const durationPreferenceByQuestionFour: Partial<Record<QuizAnswerKey, number>> = {
    A: 7,
    B: 14,
    C: 21,
};

const getCandidateTitles = (answers: QuizAnswers): string[] => {
    switch (answers.p1) {
        case 'A':
            switch (answers.p2) {
                case 'A':
                    return ['Fundamentos da Calistenia', 'HIIT Express (Queima Rápida)'];
                case 'B':
                    return ['Bússola Nutricional (Básico)'];
                case 'C':
                case 'D':
                    return ['Manhã Energética'];
                default:
                    return ['Manhã Energética'];
            }
        case 'B':
            if (answers.p2 === 'A') return ['Foco Básico (Anti-Distração)'];
            if (answers.p2 === 'B') {
                return answers.p5 === 'A' || answers.p5 === 'B'
                    ? ['Manutenção da Base (Casa)']
                    : ['Foco Básico (Anti-Distração)'];
            }
            return ['Foco Básico (Anti-Distração)'];
        case 'C':
            return answers.p2 === 'B'
                ? ['Diário de Bordo (Journaling)']
                : ['Motor de Produtividade'];
        case 'D':
            return ['Radar Financeiro'];
        case 'E':
            return ['Sincronia de Rede'];
        case 'F':
            return ['Diário de Bordo (Journaling)'];
        default:
            return ['Motor de Produtividade'];
    }
};

const sortByPreference = (
    entries: FreeCampaignEntry[],
    desiredType: CampaignTypeId | null,
) => [...entries].sort((left, right) => {
    const leftTypeScore = desiredType && left.typeId === desiredType ? 1 : 0;
    const rightTypeScore = desiredType && right.typeId === desiredType ? 1 : 0;
    if (leftTypeScore !== rightTypeScore) return rightTypeScore - leftTypeScore;
    return left.title.localeCompare(right.title);
});

const resolveRecommendation = (
    answers: QuizAnswers,
    freeCatalog: FreeCampaignEntry[],
): CampaignRecommendation | null => {
    const desiredType = answers.p3 ? typePreferenceByQuestionThree[answers.p3] || null : null;
    const desiredDuration = answers.p4 ? durationPreferenceByQuestionFour[answers.p4] || 7 : 7;
    const titleSet = new Set(getCandidateTitles(answers).map(normalizeToken));
    const candidateEntries = freeCatalog.filter((entry) => titleSet.has(entry.normalizedTitle));
    const fallbackEntries = candidateEntries.length > 0 ? candidateEntries : freeCatalog;

    const perfectDurationMatches = fallbackEntries.filter((entry) => entry.durationDays === desiredDuration);
    const sevenDayFallback = fallbackEntries.filter((entry) => entry.durationDays === 7);
    const chosenPool = perfectDurationMatches.length > 0
        ? perfectDurationMatches
        : (sevenDayFallback.length > 0 ? sevenDayFallback : fallbackEntries);
    const entry = sortByPreference(chosenPool, desiredType)[0];

    if (!entry) return null;

    return {
        entry,
        desiredDuration,
        upgradeNote: entry.durationDays === desiredDuration || desiredDuration <= entry.durationDays
            ? null
            : `Quer esse ciclo em ${desiredDuration} dias? Disponível na loja.`,
    };
};

const buildFreeCampaignEntry = (catalog: CodexCatalogItem): FreeCampaignEntry | null => {
    if (!catalog.template) return null;

    const templateMeta = resolveTemplateCampaignMeta(catalog.id, catalog.template);
    const typeId = templateMeta.campaignType || 'pratica';

    return {
        catalog,
        title: catalog.title,
        normalizedTitle: normalizeToken(catalog.title),
        durationDays: Number(catalog.duration_days ?? catalog.template.durationDays ?? 7),
        typeId,
        typeLabel: CATEGORY_LABELS[typeId],
        description: catalog.description || catalog.template.description || 'Campanha pronta para instalar.',
    };
};

interface CampaignRecommendationQuizModalProps {
    onClose: () => void;
}

export const CampaignRecommendationQuizModal: React.FC<CampaignRecommendationQuizModalProps> = ({ onClose }) => {
    const { codexCatalog, userCodexes, getArenas, buyCodex, installCodex, showToast } = useGame();
    const [questionIndex, setQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<QuizAnswers>({});
    const [selectedOption, setSelectedOption] = useState<QuizAnswerKey | null>(null);
    const [result, setResult] = useState<CampaignRecommendation | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [isSyncingLibrary, setIsSyncingLibrary] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const ensuredCatalogIdsRef = useRef<Set<string>>(new Set());

    const freeCatalog = useMemo(() => (
        codexCatalog
            .filter((item) => Number(item.price_gold ?? Math.round(item.price_brl ?? 0)) <= 0)
            .map(buildFreeCampaignEntry)
            .filter((entry): entry is FreeCampaignEntry => Boolean(entry))
    ), [codexCatalog]);

    const allArenas = getArenas();
    const installedCodexIds = useMemo(
        () => new Set(allArenas.map((arena) => arena.originCodexId).filter(Boolean)),
        [allArenas],
    );

    const findOwnedCodex = useCallback((catalogId: string): UserCodex | null => {
        const catalogEntry = codexCatalog.find((item) => item.id === catalogId);
        const normalizedTitle = normalizeToken(catalogEntry?.title || '');

        return userCodexes.find((userCodex) => (
            userCodex.catalog_id === catalogId
            || (normalizedTitle && normalizeToken(userCodex.name) === normalizedTitle)
        )) || null;
    }, [codexCatalog, userCodexes]);

    const currentQuestion = questions[questionIndex];
    const currentOptions = currentQuestion
        ? (typeof currentQuestion.getOptions === 'function' ? currentQuestion.getOptions(answers) : currentQuestion.options || [])
        : [];
    const progressPercent = ((Math.min(questionIndex + 1, TOTAL_QUESTIONS)) / TOTAL_QUESTIONS) * 100;

    const ownedResultCodex = result ? findOwnedCodex(result.entry.catalog.id) : null;
    const isResultInstalled = Boolean(ownedResultCodex && installedCodexIds.has(ownedResultCodex.id));

    const ensureCampaignInLibrary = useCallback(async (recommendation: CampaignRecommendation): Promise<UserCodex | null> => {
        const existingCodex = findOwnedCodex(recommendation.entry.catalog.id);
        if (existingCodex) {
            setStatusMessage(
                installedCodexIds.has(existingCodex.id)
                    ? 'Essa campanha já está instalada nas suas campanhas.'
                    : 'Campanha adicionada à sua biblioteca. Ela já aparece no menu de Campanhas.',
            );
            return existingCodex;
        }

        if (ensuredCatalogIdsRef.current.has(recommendation.entry.catalog.id)) return null;
        ensuredCatalogIdsRef.current.add(recommendation.entry.catalog.id);
        setIsSyncingLibrary(true);
        setStatusMessage('Adicionando a campanha recomendada à sua biblioteca...');

        try {
            const acquiredCodex = await buyCodex(recommendation.entry.catalog.id);
            const resolvedCodex = acquiredCodex || findOwnedCodex(recommendation.entry.catalog.id);

            if (resolvedCodex) {
                setStatusMessage('Campanha adicionada à sua biblioteca. Ela já aparece no menu de Campanhas.');
                return resolvedCodex;
            }

            setStatusMessage('Não foi possível adicionar essa campanha à biblioteca agora.');
            return null;
        } finally {
            setIsSyncingLibrary(false);
        }
    }, [buyCodex, findOwnedCodex, installedCodexIds]);

    useEffect(() => {
        if (!result) return;
        void ensureCampaignInLibrary(result);
    }, [ensureCampaignInLibrary, result]);

    const handleContinue = () => {
        if (!selectedOption) return;

        const nextAnswers = {
            ...answers,
            [currentQuestion.id]: selectedOption,
        } as QuizAnswers;

        setAnswers(nextAnswers);
        setSelectedOption(null);

        if (questionIndex === TOTAL_QUESTIONS - 1) {
            setResult(resolveRecommendation(nextAnswers, freeCatalog));
            return;
        }

        setQuestionIndex((current) => current + 1);
    };

    const handleInstall = async () => {
        if (!result || isInstalling) return;

        setIsInstalling(true);
        try {
            const ownedCodex = await ensureCampaignInLibrary(result);
            const resolvedCodex = ownedCodex || findOwnedCodex(result.entry.catalog.id);

            if (!resolvedCodex) {
                showToast('Nao foi possivel preparar a campanha para instalacao.', 'warning');
                return;
            }

            if (installedCodexIds.has(resolvedCodex.id)) {
                showToast('Essa campanha ja esta instalada nas suas campanhas.', 'info');
                onClose();
                return;
            }

            await installCodex(resolvedCodex.id);
            onClose();
        } finally {
            setIsInstalling(false);
        }
    };

    return (
        <Portal>
            <div className="campaign-quiz-overlay" onClick={onClose}>
                <div className="campaign-quiz-shell" onClick={(event) => event.stopPropagation()}>
                    <div className="campaign-quiz-header">
                        <div>{String(Math.min(questionIndex + 1, TOTAL_QUESTIONS)).padStart(2, '0')} / 07</div>
                        <div className="campaign-quiz-progress-shell">
                            <div className="campaign-quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div>{result ? 'Resultado' : `Pergunta ${Math.min(questionIndex + 1, TOTAL_QUESTIONS)} de 7`}</div>
                    </div>

                    <div className="campaign-quiz-stage">
                        {!result ? (
                            <section key={currentQuestion.id} className="campaign-quiz-screen">
                                <div className="campaign-quiz-meta">
                                    <div className="campaign-quiz-index">{String(questionIndex + 1).padStart(2, '0')} / 07</div>
                                    <div>Filtro inicial: gratuitas</div>
                                </div>

                                <div className="campaign-quiz-copy">
                                    <h1 className="campaign-quiz-title">{currentQuestion.title}</h1>
                                    <p className="campaign-quiz-subtitle">{currentQuestion.subtitle}</p>
                                </div>

                                <div className={`campaign-quiz-options ${currentOptions.length <= 4 ? 'is-single-column' : ''}`}>
                                    {currentOptions.map((option) => (
                                        <button
                                            key={`${currentQuestion.id}-${option.key}`}
                                            type="button"
                                            onClick={() => setSelectedOption(option.key)}
                                            className={`campaign-quiz-option ${selectedOption === option.key ? 'is-active' : ''}`}
                                        >
                                            <span className="campaign-quiz-letter">{option.key}</span>
                                            <span>
                                                <span className="campaign-quiz-option-main">{option.title}</span>
                                                <span className="campaign-quiz-option-sub">{option.subtitle}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                <div className="campaign-quiz-footer">
                                    {selectedOption && (
                                        <button
                                            type="button"
                                            onClick={handleContinue}
                                            className="luxe-skin-button min-w-[12rem] px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em]"
                                        >
                                            Continuar
                                        </button>
                                    )}
                                </div>
                            </section>
                        ) : (
                            <section className="campaign-quiz-screen">
                                <div className="campaign-quiz-meta">
                                    <div className="campaign-quiz-index">07 / 07</div>
                                    <div>Resultado</div>
                                </div>

                                <div className="campaign-quiz-result">
                                    <h1 className="campaign-quiz-result-title">Sua campanha foi identificada</h1>
                                    <p className="campaign-quiz-result-subtitle">
                                        Com base nas suas respostas, o sistema encontrou a campanha ideal para o seu momento.
                                    </p>

                                    <div className="campaign-quiz-result-name">{result.entry.title}</div>

                                    <div className="campaign-quiz-result-pills">
                                        <span className="campaign-quiz-result-pill">{result.entry.typeLabel}</span>
                                        <span className="campaign-quiz-result-pill">{result.entry.durationDays} dias</span>
                                        <span className="campaign-quiz-result-pill">Gratuita</span>
                                    </div>

                                    <p className="campaign-quiz-result-copy">{result.entry.description}</p>

                                    {result.upgradeNote && (
                                        <div className="campaign-quiz-result-note">{result.upgradeNote}</div>
                                    )}

                                    {statusMessage && (
                                        <div className="campaign-quiz-result-status">{statusMessage}</div>
                                    )}

                                    <div className="campaign-quiz-result-actions">
                                        <button
                                            type="button"
                                            onClick={handleInstall}
                                            disabled={isInstalling || isSyncingLibrary || isResultInstalled}
                                            className="luxe-skin-button w-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isInstalling
                                                ? 'Instalando...'
                                                : isResultInstalled
                                                    ? 'Campanha instalada'
                                                    : 'Instalar Campanha'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="campaign-quiz-secondary w-full px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em]"
                                        >
                                            Ver catálogo completo
                                        </button>
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
