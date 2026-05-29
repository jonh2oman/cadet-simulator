import { useState } from 'react';
import { Flag, Book, FlagTriangleRight, ArrowUp, Trophy, ArrowLeft, CheckCircle2, Ship } from 'lucide-react';
import { SignalFlag } from './SignalFlag';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBERS = '0123456789'.split('');
const SPECIAL = ['PREP', '3SUB'];

interface FlagData {
  interco: string;
  military?: string;
  memoryAid?: string;
}

const FLAG_DATA: Record<string, FlagData> = {
  A: {
    interco: "Diver down. Keep well clear at slow speed.",
    military: "Divers or friendly explosive ordnance disposal personnel down.",
    memoryAid: "Looks like a letter 'A' on its side."
  },
  B: {
    interco: "Taking in, discharging or carrying dangerous goods.",
    military: "Fuelling or transferring explosives or inflammable material.",
    memoryAid: "Looks like the letter 'B'. 'B' for boom. Red means danger."
  },
  C: { interco: "Affirmative." },
  D: { interco: "Keep clear of me; I am maneuvering with difficulty." },
  E: { interco: "I am altering my course to starboard." },
  F: { interco: "I am disabled; communicate with me." },
  G: {
    interco: "I require a pilot.",
    military: "Guide. (This ship is to be the lead ship, follow me).",
    memoryAid: "Grass on a golf course. Sand traps and water on a golf course."
  },
  H: { interco: "I have a pilot on board." },
  I: {
    interco: "Altering my course to port.",
    military: "Going alongside (in port or at anchor).",
    memoryAid: "When preparing to tie, remember to dot your 'i'."
  },
  J: {
    interco: "I am on fire.",
    military: "Semaphore message.",
    memoryAid: "White hot, need lots of water."
  },
  K: { interco: "I wish to communicate with you." },
  L: { interco: "You should stop your vessel instantly." },
  M: { interco: "My vessel is stopped and making no way through the water." },
  N: { interco: "Negative." },
  O: {
    interco: "Man overboard.",
    military: "Man overboard.",
    memoryAid: "Yellow and red will flash, after you hear the splash."
  },
  P: {
    interco: "Recall. Vessel about to sail.",
    military: "General recall. All personnel belonging to this ship must return immediately.",
    memoryAid: "White on blue, the boat will sail without you."
  },
  Q: {
    interco: "Vessel is healthy. Request free practique.",
    military: "Boat recall. All boats belonging to this ship must return immediately.",
    memoryAid: "When flying quebec, all boats back on deck."
  },
  R: { interco: "The way is off my ship. You may feel my way past me." },
  S: { interco: "I am operating astern propulsion." },
  T: { interco: "Keep clear of me. I am engaged in pair trawling." },
  U: {
    interco: "You are running into danger.",
    military: "Anchoring. / Mooring. / Weighing.",
    memoryAid: "With the red and white, the anchor takes a bite."
  },
  V: { interco: "I require assistance." },
  W: { interco: "I require medical assistance." },
  X: {
    interco: "Stop carrying out your intentions and watch for my signals.",
    military: "Exercising.",
    memoryAid: "Exercise avast when x-ray is on the mast."
  },
  Y: { interco: "I am dragging my anchor." },
  Z: {
    interco: "I require a tug.",
    military: "Communication guard.",
    memoryAid: "When many colours flow, I need a tow."
  },
  '5': {
    interco: "Numeral 5.",
    military: "Breakdown.",
    memoryAid: "Pieces of the flag are broken apart."
  },
  'PREP': {
    interco: "No meaning.",
    military: "Morning and evening ceremonies/Colours (as appropriate).",
    memoryAid: "Yellow and green, caution before go."
  },
  '3SUB': {
    interco: "Substitute the third flag in this hoist for this flag.",
    military: "Absentee indicator (CO/XO) (used in port only).",
    memoryAid: "If the CO is gone for the night, put up the black and white."
  }
};

