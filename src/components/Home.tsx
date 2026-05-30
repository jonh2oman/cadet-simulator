import { Anchor, Navigation, Radio, BookOpen, Flag, Compass, Clock, HelpCircle } from 'lucide-react';

interface HomeProps {
  onNavigate: (tab: 'ship' | 'radio' | 'alphabet' | 'flags' | 'knots' | 'clock') => void;
  onOpenHelp: () => void;
}

export default function Home({ onNavigate, onOpenHelp }: HomeProps) {
  return (
    <div className="w-full h-full bg-slate-950 flex flex-col items-center overflow-y-auto relative p-8">
      {/* Background CRT/Glass styling */}
      <div className="absolute inset-0 screen-crt opacity-10 mix-blend-overlay pointer-events-none"></div>
      
      {/* Hero Section */}
      <div className="flex flex-col items-center mt-12 mb-20 relative z-10">
        <Anchor className="text-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] mb-6" size={80} />
        <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent uppercase tracking-wider text-center drop-shadow-lg">
          Nautical Navigator
        </h1>
        <div className="flex flex-col sm:flex-row gap-4 items-center mt-6">
          <div className="px-6 py-2 text-sm md:text-base font-bold bg-blue-900/40 text-blue-300 rounded border border-blue-700/50 uppercase tracking-widest shadow-inner">
            Cadet Simulator & Training Suite
          </div>
          <button
            onClick={onOpenHelp}
            className="px-5 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-350 rounded border border-slate-700 hover:border-slate-650 hover:text-slate-200 uppercase tracking-widest shadow flex items-center gap-2 transition-all cursor-pointer"
          >
            <HelpCircle size={16} className="text-blue-405" />
            Manual & Help
          </button>
        </div>
      </div>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl w-full z-10 pb-20">
        
        {/* Ship Sim Card */}
        <button 
          onClick={() => onNavigate('ship')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-blue-500/50 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-blue-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-blue-800/50">
            <Navigation className="text-blue-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">Ship Simulator</h2>
          <p className="text-slate-400 leading-relaxed">
            Take the helm of a virtual vessel. Practice docking, steering, and understanding how a ship moves through the water using realistic controls.
          </p>
        </button>

        {/* Radio Game Card */}
        <button 
          onClick={() => onNavigate('radio')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-emerald-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-800/50">
            <Radio className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">Radio Operations</h2>
          <p className="text-slate-400 leading-relaxed">
            Master the art of maritime voice communications. Practice formatting standard messages, sending MAYDAYs, and responding to radio checks.
          </p>
        </button>

        {/* Alphabet Card */}
        <button 
          onClick={() => onNavigate('alphabet')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-purple-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-purple-800/50">
            <BookOpen className="text-purple-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">Phonetic Alphabet</h2>
          <p className="text-slate-400 leading-relaxed">
            Learn the NATO phonetic alphabet through interactive flashcards, dictation exercises, and spelling challenges using nautical terminology.
          </p>
        </button>

        {/* Flags Card */}
        <button 
          onClick={() => onNavigate('flags')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-yellow-500/50 hover:shadow-[0_0_40px_rgba(250,204,21,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-yellow-900/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-yellow-800/50">
            <Flag className="text-yellow-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">Flags & Pennants</h2>
          <p className="text-slate-400 leading-relaxed">
            Study visual communications. Learn the INTERCO and Military meanings of signal flags, memorize the alphabet, and practice flag hoisting.
          </p>
        </button>

        {/* Knots Card */}
        <button 
          onClick={() => onNavigate('knots')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-blue-400/50 hover:shadow-[0_0_40px_rgba(96,165,250,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-blue-950/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-blue-900/50">
            <Compass className="text-blue-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">Maritime Knots</h2>
          <p className="text-slate-400 leading-relaxed">
            Master seamanship and rigging. Learn how to tie essential knots, understand their specific maritime applications, and test your knowledge.
          </p>
        </button>

        {/* Clock Card */}
        <button 
          onClick={() => onNavigate('clock')} 
          className="group text-left p-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-3xl hover:bg-slate-800/80 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.2)] transition-all flex flex-col"
        >
          <div className="w-16 h-16 bg-emerald-950/40 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner border border-emerald-900/50">
            <Clock className="text-emerald-400" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-200 mb-3 tracking-wide uppercase">24-Hour Clock</h2>
          <p className="text-slate-400 leading-relaxed">
            Master nautical timekeeping and Zulu time. Learn standard 24-hour clock formats, memory tricks, and test your translation speed in interactive drills.
          </p>
        </button>

      </div>
    </div>
  );
}
