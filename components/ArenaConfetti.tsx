import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    rotation: number;
    spin: number;
    color: string;
}

const PALETTE = ['#C5A021', '#E8CE72', '#705E43', '#FFFFFF', '#7FD1AE'];

/**
 * Rajada curta e discreta para uma arena concluida.
 * Contida de proposito: marca o momento sem virar festa, porque quem usa
 * o app a serio nao quer confete tomando a tela.
 * Sobe numa camada propria, nao intercepta toque e se apaga sozinha.
 * Quem decide se aparece e o AuthenticatedApp (preferencia de animacoes).
 *
 * Para calibrar: BASE_COUNT muda a quantidade, LIFESPAN o tempo em tela.
 */
const BASE_COUNT = 80;
const LIFESPAN = 2000;

export const ArenaConfetti: React.FC<{ burstKey: number; intense?: boolean }> = ({ burstKey, intense = false }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const frameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!burstKey) return;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.scale(dpr, dpr);

        const count = intense ? Math.round(BASE_COUNT * 1.5) : BASE_COUNT;
        const lifespan = intense ? LIFESPAN + 400 : LIFESPAN;

        const particles: Particle[] = Array.from({ length: count }, () => ({
            x: width * (0.5 + (Math.random() - 0.5) * 0.5),
            y: height * 0.32 + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 9,
            vy: Math.random() * -9 - 3,
            size: 4 + Math.random() * 5,
            rotation: Math.random() * Math.PI * 2,
            spin: (Math.random() - 0.5) * 0.28,
            color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        }));

        const startedAt = performance.now();

        const draw = (now: number) => {
            const elapsed = now - startedAt;
            const fade = Math.max(0, 1 - elapsed / lifespan);

            ctx.clearRect(0, 0, width, height);

            particles.forEach((p) => {
                p.vy += 0.28;
                p.vx *= 0.99;
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.spin;

                ctx.save();
                ctx.globalAlpha = fade;
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
                ctx.restore();
            });

            if (elapsed < lifespan) {
                frameRef.current = requestAnimationFrame(draw);
                return;
            }

            ctx.clearRect(0, 0, width, height);
            frameRef.current = null;
        };

        frameRef.current = requestAnimationFrame(draw);

        return () => {
            if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            ctx.clearRect(0, 0, width, height);
        };
    }, [burstKey, intense]);

    if (!burstKey) return null;

    return (
        <canvas
            ref={canvasRef}
            aria-hidden
            data-html2canvas-ignore
            className="pointer-events-none fixed inset-0 z-[200]"
        />
    );
};
