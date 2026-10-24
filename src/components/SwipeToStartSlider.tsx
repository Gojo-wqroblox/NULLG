/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Interactive Swipe-To-Start Slider
 * Supports mouse drag and mobile touch gestures with physics spring-back
 * and aerospace hatch unlock sound & visual feedback.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsRight, Flame, Rocket, CheckCircle2, Lock } from 'lucide-react';
import { playSuccessChime } from '../utils/emergencyAudio';

interface SwipeToStartSliderProps {
  onSwipeComplete: () => void;
  label?: string;
  subLabel?: string;
  disabled?: boolean;
}

export const SwipeToStartSlider: React.FC<SwipeToStartSliderProps> = ({
  onSwipeComplete,
  label = 'Swipe to Enter Microgravity Lab',
  subLabel = 'Initialize ISS Combustion Chamber',
  disabled = false,
}) => {
  const [dragX, setDragX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const startXRef = useRef<number>(0);
  const initialDragXRef = useRef<number>(0);

  const KNOB_WIDTH = 54; // px
  const PADDING = 4; // px

  const getMaxDrag = useCallback((): number => {
    if (!trackRef.current) return 240;
    return Math.max(80, trackRef.current.clientWidth - KNOB_WIDTH - PADDING * 2);
  }, []);

  const progress = Math.min(100, Math.max(0, (dragX / (getMaxDrag() || 1)) * 100));

  // Trigger completion
  const handleComplete = useCallback(() => {
    setIsCompleted(true);
    const max = getMaxDrag();
    setDragX(max);

    // Haptic feedback if supported
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.vibrate) {
      try {
        navigator.vibrate([40, 30, 80]);
      } catch {
        // Ignore haptic errors
      }
    }

    try {
      playSuccessChime();
    } catch {
      // Audio autoplay fallback
    }

    setTimeout(() => {
      onSwipeComplete();
    }, 450);
  }, [getMaxDrag, onSwipeComplete]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    initialDragXRef.current = dragX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isCompleted) return;
    const currentX = e.touches[0].clientX;
    const delta = currentX - startXRef.current;
    const max = getMaxDrag();
    const newX = Math.min(max, Math.max(0, initialDragXRef.current + delta));
    setDragX(newX);

    if (newX >= max * 0.88) {
      setIsDragging(false);
      handleComplete();
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isCompleted) return;
    setIsDragging(false);
    const max = getMaxDrag();
    if (dragX >= max * 0.72) {
      handleComplete();
    } else {
      setDragX(0); // Snap back
    }
  };

  // Mouse handlers with window listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || isCompleted) return;
    setIsDragging(true);
    startXRef.current = e.clientX;
    initialDragXRef.current = dragX;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startXRef.current;
      const max = getMaxDrag();
      const newX = Math.min(max, Math.max(0, initialDragXRef.current + delta));
      setDragX(newX);

      if (newX >= max * 0.88) {
        setIsDragging(false);
        handleComplete();
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const max = getMaxDrag();
      if (dragX >= max * 0.72) {
        handleComplete();
      } else {
        setDragX(0); // Snap back smoothly
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragX, getMaxDrag, handleComplete]);

  return (
    <div className="w-full flex flex-col gap-1.5 select-none font-mono">
      <div
        ref={trackRef}
        className={`relative h-14 sm:h-16 w-full rounded-2xl bg-slate-950/90 border border-slate-800 p-1 flex items-center overflow-hidden transition-all shadow-inner ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        } ${isCompleted ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/20' : ''}`}
      >
        {/* Dynamic Track Glow Progress Fill */}
        <div
          className={`absolute left-0 top-0 bottom-0 rounded-xl transition-all ${
            isCompleted
              ? 'bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500'
              : 'bg-gradient-to-r from-cyan-900/60 via-cyan-600/40 to-teal-500/30'
          }`}
          style={{
            width: `${dragX + KNOB_WIDTH}px`,
            transition: isDragging ? 'none' : 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* Ambient Moving Shimmer behind text */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div
            className="flex items-center gap-1.5 text-xs sm:text-sm font-bold tracking-wider uppercase transition-opacity duration-200"
            style={{ opacity: Math.max(0.15, 1 - progress / 80) }}
          >
            {isCompleted ? (
              <span className="text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>CHAMBER ONLINE • ENTERING...</span>
              </span>
            ) : progress > 60 ? (
              <span className="text-cyan-300 animate-pulse flex items-center gap-1.5">
                <span>Release to Initialize</span>
                <ChevronsRight className="w-4 h-4" />
              </span>
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <span className="drop-shadow">{label}</span>
                <div className="flex items-center text-cyan-400 animate-pulse">
                  <ChevronsRight className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Floating Chevrons along track */}
        <div
          className="absolute right-4 pointer-events-none flex items-center gap-1 text-slate-600 transition-opacity"
          style={{ opacity: Math.max(0, 1 - progress / 50) }}
        >
          <ChevronsRight className="w-4 h-4 text-cyan-500/40 animate-pulse" />
          <ChevronsRight className="w-4 h-4 text-cyan-500/20" />
        </div>

        {/* Draggable Knob */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative z-10 w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center transition-transform shadow-xl active:scale-95 ${
            isCompleted
              ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-emerald-500/40'
              : progress > 60
              ? 'bg-cyan-400 text-slate-950 border border-white shadow-cyan-400/50'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 border border-cyan-300 shadow-cyan-500/30'
          }`}
          style={{
            transform: `translateX(${dragX}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.2s',
          }}
          role="slider"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
              handleComplete();
            }
          }}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-slate-950" />
          ) : progress > 60 ? (
            <Flame className="w-6 h-6 text-slate-950 animate-bounce" />
          ) : (
            <div className="flex items-center justify-center">
              <Rocket className="w-5 h-5 text-slate-950 rotate-45" />
            </div>
          )}
        </div>
      </div>

      {subLabel && (
        <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
          <span>{subLabel}</span>
          <span>{isCompleted ? '100%' : `${Math.round(progress)}% SWIPED`}</span>
        </div>
      )}
    </div>
  );
};
