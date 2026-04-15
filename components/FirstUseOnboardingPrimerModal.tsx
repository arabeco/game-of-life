import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, PlayCircle } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { Portal } from './Portal';

type PrimerStep = {
  id: string;
  title: string;
  text: string;
  videoSrc?: string;
  accentLabel: string;
};

interface FirstUseOnboardingPrimerModalProps {
  open: boolean;
  onClose: () => void;
  onStartGuidedOnboarding?: () => void;
  primaryLabel?: string;
  headerTitle?: string;
  headerSummary?: string;
}

const PRIMER_STEPS: PrimerStep[] = [
  {
    id: 'cycle',
    title: 'Crie seu ciclo',
    text: 'Abra a fase que vai segurar seus proximos dias. O ciclo e a moldura da execucao.',
    videoSrc: '/videos/onboarding/criar-ciclo.mp4',
    accentLabel: 'Passo 1',
  },
  {
    id: 'arena',
    title: 'Crie uma arena',
    text: 'Escolha a frente da sua vida que voce quer puxar agora e transforme isso em territorio jogavel.',
    videoSrc: '/videos/onboarding/criar-arena.mp4',
    accentLabel: 'Passo 2',
  },
  {
    id: 'action',
    title: 'Crie uma acao',
    text: 'Defina o que voce realmente vai fazer. Pode ser com alvo ou livre, sem travar seu jeito de usar.',
    videoSrc: '/videos/onboarding/criar-acao.mp4',
    accentLabel: 'Passo 3',
  },
  {
    id: 'planner',
    title: 'Leve para o Planner',
    text: 'Arraste a acao para um horario. E aqui que o dia deixa de ser intencao e vira grade viva.',
    videoSrc: '/videos/onboarding/colocar-no-planner.mp4',
    accentLabel: 'Passo 4',
  },
  {
    id: 'bay-area',
    title: 'Complete pela Bay Area',
    text: 'Quando fizer, registre por ali. O fluxo do dia continua sem te obrigar a abrir mil telas.',
    videoSrc: '/videos/onboarding/completar-bay-area.mp4',
    accentLabel: 'Passo 5',
  },
  {
    id: 'undo',
    title: 'Segure para desfazer',
    text: 'Se marcou sem querer, segure a tarefa concluida e devolva para a Bay Area sem baguncar o dia.',
    videoSrc: '/videos/onboarding/hold-descompletar.mp4',
    accentLabel: 'Passo 6',
  },
  {
    id: 'rest',
    title: 'Trave o dia para descansar',
    text: 'Toque no cadeado para abrir a tela de descanso e ver o ciclo por cima da correria.',
    videoSrc: '/videos/onboarding/cadeado-descanso.mp4',
    accentLabel: 'Passo 7',
  },
];

