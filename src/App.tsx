import { useState } from 'react';
import { Anchor } from 'lucide-react';
import ShipSim from './components/ShipSim';
import RadioGame from './components/RadioGame';
import AlphabetGame from './components/AlphabetGame';
import FlagsGame from './components/FlagsGame';
import Home from './components/Home';
import { ArrowLeft } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'ship' | 'radio' | 'alphabet' | 'flags'>('home');

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-950 overflow-hidden text-slate-200">
      
      {/* Top Navigation Bar - Only show when NOT on home screen */}
      {activeTab !== 'home' && (
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-30 shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <Anchor className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" size={28} />
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent uppercase tracking-wider hidden sm:block">
              Nautical Navigator
            </h1>
            <span className="ml-4 px-3 py-1 text-xs font-bold bg-blue-900/40 text-blue-300 rounded border border-blue-700/50 uppercase tracking-widest shadow-inner hidden md:block">
              {activeTab === 'ship' ? 'Ship Simulator' : activeTab === 'radio' ? 'Radio Game' : activeTab === 'alphabet' ? 'Phonetic Alphabet' : 'Flags & Pennants'}
            </span>
          </div>
          
          <button
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 font-bold tracking-widest text-sm uppercase shadow-inner"
          >
            <ArrowLeft size={18} />
            <span className="hidden sm:block">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </button>
        </header>
      )}

      {/* Main Full-Screen Content Area */}
      <main className="flex-1 w-full h-full relative">
        {activeTab === 'home' && <Home onNavigate={setActiveTab} />}
        {activeTab === 'ship' && <ShipSim />}
        {activeTab === 'radio' && <RadioGame />}
        {activeTab === 'alphabet' && <AlphabetGame />}
        {activeTab === 'flags' && <FlagsGame />}
      </main>
    </div>
  );
}

export default App;
