import { useState } from 'react';
import { Anchor, Navigation, Radio } from 'lucide-react';
import ShipSim from './components/ShipSim';
import RadioGame from './components/RadioGame';

function App() {
  const [activeTab, setActiveTab] = useState<'ship' | 'radio'>('ship');

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-slate-950 overflow-hidden text-slate-200">
      
      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-30 shadow-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <Anchor className="text-blue-500 drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]" size={28} />
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-emerald-500 bg-clip-text text-transparent uppercase tracking-wider">
            Nautical Navigator
          </h1>
          <span className="ml-4 px-3 py-1 text-xs font-bold bg-blue-900/40 text-blue-300 rounded border border-blue-700/50 uppercase tracking-widest shadow-inner">
            Cadet Simulator
          </span>
        </div>
        
        {/* Tab Selection */}
        <div className="flex bg-slate-950 rounded-lg border border-slate-800 p-1 shadow-inner h-12">
          <button
            onClick={() => setActiveTab('ship')}
            className={`flex items-center gap-2 px-8 rounded-md transition-all font-bold tracking-widest text-sm uppercase ${
              activeTab === 'ship' 
                ? 'bg-slate-800 text-blue-400 shadow-md border border-slate-700' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Navigation size={18} />
            Ship Simulator
          </button>
          <button
            onClick={() => setActiveTab('radio')}
            className={`flex items-center gap-2 px-8 rounded-md transition-all font-bold tracking-widest text-sm uppercase ${
              activeTab === 'radio' 
                ? 'bg-slate-800 text-emerald-400 shadow-md border border-slate-700' 
                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
            }`}
          >
            <Radio size={18} />
            Radio Game
          </button>
        </div>
      </header>

      {/* Main Full-Screen Content Area */}
      <main className="flex-1 w-full h-full relative">
        {/* We use conditional rendering, but if performance is an issue for the canvas reloading, we could use CSS hidden. For now, conditional rendering is cleaner. */}
        {activeTab === 'ship' ? <ShipSim /> : <RadioGame />}
      </main>
    </div>
  );
}

export default App;
