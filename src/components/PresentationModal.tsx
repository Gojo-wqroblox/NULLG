import React, { useState, useEffect } from 'react';
import { PRESENTATION_SLIDES } from '../data/presentationSlides';
import { PresentationSlide } from '../types';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Sparkles,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Flame,
  CheckCircle,
  Globe2,
  Orbit,
  Compass,
  ShieldAlert,
} from 'lucide-react';

interface PresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPresetScenario?: (slideId: number) => void;
  isBeginnerMode: boolean;
}

export const PresentationModal: React.FC<PresentationModalProps> = ({
  isOpen,
  onClose,
  onApplyPresetScenario,
  isBeginnerMode,
}) => {
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAstronomyGlossary, setShowAstronomyGlossary] = useState(false);

  const slide = PRESENTATION_SLIDES[currentSlideIdx];

  // Auto play presentation timer
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentSlideIdx((prev) => (prev + 1) % PRESENTATION_SLIDES.length);
      }, 9500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  // Voice narration using Web Speech API
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = `${slide.title}. ${slide.analogyContent}. Astronaut rule: ${slide.takeaway}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Stop speech when slide changes or closes
  useEffect(() => {
    if ('speechSynthesis' in window && isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [currentSlideIdx, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                NULL-G Space Presentation & Masterclass
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-sans">
                  Guest Mode Friendly
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Interactive space exploration fire briefing: How flames behave when gravity vanishes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Astronomy Principles Guide Trigger */}
            <button
              onClick={() => setShowAstronomyGlossary(!showAstronomyGlossary)}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                showAstronomyGlossary
                  ? 'bg-indigo-500 text-white border-indigo-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="Astronomy & Space Fire Principles"
            >
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">Space Physics 101</span>
            </button>

            {/* Read Aloud Voice Button */}
            <button
              onClick={handleToggleSpeak}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isSpeaking
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="Voice Narrator"
            >
              {isSpeaking ? (
                <div className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4 animate-bounce" />
                  <span className="flex gap-0.5 items-end h-3">
                    <span className="w-0.5 h-2 bg-slate-950 animate-pulse" />
                    <span className="w-0.5 h-3 bg-slate-950 animate-pulse delay-75" />
                    <span className="w-0.5 h-1.5 bg-slate-950 animate-pulse delay-150" />
                  </span>
                </div>
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{isSpeaking ? 'Narrating...' : 'Read Aloud'}</span>
            </button>

            {/* Auto Play Slides */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                isPlaying
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
              title="Auto Play Slides"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Progress Indicator Bar */}
        <div className="w-full h-1.5 bg-slate-800 flex">
          {PRESENTATION_SLIDES.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => setCurrentSlideIdx(idx)}
              className={`h-full flex-1 cursor-pointer transition-all ${
                idx === currentSlideIdx
                  ? 'bg-cyan-400 shadow-sm shadow-cyan-400/50'
                  : idx < currentSlideIdx
                  ? 'bg-cyan-700'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        {/* Slide Body or Astronomy Principles Guide */}
        {showAstronomyGlossary ? (
          /* Astronomy 101 Principles Guide Panel for Guest Mode */
          <div className="flex-1 overflow-y-auto p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                Astronomy & Space Fire Safety Principles (Guest Guide)
              </h3>
              <button
                onClick={() => setShowAstronomyGlossary(false)}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300"
              >
                Back to Presentation Slides &rarr;
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs mb-1.5">
                  <Orbit className="w-4 h-4" />
                  <span>1. Why is there Zero Gravity in Orbit?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Astronauts don’t float because Earth’s gravity is gone! At the Space Station altitude (250 miles up), Earth’s gravity is still <b>90% as strong as on Earth</b>. Astronauts float because they are in <b>constant freefall</b> traveling sideways at 17,500 mph! Since everything falls together, gravity feels zero (microgravity).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs mb-1.5">
                  <Flame className="w-4 h-4" />
                  <span>2. Why Do Earth Flames Point Upward?</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On Earth, heat causes air molecules to spread out, making hot air lighter (less dense). Gravity pulls heavy cold air down, which kicks the hot air upward (buoyancy!). In space, with no buoyant force, hot air stays right where it is, forming a <b>gentle glowing sphere</b>!
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-rose-400 font-mono font-bold text-xs mb-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>3. The Moon (0.16g) & Mars (0.38g) Fire Behavior</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  On the Moon, gravity is only 1/6th of Earth; on Mars, it is 1/3rd. Because gravity is weak, buoyant updrafts are slow and lazy. Flames are fatter, dimmer, and flicker at much lower speeds (3–5 Hz instead of 15 Hz on Earth).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs mb-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>4. Why Water Hoses Cannot Be Used on Spaceships</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If astronauts sprayed a water hose inside the space station, the water would break into floating, electrically-conductive liquid blobs. These blobs get sucked into avionics computers, short-circuiting life support! Instead, astronauts use clean heavy gases (FK-5-1-12) or microscopic water mist.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200">
              <strong className="text-cyan-400 font-mono">The Space Fire Tetrahedron:</strong> On Earth, fire needs Fuel, Oxygen, and Heat. In microgravity, fire also depends completely on <b>Forced Ventilation (Fans)</b> to bring fresh oxygen to the sphere!
            </div>
          </div>
        ) : (
          /* Standard Slide Deck View */
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
            {/* Slide Title & Badge */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                  Slide 0{slide.id} — {slide.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {currentSlideIdx + 1} of {PRESENTATION_SLIDES.length}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {slide.title}
              </h1>
              <p className="text-sm text-cyan-300 font-mono mt-0.5">
                {slide.subtitle}
              </p>
            </div>

            {/* Everyday Layperson Analogy Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-indigo-950/30 border border-cyan-500/30 shadow-lg">
              <div className="flex items-center gap-2 text-cyan-400 font-mono font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Guest Analogy: {slide.analogyTitle}</span>
              </div>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {slide.analogyContent}
              </p>
            </div>

            {/* Slide Visual Diagram Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {slide.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {pt.tag || `Fact 0${idx + 1}`}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-cyan-400/80" />
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 mb-1">
                      {pt.title}
                    </h4>
                    <p className="text-xs text-slate-400 leading-normal">
                      {pt.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Aerospace Combustion Physics */}
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400">
              <span className="font-mono font-semibold text-slate-300 block mb-1">
                🔬 Aerospace Combustion Physics:
              </span>
              <p className="leading-relaxed font-mono text-[11px] text-slate-400">
                {slide.technicalDepth}
              </p>
            </div>

            {/* Golden Takeaway Rule */}
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-400 font-mono uppercase tracking-wider block mb-0.5">
                  Astronaut Survival Takeaway:
                </strong>
                <span>{slide.takeaway}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Navigation Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => setCurrentSlideIdx((prev) => Math.max(0, prev - 1))}
            disabled={currentSlideIdx === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-300 text-xs font-mono transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          {/* Quick preset trigger */}
          {onApplyPresetScenario && (
            <button
              onClick={() => {
                onApplyPresetScenario(slide.id);
                onClose();
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-mono transition-all active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-pink-400" />
              Load This Scenario in Chamber
            </button>
          )}

          <button
            onClick={() =>
              setCurrentSlideIdx((prev) => (prev + 1) % PRESENTATION_SLIDES.length)
            }
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all shadow-md shadow-cyan-500/20 active:scale-95"
          >
            {currentSlideIdx === PRESENTATION_SLIDES.length - 1 ? 'Start Over' : 'Next Slide'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
