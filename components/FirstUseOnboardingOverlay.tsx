import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Portal } from './Portal';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';
import { OracleSpeakerMark } from './OracleSpeakerMark';

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

const getTargetElement = (selector?: string) => {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
};

const AUTO_TRIGGER_TARGET_STEP_IDS = new Set([
  'cycle-entry',
  'arena-entry',
  'action-entry',
  'rest-entry',
]);

const shouldTriggerTargetOnNext = (step: StepDef | undefined) => {
  if (!step) return false;
  return AUTO_TRIGGER_TARGET_STEP_IDS.has(step.id);
};

const canAdvanceFromStep = (step: StepDef | undefined) => {
  if (!step) return false;
  const target = getTargetElement(step.targetSelector);
  if (step.targetSelector && !target) return false;
  if (!['cycle-name', 'arena-name', 'action-name'].includes(step.id)) return true;
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
  onComplete: () => void;
}> = ({ active, onDismiss, onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [createdArenaId, setCreatedArenaId] = useState<string | null>(null);
  const [createdActionId, setCreatedActionId] = useState<string | null>(null);
  const autoAdvanceStepRef = useRef<string | null>(null);
  const currentStepRef = useRef<StepDef | undefined>(undefined);
  const isTypingRef = useRef(false);

  const steps = useMemo<StepDef[]>(() => [
    {
      id: 'cycle-entry',
      title: 'Primeiro ciclo',
      text: 'Seu histórico ainda está vazio. Comece por aqui e abra o setup do seu primeiro ciclo real.',
      targetSelector: '#start-new-cycle-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 12,
    },
    {
      id: 'cycle-name',
      title: 'Nomeie a fase',
      text: 'Dê um nome simples para essa fase. Pense em uma janela curta, clara e executável.',
      targetSelector: '#new-cycle-name-input',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'cycle-date',
      title: 'Escolha a data final',
      text: 'Aqui você define quando esse ciclo fecha. O calendário segura o ritmo da fase.',
      targetSelector: '#new-cycle-date-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'cycle-save',
      title: 'Inicie o ciclo',
      text: 'Quando estiver bom, confirme aqui. Assim o seu primeiro ciclo já nasce como dado real.',
      targetSelector: '#new-cycle-submit-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'arena-entry',
      title: 'Crie sua primeira arena',
      text: 'Agora vamos abrir a primeira frente real da sua vida. Toque no botão + no canto inferior direito para criar uma Arena.',
      targetSelector: '#new-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 14,
    },
    {
      id: 'arena-asset',
      title: 'Ativo pai',
      text: 'Aqui você escolhe o ativo pai da arena. É uma forma de dizer em qual domínio essa frente mora.',
      targetSelector: '#new-arena-asset-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-name',
      title: 'Nome da arena',
      text: 'Diga o nome da frente. Não precisa ser perfeito. Clareza vale mais do que sofisticação.',
      targetSelector: '#new-arena-name-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-description',
      title: 'Meta da arena',
      text: 'Se quiser, descreva a meta em uma frase. Os extras podem ser refinados depois.',
      targetSelector: '#new-arena-description-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-save',
      title: 'Criar arena',
      text: 'Quando fizer sentido, confirme aqui. Eu sigo sozinho assim que a arena nascer.',
      targetSelector: '#new-arena-submit-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'action-entry',
      title: 'Primeira ação',
      text: 'Perfeito. Sua arena abriu. Agora toque em Nova ação dentro dela para criar a primeira ação real.',
      targetSelector: '#add-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 14,
    },
    {
      id: 'action-name',
      title: 'Título da ação',
      text: 'Comece pelo título. Esse é o único ponto realmente obrigatório agora. O resto pode ser ajustado sem pressa.',
      targetSelector: '#onboarding-action-name-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-type',
      title: 'Tipo da ação',
      text: 'Aqui você escolhe o formato da ação. Pode tocar e experimentar, ou seguir para frente quando entender a lógica.',
      targetSelector: '#onboarding-action-type-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-reps',
      title: 'Repetições',
      text: 'Se a ação for recorrente, ajuste quantas repetições ela pede. Se não for o caso, eu pulo esse passo.',
      targetSelector: '#onboarding-action-repetitions',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-duration',
      title: 'Duração base',
      text: 'Defina uma duração base simples. Ela ajuda o planner a estimar carga sem complicar seu fluxo.',
      targetSelector: '#onboarding-action-duration',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-save',
      title: 'Salvar ação',
      text: 'Quando estiver pronta, confirme aqui. Eu levo você para o planner assim que a ação for criada.',
      targetSelector: '#onboarding-action-save-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      hideNext: true,
      padding: 12,
    },
    {
      id: 'planner-pool',
      title: 'Planner',
      text: 'Sua primeira ação agora aparece pronta para uso. Você pode arrastar para agendar ou segurar para concluir no fluxo do dia.',
      targetSelector: createdActionId ? `[data-action-id="${createdActionId}"]` : '#planner-pool',
      navigation: { view: 'planner', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 14,
    },
    {
      id: 'rest-entry',
      title: 'Tela de descanso',
      text: 'Esse atalho abre a tela de descanso. Toque aqui quando quiser ver o resumo do agora.',
      targetSelector: '#lock-icon-button',
      navigation: { view: 'planner', showReports: false, showRestScreen: false, showArenaId: null },
      autoAdvanceSelector: '#sitrep-embedded-card',
      padding: 12,
    },
    {
      id: 'sitrep-card',
      title: 'Resumo Diario',
      text: 'Aqui voce acompanha o que foi feito no dia e como isso entra no ciclo. Nao e uma tela para travar metas; e uma leitura rapida do seu padrao.',
      targetSelector: '#sitrep-embedded-card',
      navigation: { view: 'planner', showReports: false, showRestScreen: true, showArenaId: null },
      padding: 14,
    },
    {
      id: 'finish',
      title: 'Base pronta',
      text: 'Sua base inicial esta pronta. Voce ja pode comecar por esta tela.\n\nEm Configuracoes > Tutoriais, os cards 1 e 2 mostram o uso principal. Em Configuracoes > Preferencias, o Modo Jogo libera tambem os cards 3 e 4 com progresso, mundo e recursos extras.',
      navigation: { view: 'planner', showReports: false, showRestScreen: true, showArenaId: null },
      final: true,
    },
  ], [createdActionId, createdArenaId]);

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
      setCreatedActionId(null);
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
      jumpToAtLeast('cycle-name');
    };

    const handleCycleNameCompleted = () => {
      jumpToAtLeast('cycle-date');
    };

    const handleCycleEndDateSelected = () => {
      jumpToAtLeast('cycle-save');
    };

    const handleCycleCreated = () => {
      jumpToAtLeast('arena-entry');
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
      jumpToAtLeast('arena-description');
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
      jumpToAtLeast('action-type');
    };

    const handleActionTypeSelected = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionType?: string }>;
      if (customEvent.detail?.actionType === 'Ação Recorrente') {
        jumpToAtLeast('action-reps');
        return;
      }
      jumpToAtLeast('action-duration');
    };

    const handleActionRepetitionsAdjusted = () => {
      jumpToAtLeast('action-duration');
    };

    const handleActionDurationAdjusted = () => {
      jumpToAtLeast('action-save');
    };

    const handleActionCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      setCreatedActionId(customEvent.detail?.actionId || null);
      jumpToAtLeast('planner-pool');
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
    window.dispatchEvent(new CustomEvent('tutorialNavigate', { detail: { ...defaultNavigation, view: 'planner' } }));
    onDismiss();
  }, [onDismiss]);

  const handleNext = useCallback(() => {
    if (!step) return;

    if (step.final) {
      onComplete();
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
  }, [advanceStep, isTyping, onComplete, step]);

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
    ? step.id === 'arena-save'
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
          ? 'Se tocar em Abrir, eu levo você direto para o setup do ciclo.'
          : step.id === 'rest-entry'
            ? 'Se tocar em Abrir, eu abro a tela de descanso por você.'
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
