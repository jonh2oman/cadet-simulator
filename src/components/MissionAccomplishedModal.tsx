
interface MissionAccomplishedModalProps {
  onReturnToShip: () => void;
}

export default function MissionAccomplishedModal({ onReturnToShip }: MissionAccomplishedModalProps) {
  return (
    <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] rounded-2xl p-12 flex flex-col items-center animate-bounce text-center">
         <h2 className="text-5xl font-bold text-emerald-400 mb-6 drop-shadow-md tracking-wider">MISSION ACCOMPLISHED</h2>
         <p className="text-slate-300 text-xl mb-8">You successfully navigated the helicopter to the Jetty Landing Zone.</p>
         <button 
           onClick={onReturnToShip}
           className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-lg uppercase tracking-widest transition-all active:scale-95"
         >
           Return to Ship
         </button>
      </div>
    </div>
  );
}
