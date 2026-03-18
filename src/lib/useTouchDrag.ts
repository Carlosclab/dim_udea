'use client';

import { useRef, useCallback, useState } from 'react';

export interface DragState {
  dragging: boolean;
  dragIdx: number | null;
  ghostPos: { x: number; y: number } | null;
  overIdx: number | null;
}

const INITIAL: DragState = { dragging: false, dragIdx: null, ghostPos: null, overIdx: null };

/**
 * Touch drag-and-drop for a horizontal card list on mobile.
 * - Short hold (100ms) or movement (>6px) triggers drag
 * - Ghost follows finger, cards react with scale/border
 * - onReorder(from, to) fires on drop
 * - Tap still works when no drag detected
 */
export function useTouchDrag(
  itemCount: number,
  onReorder: (from: number, to: number) => void,
  enabled: boolean = true,
) {
  const [state, setState] = useState<DragState>(INITIAL);

  // Use refs for mutable drag session data so callbacks always see latest
  const dragRef = useRef<DragState>(INITIAL);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());
  const startPos = useRef<{ x: number; y: number; idx: number } | null>(null);
  const didDrag = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sync = useCallback((next: DragState) => {
    dragRef.current = next;
    setState(next);
  }, []);

  const registerCard = useCallback((idx: number, el: HTMLElement | null) => {
    if (el) cardRefs.current.set(idx, el);
    else cardRefs.current.delete(idx);
  }, []);

  const findOverIdx = useCallback((x: number, y: number): number | null => {
    let closest: number | null = null;
    let minDist = Infinity;
    for (const [idx, el] of cardRefs.current.entries()) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      if (d < minDist) { minDist = d; closest = idx; }
    }
    return closest;
  }, []);

  const startDrag = useCallback((idx: number, x: number, y: number) => {
    didDrag.current = true;
    sync({ dragging: true, dragIdx: idx, ghostPos: { x, y }, overIdx: idx });
  }, [sync]);

  const handleTouchStart = useCallback((idx: number, e: React.TouchEvent) => {
    if (!enabled) return;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY, idx };
    didDrag.current = false;
    // Start drag on short hold
    timer.current = setTimeout(() => startDrag(idx, t.clientX, t.clientY), 100);
  }, [enabled, startDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    const t = e.touches[0];
    const sp = startPos.current;

    // Not yet dragging: check threshold
    if (!dragRef.current.dragging && sp) {
      if (Math.abs(t.clientX - sp.x) > 6 || Math.abs(t.clientY - sp.y) > 6) {
        if (timer.current) { clearTimeout(timer.current); timer.current = null; }
        startDrag(sp.idx, t.clientX, t.clientY);
      }
      return;
    }

    if (!dragRef.current.dragging) return;

    const overIdx = findOverIdx(t.clientX, t.clientY);
    sync({ ...dragRef.current, ghostPos: { x: t.clientX, y: t.clientY }, overIdx });
  }, [enabled, findOverIdx, startDrag, sync]);

  const handleTouchEnd = useCallback(() => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const d = dragRef.current;

    if (d.dragging && d.dragIdx !== null && d.overIdx !== null && d.dragIdx !== d.overIdx) {
      onReorder(d.dragIdx, d.overIdx);
    }

    startPos.current = null;
    sync(INITIAL);
  }, [onReorder, sync]);

  const wasDrag = useCallback(() => didDrag.current, []);

  return { state, registerCard, handleTouchStart, handleTouchMove, handleTouchEnd, wasDrag };
}
