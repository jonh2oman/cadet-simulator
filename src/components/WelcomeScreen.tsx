
interface WelcomeScreenProps {
  onTakeHelm: () => void;
}

export default function WelcomeScreen({ onTakeHelm }: WelcomeScreenProps) {
  return (
    <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl max-w-2xl w-full p-8 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <img src="./logo.png" alt="Cadet Simulator Logo" className="w-32 h-32 mb-6 drop-shadow-xl" />
          
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">CADET SIMULATOR</h1>
          <p className="text-slate-400 text-center mb-8 max-w-lg">
            Welcome to the digital helm. Practice ship handling, navigation, and maneuvering in dynamic environments. Learn to master wind, current, and momentum.
          </p>
          
          <div className="grid grid-cols-2 gap-6 w-full mb-8">
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar">
              <h3 className="text-amber-400 font-mono text-xs mb-3 border-b border-slate-800 pb-2">SHIP CONTROLS</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between items-center"><span>Steer Port/Stbd</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">← / →</kbd></li>
                <li className="flex justify-between items-center"><span>Throttle Up/Down</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">W / X</kbd></li>
                <li className="flex justify-between items-center"><span>Cut Throttle</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">S</kbd></li>
                <li className="flex justify-between items-center"><span>Bow Thrusters</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">A / D</kbd></li>
                <li className="flex justify-between items-center"><span>Stern Thrusters</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">Z / C</kbd></li>
              </ul>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl shadow-inner max-h-[220px] overflow-y-auto custom-scrollbar">
              <h3 className="text-emerald-400 font-mono text-xs mb-3 border-b border-slate-800 pb-2">HELI & MOUSE</h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex justify-between items-center"><span className="text-emerald-400">Heli Fly/Steer</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">WASD / Arrows</kbd></li>
                <li className="flex justify-between items-center"><span className="text-emerald-400">Heli Climb/Descend</span> <kbd className="bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono shadow-sm">SPACE / SHIFT</kbd></li>
                <li className="flex justify-between items-center"><span>Steering Wheel</span> <span className="text-[10px] text-slate-450 font-mono">Drag Dial</span></li>
                <li className="flex justify-between items-center"><span>Move Panels</span> <span className="text-[10px] text-slate-450 font-mono">Drag Header</span></li>
                <li className="flex justify-between items-center"><span>Draggable Buoys</span> <span className="text-[10px] text-slate-450 font-mono">Drag on Water</span></li>
              </ul>
            </div>
          </div>
          
          <button 
            onClick={onTakeHelm}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-10 rounded-full transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)] hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] hover:-translate-y-0.5 uppercase tracking-widest text-sm active:scale-95 animate-pulse"
          >
            Take the Helm
          </button>
        </div>
      </div>
    </div>
  );
}
