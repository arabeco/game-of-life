import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Portal } from './Portal';
import { FIRST_USE_ONBOARDING_EVENTS } from '../utils/firstUseOnboarding';

const ORACLE_GRADIENT_ID = 'first-use-onboarding-oracle-gradient';

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
  waitForEvent?: string;
  padding?: number;
  hideNext?: boolean;
  final?: boolean;
};

const OracleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4Z" fill={`url(#${ORACLE_GRADIENT_ID})`} fillOpacity="0.2" />
    <path d="M12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z" fill={`url(#${ORACLE_GRADIENT_ID})`} />
    <defs>
      <linearGradient id={ORACLE_GRADIENT_ID} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFD700" />
        <stop offset="1" stopColor="#FF8C00" />
      </linearGradient>
    </defs>
  </svg>
);

const getTargetElement = (selector?: string) => {
  if (!selector) return null;
  return document.querySelector(selector) as HTMLElement | null;
};

const canAdvanceFromStep = (step: StepDef | undefined) => {
  if (!step) return false;
  if (step.id !== 'action-name') return true;
  const target = getTargetElement(step.targetSelector) as HTMLInputElement | null;
  return Boolean(target?.value?.trim());
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
  const [, setInteractionTick] = useState(0);
  const [createdArenaId, setCreatedArenaId] = useState<string | null>(null);
  const [createdActionId, setCreatedActionId] = useState<string | null>(null);
  const autoAdvanceStepRef = useRef<string | null>(null);
  const currentStepIndexRef = useRef(0);
  const currentStepRef = useRef<StepDef | undefined>(undefined);
  const isTypingRef = useRef(false);

  const steps = useMemo<StepDef[]>(() => [
    {
      id: 'cycle-entry',
      title: 'Primeiro ciclo',
      text: 'Seu historico ainda esta vazio. Comece por aqui e abra o setup do seu primeiro ciclo real.',
      targetSelector: '#start-new-cycle-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      autoAdvanceSelector: '#new-cycle-name-input',
      padding: 12,
    },
    {
      id: 'cycle-name',
      title: 'Nomeie a fase',
      text: 'De um nome simples para essa fase. Pense em uma janela curta, clara e executavel.',
      targetSelector: '#new-cycle-name-input',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'cycle-date',
      title: 'Escolha a data final',
      text: 'Aqui voce define quando esse ciclo fecha. O calendario segura o ritmo da fase.',
      targetSelector: '#new-cycle-date-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'cycle-save',
      title: 'Inicie o ciclo',
      text: 'Quando estiver bom, confirme aqui. Assim o seu primeiro ciclo ja nasce como dado real.',
      targetSelector: '#new-cycle-submit-button',
      navigation: { view: 'planner', showReports: true, showRestScreen: false, showArenaId: null },
      waitForEvent: FIRST_USE_ONBOARDING_EVENTS.cycleCreated,
      hideNext: true,
      padding: 12,
    },
    {
      id: 'arena-entry',
      title: 'Crie sua primeira arena',
      text: 'Agora vamos abrir a primeira frente real da sua vida. Toque no botao + no canto inferior direito para criar uma Arena.',
      targetSelector: '#new-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      autoAdvanceSelector: '#new-arena-asset-button',
      padding: 14,
    },
    {
      id: 'arena-asset',
      title: 'Ativo pai',
      text: 'Aqui voce escolhe o ativo pai da arena. E uma forma de dizer em qual dominio essa frente mora.',
      targetSelector: '#new-arena-asset-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 10,
    },
    {
      id: 'arena-name',
      title: 'Nome da arena',
      text: 'Diga o nome da frente. Nao precisa ser perfeito. Clareza vale mais do que sofisticacao.',
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
      waitForEvent: FIRST_USE_ONBOARDING_EVENTS.arenaCreated,
      hideNext: true,
      padding: 12,
    },
    {
      id: 'action-entry',
      title: 'Primeira acao',
      text: 'Perfeito. Sua arena abriu. Agora toque em Nova acao dentro dela para criar a primeira acao real.',
      targetSelector: '#add-action-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      autoAdvanceSelector: '#onboarding-action-name-input',
      padding: 14,
    },
    {
      id: 'action-name',
      title: 'Titulo da acao',
      text: 'Comece pelo titulo. Esse e o unico ponto realmente obrigatorio agora. O resto pode ser ajustado sem pressa.',
      targetSelector: '#onboarding-action-name-input',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-type',
      title: 'Tipo da acao',
      text: 'Aqui voce escolhe o formato da acao. Pode tocar e experimentar, ou seguir para frente quando entender a logica.',
      targetSelector: '#onboarding-action-type-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-reps',
      title: 'Repeticoes',
      text: 'Se a acao for recorrente, ajuste quantas repeticoes ela pede. Se nao for o caso, eu pulo esse passo.',
      targetSelector: '#onboarding-action-repetitions',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-duration',
      title: 'Duracao base',
      text: 'Defina uma duracao base simples. Ela ajuda o planner a estimar carga sem complicar seu fluxo.',
      targetSelector: '#onboarding-action-duration',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      padding: 10,
    },
    {
      id: 'action-save',
      title: 'Salvar acao',
      text: 'Quando estiver pronta, confirme aqui. Eu levo voce para o planner assim que a acao for criada.',
      targetSelector: '#onboarding-action-save-button',
      navigation: { view: 'arenas', showReports: false, showRestScreen: false, showArenaId: createdArenaId || 'first' },
      waitForEvent: FIRST_USE_ONBOARDING_EVENTS.actionCreated,
      hideNext: true,
      padding: 12,
    },
    {
      id: 'planner-pool',
      title: 'Planner',
      text: 'Sua primeira acao agora aparece pronta para uso. Voce pode arrastar para agendar ou segurar para concluir no fluxo do dia.',
      targetSelector: createdActionId ? `[data-action-id="${createdActionId}"]` : '#planner-pool',
      navigation: { view: 'planner', showReports: false, showRestScreen: false, showArenaId: null },
      padding: 14,
    },
    {
      id: 'rest-entry',
      title: 'Tela de descanso',
      text: 'Esse atalho abre a tela de descanso. Toque aqui quando quiser entrar no Painel Diario do agora.',
      targetSelector: '#lock-icon-button',
      navigation: { view: 'planner', showReports: false, showRestScreen: false, showArenaId: null },
      autoAdvanceSelector: '#sitrep-embedded-card',
      padding: 12,
    },
    {
      id: 'sitrep-card',
      title: 'Painel Diario',
      text: 'Aqui voce acompanha o dia de hoje. Nao precisa mexer em tudo agora. O importante e saber onde o fluxo diario mora e como destravar essa camada quando quiser agir.',
      targetSelector: '#sitrep-embedded-card',
      navigation: { view: 'planner', showReports: false, showRestScreen: true, showArenaId: null },
      padding: 14,
    },
    {
      id: 'finish',
      title: 'Base pronta',
      text: 'Sua base inicial esta pronta. Voce ja pode comecar por esta tela. Se quiser revisar o resto depois, o tutorial continua em Configuracoes > Tutoriais.',
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

  const interactionStepTargets = useMemo(() => [
    { selector: '#start-new-cycle-button', stepId: 'cycle-entry' },
    { selector: '#new-cycle-name-input', stepId: 'cycle-name' },
    { selector: '#new-cycle-date-button', stepId: 'cycle-date' },
    { selector: '#new-cycle-submit-button', stepId: 'cycle-save' },
    { selector: '#new-action-button', stepId: 'arena-entry' },
    { selector: '[data-onboarding-id="new-arena-button"]', stepId: 'arena-entry' },
    { selector: '#new-arena-asset-button', stepId: 'arena-asset' },
    { selector: '#new-arena-name-input', stepId: 'arena-name' },
    { selector: '#new-arena-description-input', stepId: 'arena-description' },
    { selector: '#new-arena-submit-button', stepId: 'arena-save' },
    { selector: '#add-action-button', stepId: 'action-entry' },
    { selector: '#onboarding-action-name-input', stepId: 'action-name' },
    { selector: '#onboarding-action-type-button', stepId: 'action-type' },
    { selector: '#onboarding-action-repetitions', stepId: 'action-reps' },
    { selector: '#onboarding-action-duration', stepId: 'action-duration' },
    { selector: '#onboarding-action-save-button', stepId: 'action-save' },
    { selector: '#planner-pool', stepId: 'planner-pool' },
    { selector: '#lock-icon-button', stepId: 'rest-entry' },
    { selector: '#sitrep-embedded-card', stepId: 'sitrep-card' },
  ], []);

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
      setInteractionTick(0);
      setCreatedArenaId(null);
      setCreatedActionId(null);
      autoAdvanceStepRef.current = null;
      currentStepIndexRef.current = 0;
      currentStepRef.current = undefined;
      isTypingRef.current = false;
    }
  }, [active]);

  useEffect(() => {
    currentStepIndexRef.current = currentStepIndex;
  }, [currentStepIndex]);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  useEffect(() => {
    isTypingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    if (!active || !step) return;
    const detail = { ...defaultNavigation, ...(step.navigation || {}) };
    window.dispatchEvent(new CustomEvent('tutorialNavigate', { detail }));
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
    const target = getTargetElement(step.targetSelector);
    if (!target) return;

    const bump = () => setInteractionTick((value) => value + 1);
    target.addEventListener('input', bump);
    target.addEventListener('change', bump);
    target.addEventListener('blur', bump);
    target.addEventListener('click', bump);

    return () => {
      target.removeEventListener('input', bump);
      target.removeEventListener('change', bump);
      target.removeEventListener('blur', bump);
      target.removeEventListener('click', bump);
    };
  }, [active, step?.id, step?.targetSelector]);

  useEffect(() => {
    if (!active || !step?.waitForEvent) return;

    const handleEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ arenaId?: string; actionId?: string }>;
      if (step.waitForEvent === FIRST_USE_ONBOARDING_EVENTS.arenaCreated) {
        setCreatedArenaId(customEvent.detail?.arenaId || null);
      }
      if (step.waitForEvent === FIRST_USE_ONBOARDING_EVENTS.actionCreated) {
        setCreatedActionId(customEvent.detail?.actionId || null);
      }
      advanceStep();
    };

    window.addEventListener(step.waitForEvent, handleEvent as EventListener);
    return () => window.removeEventListener(step.waitForEvent, handleEvent as EventListener);
  }, [active, step?.id, step?.waitForEvent, advanceStep]);

  useEffect(() => {
    if (!active) return;

    const handleCycleCreated = () => {
      jumpToAtLeast('arena-entry');
    };

    const handleArenaCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ arenaId?: string }>;
      setCreatedArenaId(customEvent.detail?.arenaId || null);
      jumpToAtLeast('action-entry');
    };

    const handleActionCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>;
      setCreatedActionId(customEvent.detail?.actionId || null);
      jumpToAtLeast('planner-pool');
    };

    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleCreated, handleCycleCreated as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, handleArenaCreated as EventListener);
    window.addEventListener(FIRST_USE_ONBOARDING_EVENTS.actionCreated, handleActionCreated as EventListener);

    return () => {
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.cycleCreated, handleCycleCreated as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.arenaCreated, handleArenaCreated as EventListener);
      window.removeEventListener(FIRST_USE_ONBOARDING_EVENTS.actionCreated, handleActionCreated as EventListener);
    };
  }, [active, jumpToAtLeast]);

  useEffect(() => {
    if (!active) return;

    const resolveTargetStepId = (rawTarget: EventTarget | null) => {
      if (!(rawTarget instanceof Element)) return null;

      let resolvedStepId: string | null = null;
      let resolvedIndex = -1;

      interactionStepTargets.forEach(({ selector, stepId }) => {
        const stepIndex = stepIndexById[stepId];
        if (typeof stepIndex !== 'number') return;
        if (!rawTarget.matches(selector) && !rawTarget.closest(selector)) return;

        if (stepIndex > resolvedIndex) {
          resolvedIndex = stepIndex;
          resolvedStepId = stepId;
        }
      });

      return resolvedStepId;
    };

    const syncProgressFromInteraction = (event: Event) => {
      const resolvedStepId = resolveTargetStepId(event.target);
      if (!resolvedStepId) return;

      const targetIndex = stepIndexById[resolvedStepId];
      const currentIndex = currentStepIndexRef.current;

      if (targetIndex > currentIndex) {
        jumpToAtLeast(resolvedStepId);
        return;
      }

      const liveStep = currentStepRef.current;
      if (isTypingRef.current && liveStep && liveStep.id === resolvedStepId) {
        setDisplayedText(liveStep.text);
        setIsTyping(false);
      }
    };

    document.addEventListener('pointerdown', syncProgressFromInteraction, true);
    document.addEventListener('focusin', syncProgressFromInteraction, true);
    document.addEventListener('input', syncProgressFromInteraction, true);
    document.addEventListener('change', syncProgressFromInteraction, true);

    return () => {
      document.removeEventListener('pointerdown', syncProgressFromInteraction, true);
      document.removeEventListener('focusin', syncProgressFromInteraction, true);
      document.removeEventListener('input', syncProgressFromInteraction, true);
      document.removeEventListener('change', syncProgressFromInteraction, true);
    };
  }, [active, interactionStepTargets, jumpToAtLeast, stepIndexById]);

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
      return;
    }

    if (!canAdvanceFromStep(step)) return;
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
  const helperText = step.hideNext
    ? step.id === 'arena-save'
      ? 'Crie a arena e eu ja sigo para a proxima etapa.'
      : step.id === 'action-save'
        ? 'Salve a acao no app que eu acompanho sem te travar.'
        : step.autoAdvanceSelector
          ? 'Toque no destaque e eu pulo junto para o proximo passo.'
          : 'Salve no app para eu seguir sozinho.'
    : step.id === 'arena-entry'
      ? 'Procure o botao + no canto inferior direito.'
      : step.id === 'action-entry'
        ? 'Abra a arena e toque em Nova acao para eu continuar com voce.'
        : step.id === 'action-name' && !canAdvance
          ? 'Preencha o titulo para liberar o proximo passo.'
          : 'Se voce adiantar alguma etapa, eu acompanho.';

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
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#f3d48a]/50 bg-gradient-to-br from-[#2d261c] to-black shadow-[0_0_24px_rgba(255,215,0,0.16)] md:h-16 md:w-16">
                    <OracleIcon className="h-6 w-6 animate-pulse-slow md:h-10 md:w-10" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-[#f3d48a]/25 bg-[#f3d48a]/10 px-2 py-1 text-[8px] font-black tracking-[0.22em] text-[#f3d48a] md:text-[10px]">
                          ONBOARDING
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
                        {step.final ? 'Concluir' : 'Proximo'}
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
