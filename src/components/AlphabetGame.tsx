import { useState } from 'react';
import { BookOpen, Ear, SpellCheck, Trophy, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

const NATO_ALPHABET: Record<string, string> = {
  A: 'Alpha', B: 'Bravo', C: 'Charlie', D: 'Delta', E: 'Echo',
  F: 'Foxtrot', G: 'Golf', H: 'Hotel', I: 'India', J: 'Juliett',
  K: 'Kilo', L: 'Lima', M: 'Mike', N: 'November', O: 'Oscar',
  P: 'Papa', Q: 'Quebec', R: 'Romeo', S: 'Sierra', T: 'Tango',
  U: 'Uniform', V: 'Victor', W: 'Whiskey', X: 'X-ray', Y: 'Yankee', Z: 'Zulu'
};

const WORDS = [
  "PORT", "STARBOARD", "BOW", "STERN", "BRIDGE", "HELM", "KEEL", "DRAFT", "WAKE", 
  "KNOT", "BEAM", "RADIO", "ANCHOR", "MAYDAY", "PANPAN", "RADAR", "SONAR", "BUOY"
];

type GameMode = 'menu' | 'flashcard' | 'dictation' | 'spelling';

export default function AlphabetGame() {
  const [mode, setMode] = useState<GameMode>('menu');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  
  const [currentLetter, setCurrentLetter] = useState('A');
  const [currentWord, setCurrentWord] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [feedback, setFeedback] = useState<'none'|'correct'|'incorrect'>('none');
  const [spellingProgress, setSpellingProgress] = useState<string[]>([]);
  
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
    if (newMode === 'dictation') nextDictation();
    if (newMode === 'spelling') nextSpelling();
  };

  const nextFlashcard = () => {
    const letters = Object.keys(NATO_ALPHABET);
    const next = letters[Math.floor(Math.random() * letters.length)];
    setCurrentLetter(next);
    setInputValue('');
    setFeedback('none');
  };

  const nextDictation = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(word);
    setInputValue('');
    setFeedback('none');
    
    // Speak the word phonetically
    setTimeout(() => {
      window.speechSynthesis.cancel();
      const phrase = word.split('').map(char => NATO_ALPHABET[char]).join(', ');
      const msg = new SpeechSynthesisUtterance(phrase);
      msg.rate = 0.8;
      msg.pitch = 1.0;
      window.speechSynthesis.speak(msg);
    }, 500);
  };

  const replayDictation = () => {
    window.speechSynthesis.cancel();
    const phrase = currentWord.split('').map(char => NATO_ALPHABET[char]).join(', ');
    const msg = new SpeechSynthesisUtterance(phrase);
    msg.rate = 0.8;
    window.speechSynthesis.speak(msg);
  };

  const nextSpelling = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(word);
    setSpellingProgress([]);
    setFeedback('none');
  };

  const handleFlashcardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback === 'correct') return;
    
    if (inputValue.toLowerCase().trim() === NATO_ALPHABET[currentLetter].toLowerCase()) {
      playSound('correct');
      setScore(s => s + 10 * (1 + Math.floor(streak/5)));
      setStreak(s => s + 1);
      setFeedback('correct');
      setTimeout(nextFlashcard, 800);
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      // Briefly show incorrect state, but keep the current letter
      setTimeout(() => setFeedback('none'), 800);
    }
  };

  const handleDictationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (feedback === 'correct') return;

    if (inputValue.toUpperCase().trim() === currentWord) {
      playSound('correct');
      setScore(s => s + 20 * (1 + Math.floor(streak/3)));
      setStreak(s => s + 1);
      setFeedback('correct');
      setTimeout(nextDictation, 1200);
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      setTimeout(() => setFeedback('none'), 800);
    }
  };

  const handleSpellingClick = (phonetic: string) => {
    if (feedback === 'correct') return;

    const expectedLetter = currentWord[spellingProgress.length];
    if (NATO_ALPHABET[expectedLetter] === phonetic) {
      playSound('correct');
      const newProgress = [...spellingProgress, phonetic];
      setSpellingProgress(newProgress);
      
      if (newProgress.length === currentWord.length) {
        setScore(s => s + 15 * (1 + Math.floor(streak/4)));
        setStreak(s => s + 1);
        setFeedback('correct');
        setTimeout(nextSpelling, 1000);
      }
    } else {
      playSound('incorrect');
      setStreak(0);
      setFeedback('incorrect');
      setTimeout(() => setFeedback('none'), 500);
    }
  };

  // Generate randomized options for spelling mode
  const getSpellingOptions = () => {
    if (mode !== 'spelling' || !currentWord) return [];
    const expectedLetter = currentWord[spellingProgress.length];
    if (!expectedLetter) return [];

    const correctPhonetic = NATO_ALPHABET[expectedLetter];
    
    // Get 3 random distinct incorrect options
    const options = [correctPhonetic];
    const letters = Object.keys(NATO_ALPHABET);
    
    while (options.length < 4) {
      const randLetter = letters[Math.floor(Math.random() * letters.length)];
      const randPhonetic = NATO_ALPHABET[randLetter];
      if (!options.includes(randPhonetic)) {
        options.push(randPhonetic);
      }
    }
    
    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  return (
    <div className="w-full h-full bg-slate-900 flex flex-col relative overflow-hidden">
      {/* Background CRT/Glass styling */}
      <div className="absolute inset-0 screen-crt opacity-10 mix-blend-overlay pointer-events-none"></div>

      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <BookOpen className="text-purple-400" size={32} />
          <div>
            <h2 className="text-xl font-bold text-slate-200">Phonetic Alphabet Training</h2>
            <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">Communicate with clarity</p>
          </div>
        </div>
        
        {mode !== 'menu' && (
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Trophy className="text-amber-400" size={20} />
              <div className="text-2xl font-mono font-bold text-amber-400">{score}</div>
            </div>
            <div className="flex flex-col items-end">
              <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">Streak Multiplier</div>
              <div className="text-lg font-mono font-bold text-emerald-400">x{1 + Math.floor(streak/4)}</div>
            </div>
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
      <div className="flex-1 p-8 flex items-center justify-center z-10">
        
        {/* Menu Mode */}
        {mode === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
            
            <button onClick={() => startGame('flashcard')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all">
              <div className="w-20 h-20 bg-purple-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="text-purple-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Visual Flashcards</h3>
              <p className="text-slate-400 text-sm">See a letter and type its phonetic NATO word quickly to build your streak.</p>
            </button>

            <button onClick={() => startGame('dictation')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
              <div className="w-20 h-20 bg-blue-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Ear className="text-blue-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Audio Dictation</h3>
              <p className="text-slate-400 text-sm">Listen to a sequence of phonetic words spoken over the radio and type the spelled word.</p>
            </button>

            <button onClick={() => startGame('spelling')} className="group flex flex-col items-center text-center p-10 glass-panel border border-slate-700/50 rounded-2xl hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all">
              <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <SpellCheck className="text-emerald-400" size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-200 mb-2">Spelling Challenge</h3>
              <p className="text-slate-400 text-sm">See a nautical word and select the correct phonetic words in the exact sequence.</p>
            </button>

          </div>
        )}

        {/* Flashcard Mode */}
        {mode === 'flashcard' && (
          <div className="max-w-md w-full flex flex-col items-center">
            <div className={`w-64 h-64 rounded-3xl flex items-center justify-center text-9xl font-black mb-12 shadow-2xl transition-colors duration-300 ${
              feedback === 'correct' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]' :
              feedback === 'incorrect' ? 'bg-red-900/40 text-red-400 border border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
              'bg-slate-800 text-slate-200 border border-slate-700 shadow-slate-900/50'
            }`}>
              {currentLetter}
            </div>
            
            <form onSubmit={handleFlashcardSubmit} className="w-full flex gap-3">
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type phonetic word..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-purple-500 rounded-xl px-6 py-4 text-xl outline-none transition-colors text-slate-200 text-center uppercase tracking-widest"
                disabled={feedback === 'correct'}
              />
              <button 
                type="submit"
                disabled={feedback === 'correct' || !inputValue}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold px-8 rounded-xl transition-colors shadow-lg shadow-purple-900/50"
              >
                SUBMIT
              </button>
            </form>
          </div>
        )}

        {/* Dictation Mode */}
        {mode === 'dictation' && (
          <div className="max-w-md w-full flex flex-col items-center">
            
            <button 
              onClick={replayDictation}
              className={`w-40 h-40 rounded-full flex flex-col items-center justify-center mb-12 transition-all duration-300 shadow-2xl border-4 ${
                feedback === 'correct' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.3)]' :
                feedback === 'incorrect' ? 'bg-red-900/40 text-red-400 border-red-500/50 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
                'bg-slate-800 hover:bg-slate-700 text-blue-400 border-slate-700 hover:border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]'
              }`}
            >
              {feedback === 'correct' ? <CheckCircle2 size={64} /> :
               feedback === 'incorrect' ? <XCircle size={64} /> :
               <Ear size={64} className="animate-pulse" />}
              <span className="mt-4 font-bold tracking-widest text-sm text-slate-300 uppercase">Listen</span>
            </button>

            <form onSubmit={handleDictationSubmit} className="w-full flex gap-3">
              <input 
                autoFocus
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type the word..."
                className="flex-1 bg-slate-950 border-2 border-slate-700 focus:border-blue-500 rounded-xl px-6 py-4 text-xl outline-none transition-colors text-slate-200 text-center uppercase tracking-widest"
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

        {/* Spelling Mode */}
        {mode === 'spelling' && (
          <div className="max-w-2xl w-full flex flex-col items-center">
            
            <div className="text-5xl font-black text-slate-200 tracking-widest uppercase mb-12 flex gap-2">
              {currentWord.split('').map((char, i) => {
                const isCompleted = i < spellingProgress.length;
                const isCurrent = i === spellingProgress.length;
                return (
                  <div key={i} className={`flex flex-col items-center ${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400 animate-pulse' : 'text-slate-600'}`}>
                    <span>{char}</span>
                    <span className="text-xs font-mono mt-2 min-h-4">
                      {isCompleted ? spellingProgress[i] : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {feedback === 'correct' ? (
              <div className="h-48 flex items-center justify-center animate-bounce">
                <CheckCircle2 className="text-emerald-400" size={80} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 w-full h-48">
                {getSpellingOptions().map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSpellingClick(opt)}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-emerald-500 rounded-xl text-xl font-bold text-slate-200 transition-all shadow-lg active:scale-95"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