const WORDS = [
  // Directions & Ship Parts
  "PORT", "STAR", "BOW", "STERN", "BRIDGE", "HELM", "KEEL", "DRAFT", "WAKE", 
  "KNOT", "BEAM", "RADIO", "ANCHOR", "MAYDAY", "PANPAN", "RADAR", "SONAR", "BUOY",
  "HALYARD", "MAST", "MASTHEAD", "TRUCK", "YARD", "GAFF", "BULKHEAD", "DECK", 
  "OVERHEAD", "DECKHEAD", "GALLEY", "MESS", "WARDROOM", "COMPASS", "BINNACLE", 
  "CAPSTAN", "CLEAT", "FENDER", "SCUPPER", "GANGWAY", "BROW", "QUARTERDECK", "FORECASTLE",
  // Ranks & Roles
  "SEAMAN", "SAILOR", "PETTY", "OFFICER", "CHIEF", "LIEUTENANT", "COMMANDER", 
  "CAPTAIN", "ADMIRAL", "CADET", "COXSWAIN", "BOATSWAIN", "QUARTERMASTER"
];

const TERM_QUESTIONS = [
  { term: "Bent on", definition: "The signal flag is attached to the halyard, secured to a cleat and ready to be hoisted." },
  { term: "Hoist", definition: "To raise the signal flag." },
  { term: "Close Up", definition: "The signal flag is hoisted to the full extent of the halyard with the head of the flag touching the block." },
  { term: "At the Dip", definition: "The signal flag is hoisted to a position one-third of the halyard length from the top." },
  { term: "Haul Down (Strike)", definition: "To lower the signal flag and remove from the halyard." },
  { term: "Masthead (Truck)", definition: "Top portion of a mast." },
  { term: "Yard", definition: "The horizontal spars fitted on a mast to carry sails, rigging or signals." },
  { term: "Gaff", definition: "A spar projecting aft from the mast and angled up at approximately 45 degrees." },
  { term: "Halyard", definition: "The line which raises or lowers a signal flag." }
];

