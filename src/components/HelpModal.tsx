import { useState } from 'react';
import { BookOpen, Flag, Navigation, Radio, Compass, Clock, X, HelpCircle, FileText, Settings, Award } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [tab, setTab] = useState<'guides' | 'changelog' | 'about'>('guides');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
      {/* CRT Scan lines overlay */}
      <div className="absolute inset-0 screen-crt opacity-10 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-4xl h-[650px] bg-slate-900/90 border border-slate-700/50 rounded-2xl flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-blue-400" size={24} />
            <div>
              <h2 className="text-lg font-bold text-slate-200">Training Manual & Help Center</h2>
              <p className="text-slate-400 text-xs font-semibold tracking-wider">SYSTEM VERSION v1.2.0</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 p-2 gap-2">
          <button
            onClick={() => setTab('guides')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              tab === 'guides'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={14} /> Module Guides
          </button>
          <button
            onClick={() => setTab('changelog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              tab === 'changelog'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <FileText size={14} /> Change Log
          </button>
          <button
            onClick={() => setTab('about')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              tab === 'about'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Settings size={14} /> About System
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-950/20">
          
          {/* TAB: Guides */}
          {tab === 'guides' && (
            <div className="space-y-6">
              
              {/* Ship Sim */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-800/30 flex-shrink-0">
                  <Navigation size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">Ship Simulator</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Operate a vessel's helm with realistic controls. Practice throttle management, steering response, and docking. Supports both standard water vessels and helicopter flight dynamics (cyclic joystick control, altitude management).
                  </p>
                </div>
              </div>

              {/* Radio Game */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-emerald-900/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-800/30 flex-shrink-0">
                  <Radio size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">Radio Operations</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Teaches VHF communication standards. Practice formatting distress messages (MAYDAY) and handling accidental alarm cancellation logs. Interactive red DISTRESS button plays simulated alert sounds and opens cancellations scenarios.
                  </p>
                </div>
              </div>

              {/* Alphabet */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-purple-900/20 rounded-xl flex items-center justify-center text-purple-400 border border-purple-800/30 flex-shrink-0">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">Phonetic Alphabet</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Learn the NATO phonetic alphabet standard. Review dynamic visual flashcards and practice spelling drills using nautical terminology (e.g. Juliet, Alpha, Sierra, Echo, Romeo).
                  </p>
                </div>
              </div>

              {/* Flags */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-yellow-900/20 rounded-xl flex items-center justify-center text-yellow-400 border border-yellow-800/30 flex-shrink-0">
                  <Flag size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">Flags & Pennants</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Study international maritime signal flags. Learn both the alphabetical, numeral, and specific military meanings of each flag (e.g., Alfa: "diver down", Bravo: "dangerous cargo").
                  </p>
                </div>
              </div>

              {/* Knots */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-blue-950/20 rounded-xl flex items-center justify-center text-blue-400 border border-blue-900/30 flex-shrink-0">
                  <Compass size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">Maritime Knots</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Master seamanship rigging. Teaches 7 essential knots (Bowline, Figure of 8, Reef, Overhand, Sheet Bend, Clove Hitch, Round Turn) with high-quality vector diagrams, step-by-step instructions, and safety warnings.
                  </p>
                </div>
              </div>

              {/* Clock */}
              <div className="glass-panel border border-slate-800/60 p-4 rounded-xl flex gap-4">
                <div className="w-12 h-12 bg-emerald-950/20 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-900/30 flex-shrink-0">
                  <Clock size={24} />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-200 mb-1">24-Hour Clock</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Master 24-hour time and Zulu time conversions. Test hands placement on the Time Matcher analog clock (with AM/PM visual backdrops) or practice conversions in the fast-paced, timed Speed Drill game mode.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TAB: Change Log */}
          {tab === 'changelog' && (
            <div className="space-y-6">
              
              <div className="border-l-2 border-blue-500 pl-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-100">v1.2.0</span>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900">LATEST</span>
                </div>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                  <li>Added **24-Hour Clock** training module.</li>
                  <li>Integrated interactive **Time Matcher** analog SVG clock with dynamic day/night backdrop states.</li>
                  <li>Built timed **Arcade Speed Drill** translation game mode.</li>
                  <li>Fixed Overhand Knot diagram to correctly show a single-rope stopper loop (cropping the vector).</li>
                  <li>Modified Reef Knot diagram to render in high-visibility white.</li>
                  <li>Added Help Modal with module documentation and changelogs.</li>
                </ul>
              </div>

              <div className="border-l-2 border-slate-700 pl-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-450">v1.1.0</span>
                </div>
                <ul className="text-xs text-slate-400 list-disc list-inside space-y-1">
                  <li>Added **Maritime Knots** module with authentic public domain diagrams.</li>
                  <li>Designed premium **iOS 26 glassmorphic** UI themes across all control panels.</li>
                  <li>Implemented **dynamic ocean waves** in ShipSim with SVG turbulence filters.</li>
                  <li>Added TTS radio filters and Flight Surgeon working channel support.</li>
                  <li>Created functional **DSC Distress alarm cancellation** simulator scenarios.</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB: About */}
          {tab === 'about' && (
            <div className="space-y-4 max-w-xl">
              <h3 className="text-base font-bold text-slate-200">System Diagnostics</h3>
              <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4 font-mono text-xs text-slate-400 space-y-2">
                <div className="flex justify-between"><span className="text-slate-500">System Name:</span><span className="text-slate-300">Nautical Navigator Training Suite</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Framework:</span><span className="text-slate-300">React 19 + TypeScript + Vite</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Aesthetic Preset:</span><span className="text-slate-300">iOS 26 Heavy Glassmorphism</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Time Reference:</span><span className="text-slate-300">Zulu Time (UTC) Alignment</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Release Status:</span><span className="text-slate-300 font-bold text-emerald-400">Stable Release</span></div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                This simulator is designed to train maritime cadets in radio operations, navigation rules, signal flag layouts, and basic seamanship. Sourced illustrations are fetched from public domain archives.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex justify-between items-center text-xs text-slate-500 font-semibold uppercase tracking-wider">
          <span>Nautical Navigator Suite</span>
          <span className="flex items-center gap-1.5"><Award size={12} className="text-yellow-500" /> Cadet Standard Certification</span>
        </div>

      </div>
    </div>
  );
}
