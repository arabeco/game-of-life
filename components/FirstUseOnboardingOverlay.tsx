import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Portal } from './Portal';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { OracleSpeakerMark } from './OracleSpeakerMark';
import { SYSTEM_CHALLENGES } from '../constants/systemChallenges';
import type { OnboardingAgeRange, OnboardingPurpose, OraclePresenceLevel } from '../types';

type AppView = 'assets' | 'arenas' | 'planner' | 'social' | 'settings' | 'reports';

type NavigationDetail = {
  view?: AppView;
  showReports?: boolean;
  showRestScreen?: boolean;
  showArenaId?: string | null;
};

type StepDef = {
  id: string;
  title: string;
  text: string;
  targetSelector?: string;
  navigation?: NavigationDetail;
  autoAdvanceSelector?: string;
  padding?: number;
  hideNext?: boolean;
  final?: boolean;
};

export type OnboardingAnswers = {
  ageRange: OnboardingAgeRange | null;
  purpose: OnboardingPurpose | null;
  oraclePresenceLevel: OraclePresenceLevel | null;
};

// As tres perguntas de primeiro uso. Nenhuma delas muda so texto: as respostas
// vao para o perfil, e a presenca do Oraculo governa quanto ele fala depois.
const AGE_RANGES = [
  { id: 'ate_17' as const, label: 'Ate 17' },
  { id: '18_24' as const, label: '18 a 24' },
  { id: '25_34' as const, label: '25 a 34' },
  { id: '35_49' as const, label: '35 a 49' },
  { id: '50_mais' as const, label: '50+' },
];

const PURPOSES = [
  { id: 'organizar' as const, icon: '\u{1F5C2}', label: 'Organizar a vida', detail: 'Por ordem no que ja existe' },
  { id: 'habitos' as const, icon: '\u{1F331}', label: 'Criar habitos', detail: 'Firmar o que ainda nao pegou' },
  { id: 'objetivo' as const, icon: '\u{1F3AF}', label: 'Perseguir um objetivo', detail: 'Uma coisa que importa agora' },
  { id: 'retomar' as const, icon: '\u{1F9ED}', label: 'Retomar o controle', detail: 'Voltar a um rumo que se perdeu' },
];

const ORACLE_PRESENCES = [
  { id: 1 as const, icon: '\u{1F311}', label: 'Discreta', detail: 'So no que importa' },
  { id: 2 as const, icon: '\u{1F313}', label: 'Equilibrada', detail: 'Marca os momentos' },
  { id: 3 as const, icon: '\u{1F315}', label: 'Presente', detail: 'Acompanha de perto' },
];

const getTargetElement = (selector?: string) => {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
};

const AUTO_TRIGGER_TARGET_STEP_IDS = new Set([
  'cycle-entry',
  'arena-entry',
  'action-entry',
]);

const shouldTriggerTargetOnNext = (step: StepDef | undefined) => {
  if (!step) return false;
  return AUTO_TRIGGER_TARGET_STEP_IDS.has(step.id);
};

const canAdvanceFromStep = (step: StepDef | undefined) => {
  if (!step) return false;
  const target = getTargetElement(step.targetSelector);
  if (step.targetSelector && !target) return false;
  if (!['arena-name', 'action-name'].includes(step.id)) return true;
  const inputTarget = target as HTMLInputElement | HTMLTextAreaElement | null;
  return Boolean(inputTarget?.value?.trim());
};

const defaultNavigation: NavigationDetail = {
  showReports: false,
  showRestScreen: false,
  showArenaId: null,
};

