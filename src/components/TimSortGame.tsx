'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  GamePhase,
  NumberCard,
  Run,
  createCards,
  generateArray,
  isRunSorted,
  createRunsFromSplits,
} from '@/lib/timsort-engine';
import { useTouchDrag } from '@/lib/useTouchDrag';
import NumberCardComponent from './NumberCardComponent';

/*
 * Full UdeA palette
 * Primary:       #026937  #35944b  #43b649  #8dc63f  #3ebdac  #069a7e  #0e7774
 * Complementary: #70205b  #137598  #ef434d  #f9a12c
 *
 * Run colors use BOTH palettes for visual variety and contrast.
 */
const RUN_COLORS = [
  '#026937', // UdeA dark green
  '#f9a12c', // amber
  '#137598', // blue
  '#ef434d', // red
  '#3ebdac', // teal
  '#70205b', // purple
  '#8dc63f', // lime
  '#069a7e', // teal-dark
];

// ============================================================
// Code snippets (Swift) for each phase
// ============================================================
const CODE_SNIPPETS: Record<string, { title: string; code: string }> = {
  'identify-runs': {
    title: 'Identificar Runs — Swift',
    code: `<span class="kw">func</span> <span class="fn">findRuns</span>(<span class="kw">_</span> a: [<span class="tp">Int</span>]) -> [[<span class="tp">Int</span>]] {
  <span class="kw">var</span> runs: [[<span class="tp">Int</span>]] = []
  <span class="kw">var</span> run = [a[<span class="nu">0</span>]]
  <span class="kw">for</span> i <span class="kw">in</span> <span class="nu">1</span>..&lt;a.count {
    <span class="kw">if</span> a[i] >= run.last! {
      run.<span class="fn">append</span>(a[i]) <span class="cm">// sigue subiendo</span>
    } <span class="kw">else</span> {
      runs.<span class="fn">append</span>(run)  <span class="cm">// cortar aqui</span>
      run = [a[i]]
    }
  }
  <span class="kw">return</span> runs + [run]
}`,
  },
  'insertion-sort': {
    title: 'Insertion Sort — Swift',
    code: `<span class="kw">func</span> <span class="fn">insertionSort</span>(<span class="kw">_</span> a: <span class="kw">inout</span> [<span class="tp">Int</span>]) {
  <span class="kw">for</span> i <span class="kw">in</span> <span class="nu">1</span>..&lt;a.count {
    <span class="kw">let</span> key = a[i]
    <span class="kw">var</span> j = i - <span class="nu">1</span>
    <span class="kw">while</span> j >= <span class="nu">0</span> && a[j] > key {
      a[j + <span class="nu">1</span>] = a[j] <span class="cm">// desplazar</span>
      j -= <span class="nu">1</span>
    }
    a[j + <span class="nu">1</span>] = key
  }
} <span class="cm">// O(n) si casi ordenado</span>`,
  },
  merge: {
    title: 'Merge — Swift',
    code: `<span class="kw">func</span> <span class="fn">merge</span>(<span class="kw">_</span> left: [<span class="tp">Int</span>], <span class="kw">_</span> right: [<span class="tp">Int</span>]) -> [<span class="tp">Int</span>] {
  <span class="kw">var</span> i = <span class="nu">0</span>, j = <span class="nu">0</span>, result: [<span class="tp">Int</span>] = []
  <span class="kw">while</span> i < left.count && j < right.count {
    <span class="kw">if</span> left[i] <= right[j] {
      result.<span class="fn">append</span>(left[i]); i += <span class="nu">1</span>
    } <span class="kw">else</span> {
      result.<span class="fn">append</span>(right[j]); j += <span class="nu">1</span>
    }
  }
  <span class="kw">return</span> result + <span class="tp">Array</span>(left[i...])
                + <span class="tp">Array</span>(right[j...])
}`,
  },
};

