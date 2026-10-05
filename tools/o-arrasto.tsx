/**
 * O GESTO DE PEGAR E ARRASTAR, MEDIDO.
 *
 * Os cartoes usam o usePlannerDragHold de verdade — o mesmo das cinco pecas do
 * planner. O registro anota cada decisao do gesto com o tempo, em ms, contado do
 * instante em que o dedo tocou.
 *
 * Os roteiros disparam toques sinteticos com tempo controlado e expoem o
 * resultado em `window.__arrasto`, para a prova ser repetivel e nao depender de
 * dedo. O ultimo roteiro trava a thread de proposito, como o balao do Oraculo
 * digitando uma letra a cada 22ms: e onde o arrasto morria.
 */
import '../index.css';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    usePlannerDragHold, PLANNER_PEGAR_MS, PLANNER_SEGURAR_MS, PLANNER_ENCHER_MS, BAIA_ENCHER_MS,
} from '../hooks/usePlannerDragHold';

type Linha = { t: number; cartao: string; evento: string };

const relogio = { t0: 0 };
const agora = () => Math.round(performance.now() - relogio.t0);

/**
 * Um cartao que conclui de verdade: o timer e a barra leem o mesmo tempo de
 * enchimento que as pecas do app — `PLANNER_ENCHER_MS` ou `BAIA_ENCHER_MS`.
 */
const Cartao: React.FC<{
    nome: string;
    encherMs: number;
    anotar: (cartao: string, evento: string) => void;
}> = ({ nome, encherMs, anotar }) => {
    const [enchendo, setEnchendo] = useState(false);
    const conclusao = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { events, erguido } = usePlannerDragHold({
        onTap: () => anotar(nome, 'toque'),
        onDrag: () => anotar(nome, 'ARRASTOU'),
        onHoldStart: () => {
            anotar(nome, 'comecou a concluir');
            setEnchendo(true);
            conclusao.current = setTimeout(() => { anotar(nome, 'CONCLUIU'); setEnchendo(false); }, encherMs);
        },
        onHoldCancel: () => {
            if (conclusao.current) { clearTimeout(conclusao.current); conclusao.current = null; }
            setEnchendo(false);
        },
    });
    const anterior = useRef(false);
    useEffect(() => {
        if (erguido !== anterior.current) anotar(nome, erguido ? 'pegou (subiu)' : 'desceu');
        anterior.current = erguido;
    }, [erguido, nome, anotar]);

    return (
        <div
            data-cartao={nome}
            {...events}
            className={`cartao${erguido ? ' planner-erguido' : ''}`}
        >
            {nome}
            {enchendo && <div className="enche" style={{ animationDuration: `${encherMs}ms` }} />}
        </div>
    );
};

/* ------------------------------------------------ toques sinteticos */
const toque = (alvo: Element, tipo: 'touchstart' | 'touchmove' | 'touchend', x: number, y: number) => {
    const t = new Touch({ identifier: 1, target: alvo, clientX: x, clientY: y });
    const lista = tipo === 'touchend' ? [] : [t];
    alvo.dispatchEvent(new TouchEvent(tipo, {
        touches: lista, targetTouches: lista, changedTouches: [t], bubbles: true, cancelable: true,
    }));
};
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const travarThread = (ms: number) => { const fim = performance.now() + ms; while (performance.now() < fim) { /* ocupado */ } };

function Bancada() {
    const [linhas, setLinhas] = useState<Linha[]>([]);
    const registro = useRef<Linha[]>([]);

    const anotar = useCallback((cartao: string, evento: string) => {
        const linha = { t: agora(), cartao, evento };
        registro.current = [...registro.current, linha];
        setLinhas(registro.current);
    }, []);

    const zerar = () => { registro.current = []; setLinhas([]); };

    /** Cada roteiro devolve o que o gesto decidiu, para conferir de fora. */
    const roteiros: Record<string, (alvo: Element) => Promise<void>> = {
        'toque rapido': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50); await esperar(80); toque(alvo, 'touchend', 50, 50);
        },
        'pega e devolve': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50); await esperar(420); toque(alvo, 'touchend', 50, 50);
        },
        'pega e arrasta': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50); await esperar(320);
            toque(alvo, 'touchmove', 50, 82); await esperar(30); toque(alvo, 'touchend', 50, 82);
        },
        'segura parado': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50); await esperar(2300); toque(alvo, 'touchend', 50, 50);
        },
        'varre cedo (rolar)': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50); await esperar(100);
            toque(alvo, 'touchmove', 50, 82); await esperar(30); toque(alvo, 'touchend', 50, 82);
        },
        'thread ocupada (Oraculo)': async (alvo) => {
            toque(alvo, 'touchstart', 50, 50);
            // Trava a thread por 400ms LOGO apos tocar: o timer do pegar (240ms)
            // so poderia correr depois. O dedo se move no fim da trava, ainda
            // dentro da mesma tarefa — antes do timer atrasado conseguir rodar.
            await esperar(10);
            travarThread(400);
            toque(alvo, 'touchmove', 50, 82);
            await esperar(30); toque(alvo, 'touchend', 50, 82);
        },
    };

    const rodar = async (nome: string, cartao = 'A') => {
        const alvo = document.querySelector(`[data-cartao="${cartao}"]`);
        if (!alvo) return [];
        zerar();
        relogio.t0 = performance.now();
        await roteiros[nome](alvo);
        await esperar(80);
        return registro.current.map((l) => `${l.t}ms ${l.evento}`);
    };

    useEffect(() => {
        (window as any).__arrasto = { rodar, roteiros: Object.keys(roteiros) };
    });

    return (
        <>
            <header>
                <h1>O arrasto</h1>
                <p>
                    O <code>usePlannerDragHold</code> de verdade. Pegar aos <code>{PLANNER_PEGAR_MS}ms</code>;
                    concluir só com o dedo parado até <code>{PLANNER_SEGURAR_MS}ms</code>. Toque e segure
                    um cartão — ou rode um roteiro, que mede com toques sintéticos.
                </p>
            </header>
            <div className="roteiros">
                {Object.keys(roteiros).map((nome) => (
                    <button key={nome} onClick={() => void rodar(nome)}>{nome}</button>
                ))}
            </div>
            <div
                className="palco"
                onTouchStartCapture={() => { relogio.t0 = performance.now(); }}
                onMouseDownCapture={() => { relogio.t0 = performance.now(); }}
            >
                <Cartao nome="A" encherMs={PLANNER_ENCHER_MS} anotar={anotar} />
                <Cartao nome="B" encherMs={PLANNER_ENCHER_MS} anotar={anotar} />
                <Cartao nome="Baia" encherMs={BAIA_ENCHER_MS} anotar={anotar} />
            </div>
            <div className="registro">
                {linhas.length === 0
                    ? 'Toque, segure, arraste — ou rode um roteiro.'
                    : linhas.map((l, i) => (
                        <div key={i}><b>{String(l.t).padStart(4, ' ')}ms</b> · {l.cartao} · {l.evento}</div>
                    ))}
            </div>
        </>
    );
}

createRoot(document.getElementById('raiz')!).render(<Bancada />);