export const FirstUseOnboardingOverlay: React.FC<{
  active: boolean;
  onDismiss: () => void;
  onComplete: (acceptedSystemChallenges: string[], answers: OnboardingAnswers) => void;
}> = ({ active, onDismiss, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [createdArenaId, setCreatedArenaId] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<OnboardingAgeRange | null>(null);
  const [purpose, setPurpose] = useState<OnboardingPurpose | null>(null);
  const [oraclePresenceLevel, setOraclePresenceLevel] = useState<OraclePresenceLevel | null>(null);
  const [selectedMissionIds, setSelectedMissionIds] = useState<string[]>([]);
  const autoAdvanceStepRef = useRef<string | null>(null);
  const currentStepRef = useRef<StepDef | undefined>(undefined);
  const isTypingRef = useRef(false);

  const steps = useMemo<StepDef[]>(() => [
    {
      id: 'age-range',
      title: 'Qual sua faixa etária?',
      text: 'Ajuda a calibrar o ritmo e a linguagem. Fica só no seu perfil.',
      navigation: { view: 'assets', showReports: false, showRestScreen: false, showArenaId: null },
      hideNext: true,
    },
    {
      id: 'purpose',
      title: 'Pra que você quer usar o app?',
      text: 'Não existe resposta errada, e dá pra mudar depois.',
      navigation: { view: 'assets', showReports: false, showRestScreen: false, showArenaId: null },
      hideNext: true,
    },
    {
      id: 'oracle-presence',
      title: 'Quanta presença você quer do Oráculo?',
      text: 'Ele comenta o que você faz. Você decide o quanto.',
      navigation: { view: 'assets', showReports: false, showRestScreen: false, showArenaId: null },
      hideNext: true,
    },
    {
      id: 'arena-entry',
      title: 'Sua primeira arena',
      text: purpose === 'organizar'
        ? 'Comece por uma área só, mesmo querendo organizar tudo. As outras entram depois, sem pressa.'
        : purpose === 'habitos'
          ? 'Escolha a área onde o hábito precisa pegar. Uma de cada vez firma mais rápido.'
          : purpose === 'retomar'
            ? 'Escolha por onde recomeçar. Um ponto claro vale mais que um plano inteiro.'
            : 'Escolha a área que mais importa agora e crie uma arena simples para ela.',
      targetSelector: '#new-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 14,
    },
    {
      id: 'arena-asset',
      title: 'Escolha a área',
      text: 'Em qual parte da vida essa meta vive?',
      targetSelector: '#new-arena-asset-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-name',
      title: 'Dê um nome claro',
      text: 'Use algo que você reconheça de imediato, como Academia, Faculdade ou Família.',
      targetSelector: '#new-arena-name-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-save',
      title: 'Crie a arena',
      text: 'Isso basta por enquanto. Os detalhes podem ser ajustados quando fizerem falta.',
      targetSelector: '#new-arena-submit-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'action-entry',
      title: 'Primeira ação',
      text: 'Agora transforme a arena em algo executável. Toque em Nova ação.',
      targetSelector: '#add-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 14,
    },
    {
      id: 'action-name',
      title: 'O que você vai fazer?',
      text: 'Escreva uma ação concreta, como Treinar, Estudar inglês ou Ligar para meus pais.',
      targetSelector: '#onboarding-action-name-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-reps',
      title: 'Escolha uma meta leve',
      text: 'Quantas vezes você realmente consegue fazer isso em uma semana? Começar menor ajuda a continuar.',
      targetSelector: '#onboarding-action-repetitions',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-save',
      title: 'Salve sua ação',
      text: 'Pronto. Você já tem uma meta que pode cumprir.',
      targetSelector: '#onboarding-action-save-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'cycle-entry',
      title: 'Comece um ciclo curto',
      text: 'Agora dê um prazo para essa meta. Sete dias é um bom primeiro teste.',
      targetSelector: '#start-new-cycle-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 12,
    },
    {
      id: 'cycle-date',
      title: 'Confira o prazo',
      text: 'O primeiro ciclo já vem curto. Ajuste apenas se realmente precisar.',
      targetSelector: '#new-cycle-date-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'cycle-save',
      title: 'Inicie o ciclo',
      text: 'Confirme e comece. O Glyph vai acompanhar seu ritmo sem exigir dias perfeitos.',
      targetSelector: '#new-cycle-submit-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'missions',
      title: 'Quer uma missao para comecar?',
      text: 'Escolha uma ou nenhuma. Ela apenas acompanha o que voce fizer e pode ser abandonada depois.',
      navigation: { view: 'assets', showReports: false, showRestScreen: false, showArenaId: null },
    },
    {
      id: 'finish',
      title: 'Tudo pronto',
      text: purpose === 'organizar'
        ? 'Sua primeira base está viva. Quando ela estiver clara, adicione outras áreas aos poucos.'
        : purpose === 'habitos'
          ? 'O hábito tem onde morar agora. O resto é aparecer e registrar.'
          : purpose === 'retomar'
            ? 'O primeiro ponto está de pé. Recomeçar é isso: um lugar por vez.'
            : 'Seu foco está pronto. Agora basta agir e registrar quando fizer.',
      navigation: { view: 'assets', showReports: false, showRestScreen: false, showArenaId: null },
      final: true,
    },
  ], [createdArenaId, purpose]);

  const stepIndexById = useMemo(() => {
    return steps.reduce<Record<string, number>>((accumulator, currentStep, index) => {
      accumulator[currentStep.id] = index;
      return accumulator;
    }, {});
  }, [steps]);

  const jumpToAtLeast = useCallback((targetStepId: string) => {
    const targetIndex = stepIndexById[targetStepId];
    if (typeof targetIndex !== 'number') return;

    setCurrentStepIndex((previous) => previous >= targetIndex ? previous : targetIndex);
  }, [stepIndexById]);

  const step = active ? steps[currentStepIndex] : undefined;

  const bubblePosition = useMemo(() => {
    if (!spotlightRect) return 'top';
    const screenHeight = window.innerHeight;
    const centerY = spotlightRect.top + spotlightRect.height / 2;
    return centerY < screenHeight * 0.45 ? 'bottom' : 'top';
  }, [spotlightRect]);

  const advanceStep = useCallback(() => {
    setCurrentStepIndex((previous) => {
      let next = previous + 1;
      while (next < steps.length) {
        const candidate = steps[next];
        if (candidate.id === 'action-reps' && !getTargetElement(candidate.targetSelector)) {
          next += 1;
          continue;
        }
        break;
      }
      return Math.min(next, steps.length - 1);
    });
  }, [steps]);

  useEffect(() => {
    if (!active) {
      setCurrentStepIndex(0);
      setSpotlightRect(null);
      setDisplayedText('');
      setIsTyping(false);
      setCreatedArenaId(null);
      setAgeRange(null);
      setPurpose(null);
      setOraclePresenceLevel(null);
      setSelectedMissionIds([]);
      autoAdvanceStepRef.current = null;
      currentStepRef.current = undefined;
      isTypingRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (!active || !step) return;
    const detail = { ...defaultNavigation, ...(step.navigation || {}) };
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('tutorialNavigate', { detail }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active, step]);

  useEffect(() => {
    if (!active || !step) return;

    setDisplayedText('');
    setIsTyping(true);

    const fullText = step.text;
    let charIndex = 0;

    const typingInterval = window.setInterval(() => {
      if (charIndex <= fullText.length) {
        setDisplayedText(fullText.slice(0, charIndex));
        charIndex += 1;
      } else {
        setIsTyping(false);
        window.clearInterval(typingInterval);
      }
    }, 14);

    return () => window.clearInterval(typingInterval);
  }, [active, step?.id, step?.text]);

  useEffect(() => {
    if (!active || !step) return;

    const updateRect = () => {
      const target = getTargetElement(step.targetSelector);
      if (target) {
        setSpotlightRect(target.getBoundingClientRect());
      } else {
        setSpotlightRect(null);
      }

      if (step.autoAdvanceSelector && autoAdvanceStepRef.current !== step.id) {
        const autoTarget = getTargetElement(step.autoAdvanceSelector);
        if (autoTarget) {
          autoAdvanceStepRef.current = step.id;
          window.setTimeout(() => advanceStep(), 220);
        }
      }
    };

    updateRect();
    const interval = window.setInterval(updateRect, 220);
    const observer = new MutationObserver(updateRect);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'open'],
    });

    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, true);

    return () => {
      window.clearInterval(interval);
      observer.disconnect();
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect, true);
    };
  }, [active, step, advanceStep]);

  useEffect(() => {
    if (!active || !step?.targetSelector) return;

    const timer = window.setTimeout(() => {
      const target = getTargetElement(step.targetSelector);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const isFixedTarget = window.getComputedStyle(target).position === 'fixed';
      const isOutOfView = rect.top < 96 || rect.bottom > window.innerHeight - 96;

      if (!isFixedTarget && isOutOfView) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [active, step?.id, step?.targetSelector]);

  useEffect(() => {
    if (!active || !step?.targetSelector) return;
    const revealCurrentStepText = (event: Event) => {
      const liveStep = currentStepRef.current;
      if (!isTypingRef.current || !liveStep?.targetSelector) return;
      if (!(event.target instanceof Element)) return;
      if (!event.target.matches(liveStep.targetSelector) && !event.target.closest(liveStep.targetSelector)) return;
      setDisplayedText(liveStep.text);
      setIsTyping(false);
    };

    document.addEventListener('pointerdown', revealCurrentStepText, true);
    document.addEventListener('focusin', revealCurrentStepText, true);
    document.addEventListener('input', revealCurrentStepText, true);
    document.addEventListener('change', revealCurrentStepText, true);

    return () => {
      document.removeEventListener('pointerdown', revealCurrentStepText, true);
      document.removeEventListener('focusin', revealCurrentStepText, true);
      document.removeEventListener('input', revealCurrentStepText, true);
      document.removeEventListener('change', revealCurrentStepText, true);
    };
  }, [active, step?.id, step?.targetSelector]);

  useEffect(() => {
    if (!active) return;

    const handleCycleSetupOpened = () => {
      jumpToAtLeast('cycle-date');
    };

    const handleCycleNameCompleted = () => {
      jumpToAtLeast('cycle-date');
    };

    const handleCycleEndDateSelected = () => {
      jumpToAtLeast('cycle-save');
    };

    const handleCycleCreated = () => {
      jumpToAtLeast('missions');
    };

    const handleArenaModalOpened = () => {
      window.setTimeout(() => {
        const hasArenaModalTarget = !!getTargetElement('#new-arena-asset-button') || !!getTargetElement('#new-arena-name-input');
        if (hasArenaModalTarget) {
          jumpToAtLeast('arena-asset');
        }
      }, 0);
    };

    const handleArenaAssetSelected = () => {
      jumpToAtLeast('arena-name');
    };

    const handleArenaNameCompleted = () => {
      jumpToAtLeast('arena-save');
    };

    const handleArenaCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ arenaId?: string }>;
      setCreatedArenaId(customEvent.detail?.arenaId || null);
      jumpToAtLeast('action-entry');
      window.setTimeout(() => {
        window.dispatchEvent(new CustomEvent(FIRST_USE_ONBOARDING_EVENTS.requestActionModalOpen));
      }, 320);
    };

    const handleActionModalOpened = () => {
      window.setTimeout(() => {
        const hasActionModalTarget = !!getTargetElement('#onboarding-action-name-input') || !!getTargetElement('#onboarding-action-type-button');
        if (hasActionModalTarget) {
          jumpToAtLeast('action-name');
        }
      }, 0);
    };

    const handleActionNameCompleted = () => {
      window.setTimeout(() => {
        jumpToAtLeast(getTargetElement('#onboarding-action-repetitions') ? 'action-reps' : 'action-save');
      }, 0);
    };

    const handleActionTypeSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionType?: string }>;
      if (customEvent.detail?.actionType === 'Ação Recorrente') {
        jumpToAtLeast('action-reps');
        return;
      }
      jumpToAtLeast('action-save');
    };

    const handleActionRepetitionsAdjusted = () => {
      jumpToAtLeast('action-save');
    };

    const handleActionDurationAdjusted = () => {
      jumpToAtLeast('action-save');
    };

    const handleActionCreated = (event: Event) => {
      jumpToAtLeast('cycle-entry');
    };

    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleSetupOpened, handleCycleSetupOpened as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleNameCompleted, handleCycleNameCompleted as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleEndDateSelected, handleCycleEndDateSelected as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleCreated, handleCycleCreated as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaModalOpened, handleArenaModalOpened as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaAssetSelected, handleArenaAssetSelected as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaNameCompleted, handleArenaNameCompleted as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, handleArenaCreated as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionModalOpened, handleActionModalOpened as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionNameCompleted, handleActionNameCompleted as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionTypeSelected, handleActionTypeSelected as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionRepetitionsAdjusted, handleActionRepetitionsAdjusted as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionDurationAdjusted, handleActionDurationAdjusted as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionCreated, handleActionCreated as EventListener);

    return () => {
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleSetupOpened, handleCycleSetupOpened as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleNameCompleted, handleCycleNameCompleted as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleEndDateSelected, handleCycleEndDateSelected as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleCreated, handleCycleCreated as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaModalOpened, handleArenaModalOpened as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaAssetSelected, handleArenaAssetSelected as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaNameCompleted, handleArenaNameCompleted as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, handleArenaCreated as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionModalOpened, handleActionModalOpened as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionNameCompleted, handleActionNameCompleted as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionTypeSelected, handleActionTypeSelected as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionRepetitionsAdjusted, handleActionRepetitionsAdjusted as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionDurationAdjusted, handleActionDurationAdjusted as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionCreated, handleActionCreated as EventListener);
    };
  }, [active, jumpToAtLeast]);

  const handleDismiss = useCallback(() => {
    window.dispatchEvent(new CustomEvent('tutorialNavigate', { detail: { ...defaultNavigation, view: 'assets' } }));
    onDismiss();
  }, [onDismiss]);

  // Escolher ja avanca: sao perguntas de uma resposta so, e um botao Proximo
  // depois da escolha seria um clique a mais sem nada para decidir nele.
  const handleAnswerAndAdvance = useCallback((apply: () => void) => {
    apply();
    setDisplayedText(currentStepRef.current?.text || '');
    setIsTyping(false);
    window.setTimeout(() => advanceStep(), 180);
  }, [advanceStep]);

  const handleNext = useCallback(() => {
    if (!step) return;

    if (step.final) {
      onComplete(selectedMissionIds, { ageRange, purpose, oraclePresenceLevel });
      return;
    }

    if (isTyping) {
      setDisplayedText(step.text);
      setIsTyping(false);
      if (!shouldTriggerTargetOnNext(step)) return;
    }

    if (!canAdvanceFromStep(step)) return;

    if (shouldTriggerTargetOnNext(step)) {
      const target = getTargetElement(step.targetSelector);
      target?.click();
      return;
    }

    advanceStep();
  }, [advanceStep, ageRange, isTyping, onComplete, oraclePresenceLevel, purpose, selectedMissionIds, step]);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleDismiss();
        return;
      }
      if ((event.key === 'Enter' || event.key === ' ') && !step?.hideNext) {
        event.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, handleDismiss, handleNext, step?.hideNext]);

  if (!active || !step) return null;

  const canAdvance = canAdvanceFromStep(step);
  const padding = step.padding ?? 12;
  const progress = `${currentStepIndex + 1} / ${steps.length}`;
  const nextLabel = step.final
    ? 'Concluir'
    : shouldTriggerTargetOnNext(step)
      ? 'Abrir'
      : 'Próximo';
  const helperText = step.hideNext
    ? step.id === 'start-style'
      ? 'Não existe escolha errada. Você pode mudar de abordagem quando quiser.'
      : step.id === 'arena-save'
      ? 'Crie a arena e eu já sigo para a próxima etapa.'
      : step.id === 'action-save'
        ? 'Salve a ação no app que eu acompanho sem te travar.'
        : step.autoAdvanceSelector
          ? 'Toque no destaque e eu pulo junto para o próximo passo.'
          : 'Salve no app para eu seguir sozinho.'
    : step.id === 'arena-entry'
      ? 'Se tocar em Abrir, eu aciono o botão + por você.'
      : step.id === 'action-entry'
        ? 'Se tocar em Abrir, eu aciono Nova ação por você.'
        : step.id === 'cycle-entry'
                          ? 'Se tocar em Abrir, eu levo você direto para o ciclo.'
        : step.id === 'action-name' && !canAdvance
          ? 'Preencha o título para liberar o próximo passo.'
          : 'Se você adiantar alguma etapa, eu acompanho.';

  return (
    <Portal>
      <div className="fixed inset-0 z-[21000] pointer-events-none">
        <div
          className="absolute inset-0 bg-black/16 transition-all duration-500"
          style={{
            maskImage: spotlightRect
              ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.45 + 28}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
              : 'none',
            WebkitMaskImage: spotlightRect
              ? `radial-gradient(circle ${Math.max(spotlightRect.width, spotlightRect.height) / 1.45 + 28}px at ${spotlightRect.left + spotlightRect.width / 2}px ${spotlightRect.top + spotlightRect.height / 2}px, transparent 100%, black 100%)`
              : 'none',
          } as React.CSSProperties}
        />

        {spotlightRect && (
          <div
            className="absolute rounded-xl border border-[#f3d48a]/80 shadow-[0_0_24px_rgba(250,204,21,0.28)] pointer-events-none transition-all duration-300"
            style={{
              left: spotlightRect.left - padding,
              top: spotlightRect.top - padding,
              width: spotlightRect.width + padding * 2,
              height: spotlightRect.height + padding * 2,
            }}
          >
            <div className="absolute -top-1 -left-1 h-3 w-3 border-l-2 border-t-2 border-[#ffe9b0]" />
            <div className="absolute -top-1 -right-1 h-3 w-3 border-r-2 border-t-2 border-[#ffe9b0]" />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-[#ffe9b0]" />
            <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-[#ffe9b0]" />
          </div>
        )}

        <div className={`absolute left-0 right-0 flex justify-center px-4 transition-all duration-500 ${bubblePosition === 'top' ? 'top-4 md:top-10' : 'bottom-8 md:bottom-16'}`}>
          <div className="w-full max-w-[min(540px,94vw)] pointer-events-auto animate-fade-in-down">
            <div className="relative overflow-hidden rounded-[22px] border border-[#f3d48a]/35 bg-[linear-gradient(180deg,rgba(19,16,13,0.96),rgba(8,8,9,0.97))] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
              <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.18),transparent_70%)] pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#f3d48a]/60 to-transparent pointer-events-none" />

              <div className="flex gap-4 p-4 md:p-5">
                <div className="flex-shrink-0">
                  <OracleSpeakerMark tone="guide" size="md" badge className="md:hidden" />
                  <OracleSpeakerMark tone="guide" size="lg" badge className="hidden md:flex" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#f3d48a]/25 bg-[#f3d48a]/10 px-2 py-1 text-[8px] font-black tracking-[0.22em] text-[#f3d48a] md:text-[10px]">
                          INICIO
                        </span>
                        <span className="text-[9px] uppercase tracking-[0.16em] text-gray-500 md:text-[10px]">
                          {progress}
                        </span>
                      </div>
                      <h3 id="first-use-onboarding-title" className="text-[10px] font-bold uppercase leading-tight tracking-[0.16em] text-[#f6dfab] md:text-sm">
                        {step.title}
                      </h3>
                    </div>

                    <button
                      onClick={handleDismiss}
                      className="shrink-0 px-1 text-[10px] uppercase tracking-[0.18em] text-gray-500 transition-colors hover:text-white"
                    >
                      X
                    </button>
                  </div>

                  <p className="whitespace-pre-wrap text-[12px] leading-[1.45] text-gray-100/92 md:text-[15px] md:leading-[1.6]">
                    {displayedText}
                    {isTyping && <span className="ml-1 inline-block h-3 w-1 animate-pulse align-middle bg-[#f3d48a] opacity-80 md:h-4 md:w-1.5" />}
                  </p>

                  {step.id === 'age-range' && (
                    <div className="mt-3 grid grid-cols-5 gap-1.5">
                      {AGE_RANGES.map(option => (
                        <button
                          key={option.id}
                          id={`onboarding-age-${option.id}`}
                          type="button"
                          onClick={() => handleAnswerAndAdvance(() => setAgeRange(option.id))}
                          className={`min-w-0 rounded-xl border px-1 py-3 text-center transition-all active:scale-[0.98] ${
                            ageRange === option.id
                              ? 'border-[#f3d48a]/70 bg-[#f3d48a]/18 text-[#fff0c7]'
                              : 'border-white/10 bg-white/[0.04] text-white/74 hover:border-[#f3d48a]/35 hover:bg-[#f3d48a]/8'
                          }`}
                        >
                          <span className="block text-[9px] font-black uppercase tracking-[0.04em] md:text-[10px]">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {step.id === 'purpose' && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {PURPOSES.map(option => (
                        <button
                          key={option.id}
                          id={`onboarding-purpose-${option.id}`}
                          type="button"
                          onClick={() => handleAnswerAndAdvance(() => setPurpose(option.id))}
                          className={`min-w-0 rounded-xl border px-2 py-3 text-left transition-all active:scale-[0.98] ${
                            purpose === option.id
                              ? 'border-[#f3d48a]/70 bg-[#f3d48a]/18 text-[#fff0c7]'
                              : 'border-white/10 bg-white/[0.04] text-white/74 hover:border-[#f3d48a]/35 hover:bg-[#f3d48a]/8'
                          }`}
                        >
                          <span className="block text-lg leading-none">{option.icon}</span>
                          <span className="mt-2 block text-[9px] font-black uppercase tracking-[0.08em] md:text-[10px]">{option.label}</span>
                          <span className="mt-1 block text-[8px] text-white/42 md:text-[9px]">{option.detail}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {step.id === 'oracle-presence' && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {ORACLE_PRESENCES.map(option => (
                        <button
                          key={option.id}
                          id={`onboarding-oracle-${option.id}`}
                          type="button"
                          onClick={() => handleAnswerAndAdvance(() => setOraclePresenceLevel(option.id))}
                          className={`min-w-0 rounded-xl border px-2 py-3 text-center transition-all active:scale-[0.98] ${
                            oraclePresenceLevel === option.id
                              ? 'border-[#f3d48a]/70 bg-[#f3d48a]/18 text-[#fff0c7]'
                              : 'border-white/10 bg-white/[0.04] text-white/74 hover:border-[#f3d48a]/35 hover:bg-[#f3d48a]/8'
                          }`}
                        >
                          <span className="block text-lg leading-none">{option.icon}</span>
                          <span className="mt-2 block text-[9px] font-black uppercase tracking-[0.08em] md:text-[10px]">{option.label}</span>
                          <span className="mt-1 block text-[8px] text-white/42 md:text-[9px]">{option.detail}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {step.id === 'missions' && (
                    <div className="mt-3 space-y-2">
                      {SYSTEM_CHALLENGES.slice(0, 3).map((mission) => {
                        const selected = selectedMissionIds.includes(mission.id);
                        return (
                          <button
                            key={mission.id}
                            type="button"
                            onClick={() => setSelectedMissionIds(selected ? [] : [mission.id])}
                            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99] ${selected
                              ? 'border-[#f3d48a]/65 bg-[#f3d48a]/14'
                              : 'border-white/10 bg-white/[0.035] hover:border-[#f3d48a]/30'}`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/25 text-lg">{mission.actionTemplate.icon}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[10px] font-black uppercase tracking-[0.08em] text-white/88">{mission.title}</span>
                              <span className="mt-0.5 block text-[9px] text-white/48">+{mission.rewardGold || 0} ouro</span>
                            </span>
                            <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${selected ? 'border-[#f3d48a] bg-[#f3d48a] text-black' : 'border-white/20 text-transparent'}`}>OK</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => setSelectedMissionIds([])}
                        className={`w-full rounded-xl border px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] transition ${selectedMissionIds.length === 0
                          ? 'border-white/25 bg-white/[0.08] text-white/78'
                          : 'border-white/8 bg-transparent text-white/38 hover:text-white/65'}`}
                      >
                        Nenhuma por enquanto
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="text-[9px] tracking-[0.08em] text-gray-500 md:text-[11px]">
                      {helperText}
                    </div>

                    {!step.hideNext && (
                      <button
                        id="first-use-onboarding-next"
                        onClick={handleNext}
                        disabled={!canAdvance}
                        className="shrink-0 rounded-full border border-[#f3d48a]/35 bg-[#f3d48a]/12 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#f6dfab] transition hover:bg-[#f3d48a]/20 disabled:opacity-40 disabled:hover:bg-[#f3d48a]/12 md:text-[11px]"
                      >
                        {nextLabel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Portal>
  );
};