// ============================================================
// Phase Indicator
// ============================================================
function PhaseIndicator({ phase }: { phase: GamePhase }) {
  const steps = [
    { key: 'identify-runs', label: 'Dividir', num: 1 },
    { key: 'insertion-sort', label: 'Ordenar', num: 2 },
    { key: 'merge', label: 'Fusionar', num: 3 },
  ];
  const idx = steps.findIndex(s => s.key === phase);

  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="lg-phase-dot"
              style={{
                background: i < idx ? 'linear-gradient(145deg, #43b649, #026937)'
                  : i === idx ? 'linear-gradient(145deg, #35944b, #026937)'
                  : 'rgba(255,255,255,0.4)',
                color: i <= idx ? '#fff' : '#8fa396',
                boxShadow: i === idx ? '0 2px 10px rgba(2,105,55,0.3), 0 0.5px 0 rgba(255,255,255,0.5) inset'
                  : i < idx ? '0 2px 8px rgba(67,182,73,0.25), 0 0.5px 0 rgba(255,255,255,0.4) inset'
                  : '0 1px 4px rgba(0,0,0,0.06), 0 0.5px 0 rgba(255,255,255,0.5) inset',
              }}
            >
              {i < idx ? '✓' : s.num}
            </div>
            <span className="text-[11px] font-semibold" style={{ color: i < idx ? '#43b649' : i === idx ? '#026937' : '#8fa396' }}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="lg-phase-line mb-5" style={{ background: i < idx ? 'linear-gradient(90deg, #026937, #43b649)' : 'rgba(0,0,0,0.06)' }} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// Toast
// ============================================================
function Toast({ message, type }: { message: string; type: 'info' | 'success' | 'error' | 'warning' }) {
  const c = {
    info:    { bg: 'rgba(19,117,152,0.10)', color: '#137598', icon: 'i' },
    success: { bg: 'rgba(67,182,73,0.12)',   color: '#026937', icon: '✓' },
    error:   { bg: 'rgba(239,67,77,0.10)',   color: '#d4322a', icon: '!' },
    warning: { bg: 'rgba(249,161,44,0.12)',  color: '#b8780e', icon: '!' },
  }[type];

  return (
    <div className="lg-toast lg-slide-up mx-4 mb-4 px-4 py-3 flex items-start gap-2.5" style={{ background: c.bg }}>
      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5" style={{ background: c.color }}>
        {c.icon}
      </div>
      <p className="text-[14px] font-medium leading-snug" style={{ color: c.color }}>{message}</p>
    </div>
  );
}

// ============================================================
// Score
// ============================================================
function ScoreBar({ score, mistakes }: { score: number; mistakes: number }) {
  return (
    <div className="flex justify-center gap-3 mb-4 px-4">
      <div className="lg-badge" style={{ background: 'rgba(2,105,55,0.12)', color: '#026937' }}>
        <span className="text-[15px]">★</span> {score} pts
      </div>
      <div className="lg-badge" style={{ background: 'rgba(239,67,77,0.10)', color: '#d4322a' }}>
        <span className="text-[15px]">♥</span> {mistakes} {mistakes === 1 ? 'error' : 'errores'}
      </div>
    </div>
  );
}

// ============================================================
// Code Panel (collapsible)
// ============================================================
function CodePanel({ phaseKey }: { phaseKey: string }) {
  const [open, setOpen] = useState(false);
  const snippet = CODE_SNIPPETS[phaseKey];
  if (!snippet) return null;

  return (
    <div className="mt-3 mb-1">
      <button className="code-toggle" onClick={() => setOpen(!open)}>
        <span style={{ fontSize: 15, transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>
          ▶
        </span>
        {snippet.title}
      </button>
      {open && (
        <div className="code-panel mt-2 lg-appear">
          <pre dangerouslySetInnerHTML={{ __html: snippet.code }} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// Tutorial (animated onboarding)
// ============================================================
function Tutorial({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'Paso 1: Dividir',
      desc: 'Primero, divides el array en sub-grupos llamados "runs".',
      color: '#026937',
      render: () => (
        <div className="flex items-center justify-center gap-1 my-4">
          {[5, 8, 3, 7].map((n, i) => (
            <React.Fragment key={i}>
              <div
                className="lg-card lg-card-sm tutorial-card-enter"
                style={{
                  background: `linear-gradient(145deg, ${i < 2 ? '#026937' : '#f9a12c'}dd, ${i < 2 ? '#026937' : '#f9a12c'}99)`,
                  border: `0.5px solid ${i < 2 ? '#026937' : '#f9a12c'}66`,
                  boxShadow: `0 2px 8px ${i < 2 ? '#026937' : '#f9a12c'}28, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
                  animationDelay: `${i * 0.12}s`,
                }}
              >
                <span>{n}</span>
              </div>
              {i === 1 && (
                <div
                  className="w-0.5 h-10 rounded-full mx-1"
                  style={{
                    background: '#ef434d',
                    animation: 'tutorial-split 1.5s ease both',
                    animationDelay: '0.6s',
                  }}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      ),
    },
    {
      title: 'Paso 2: Ordenar',
      desc: 'Ordenas cada run con Insertion Sort. Toca una carta, luego la posicion destino.',
      color: '#137598',
      render: () => (
        <div className="flex items-center justify-center gap-3 my-4">
          {[3, 5].map((n, i) => (
            <div
              key={i}
              className="lg-card lg-card-sm tutorial-card-enter"
              style={{
                background: `linear-gradient(145deg, #43b649dd, #43b649aa)`,
                border: `0.5px solid #43b64966`,
                boxShadow: `0 2px 8px #43b64928, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
                animationDelay: `${i * 0.15}s`,
              }}
            >
              <span>{n}</span>
            </div>
          ))}
          <span className="text-[20px] tutorial-fade-loop" style={{ color: '#8fa396' }}>→</span>
          {[7, 3].map((n, i) => (
            <div
              key={`b-${i}`}
              className="lg-card lg-card-sm tutorial-card-enter"
              style={{
                background: `linear-gradient(145deg, #f9a12cdd, #f9a12c99)`,
                border: `0.5px solid #f9a12c66`,
                boxShadow: `0 2px 8px #f9a12c28, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
                animationDelay: `${0.4 + i * 0.15}s`,
              }}
            >
              <span>{n}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Paso 3: Fusionar',
      desc: 'Fusionas los runs eligiendo siempre el menor del frente de cada run.',
      color: '#43b649',
      render: () => (
        <div className="flex items-center justify-center gap-2 my-4">
          {[3, 5, 3, 7].map((n, i) => (
            <div
              key={i}
              className="lg-card lg-card-sm tutorial-card-enter"
              style={{
                background: `linear-gradient(145deg, #43b649dd, #43b64999)`,
                border: `0.5px solid #43b64966`,
                boxShadow: `0 2px 8px #43b64928, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
                animationDelay: `${i * 0.12}s`,
              }}
            >
              <span>{n}</span>
            </div>
          ))}
        </div>
      ),
    },
  ];

  const s = steps[step];

  return (
    <div className="flex-1 flex flex-col px-5 pt-10 pb-8">
      <div className="text-center mb-6 lg-slide-up">
        <h1 className="text-[30px] font-bold tracking-tight" style={{ color: '#1a2e22' }}>Como jugar</h1>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              background: i === step ? s.color : '#cedbd4',
              borderRadius: 4,
            }}
          />
        ))}
      </div>

      <div className="lg-panel p-5 flex-1 flex flex-col lg-slide-up" key={step}>
        <div
          className="lg-phase-dot mx-auto mb-3"
          style={{
            background: `linear-gradient(145deg, ${s.color}dd, ${s.color})`,
            color: '#fff',
            boxShadow: `0 2px 10px ${s.color}33, 0 0.5px 0 rgba(255,255,255,0.5) inset`,
          }}
        >
          {step + 1}
        </div>
        <h2 className="text-[18px] font-bold text-center mb-1" style={{ color: '#1a2e22' }}>{s.title}</h2>
        <p className="text-[14px] text-center leading-snug mb-2" style={{ color: '#6b7c72' }}>{s.desc}</p>

        <div className="flex-1 flex flex-col justify-center">
          {s.render()}
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="lg-btn flex-1" style={{ background: 'rgba(0,0,0,0.05)', color: '#1a2e22' }}>
            Atras
          </button>
        )}
        <button
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : onFinish()}
          className="lg-btn lg-btn-primary flex-1"
        >
          {step < steps.length - 1 ? 'Siguiente' : 'Jugar!'}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Confetti
// ============================================================
function Confetti() {
  const [pieces, setPieces] = useState<{ id: number; x: number; color: string; delay: number; w: number; h: number }[]>([]);
  useEffect(() => {
    const allColors = ['#026937', '#35944b', '#43b649', '#8dc63f', '#3ebdac', '#069a7e', '#0e7774', '#70205b', '#137598', '#ef434d', '#f9a12c'];
    setPieces(Array.from({ length: 45 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      color: allColors[Math.floor(Math.random() * allColors.length)],
      delay: Math.random() * 2.5, w: Math.random() * 6 + 4, h: Math.random() * 8 + 4,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece"
          style={{ left: `${p.x}%`, backgroundColor: p.color, width: `${p.w}px`, height: `${p.h}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px', animationDelay: `${p.delay}s`, opacity: 0.85 }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Main Game
// ============================================================
export default function TimSortGame() {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [showTutorial, setShowTutorial] = useState(false);
  const [cards, setCards] = useState<NumberCard[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error' | 'warning'>('info');

  const [splitMarkers, setSplitMarkers] = useState<Set<number>>(new Set());
  const [currentRunIndex, setCurrentRunIndex] = useState(0);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [mergePairIndex, setMergePairIndex] = useState(0);
  const [mergedResult, setMergedResult] = useState<NumberCard[]>([]);
  const [mergeLeftPointer, setMergeLeftPointer] = useState(0);
  const [mergeRightPointer, setMergeRightPointer] = useState(0);

  const showMsg = (msg: string, type: 'info' | 'success' | 'error' | 'warning') => { setMessage(msg); setMessageType(type); };

  const initGame = useCallback(() => {
    setCards(createCards(generateArray(8)));
    setPhase('intro');
    setShowTutorial(false);
    setRuns([]); setScore(0); setMistakes(0);
    setSplitMarkers(new Set()); setCurrentRunIndex(0); setSelectedCardIdx(null);
    setMergePairIndex(0); setMergedResult([]); setMergeLeftPointer(0); setMergeRightPointer(0);
    setMessage('');
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // --- Phase 1 ---
  const toggleSplit = (i: number) => { const n = new Set(splitMarkers); n.has(i) ? n.delete(i) : n.add(i); setSplitMarkers(n); };

  const confirmSplits = () => {
    if (splitMarkers.size === 0) { showMsg('Toca entre las cartas para marcar al menos un corte', 'warning'); return; }
    const newRuns = createRunsFromSplits(cards, Array.from(splitMarkers));
    if (newRuns.some(r => r.cards.length > 5)) { showMsg('Maximo 5 elementos por run. Divide mas.', 'warning'); return; }
    if (newRuns.filter(r => r.cards.length < 2).length > 1) { showMsg('Cada run debe tener al menos 2 elementos.', 'warning'); return; }
    newRuns.forEach((r, i) => { r.color = RUN_COLORS[i % RUN_COLORS.length]; });
    setRuns(newRuns); setScore(p => p + 10);
    const first = newRuns.findIndex(r => !r.sorted);
    if (first === -1) {
      setScore(p => p + 20);
      if (newRuns.length === 1) { setPhase('victory'); showMsg('El array ya estaba ordenado!', 'success'); }
      else { setPhase('merge'); showMsg('Todos los runs ya estan ordenados. A fusionar!', 'success'); resetMerge(); }
    } else { setCurrentRunIndex(first); setSelectedCardIdx(null); setPhase('insertion-sort'); showMsg('Toca una carta y luego toca donde quieres moverla', 'info'); }
  };

  const getCardSplitColor = (index: number): string => {
    let g = 0; for (const m of Array.from(splitMarkers).sort((a, b) => a - b)) { if (index >= m) g++; }
    return RUN_COLORS[g % RUN_COLORS.length];
  };

  // --- Phase 2: reorder (used by both tap and drag) ---
  const reorderRun = useCallback((runIdx: number, fromIdx: number, toIdx: number) => {
    if (runIdx !== currentRunIndex || runs[runIdx]?.sorted) return;
    const nr = [...runs]; const run = { ...nr[runIdx], cards: [...nr[runIdx].cards] };
    const [m] = run.cards.splice(fromIdx, 1); run.cards.splice(toIdx, 0, m);
    run.sorted = isRunSorted(run.cards); nr[runIdx] = run; setRuns(nr); setSelectedCardIdx(null);
    if (run.sorted) {
      setScore(p => p + 15); showMsg(`Run ${runIdx + 1} ordenado!`, 'success');
      const next = nr.findIndex((r, i) => i > runIdx && !r.sorted);
      if (next === -1) {
        setTimeout(() => { if (nr.length === 1) { setPhase('victory'); showMsg('Array ordenado!', 'success'); }
        else { setPhase('merge'); showMsg('Todos ordenados. Ahora fusionalos!', 'success'); resetMerge(); } }, 600);
      } else { setTimeout(() => setCurrentRunIndex(next), 400); }
    }
  }, [runs, currentRunIndex]);

  const handleInsertionTap = (runIdx: number, cardIdx: number) => {
    if (runIdx !== currentRunIndex || runs[runIdx].sorted) return;
    if (selectedCardIdx === null) { setSelectedCardIdx(cardIdx); return; }
    if (selectedCardIdx === cardIdx) { setSelectedCardIdx(null); return; }
    reorderRun(runIdx, selectedCardIdx, cardIdx);
  };

  // Touch drag for the active run
  const activeRunCards = runs[currentRunIndex]?.cards ?? [];
  const dragHandlers = useTouchDrag(
    activeRunCards.length,
    (from, to) => reorderRun(currentRunIndex, from, to),
    phase === 'insertion-sort' && !runs[currentRunIndex]?.sorted,
  );

  // --- Phase 3 ---
  const resetMerge = () => { setMergePairIndex(0); setMergedResult([]); setMergeLeftPointer(0); setMergeRightPointer(0); };
  const getCurrentPair = (): [Run, Run] | null => { const i = mergePairIndex * 2; return i + 1 < runs.length ? [runs[i], runs[i + 1]] : null; };

  const handleMergeSelect = (side: 'left' | 'right') => {
    const pair = getCurrentPair(); if (!pair) return;
    const [L, R] = pair;
    if (side === 'left' && mergeLeftPointer >= L.cards.length) return;
    if (side === 'right' && mergeRightPointer >= R.cards.length) return;
    const lc = L.cards[mergeLeftPointer], rc = R.cards[mergeRightPointer];
    if (mergeLeftPointer < L.cards.length && mergeRightPointer < R.cards.length) {
      const ok = lc.value <= rc.value ? 'left' : 'right';
      if (side !== ok) { setMistakes(p => p + 1); showMsg(`Elige el menor: ${ok === 'left' ? lc.value : rc.value} < ${ok === 'left' ? rc.value : lc.value}`, 'error'); return; }
    }
    const sel = side === 'left' ? lc : rc;
    const nm = [...mergedResult, sel]; setMergedResult(nm); setScore(p => p + 5);
    const nLP = side === 'left' ? mergeLeftPointer + 1 : mergeLeftPointer;
    const nRP = side === 'right' ? mergeRightPointer + 1 : mergeRightPointer;
    if (side === 'left') setMergeLeftPointer(nLP); else setMergeRightPointer(nRP);
    if (nLP >= L.cards.length && nRP >= R.cards.length) { finishMerge(nm); }
    else if (nLP >= L.cards.length) { const f = [...nm, ...R.cards.slice(nRP)]; setMergedResult(f); setMergeRightPointer(R.cards.length); setTimeout(() => finishMerge(f), 500); }
    else if (nRP >= R.cards.length) { const f = [...nm, ...L.cards.slice(nLP)]; setMergedResult(f); setMergeLeftPointer(L.cards.length); setTimeout(() => finishMerge(f), 500); }
  };

  const finishMerge = (merged: NumberCard[]) => {
    const i = mergePairIndex * 2; const nr = [...runs];
    nr.splice(i, 2, { id: `merged-${Date.now()}`, cards: merged, sorted: true, color: nr[i].color });
    setRuns(nr); setScore(p => p + 20);
    if (nr.length <= 1) { setTimeout(() => { setPhase('victory'); showMsg('Felicidades! TimSort completado!', 'success'); }, 400); }
    else { showMsg(`Merge completo! Quedan ${nr.length} runs.`, 'success'); setTimeout(resetMerge, 600); }
  };

  // ======================== RENDER ========================
  return (
    <div className="lg-background min-h-[100dvh] flex flex-col safe-area-top safe-area-bottom">

      {/* TUTORIAL */}
      {showTutorial && (
        <Tutorial onFinish={() => {
          setShowTutorial(false);
          setPhase('identify-runs');
          showMsg('Toca los espacios entre cartas para dividir en runs', 'info');
        }} />
      )}

      {/* INTRO */}
      {phase === 'intro' && !showTutorial && (
        <div className="flex-1 flex flex-col px-5 pt-14 pb-8">
          <div className="text-center mb-8 lg-slide-up">
            <h1 className="text-[34px] font-bold tracking-tight" style={{ color: '#1a2e22' }}>TimSort</h1>
            <p className="text-[15px] mt-1" style={{ color: '#6b7c72' }}>Aprende ordenamiento jugando</p>
          </div>

          <div className="lg-panel p-5 mb-5 lg-slide-up" style={{ animationDelay: '0.08s' }}>
            <h2 className="text-[17px] font-bold mb-4" style={{ color: '#1a2e22' }}>Como funciona?</h2>
            <div className="space-y-4">
              {[
                { n: 1, c: '#026937', t: 'Dividir en Runs', d: 'Separa el array en sub-grupos pequenos' },
                { n: 2, c: '#137598', t: 'Insertion Sort', d: 'Ordena cada grupo individualmente' },
                { n: 3, c: '#43b649', t: 'Merge', d: 'Fusiona los grupos eligiendo el menor' },
              ].map(s => (
                <div key={s.n} className="flex items-start gap-3">
                  <div className="lg-phase-dot shrink-0" style={{ background: `linear-gradient(145deg, ${s.c}dd, ${s.c})`, color: '#fff', width: 28, height: 28, fontSize: 13, boxShadow: `0 2px 8px ${s.c}33, 0 0.5px 0 rgba(255,255,255,0.4) inset` }}>
                    {s.n}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: '#1a2e22' }}>{s.t}</p>
                    <p className="text-[13px] leading-snug" style={{ color: '#6b7c72' }}>{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg-panel p-5 mb-8 lg-slide-up" style={{ animationDelay: '0.16s' }}>
            <p className="text-[12px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>ARRAY A ORDENAR</p>
            <div className="flex gap-2.5 justify-center flex-wrap">
              {cards.map((card, i) => (
                <NumberCardComponent key={card.id} card={card} color="#026937" animationDelay={i * 60 + 200} size="lg" />
              ))}
            </div>
          </div>

          <div className="mt-auto space-y-3 lg-slide-up" style={{ animationDelay: '0.24s' }}>
            <button
              onClick={() => setShowTutorial(true)}
              className="lg-btn w-full text-[17px]"
              style={{ background: 'rgba(2,105,55,0.08)', color: '#026937', border: '0.5px solid rgba(2,105,55,0.2)' }}
            >
              Tutorial
            </button>
            <button
              onClick={() => { setPhase('identify-runs'); showMsg('Toca los espacios entre cartas para dividir en runs', 'info'); }}
              className="lg-btn lg-btn-primary w-full text-[17px]"
            >
              Comenzar
            </button>
          </div>
        </div>
      )}

      {/* GAME PHASES */}
      {phase !== 'intro' && phase !== 'victory' && !showTutorial && (
        <div className="flex-1 flex flex-col px-4 pt-6 pb-6">
          <PhaseIndicator phase={phase} />
          <ScoreBar score={score} mistakes={mistakes} />
          {message && <Toast message={message} type={messageType} />}

          {/* PHASE 1 */}
          {phase === 'identify-runs' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-3">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 1</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Divide el array en runs</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>Toca las lineas entre cartas para cortar.</p>
              </div>

              <CodePanel phaseKey="identify-runs" />

              <div className="lg-panel p-4 flex-1 flex flex-col justify-center my-3">
                <div className="flex items-center justify-center flex-wrap gap-y-3">
                  {cards.map((card, i) => (
                    <React.Fragment key={card.id}>
                      <NumberCardComponent card={card} color={splitMarkers.size > 0 ? getCardSplitColor(i) : '#026937'} animationDelay={i * 40} />
                      {i < cards.length - 1 && (
                        <button onClick={() => toggleSplit(i + 1)} className={`lg-split-btn ${splitMarkers.has(i + 1) ? 'lg-split-btn-active' : ''}`}>
                          {splitMarkers.has(i + 1) ? '✂' : '┆'}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <button onClick={confirmSplits} className="lg-btn lg-btn-success w-full">
                Confirmar {splitMarkers.size > 0 ? splitMarkers.size + 1 : 1} runs
              </button>
            </div>
          )}

          {/* PHASE 2 */}
          {phase === 'insertion-sort' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-3">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 2</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Ordena cada run</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>Arrastra las cartas o toca para mover.</p>
              </div>

              <CodePanel phaseKey="insertion-sort" />

              <div className="space-y-3 flex-1 mt-3">
                {runs.map((run, runIdx) => {
                  const isActive = runIdx === currentRunIndex && !run.sorted;
                  return (
                    <div key={run.id} className={`lg-panel lg-panel-sm p-4 transition-all duration-300 ${isActive ? 'lg-panel-active' : run.sorted ? 'lg-panel-success' : ''}`}
                      style={{ opacity: !isActive && !run.sorted ? 0.45 : 1 }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: run.color, boxShadow: `0 0 6px ${run.color}44` }} />
                        <span className="text-[13px] font-semibold" style={{ color: '#1a2e22' }}>Run {runIdx + 1}</span>
                        {run.sorted && <span className="lg-badge text-[12px]" style={{ background: 'rgba(67,182,73,0.12)', color: '#026937' }}>✓ Listo</span>}
                        {isActive && <span className="lg-badge text-[12px]" style={{ background: `${run.color}15`, color: run.color }}>Ordenar</span>}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {run.cards.map((card, ci) => (
                          <NumberCardComponent key={card.id} card={card} color={run.sorted ? '#43b649' : run.color}
                            selected={isActive && !dragHandlers.state.dragging && selectedCardIdx === ci}
                            dimmed={!isActive && !run.sorted}
                            dragging={isActive && dragHandlers.state.dragIdx === ci}
                            dropTarget={isActive && dragHandlers.state.dragging && dragHandlers.state.overIdx === ci && dragHandlers.state.dragIdx !== ci}
                            onClick={() => {
                              if (!dragHandlers.wasDrag()) handleInsertionTap(runIdx, ci);
                            }}
                            onTouchStart={isActive ? (e) => dragHandlers.handleTouchStart(ci, e) : undefined}
                            onTouchMove={isActive ? dragHandlers.handleTouchMove : undefined}
                            onTouchEnd={isActive ? dragHandlers.handleTouchEnd : undefined}
                            registerRef={isActive ? (el) => dragHandlers.registerCard(ci, el) : undefined}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghost card floating under finger */}
              {dragHandlers.state.dragging && dragHandlers.state.ghostPos && dragHandlers.state.dragIdx !== null && (
                <div
                  className="lg-ghost"
                  style={{
                    left: dragHandlers.state.ghostPos.x,
                    top: dragHandlers.state.ghostPos.y,
                    background: `linear-gradient(145deg, ${runs[currentRunIndex]?.color ?? '#026937'}ee, ${runs[currentRunIndex]?.color ?? '#026937'}aa)`,
                    boxShadow: `0 16px 40px ${runs[currentRunIndex]?.color ?? '#026937'}55, 0 0 0 2px ${runs[currentRunIndex]?.color ?? '#026937'}44, 0 0.5px 0 rgba(255,255,255,0.5) inset`,
                  }}
                >
                  <span>{activeRunCards[dragHandlers.state.dragIdx]?.value}</span>
                </div>
              )}
            </div>
          )}

          {/* PHASE 3 */}
          {phase === 'merge' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-3">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 3</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Fusiona los runs</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>Toca la carta con el valor menor.</p>
              </div>

              <CodePanel phaseKey="merge" />

              {(() => {
                const pair = getCurrentPair(); if (!pair) return null;
                const [L, R] = pair;
                return (
                  <div className="space-y-3 flex-1 mt-3">
                    <div className="lg-panel lg-panel-sm p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: L.color }}>Run A</p>
                      <div className="flex gap-2 flex-wrap">
                        {L.cards.map((c, i) => <NumberCardComponent key={c.id} card={c} color={L.color} done={i < mergeLeftPointer} highlighted={i === mergeLeftPointer} showPointer={i === mergeLeftPointer} onClick={() => { if (i === mergeLeftPointer) handleMergeSelect('left'); }} />)}
                      </div>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="lg-badge" style={{ background: 'rgba(255,255,255,0.5)', color: '#6b7c72', fontSize: 11, fontWeight: 700 }}>VS</div>
                    </div>
                    <div className="lg-panel lg-panel-sm p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: R.color }}>Run B</p>
                      <div className="flex gap-2 flex-wrap">
                        {R.cards.map((c, i) => <NumberCardComponent key={c.id} card={c} color={R.color} done={i < mergeRightPointer} highlighted={i === mergeRightPointer} showPointer={i === mergeRightPointer} onClick={() => { if (i === mergeRightPointer) handleMergeSelect('right'); }} />)}
                      </div>
                    </div>
                    <div className="lg-panel lg-panel-sm lg-panel-success p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: '#026937' }}>Resultado ({mergedResult.length}/{L.cards.length + R.cards.length})</p>
                      <div className="flex gap-2 flex-wrap min-h-[52px]">
                        {mergedResult.length === 0
                          ? <p className="text-[13px] italic" style={{ color: '#b0c4b8' }}>Toca las cartas de arriba...</p>
                          : mergedResult.map((c, i) => <NumberCardComponent key={`m-${c.id}-${i}`} card={c} color="#43b649" size="sm" animationDelay={0} />)}
                      </div>
                    </div>
                    {runs.length > 2 && (
                      <div className="px-1">
                        <p className="text-[11px] font-semibold tracking-wide mb-1.5" style={{ color: '#8fa396' }}>EN ESPERA</p>
                        <div className="flex gap-2 flex-wrap">
                          {runs.slice(2).map(r => <div key={r.id} className="lg-badge" style={{ background: `${r.color}12`, color: r.color }}>[{r.cards.map(c => c.value).join(', ')}]</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* VICTORY */}
      {phase === 'victory' && !showTutorial && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          <Confetti />
          <div className="text-[64px] mb-3 lg-pop">🏆</div>
          <h2 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: '#1a2e22' }}>Completado!</h2>
          <p className="text-[15px] mb-8" style={{ color: '#6b7c72' }}>Has dominado TimSort</p>
          <div className="lg-panel p-6 w-full max-w-sm mb-8 lg-slide-up">
            <div className="flex justify-around mb-6">
              <div className="text-center">
                <p className="text-[36px] font-bold" style={{ color: '#43b649' }}>{score}</p>
                <p className="text-[13px] font-medium" style={{ color: '#6b7c72' }}>Puntos</p>
              </div>
              <div style={{ width: '0.5px', background: 'rgba(0,0,0,0.08)', alignSelf: 'stretch' }} />
              <div className="text-center">
                <p className="text-[36px] font-bold" style={{ color: '#ef434d' }}>{mistakes}</p>
                <p className="text-[13px] font-medium" style={{ color: '#6b7c72' }}>Errores</p>
              </div>
            </div>
            <p className="text-[11px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>RESULTADO FINAL</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {(runs.length > 0 ? runs[0].cards : cards).map((c, i) => <NumberCardComponent key={c.id} card={c} color="#43b649" animationDelay={i * 80} size="sm" />)}
            </div>
          </div>
          <button onClick={initGame} className="lg-btn lg-btn-primary w-full max-w-sm">Jugar de nuevo</button>
          <p className="text-[11px] mt-6 text-center" style={{ color: '#b0c4b8' }}>TimSort: O(n log n) peor caso · O(n) mejor caso</p>
        </div>
      )}
    </div>
  );
}