const PrimerStepPreview: React.FC<{ step: PrimerStep; stepNumber: number }> = ({ step, stepNumber }) => {
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setHasError(false);
    setIsReady(false);
  }, [step.id, step.videoSrc]);

  if (!step.videoSrc || hasError) {
    return (
      <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px] border border-white/8 bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.16),transparent_35%),linear-gradient(180deg,#090909_0%,#020202_100%)]">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.03),transparent_45%)]" />
        <div className="relative flex h-full flex-col items-center justify-center px-5 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-yellow-500/25 bg-yellow-500/10 text-yellow-300 shadow-[0_0_26px_rgba(234,179,8,0.16)]">
            <PlayCircle className="h-8 w-8" />
          </div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-yellow-400/80">
            {step.accentLabel}
          </div>
          <div className="mt-2 text-lg font-black uppercase tracking-[0.12em] text-white">
            {step.title}
          </div>
          <p className="mt-3 max-w-[22rem] text-[12px] leading-relaxed text-gray-300">
            Adicione o clipe <span className="font-black text-gray-100">{step.videoSrc}</span> para esta etapa aparecer aqui.
          </p>
          <div className="mt-4 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
            Cena {stepNumber}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[22px] border border-white/8 bg-black">
      {!isReady && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,rgba(255,215,0,0.15),transparent_30%),linear-gradient(180deg,#050505_0%,#000000_100%)] text-gray-300">
          <div className="mb-4 h-14 w-14 animate-pulse rounded-full border border-yellow-500/20 bg-yellow-500/10 shadow-[0_0_28px_rgba(234,179,8,0.15)]" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/55">Carregando cena</p>
        </div>
      )}
      <video
        key={step.id}
        src={step.videoSrc}
        className={`h-full w-full object-cover transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        controls={false}
        disablePictureInPicture
        onLoadedData={() => setIsReady(true)}
        onCanPlay={() => setIsReady(true)}
        onError={() => setHasError(true)}
      />
    </div>
  );
};

export const FirstUseOnboardingPrimerModal: React.FC<FirstUseOnboardingPrimerModalProps> = ({
  open,
  onClose,
  onStartGuidedOnboarding,
  primaryLabel,
  headerTitle = 'Primeiro giro',
  headerSummary = 'Veja o fluxo real em passos curtos. Depois eu te acompanho no app ao vivo.',
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    setCurrentIndex(0);
  }, [open]);

  const currentStep = PRIMER_STEPS[currentIndex];
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === PRIMER_STEPS.length - 1;
  const progressLabel = `${currentIndex + 1} / ${PRIMER_STEPS.length}`;
  const finalPrimaryLabel = primaryLabel || (onStartGuidedOnboarding ? 'Comecar guiado' : 'Fechar');

  const stepChipLabel = useMemo(() => {
    if (isLastStep) return 'Pronto para comecar';
    return 'Visao rapida';
  }, [isLastStep]);

  if (!open) return null;

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/88 px-4 py-5 backdrop-blur-md"
        onClick={onClose}
      >
        <GlassCard
          variant="gold"
          className="relative w-full max-w-sm overflow-hidden rounded-[30px] border-yellow-500/25 bg-[#050505] p-0 shadow-[0_0_56px_rgba(234,179,8,0.14)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.16),transparent_58%)]" />

          <div className="relative flex max-h-[86svh] flex-col">
            <div className="border-b border-white/8 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.32em] text-yellow-400/80">
                    Como funciona
                  </div>
                  <h2 className="mt-2 text-xl font-black uppercase tracking-[0.14em] text-white sm:text-2xl">
                    {headerTitle}
                  </h2>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-300">
                  {progressLabel}
                </div>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
                {headerSummary}
              </p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {PRIMER_STEPS.map((primerStep, index) => {
                    const isActive = index === currentIndex;
                    return (
                      <button
                        key={primerStep.id}
                        type="button"
                        onClick={() => setCurrentIndex(index)}
                        aria-label={`Ir para passo ${index + 1}`}
                        className={`h-2.5 rounded-full transition-all duration-200 ${
                          isActive
                            ? 'w-7 bg-[var(--skin-accent-color)] shadow-[0_0_14px_rgba(234,179,8,0.28)]'
                            : 'w-2.5 bg-white/18 hover:bg-white/28'
                        }`}
                      />
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-white/68 transition-colors hover:text-white"
                >
                  Pular
                </button>
              </div>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-4">
              <PrimerStepPreview step={currentStep} stepNumber={currentIndex + 1} />

              <div className="mt-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-yellow-400/80">
                    {currentStep.accentLabel}
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-gray-400">
                    {stepChipLabel}
                  </div>
                </div>
                <h3 className="mt-2 text-[18px] font-black uppercase tracking-[0.12em] text-white">
                  {currentStep.title}
                </h3>
                <p className="mt-2 text-[12px] leading-relaxed text-gray-300">
                  {currentStep.text}
                </p>
              </div>
            </div>

            <div className="border-t border-white/8 p-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  disabled={isFirstStep}
                  className="luxe-skin-button flex h-11 min-w-[122px] items-center justify-center gap-2 rounded-xl px-4 text-[10px] font-black uppercase tracking-[0.16em] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isLastStep) {
                      if (onStartGuidedOnboarding) {
                        onStartGuidedOnboarding();
                      } else {
                        onClose();
                      }
                      return;
                    }
                    setCurrentIndex((prev) => Math.min(PRIMER_STEPS.length - 1, prev + 1));
                  }}
                  className="luxe-skin-button flex h-11 flex-1 items-center justify-center rounded-xl px-4 text-[11px] font-black uppercase tracking-[0.16em]"
                >
                  <span className="inline-flex items-center justify-center gap-2">
                    {isLastStep ? finalPrimaryLabel : 'Proximo'}
                    {!isLastStep && <ChevronRight className="h-4 w-4" />}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </Portal>
  );
};