type GameMode = 'menu' | 'dictionary' | 'flashcard' | 'hoist' | 'terms';

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

  // Terms Quiz State
  const [currentTermIndex, setCurrentTermIndex] = useState(0);
  const [termOptions, setTermOptions] = useState<string[]>([]);

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
    if (newMode === 'terms') nextTerm();
  };

  const nextFlashcard = () => {
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

  const nextTerm = () => {
    const correctIdx = Math.floor(Math.random() * TERM_QUESTIONS.length);
    setCurrentTermIndex(correctIdx);
    
    // Generate 3 random wrong options
    const options = [TERM_QUESTIONS[correctIdx].term];
    while (options.length < 4) {
      const randTerm = TERM_QUESTIONS[Math.floor(Math.random() * TERM_QUESTIONS.length)].term;
      if (!options.includes(randTerm)) options.push(randTerm);
    }
    setTermOptions(options.sort(() => Math.random() - 0.5));
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

  const handleTermClick = (selectedTerm: string) => {
    if (feedback === 'correct') return;

    if (selectedTerm === TERM_QUESTIONS[currentTermIndex].term) {
      playSound('correct');
      setScore(s => s + 10 * (1 + Math.floor(streak/3)));
      setStreak(s => s + 1);
      setFeedback('correct');
      setTimeout(nextTerm, 1000);
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      setTimeout(() => setFeedback('none'), 800);
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl w-full">
            
            <button onClick={() => startGame('dictionary')} className="group flex flex-col items-center text-center p-8 glass-panel border border-slate-700/50 rounded-2xl hover:border-yellow-500/50 hover:shadow-[0_0_30px_rgba(250,204,21,0.15)] transition-all">
              <div className="w-16 h-16 bg-yellow-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Book className="text-yellow-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Dictionary</h3>
              <p className="text-slate-400 text-sm">Reference chart for flags, SCTV meanings, and memory aids.</p>
            </button>

            <button onClick={() => startGame('flashcard')} className="group flex flex-col items-center text-center p-8 glass-panel border border-slate-700/50 rounded-2xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
              <div className="w-16 h-16 bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FlagTriangleRight className="text-blue-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Decoding</h3>
              <p className="text-slate-400 text-sm">Type the correct letter or number sequence to build your streak.</p>
            </button>

            <button onClick={() => startGame('hoist')} className="group flex flex-col items-center text-center p-8 glass-panel border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ArrowUp className="text-emerald-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Hoist Challenge</h3>
              <p className="text-slate-400 text-sm">Hoist the correct flags onto the halyard in the proper sequence.</p>
            </button>

            <button onClick={() => startGame('terms')} className="group flex flex-col items-center text-center p-8 glass-panel border border-slate-700/50 rounded-2xl hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
              <div className="w-16 h-16 bg-purple-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Ship className="text-purple-400" size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-200 mb-2">Terms & Mast</h3>
              <p className="text-slate-400 text-sm">Quiz on hoist terminology and the anatomy of a signal mast.</p>
            </button>

          </div>
        )}

        {/* Dictionary Mode */}
        {mode === 'dictionary' && (
          <div className="max-w-7xl w-full h-full pb-20 mt-20">
            <h3 className="text-2xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">Alphabet Flags</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
              {ALPHABET.map(char => {
                const data = FLAG_DATA[char] || { interco: FLAG_DATA[char] ? (FLAG_DATA[char] as any) : "" };
                return (
                  <div key={char} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-start gap-6 hover:bg-slate-800 transition-colors shadow-lg">
                    <SignalFlag char={char} size={80} className="flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-3xl font-black text-slate-200 mb-2">{char}</div>
                      <div className="space-y-2">
                        {data.military && (
                          <div>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-0.5">SCTV / Military</span>
                            <span className="text-sm text-slate-300 leading-snug block">{data.military}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">INTERCO</span>
                          <span className="text-sm text-slate-300 leading-snug block">{data.interco}</span>
                        </div>
                        {data.memoryAid && (
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-700/50 mt-3">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-0.5">Memory Aid</span>
                            <span className="text-xs text-slate-400 italic block">"{data.memoryAid}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <h3 className="text-2xl font-bold text-slate-300 mb-6 border-b border-slate-700 pb-2">Numeral & Special Pennants</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...NUMBERS, ...SPECIAL].map(char => {
                const data = FLAG_DATA[char] || { interco: `Numeral ${char}.` };
                return (
                  <div key={char} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex items-start gap-6 hover:bg-slate-800 transition-colors shadow-lg">
                    <SignalFlag char={char} size={60} className="flex-shrink-0 mt-2" />
                    <div className="flex-1">
                      <div className="text-2xl font-black text-slate-200 mb-2">{char}</div>
                      <div className="space-y-2">
                        {data.military && (
                          <div>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-0.5">SCTV / Military</span>
                            <span className="text-sm text-slate-300 leading-snug block">{data.military}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-0.5">INTERCO</span>
                          <span className="text-sm text-slate-300 leading-snug block">{data.interco}</span>
                        </div>
                        {data.memoryAid && (
                          <div className="bg-slate-900/80 p-2 rounded border border-slate-700/50 mt-3">
                            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-0.5">Memory Aid</span>
                            <span className="text-xs text-slate-400 italic block">"{data.memoryAid}"</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flashcard Mode */}
        {mode === 'flashcard' && (
          <div className="max-w-xl w-full flex flex-col items-center">
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
                    
                    {hoistProgress.length < targetWord.length && (
                      <div className="w-[100px] h-[100px] border-2 border-dashed border-slate-500 rounded-lg flex items-center justify-center bg-slate-900/50 mt-2">
                        <ArrowUp className="text-slate-500 animate-pulse" size={32} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

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

        {/* Terms & Mast Mode */}
        {mode === 'terms' && (
          <div className="max-w-3xl w-full flex flex-col items-center">
            
            <div className={`w-full p-10 rounded-3xl border text-center transition-colors mb-8 ${
                feedback === 'correct' ? 'bg-emerald-900/40 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]' :
                feedback === 'incorrect' ? 'bg-red-900/40 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
                'bg-slate-800/80 border-slate-700 shadow-xl'
            }`}>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">What is the term for:</h3>
              <p className="text-2xl lg:text-3xl font-medium text-slate-200 leading-relaxed">
                "{TERM_QUESTIONS[currentTermIndex].definition}"
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
              {termOptions.map((term, i) => (
                <button
                  key={i}
                  onClick={() => handleTermClick(term)}
                  disabled={feedback === 'correct'}
                  className={`p-6 rounded-xl border-2 transition-all font-bold text-xl ${
                    feedback === 'correct' && term === TERM_QUESTIONS[currentTermIndex].term
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-900/50'
                      : feedback === 'correct'
                      ? 'bg-slate-800 border-slate-700 text-slate-500 opacity-50'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-purple-500 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {term}
                </button>
              ))}
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
