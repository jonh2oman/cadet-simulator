import type { Course } from '../config/constants';

interface CourseCompletedModalProps {
  activeCourse: Course;
  courseElapsedTime: number;
  shipClass: string;
  onRetry: () => void;
  onFreeSailing: () => void;
}

export default function CourseCompletedModal({
  activeCourse,
  courseElapsedTime,
  shipClass,
  onRetry,
  onFreeSailing
}: CourseCompletedModalProps) {
  return (
    <div className="absolute inset-0 z-[110] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900/90 border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] rounded-2xl max-w-md w-full p-8 relative text-center">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900">
          <span className="text-4xl">🏆</span>
        </div>
        <h2 className="text-3xl font-bold text-white mt-12 mb-2 tracking-wide">COURSE COMPLETED!</h2>
        <p className="text-slate-400 text-sm mb-6">Excellent seamanship, Cadet!</p>
        
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl shadow-inner mb-6 text-left font-mono text-sm space-y-2">
          <div className="flex justify-between"><span className="text-slate-400">Course:</span> <span className="text-slate-200">{activeCourse.name}</span></div>
          <div className="flex justify-between">
            <span className="text-slate-400">Time Taken:</span> 
            <span className="text-amber-400">
              {Math.floor(courseElapsedTime / 60)}m {Math.floor(courseElapsedTime % 60)}s
            </span>
          </div>
          <div className="flex justify-between"><span className="text-slate-400">Vessel Class:</span> <span className="text-emerald-400 uppercase">{shipClass}</span></div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onRetry}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-wider text-xs active:scale-95"
          >
            Retry Course
          </button>
          <button 
            onClick={onFreeSailing}
            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all border border-slate-700 uppercase tracking-wider text-xs active:scale-95"
          >
            Free Sailing
          </button>
        </div>
      </div>
    </div>
  );
}
