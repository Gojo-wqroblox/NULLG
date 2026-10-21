import React from 'react';
import { X, Sparkles, HelpCircle, Flame, Shield, Wind, Droplets, Zap } from 'lucide-react';

interface BeginnerGlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BeginnerGlossaryModal: React.FC<BeginnerGlossaryModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const GLOSSARY_CARDS = [
    {
      icon: Flame,
      title: 'Why Fire Turns into a Blue Ball in Space',
      analogy: 'The Hot Air Balloon Effect',
      explanation:
        'On Earth, hot air floats up because it is lighter than cold air. That’s why campfire flames are tall, pointy, and flicker. In space, there is zero gravity—so there is NO "up" or "down"! Heat expands evenly in all directions, turning the flame into a quiet, glowing blue sphere.',
    },
    {
      icon: Wind,
      title: 'Why You Cannot Blow Out a Space Fire',
      analogy: 'Blowing on Soup vs Fanning Campfires',
      explanation:
        'In zero-g, a flame quickly burns the oxygen right next to it and gets trapped in its own cloud of smoke (CO₂), slowly putting itself out. But if you blow on it or turn on the spaceship air conditioning, you blow fresh oxygen straight into the flame, turning a calm sphere into a raging blowtorch!',
    },
    {
      icon: Droplets,
      title: 'Why Water Hoses Are Banned on Space Stations',
      analogy: 'Throwing a Bucket of Water into a Laptop',
      explanation:
        'In zero gravity, water doesn’t fall to the ground—it breaks into floating conductive water blobs. If an astronaut sprayed a hose, the water blobs would float into million-dollar flight guidance computers, short-circuiting life support! Instead, astronauts use clean heavy gases (FK-5-1-12) or microscopic mist that vanishes into steam.',
    },
    {
      icon: Zap,
      title: 'The "Invisible Ninja": Hydrogen Fuel Leaks',
      analogy: 'A Ghost Flame You Can Walk Into',
      explanation:
        'Hydrogen burns with almost zero smoke and an ultra-faint, pale ultraviolet blue light. In a well-lit spacecraft module, astronauts cannot see a burning hydrogen flame with their eyes! They must use thermal infrared cameras to detect the invisible 2,000°C wall of heat.',
    },
    {
      icon: Shield,
      title: 'Why Nitrogen is Humanity’s Fire Shield',
      analogy: 'The Peaceful Crowd',
      explanation:
        'Earth’s air is 78% Nitrogen. Nitrogen does not catch fire; it just hangs around soaking up heat like a cold sponge. Without nitrogen (like in the tragic Apollo 1 mission with 100% pure oxygen), materials like clothing and Velcro explode into flames in less than 10 seconds.',
    },
    {
      icon: Sparkles,
      title: 'NASA’s "Cool Flames" Discovery',
      analogy: 'Zombie Flames That Won’t Die',
      explanation:
        'During experiments on the ISS, NASA scientists saw droplet flames seemingly extinguish and disappear. But thermal sensors revealed the fire was still silently burning at 400°C with no visible light and no smoke! These low-temperature "cool flames" can only exist when buoyancy doesn’t whisk fuel away.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">
                Space Cadet Beginner Guide
              </h3>
              <p className="text-xs text-slate-400">
                Simple everyday analogies for people new to space physics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {GLOSSARY_CARDS.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      {card.analogy}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">
                    {card.title}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {card.explanation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-mono">
            Tip: You can toggle Beginner Mode anytime in the top navigation bar!
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-all"
          >
            Understood, Commander
          </button>
        </div>
      </div>
    </div>
  );
};
