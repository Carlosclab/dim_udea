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
import NumberCardComponent from './NumberCardComponent';

// UdeA palette for runs
const RUN_COLORS = ['#026937', '#3ebdac', '#43b649', '#0e7774', '#8dc63f', '#069a7e', '#35944b', '#3ebdac'];

// ============================================================
// Phase Indicator — Liquid Glass dots
// ============================================================
function PhaseIndicator({ phase }: { phase: GamePhase }) {
  const steps = [
    { key: 'identify-runs', label: 'Dividir', num: 1 },
    { key: 'insertion-sort', label: 'Ordenar', num: 2 },
    { key: 'merge', label: 'Fusionar', num: 3 },
  ];
  const currentIdx = steps.findIndex(s => s.key === phase);

  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className="flex flex-col items-center gap-1">
            <div
              className="lg-phase-dot"
              style={{
                background: i < currentIdx
                  ? 'linear-gradient(145deg, #43b649, #026937)'
                  : i === currentIdx
                    ? 'linear-gradient(145deg, #35944b, #026937)'
                    : 'rgba(255,255,255,0.4)',
                color: i <= currentIdx ? '#fff' : '#8fa396',
                boxShadow: i === currentIdx
                  ? '0 2px 10px rgba(2,105,55,0.3), 0 0.5px 0 rgba(255,255,255,0.5) inset'
                  : i < currentIdx
                    ? '0 2px 8px rgba(67,182,73,0.25), 0 0.5px 0 rgba(255,255,255,0.4) inset'
                    : '0 1px 4px rgba(0,0,0,0.06), 0 0.5px 0 rgba(255,255,255,0.5) inset',
              }}
            >
              {i < currentIdx ? '✓' : s.num}
            </div>
            <span
              className="text-[11px] font-semibold"
              style={{ color: i < currentIdx ? '#43b649' : i === currentIdx ? '#026937' : '#8fa396' }}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="lg-phase-line mb-5"
              style={{
                background: i < currentIdx
                  ? 'linear-gradient(90deg, #026937, #43b649)'
                  : 'rgba(0,0,0,0.06)',
              }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================
// Toast — Liquid Glass
// ============================================================
function Toast({ message, type }: { message: string; type: 'info' | 'success' | 'error' | 'warning' }) {
  const config = {
    info: { bg: 'rgba(62,189,172,0.12)', color: '#0e7774', icon: 'i' },
    success: { bg: 'rgba(67,182,73,0.12)', color: '#026937', icon: '✓' },
    error: { bg: 'rgba(192,57,43,0.10)', color: '#a93226', icon: '!' },
    warning: { bg: 'rgba(212,160,23,0.12)', color: '#9a7d0a', icon: '!' },
  };
  const c = config[type];

  return (
    <div
      className="lg-toast lg-slide-up mx-4 mb-4 px-4 py-3 flex items-start gap-2.5"
      style={{ background: c.bg }}
    >
      <div
        className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 mt-0.5"
        style={{ background: c.color }}
      >
        {c.icon}
      </div>
      <p className="text-[14px] font-medium leading-snug" style={{ color: c.color }}>
        {message}
      </p>
    </div>
  );
}

// ============================================================
// Score — Liquid Glass pills
// ============================================================
function ScoreBar({ score, mistakes }: { score: number; mistakes: number }) {
  return (
    <div className="flex justify-center gap-3 mb-4 px-4">
      <div className="lg-badge" style={{ background: 'rgba(2,105,55,0.12)', color: '#026937' }}>
        <span className="text-[15px]">★</span> {score} pts
      </div>
      <div className="lg-badge" style={{ background: 'rgba(192,57,43,0.10)', color: '#a93226' }}>
        <span className="text-[15px]">♥</span> {mistakes} {mistakes === 1 ? 'error' : 'errores'}
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
    setPieces(Array.from({ length: 45 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: ['#026937','#35944b','#43b649','#8dc63f','#3ebdac','#069a7e','#0e7774'][Math.floor(Math.random() * 7)],
      delay: Math.random() * 2.5,
      w: Math.random() * 6 + 4,
      h: Math.random() * 8 + 4,
    })));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.x}%`,
            backgroundColor: p.color,
            width: `${p.w}px`,
            height: `${p.h}px`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            opacity: 0.85,
          }}
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

  const showMsg = (msg: string, type: 'info' | 'success' | 'error' | 'warning') => {
    setMessage(msg);
    setMessageType(type);
  };

  const initGame = useCallback(() => {
    setCards(createCards(generateArray(8)));
    setPhase('intro');
    setRuns([]);
    setScore(0);
    setMistakes(0);
    setSplitMarkers(new Set());
    setCurrentRunIndex(0);
    setSelectedCardIdx(null);
    setMergePairIndex(0);
    setMergedResult([]);
    setMessage('');
  }, []);

  useEffect(() => { initGame(); }, [initGame]);

  // --- Phase 1 ---
  const toggleSplit = (index: number) => {
    const next = new Set(splitMarkers);
    if (next.has(index)) next.delete(index); else next.add(index);
    setSplitMarkers(next);
  };

  const confirmSplits = () => {
    if (splitMarkers.size === 0) { showMsg('Toca entre las cartas para marcar al menos un corte', 'warning'); return; }
    const newRuns = createRunsFromSplits(cards, Array.from(splitMarkers));
    if (newRuns.some(r => r.cards.length > 5)) { showMsg('Maximo 5 elementos por run. Divide mas.', 'warning'); return; }
    if (newRuns.filter(r => r.cards.length < 2).length > 1) { showMsg('Cada run debe tener al menos 2 elementos.', 'warning'); return; }

    newRuns.forEach((r, i) => { r.color = RUN_COLORS[i % RUN_COLORS.length]; });
    setRuns(newRuns);
    setScore(prev => prev + 10);

    const firstUnsorted = newRuns.findIndex(r => !r.sorted);
    if (firstUnsorted === -1) {
      setScore(prev => prev + 20);
      if (newRuns.length === 1) { setPhase('victory'); showMsg('El array ya estaba ordenado!', 'success'); }
      else { setPhase('merge'); showMsg('Todos los runs ya estan ordenados. A fusionar!', 'success'); resetMerge(); }
    } else {
      setCurrentRunIndex(firstUnsorted);
      setSelectedCardIdx(null);
      setPhase('insertion-sort');
      showMsg('Toca una carta y luego toca donde quieres moverla', 'info');
    }
  };

  const getCardSplitColor = (index: number): string => {
    let group = 0;
    for (const m of Array.from(splitMarkers).sort((a, b) => a - b)) { if (index >= m) group++; }
    return RUN_COLORS[group % RUN_COLORS.length];
  };

  // --- Phase 2 ---
  const handleInsertionTap = (runIdx: number, cardIdx: number) => {
    if (runIdx !== currentRunIndex || runs[runIdx].sorted) return;
    if (selectedCardIdx === null) { setSelectedCardIdx(cardIdx); return; }
    if (selectedCardIdx === cardIdx) { setSelectedCardIdx(null); return; }

    const newRuns = [...runs];
    const run = { ...newRuns[runIdx], cards: [...newRuns[runIdx].cards] };
    const [moved] = run.cards.splice(selectedCardIdx, 1);
    run.cards.splice(cardIdx, 0, moved);
    run.sorted = isRunSorted(run.cards);
    newRuns[runIdx] = run;
    setRuns(newRuns);
    setSelectedCardIdx(null);

    if (run.sorted) {
      setScore(prev => prev + 15);
      showMsg(`Run ${runIdx + 1} ordenado!`, 'success');
      const next = newRuns.findIndex((r, i) => i > runIdx && !r.sorted);
      if (next === -1) {
        setTimeout(() => {
          if (newRuns.length === 1) { setPhase('victory'); showMsg('Array ordenado!', 'success'); }
          else { setPhase('merge'); showMsg('Todos los runs ordenados. Ahora fusionalos!', 'success'); resetMerge(); }
        }, 600);
      } else { setTimeout(() => setCurrentRunIndex(next), 400); }
    }
  };

  // --- Phase 3 ---
  const resetMerge = () => { setMergePairIndex(0); setMergedResult([]); setMergeLeftPointer(0); setMergeRightPointer(0); };

  const getCurrentPair = (): [Run, Run] | null => {
    const idx = mergePairIndex * 2;
    return idx + 1 < runs.length ? [runs[idx], runs[idx + 1]] : null;
  };

  const handleMergeSelect = (side: 'left' | 'right') => {
    const pair = getCurrentPair();
    if (!pair) return;
    const [left, right] = pair;
    if (side === 'left' && mergeLeftPointer >= left.cards.length) return;
    if (side === 'right' && mergeRightPointer >= right.cards.length) return;

    const lc = left.cards[mergeLeftPointer], rc = right.cards[mergeRightPointer];
    if (mergeLeftPointer < left.cards.length && mergeRightPointer < right.cards.length) {
      const correct = lc.value <= rc.value ? 'left' : 'right';
      if (side !== correct) {
        setMistakes(prev => prev + 1);
        showMsg(`Elige el menor: ${correct === 'left' ? lc.value : rc.value} < ${correct === 'left' ? rc.value : lc.value}`, 'error');
        return;
      }
    }

    const sel = side === 'left' ? lc : rc;
    const newMerged = [...mergedResult, sel];
    setMergedResult(newMerged);
    setScore(prev => prev + 5);

    const nLP = side === 'left' ? mergeLeftPointer + 1 : mergeLeftPointer;
    const nRP = side === 'right' ? mergeRightPointer + 1 : mergeRightPointer;
    if (side === 'left') setMergeLeftPointer(nLP); else setMergeRightPointer(nRP);

    if (nLP >= left.cards.length && nRP >= right.cards.length) { finishMerge(newMerged); }
    else if (nLP >= left.cards.length) {
      const f = [...newMerged, ...right.cards.slice(nRP)];
      setMergedResult(f); setMergeRightPointer(right.cards.length);
      setTimeout(() => finishMerge(f), 500);
    } else if (nRP >= right.cards.length) {
      const f = [...newMerged, ...left.cards.slice(nLP)];
      setMergedResult(f); setMergeLeftPointer(left.cards.length);
      setTimeout(() => finishMerge(f), 500);
    }
  };

  const finishMerge = (merged: NumberCard[]) => {
    const idx = mergePairIndex * 2;
    const newRuns = [...runs];
    newRuns.splice(idx, 2, { id: `merged-${Date.now()}`, cards: merged, sorted: true, color: newRuns[idx].color });
    setRuns(newRuns);
    setScore(prev => prev + 20);

    if (newRuns.length <= 1) {
      setTimeout(() => { setPhase('victory'); showMsg('Felicidades! TimSort completado!', 'success'); }, 400);
    } else {
      showMsg(`Merge completo! Quedan ${newRuns.length} runs.`, 'success');
      setTimeout(() => { setMergePairIndex(0); setMergedResult([]); setMergeLeftPointer(0); setMergeRightPointer(0); }, 600);
    }
  };

  // ======================== RENDER ========================
  return (
    <div className="lg-background min-h-[100dvh] flex flex-col safe-area-top safe-area-bottom">

      {/* ===== INTRO ===== */}
      {phase === 'intro' && (
        <div className="flex-1 flex flex-col px-5 pt-14 pb-8">
          <div className="text-center mb-8 lg-slide-up">
            <h1 className="text-[34px] font-bold tracking-tight" style={{ color: '#1a2e22' }}>
              TimSort
            </h1>
            <p className="text-[15px] mt-1" style={{ color: '#6b7c72' }}>
              Aprende ordenamiento jugando
            </p>
          </div>

          {/* How it works */}
          <div className="lg-panel p-5 mb-5 lg-slide-up" style={{ animationDelay: '0.08s' }}>
            <h2 className="text-[17px] font-bold mb-4" style={{ color: '#1a2e22' }}>Como funciona?</h2>
            <div className="space-y-4">
              {[
                { num: 1, color: '#026937', title: 'Dividir en Runs', desc: 'Separa el array en sub-grupos pequenos' },
                { num: 2, color: '#069a7e', title: 'Insertion Sort', desc: 'Ordena cada grupo individualmente' },
                { num: 3, color: '#43b649', title: 'Merge', desc: 'Fusiona los grupos eligiendo el menor' },
              ].map(step => (
                <div key={step.num} className="flex items-start gap-3">
                  <div
                    className="lg-phase-dot shrink-0"
                    style={{
                      background: `linear-gradient(145deg, ${step.color}dd, ${step.color})`,
                      color: '#fff',
                      width: 28, height: 28, fontSize: 13,
                      boxShadow: `0 2px 8px ${step.color}33, 0 0.5px 0 rgba(255,255,255,0.4) inset`,
                    }}
                  >
                    {step.num}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold" style={{ color: '#1a2e22' }}>{step.title}</p>
                    <p className="text-[13px] leading-snug" style={{ color: '#6b7c72' }}>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Array preview */}
          <div className="lg-panel p-5 mb-8 lg-slide-up" style={{ animationDelay: '0.16s' }}>
            <p className="text-[12px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>
              ARRAY A ORDENAR
            </p>
            <div className="flex gap-2.5 justify-center flex-wrap">
              {cards.map((card, i) => (
                <NumberCardComponent
                  key={card.id}
                  card={card}
                  color="#026937"
                  animationDelay={i * 60 + 200}
                  size="lg"
                />
              ))}
            </div>
          </div>

          <div className="mt-auto lg-slide-up" style={{ animationDelay: '0.24s' }}>
            <button
              onClick={() => { setPhase('identify-runs'); showMsg('Toca los espacios entre cartas para dividir en runs', 'info'); }}
              className="lg-btn lg-btn-primary w-full text-[17px]"
            >
              Comenzar
            </button>
          </div>
        </div>
      )}

      {/* ===== GAME PHASES ===== */}
      {phase !== 'intro' && phase !== 'victory' && (
        <div className="flex-1 flex flex-col px-4 pt-6 pb-6">
          <PhaseIndicator phase={phase} />
          <ScoreBar score={score} mistakes={mistakes} />
          {message && <Toast message={message} type={messageType} />}

          {/* PHASE 1: IDENTIFY RUNS */}
          {phase === 'identify-runs' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-4">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 1</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Divide el array en runs</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>
                  Toca las lineas entre cartas para cortar. Busca secuencias ya ordenadas.
                </p>
              </div>

              <div className="lg-panel p-4 flex-1 flex flex-col justify-center mb-4">
                <div className="flex items-center justify-center flex-wrap gap-y-3">
                  {cards.map((card, i) => (
                    <React.Fragment key={card.id}>
                      <NumberCardComponent
                        card={card}
                        color={splitMarkers.size > 0 ? getCardSplitColor(i) : '#007aff'}
                        animationDelay={i * 40}
                      />
                      {i < cards.length - 1 && (
                        <button
                          onClick={() => toggleSplit(i + 1)}
                          className={`lg-split-btn ${splitMarkers.has(i + 1) ? 'lg-split-btn-active' : ''}`}
                        >
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

          {/* PHASE 2: INSERTION SORT */}
          {phase === 'insertion-sort' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-4">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 2</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Ordena cada run</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>
                  Toca una carta para seleccionarla, luego toca la posicion destino.
                </p>
              </div>

              <div className="space-y-3 flex-1">
                {runs.map((run, runIdx) => {
                  const isActive = runIdx === currentRunIndex && !run.sorted;
                  return (
                    <div
                      key={run.id}
                      className={`lg-panel lg-panel-sm p-4 transition-all duration-300 ${
                        isActive ? 'lg-panel-active' : run.sorted ? 'lg-panel-success' : ''
                      }`}
                      style={{ opacity: !isActive && !run.sorted ? 0.45 : 1 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: run.color, boxShadow: `0 0 6px ${run.color}44` }}
                        />
                        <span className="text-[13px] font-semibold" style={{ color: '#1a2e22' }}>
                          Run {runIdx + 1}
                        </span>
                        {run.sorted && (
                          <span className="lg-badge text-[12px]" style={{ background: 'rgba(52,199,89,0.12)', color: '#026937' }}>
                            ✓ Listo
                          </span>
                        )}
                        {isActive && (
                          <span className="lg-badge text-[12px]" style={{ background: `${run.color}15`, color: run.color }}>
                            Ordenar
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {run.cards.map((card, cardIdx) => (
                          <NumberCardComponent
                            key={card.id}
                            card={card}
                            color={run.sorted ? '#43b649' : run.color}
                            selected={isActive && selectedCardIdx === cardIdx}
                            dimmed={!isActive && !run.sorted}
                            onClick={() => handleInsertionTap(runIdx, cardIdx)}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PHASE 3: MERGE */}
          {phase === 'merge' && (
            <div className="flex-1 flex flex-col lg-slide-up">
              <div className="lg-panel lg-panel-sm p-4 mb-4">
                <p className="text-[12px] font-semibold tracking-wide mb-0.5" style={{ color: '#8fa396' }}>PASO 3</p>
                <p className="text-[16px] font-semibold" style={{ color: '#1a2e22' }}>Fusiona los runs</p>
                <p className="text-[13px] mt-1 leading-snug" style={{ color: '#6b7c72' }}>
                  Toca siempre la carta con el valor menor de los dos frentes.
                </p>
              </div>

              {(() => {
                const pair = getCurrentPair();
                if (!pair) return null;
                const [left, right] = pair;

                return (
                  <div className="space-y-3 flex-1">
                    {/* Left run */}
                    <div className="lg-panel lg-panel-sm p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: left.color }}>Run A</p>
                      <div className="flex gap-2 flex-wrap">
                        {left.cards.map((card, i) => (
                          <NumberCardComponent
                            key={card.id}
                            card={card}
                            color={left.color}
                            done={i < mergeLeftPointer}
                            highlighted={i === mergeLeftPointer}
                            showPointer={i === mergeLeftPointer}
                            onClick={() => { if (i === mergeLeftPointer) handleMergeSelect('left'); }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* VS divider */}
                    <div className="flex items-center justify-center">
                      <div className="lg-badge" style={{ background: 'rgba(255,255,255,0.5)', color: '#6b7c72', fontSize: 11, fontWeight: 700 }}>
                        VS
                      </div>
                    </div>

                    {/* Right run */}
                    <div className="lg-panel lg-panel-sm p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: right.color }}>Run B</p>
                      <div className="flex gap-2 flex-wrap">
                        {right.cards.map((card, i) => (
                          <NumberCardComponent
                            key={card.id}
                            card={card}
                            color={right.color}
                            done={i < mergeRightPointer}
                            highlighted={i === mergeRightPointer}
                            showPointer={i === mergeRightPointer}
                            onClick={() => { if (i === mergeRightPointer) handleMergeSelect('right'); }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Merged result */}
                    <div className="lg-panel lg-panel-sm lg-panel-success p-4">
                      <p className="text-[13px] font-semibold mb-2.5" style={{ color: '#026937' }}>
                        Resultado ({mergedResult.length}/{left.cards.length + right.cards.length})
                      </p>
                      <div className="flex gap-2 flex-wrap min-h-[52px]">
                        {mergedResult.length === 0 ? (
                          <p className="text-[13px] italic" style={{ color: '#b0c4b8' }}>Toca las cartas de arriba...</p>
                        ) : mergedResult.map((card, i) => (
                          <NumberCardComponent key={`m-${card.id}-${i}`} card={card} color="#43b649" size="sm" animationDelay={0} />
                        ))}
                      </div>
                    </div>

                    {runs.length > 2 && (
                      <div className="px-1">
                        <p className="text-[11px] font-semibold tracking-wide mb-1.5" style={{ color: '#8fa396' }}>EN ESPERA</p>
                        <div className="flex gap-2 flex-wrap">
                          {runs.slice(2).map(run => (
                            <div key={run.id} className="lg-badge" style={{ background: `${run.color}12`, color: run.color }}>
                              [{run.cards.map(c => c.value).join(', ')}]
                            </div>
                          ))}
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

      {/* ===== VICTORY ===== */}
      {phase === 'victory' && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 pb-8">
          <Confetti />

          <div className="text-[64px] mb-3 lg-pop">🏆</div>
          <h2 className="text-[28px] font-bold tracking-tight mb-1" style={{ color: '#1a2e22' }}>
            Completado!
          </h2>
          <p className="text-[15px] mb-8" style={{ color: '#6b7c72' }}>Has dominado TimSort</p>

          <div className="lg-panel p-6 w-full max-w-sm mb-8 lg-slide-up">
            <div className="flex justify-around mb-6">
              <div className="text-center">
                <p className="text-[36px] font-bold" style={{ color: '#43b649' }}>{score}</p>
                <p className="text-[13px] font-medium" style={{ color: '#6b7c72' }}>Puntos</p>
              </div>
              <div style={{ width: '0.5px', background: 'rgba(0,0,0,0.08)', alignSelf: 'stretch' }} />
              <div className="text-center">
                <p className="text-[36px] font-bold" style={{ color: '#c0392b' }}>{mistakes}</p>
                <p className="text-[13px] font-medium" style={{ color: '#6b7c72' }}>Errores</p>
              </div>
            </div>

            <p className="text-[11px] font-semibold tracking-wide mb-3" style={{ color: '#8fa396' }}>RESULTADO FINAL</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {(runs.length > 0 ? runs[0].cards : cards).map((card, i) => (
                <NumberCardComponent key={card.id} card={card} color="#43b649" animationDelay={i * 80} size="sm" />
              ))}
            </div>
          </div>

          <button onClick={initGame} className="lg-btn lg-btn-primary w-full max-w-sm">
            Jugar de nuevo
          </button>

          <p className="text-[11px] mt-6 text-center" style={{ color: '#b0c4b8' }}>
            TimSort: O(n log n) peor caso · O(n) mejor caso
          </p>
        </div>
      )}
    </div>
  );
}
