import React, { useState } from 'react';
import { askCommanderSI } from '../services/geminiService';
import { X, Send, Sparkles, User, Loader2, Compass, Shield, Award } from 'lucide-react';

interface CommanderAIModalProps {
  isOpen: boolean;
  onClose: () => void;
  chamberState: any;
  isBeginnerMode: boolean;
}

interface Message {
  sender: 'user' | 'captain';
  text: string;
}

const QUICK_QUESTIONS = [
  'What happens if Hydrogen leaks into our Artemis 34% O₂ cabin?',
  'Why is throwing water on a space station fire dangerous?',
  'Can an astronaut blow out a space fire like a birthday candle?',
  'What does zero gravity actually mean?',
  'Explain the 1997 Mir space station fire.',
  'Why does Silane explode without a spark?',
];

export const CommanderAIModal: React.FC<CommanderAIModalProps> = ({
  isOpen,
  onClose,
  chamberState,
  isBeginnerMode,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'captain',
      text: `Greetings! I am Captain, your spacecraft Fire Safety Super Intelligence. Station status nominal. What are your orders or questions regarding our cabin atmosphere, gas chemistry, and zero-gravity combustion?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const q = questionText || input.trim();
    if (!q || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setInput('');
    setIsLoading(true);

    try {
      const answer = await askCommanderSI(q, chamberState, isBeginnerMode);
      setMessages((prev) => [...prev, { sender: 'captain', text: answer }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'captain',
          text: 'Captain here: Telemetry link experienced a transient glitch, but our emergency protocols remain clear: cut cabin fans immediately and isolate the module to starve the flame sphere!',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Award className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                Captain
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 font-sans">
                  Space Safety SI
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700 font-sans">
                  GEMINI 3.8 FLASH
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {isBeginnerMode ? 'Guest Mode: Plain everyday language & clear tactical advice' : 'Technical Mode: Aerospace combustion thermodynamics'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'captain' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-slate-950 font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                  C
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed whitespace-pre-line ${
                  m.sender === 'user'
                    ? 'bg-cyan-500 text-slate-950 font-medium font-sans shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                }`}
              >
                {m.text}
              </div>

              {m.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-cyan-600/30 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono py-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Captain is analyzing spacecraft telemetry...</span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/50 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] font-mono text-cyan-400 shrink-0 font-bold">Ask Captain:</span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 whitespace-nowrap transition-all active:scale-95"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask Captain about zero-gravity, gas leaks, or fire safety..."
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-bold text-xs font-mono transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
