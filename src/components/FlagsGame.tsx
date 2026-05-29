import { useState } from 'react';
import { Flag, Book, FlagTriangleRight, ArrowUp, Trophy, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { SignalFlag } from './SignalFlag';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBERS = '0123456789'.split('');

const FLAG_MEANINGS: Record<string, string> = {
  A: "I have a diver down; keep well clear at slow speed.",
  B: "I am taking in, or discharging, or carrying dangerous goods.",
  C: "Affirmative.",
  D: "Keep clear of me; I am maneuvering with difficulty.",
  E: "I am altering my course to starboard.",
  F: "I am disabled; communicate with me.",
  G: "I require a pilot. (Fishing: I am hauling nets).",
  H: "I have a pilot on board.",
  I: "I am altering my course to port.",
  J: "I am on fire and have dangerous cargo on board.",
  K: "I wish to communicate with you.",
  L: "You should stop your vessel instantly.",
  M: "My vessel is stopped and making no way through the water.",
  N: "Negative.",
  O: "Man overboard.",
  P: "The Blue Peter. All aboard, vessel is about to proceed to sea.",
  Q: "My vessel is 'healthy' and I request free practique.",
  R: "The way is off my ship. You may feel my way past me.",
  S: "I am operating astern propulsion.",
  T: "Keep clear of me. I am engaged in pair trawling.",
  U: "You are running into danger.",
  V: "I require assistance.",
  W: "I require medical assistance.",
  X: "Stop carrying out your intentions and watch for my signals.",
  Y: "I am dragging my anchor.",
  Z: "I require a tug."
};

const WORDS = [
  "PORT", "STARBOARD", "BOW", "STERN", "BRIDGE", "HELM", "KEEL", "DRAFT", "WAKE", 
  "KNOT", "BEAM", "RADIO", "ANCHOR", "MAYDAY", "PANPAN", "RADAR", "SONAR", "BUOY"
];

type GameMode = 'menu' | 'dictionary' | 'flashcard' | 'hoist';

export default function FlagsGame() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  // Flashcard State
  const [flashcardChars, setFlashcardChars] = useState<string[]>(['A']);
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'none'|'correct'|'incorrect'>('none');
  
  // Hoist State
  const [targetWord, setTargetWord] = useState('PORT');
  const [hoistProgress, setHoistProgress] = useState<string[]>([]);

  // Audio context for sound effects
  const playSound = (type: 'correct' | 'incorrect') => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  };

  const startGame = (newMode: GameMode) => {
    setMode(newMode);
    setScore(0);
    setStreak(0);
    if (newMode === 'flashcard') nextFlashcard();
    if (newMode === 'hoist') nextHoist();
  };

  const nextFlashcard = () => {
    // Generate 1 to 3 random flags
    const count = Math.random() > 0.7 ? (Math.random() > 0.5 ? 3 : 2) : 1;
    const pool = [...ALPHABET, ...NUMBERS];
    const newChars = [];
    for (let i = 0; i < count; i++) {
      newChars.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setFlashcardChars(newChars);
    setInputValue('');
    setFeedback('none');
  };

  const nextHoist = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setTargetWord(word);
    setHoistProgress([]);
    setFeedback('none');
  };

  const handleFlashcardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback === 'correct') return;
    
    const expected = flashcardChars.join('');
    if (inputValue.toUpperCase().trim() === expected) {
      playSound('correct');
      setScore(s => s + 15 * flashcardChars.length * (1 + Math.floor(streak/5)));
      setStreak(s => s + 1);
      setFeedback('correct');
      setTimeout(nextFlashcard, 800);
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      setTimeout(() => setFeedback('none'), 800);
    }
  };

  const handleHoistClick = (char: string) => {
    if (feedback === 'correct') return;

    const expectedLetter = targetWord[hoistProgress.length];
    if (char === expectedLetter) {
      playSound('correct');
      const newProgress = [...hoistProgress, char];
      setHoistProgress(newProgress);
      
      if (newProgress.length === targetWord.length) {
        setScore(s => s + 20 * (1 + Math.floor(streak/4)));
        setStreak(s => s + 1);
        setFeedback('correct');
        setTimeout(nextHoist, 1000);
      }
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      setTimeout(() => setFeedback('none'), 500);
    }
  };

  const getHoistOptions = () => {
    if (mode !== 'hoist' || !targetWord) return [];
    const expectedLetter = targetWord[hoistProgress.length];
    if (!expectedLetter) return [];
    
    const options = [expectedLetter];
    while (options.length < 8) {
      const randChar = ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
      if (!options.includes(randChar)) options.push(randChar);
    }
    return options.sort(() => Math.random() - 0.5);
  };

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Background CRT/Glass styling */}
      <div className="absolute inset-0 screen-crt opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <Flag className="text-yellow-400" size={32} />
          <div>
            <h2 className="text-xl font-bold text-slate-200">Flags & Pennants</h2>
            <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">Visual Communications</p>
          </div>
        </div>
        
        {mode !== 'menu' && (
          <div className="flex items-center gap-8">
            {mode !== 'dictionary' && (
              <>
                <div className="flex items-center gap-2">
                  <Trophy className="text-amber-400" size={20} />
                  <div className="text-2xl font-mono font-bold text-amber-400">{score}</div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Streak</div>
                  <div className="text-lg font-mono font-bold text-emerald-400">x{1 + Math.floor(streak/4)}</div>
                </div>
              </>
            )}
            <button 
              onClick={() => setMode('menu')}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700 font-bold text-sm"
            >
              <ArrowLeft size={16} /> Menu
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 flex items-center justify-center z-10 overflow-y-auto">
        
        {/* Menu Mode */}
        {mode === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
            
            <button onClick={() => startGame('dictionary')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all">
              <div className="w-20 h-20 bg-yellow-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Book className="text-yellow-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Flag Dictionary</h3>
              <p className="text-slate-400 text-sm">Reference chart for all alphabet flags, numeral pennants, and their individual maritime meanings.</p>
            </button>

            <button onClick={() => startGame('flashcard')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
              <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FlagTriangleRight className="text-blue-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Decoding Flashcards</h3>
              <p className="text-slate-400 text-sm">See flags flying and type the correct letter or number sequence to build your streak.</p>
            </button>

            <button onClick={() => startGame('hoist')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all">
              <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ArrowUp className="text-emerald-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Hoist Challenge</h3>
              <p className="text-slate-400 text-sm">See a word and hoist the correct flags onto the halyard in the proper top-to-bottom sequence.</p>
            </button>

          </div>
        )}

        {/* Dictionary Mode */}
        {mode === 'dictionary' && (
          <div className="max-w-5xl w-full h-full pb-20">
            <h3 className="text-xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">Alphabet Flags</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
              {ALPHABET.map(char => (
                <div key={char} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-4">
                  <SignalFlag char={char} size={60} />
                  <div>
                    <div className="text-2xl font-black text-slate-200">{char}</div>
                    <div className="text-xs text-slate-400 leading-tight mt-1">{FLAG_MEANINGS[char]}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">Numeral Pennants</h3>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {NUMBERS.map(num => (
                <div key={num} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col items-center gap-4 text-center">
                  <SignalFlag char={num} size={80} />
                  <div className="text-3xl font-black text-slate-200">{num}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Flashcard Mode */}
        {mode === 'flashcard' && (
          <div className="max-w-xl w-full flex flex-col items-center">
            
            {/* The Halyard (Rope) */}
            <div className="relative mb-12 flex flex-col items-center">
              <div className="absolute top-0 bottom-0 w-1 bg-slate-600 rounded-full z-0"></div>
              
              <div className={`relative z-10 flex flex-col gap-2 p-8 rounded-3xl transition-colors duration-300 ${
                feedback === 'correct' ? 'bg-emerald-900/40 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]' :
                feedback === 'incorrect' ? 'bg-red-900/40 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
                'bg-slate-800/50 border border-slate-700 shadow-slate-900/50'
              }`}>
                {flashcardChars.map((char, i) => (
                  <div key={i} className="transform transition-transform animate-in fade-in zoom-in" style={{ animationDelay: `${i * 100}ms` }}>
                    <SignalFlag char={char} size={150} />
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleFlashcardSubmit} className="w-full flex gap-3">
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type the letters/numbers..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl px-6 py-4 text-2xl outline-none transition-colors text-slate-200 text-center uppercase tracking-widest font-mono"
                disabled={feedback === 'correct'}
              />
              <button 
                type="submit"
                disabled={feedback === 'correct' || !inputValue}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-8 rounded-xl transition-colors shadow-lg shadow-blue-900/50"
              >
                SUBMIT
              </button>
            </form>
          </div>
        )}

        {/* Hoist Mode */}
        {mode === 'hoist' && (
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            
            {/* The Target Word & Halyard */}
            <div className="flex flex-col items-center">
              <div className="text-4xl font-black tracking-widest text-slate-200 mb-8 border-b-2 border-slate-700 pb-4 w-full text-center">
                {targetWord}
              </div>
              
              <div className="relative min-h-[400px] w-48 flex flex-col items-center bg-slate-800/30 rounded-3xl border border-slate-700 py-8">
                <div className="absolute top-0 bottom-0 w-1 bg-slate-600 rounded-full z-0"></div>
                
                {feedback === 'correct' ? (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <CheckCircle2 className="text-emerald-400 animate-bounce" size={100} />
                  </div>
                ) : (
                  <div className="z-10 flex flex-col gap-2">
                    {hoistProgress.map((char, i) => (
                      <div key={i} className="animate-in slide-in-from-bottom-4">
                        <SignalFlag char={char} size={100} />
                      </div>
                    ))}
                    
                    {/* Placeholder for next flag */}
                    {hoistProgress.length < targetWord.length && (
                      <div className="w-[100px] h-[100px] border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center bg-slate-900/50 mt-2">
                        <ArrowUp className="text-slate-500 animate-pulse" size={32} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* The Flag Options Grid */}
            <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${feedback === 'correct' ? 'opacity-50 pointer-events-none' : ''}`}>
              {getHoistOptions().map((char, i) => (
                <button
                  key={i}
                  onClick={() => handleHoistClick(char)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-emerald-500 rounded-xl p-4 flex items-center justify-center transition-all shadow-lg active:scale-95 group"
                >
                  <div className="group-hover:scale-110 transition-transform">
                    <SignalFlag char={char} size={80} />
                  </div>
                </button>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
