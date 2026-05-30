import { useState } from 'react';
import { BookOpen, CheckCircle, HelpCircle, Info, RefreshCw } from 'lucide-react';

interface Knot {
  id: string;
  name: string;
  category: 'Loop' | 'Stopper' | 'Bend' | 'Hitch';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  uses: string[];
  tips: string;
  imageUrl: string;
  steps: string[];
  quiz: {
    question: string;
    options: string[];
    answerIdx: number;
    explanation: string;
  };
}

export default function KnotsModule() {
  const [activeKnotId, setActiveKnotId] = useState<string>('bowline');
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const knots: Knot[] = [
    {
      id: 'bowline',
      name: 'Bowline',
      category: 'Loop',
      difficulty: 'Medium',
      description: 'The Bowline is an ancient and essential loop knot. Often called the "King of Knots," it forms a secure, fixed loop at the end of a line. It is highly reliable, strong, and crucially, it is easy to untie even after holding a heavy load.',
      uses: [
        'Forming a secure loop to attach a halyard or sheet to a sail.',
        'Securing a mooring line around a post, piling, or ring.',
        'Rescue operations (lowering or hoisting personnel safely in a loop).'
      ],
      tips: 'Remember the classic adage: "The rabbit comes out of the hole, goes around the tree, and goes back down the hole."',
      imageUrl: '/cadet-simulator/images/knots/bowline.svg',
      steps: [
        'Make a small loop (the "hole") in the standing part of the rope, leaving enough working end below it.',
        'Pass the working end (the "rabbit") up through the loop from underneath.',
        'Wrap the working end around behind the standing part of the rope (the "tree").',
        'Pass the working end back down through the loop (into the "hole"), then pull the standing part and working end to tighten.'
      ],
      quiz: {
        question: 'Why is the Bowline considered one of the most useful loops in sailing?',
        options: [
          'It is the only knot that can join ropes of different sizes.',
          'It forms a secure, fixed loop that does not slip and is easy to untie under load.',
          'It is designed to slide up and down a post easily.',
          'It binds two sails together securely.'
        ],
        answerIdx: 1,
        explanation: 'The Bowline is prized in maritime use because it forms a reliable, non-slip loop, yet remains very easy to undo even after carrying a massive structural load.'
      }
    },
    {
      id: 'figure-eight',
      name: 'Figure-of-Eight',
      category: 'Stopper',
      difficulty: 'Easy',
      description: 'The Figure-of-Eight knot is the standard stopper knot used on vessels. It is bulky enough to prevent a rope from sliding out of blocks, fairleads, or clutches, and is much easier to untie than a simple overhand knot.',
      uses: [
        'Preventing sheets and halyards from running free through blocks.',
        'As a temporary grip at the end of a line.'
      ],
      tips: 'Form a loop, twist it once to make an "8" shape, and tuck the working end through from the front.',
      imageUrl: '/cadet-simulator/images/knots/figure_eight.svg',
      steps: [
        'Form a loop near the working end of your line, crossing it over the standing part.',
        'Twist the loop 360 degrees to create a figure-8 shape (passing the working end behind the standing line).',
        'Pass the working end through the top loop from the front, then pull both ends to tighten.'
      ],
      quiz: {
        question: 'What is the primary function of a Figure-of-Eight knot?',
        options: [
          'To tie a boat to a dock pier.',
          'To act as a stopper knot to prevent a line from running through a block.',
          'To bind two ropes of unequal thickness together.',
          'To create a quick loop for rescue operations.'
        ],
        answerIdx: 1,
        explanation: 'The Figure-of-Eight is the standard stopper knot, designed to make a bulky block at the end of a line so it cannot slide through a pulley or block.'
      }
    },
    {
      id: 'reef-knot',
      name: 'Reef Knot',
      category: 'Bend',
      difficulty: 'Easy',
      description: 'The Reef Knot, or Square Knot, is a simple binding knot used to join two lines of equal thickness. It is flat, lies flush, and was historically used to "reef" sails (tie down excess sailcloth). WARNING: It is not a secure bend and must never be used for critical loads.',
      uses: [
        'Reefing or furling sails (tying sail ties).',
        'Tying packages, sail covers, or simple bindings.'
      ],
      tips: 'Remember: "Left over right and tuck, right over left and tuck."',
      imageUrl: '/cadet-simulator/images/knots/reef_knot.svg',
      steps: [
        'Cross the left rope end over the right rope end.',
        'Tuck the left end underneath the right rope to make the first twist.',
        'Cross the right rope end (which is now on your left) over the left end.',
        'Tuck it under and pull all four ends taut to secure the knot.'
      ],
      quiz: {
        question: 'Under what condition should you use a Reef Knot?',
        options: [
          'To join two lines of equal thickness under non-critical loads.',
          'To tie a boat to a mooring buoy in heavy winds.',
          'To join a thick anchor line to a thin utility line.',
          'To hoist a heavy cargo load.'
        ],
        answerIdx: 0,
        explanation: 'A Reef Knot is a simple binding knot. It slips easily under high tension or with different line materials, so it must only be used to tie equal-sized ropes in low-stress tasks (like reefing sails).'
      }
    },
    {
      id: 'overhand-knot',
      name: 'Overhand Knot',
      category: 'Stopper',
      difficulty: 'Easy',
      description: 'The Overhand Knot is the simplest of all knots. It is a basic stopper or lock, but it jams easily under tension and can be extremely difficult to untie once wet or loaded.',
      uses: [
        'Basis for many other knots (reef, surgeon\'s, etc.).',
        'Preventing a rope end from fraying temporarily.'
      ],
      tips: 'Form a loop, and push the working end straight through.',
      imageUrl: '/cadet-simulator/images/knots/overhand_knot.svg',
      steps: [
        'Hold the rope and cross the working end over the standing part to form a loop.',
        'Pass the working end through the loop from underneath.',
        'Pull both sides in opposite directions to tighten the knot.'
      ],
      quiz: {
        question: 'What is the main disadvantage of the Overhand Knot?',
        options: [
          'It requires three ropes to tie.',
          'It jams tightly under load and is very difficult to untie when wet.',
          'It cannot hold a load at all.',
          'It takes too long to tie.'
        ],
        answerIdx: 1,
        explanation: 'The Overhand Knot is prone to jamming under load, which is why sailors prefer the Figure-of-Eight as a stopper knot.'
      }
    },
    {
      id: 'sheet-bend',
      name: 'Sheet Bend',
      category: 'Bend',
      difficulty: 'Medium',
      description: 'The Sheet Bend is the standard knot for joining two ropes together, especially if they are of unequal thickness or diameter. It is highly secure, holding fast where a Reef Knot would fail.',
      uses: [
        'Joining a thin utility line to a thick docking or mooring line.',
        'Extending the length of a line using whatever ropes are available.'
      ],
      tips: 'Always make the loop (bight) in the thicker rope, and weave the thinner rope through and around it.',
      imageUrl: '/cadet-simulator/images/knots/sheet_bend.svg',
      steps: [
        'Form a bight (U-loop) with the thicker rope.',
        'Insert the thinner rope up through the bight from underneath.',
        'Wrap the thinner rope once completely around the back of both strands of the thicker rope\'s bight.',
        'Tuck the thinner rope end back under itself (the loop it made) and pull all ends to tighten.'
      ],
      quiz: {
        question: 'When should you choose a Sheet Bend over a Reef Knot?',
        options: [
          'When you are tying a rope to a metal post.',
          'When joining two ropes of different thicknesses.',
          'When you need a loop that will slide.',
          'When tying down a sail cover in high winds.'
        ],
        answerIdx: 1,
        explanation: 'The Sheet Bend excels at connecting two lines with different diameters, whereas a Reef Knot would easily slip under tension in that situation.'
      }
    },
    {
      id: 'round-turn-half-hitches',
      name: 'Round Turn & Two Half Hitches',
      category: 'Hitch',
      difficulty: 'Medium',
      description: 'This is the most reliable hitch for securing a line to a post, ring, or piling under heavy load (such as a mooring line). The "round turn" takes the initial strain, making it easy to tie and untie even when under high tension.',
      uses: [
        'Securing mooring lines to dock posts or pilings.',
        'Securing fenders to a vessel\'s guard rail.',
        'Tying off towing lines.'
      ],
      tips: 'Always wrap the rope completely around the post twice (Round Turn) before adding the two locking half hitches.',
      imageUrl: '/cadet-simulator/images/knots/round_turn.png',
      steps: [
        'Wrap the rope completely around the post or ring twice. This forms the "Round Turn".',
        'Pass the working end around the standing line and through the loop to create the first half hitch.',
        'Repeat the half hitch process in the same direction to add the second half hitch, locking the knot in place.'
      ],
      quiz: {
        question: 'Why is the "Round Turn" part of this hitch so important under tension?',
        options: [
          'It makes the knot look symmetrical.',
          'It frictionally absorbs almost all the load tension, making the locking hitches easy to tie/untie.',
          'It prevents the rope from getting wet.',
          'It is required to double the strength of the rope.'
        ],
        answerIdx: 1,
        explanation: 'The double wraps of the round turn grip the post or ring and hold the load strain by friction. This leaves the working end tension-free, allowing you to tie the locking hitches with ease.'
      }
    },
    {
      id: 'clove-hitch',
      name: 'Clove Hitch',
      category: 'Hitch',
      difficulty: 'Easy',
      description: 'The Clove Hitch is a quick way to secure a line to a post or piling. It consists of two opposing half-hitches. While fast, it can slip if the tension fluctuates or if the line is slick, so it should be backed up with half hitches for safety.',
      uses: [
        'Temporarily securing fenders to the stanchion or guard rails.',
        'Starting and ending lashings on pilings.'
      ],
      tips: 'Think of it as making two loops in the rope in opposite directions, putting the second loop behind the first, and sliding them over the post.',
      imageUrl: '/cadet-simulator/images/knots/clove_hitch.svg',
      steps: [
        'Wrap the working end around the post, crossing over the standing part to form an "X" shape.',
        'Wrap the rope around the post a second time above the first wrap.',
        'Tuck the working end under the second wrap (next to the crossing point) and pull both ends to lock.'
      ],
      quiz: {
        question: 'Why should you avoid using a Clove Hitch for long-term critical mooring?',
        options: [
          'It is illegal in Canada.',
          'It can slip if the line undergoes slack and tension cycles or on slippery ropes.',
          'It damages the fibers of the rope permanently.',
          'It takes too long to untie.'
        ],
        answerIdx: 1,
        explanation: 'A Clove Hitch relies on constant tension. If the boat bobs and slacks the line, or if the piling is very slick, the hitch can loosen itself and slip off.'
      }
    }
  ];

  const activeKnot = knots.find(k => k.id === activeKnotId) || knots[0];

  const resetQuiz = () => {
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
  };

  const handleKnotChange = (id: string) => {
    setActiveKnotId(id);
    resetQuiz();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 border-emerald-500/30 bg-emerald-950/20';
      case 'Medium': return 'text-amber-400 border-amber-500/30 bg-amber-950/20';
      case 'Hard': return 'text-rose-400 border-rose-500/30 bg-rose-950/20';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* CRT scan lines */}
      <div className="absolute inset-0 screen-crt opacity-25 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-7xl h-full max-h-[850px] glass-panel border border-slate-700/50 rounded-2xl flex flex-col shadow-2xl z-10 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <BookOpen className="text-blue-400" size={32} />
            <div>
              <h2 className="text-xl font-bold text-slate-200">Maritime Knots & Seamanship</h2>
              <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">Interactive Rigging Guide</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          
          {/* Left Column: Knot Selector */}
          <div className="w-full lg:w-[320px] bg-slate-800/60 border-b lg:border-b-0 lg:border-r border-slate-700/50 p-4 overflow-y-auto flex-shrink-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">Select Knot</h3>
            <div className="space-y-2">
              {knots.map((k) => (
                <button
                  key={k.id}
                  onClick={() => handleKnotChange(k.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                    k.id === activeKnotId
                      ? 'bg-blue-600/30 border-blue-500/80 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.15)]'
                      : 'bg-slate-900/40 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-400'
                  }`}
                >
                  <div>
                    <div className="font-bold text-base text-slate-200">{k.name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{k.category}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyColor(k.difficulty)}`}>
                    {k.difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Knot Details & Tutorial */}
          <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6 bg-slate-900/40">
            
            {/* Overview Section */}
            <div className="glass-panel border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-bold text-slate-100">{activeKnot.name}</h2>
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-900/40 text-blue-300 rounded-full border border-blue-800">
                    {activeKnot.category}
                  </span>
                </div>
                <p className="text-slate-300 mt-4 text-base leading-relaxed">{activeKnot.description}</p>
                
                {/* Warning note for Reef Knot */}
                {activeKnot.id === 'reef-knot' && (
                  <div className="mt-4 p-3 bg-red-950/40 border border-red-900/50 text-red-300 rounded-lg text-sm flex gap-2">
                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                    <span><strong>Safety Warning:</strong> The reef knot can easily capsize (spill) under load. Never use this knot for safety-critical lines or bends.</span>
                  </div>
                )}
              </div>

              <div className="w-full md:w-[260px] bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex-shrink-0">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Marine Uses
                </h4>
                <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                  {activeKnot.uses.map((use, idx) => (
                    <li key={idx} className="leading-relaxed">{use}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Step-by-Step Tying & Quiz Section */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              
              {/* Tying Guide Diagram */}
              <div className="glass-panel border border-slate-800 rounded-2xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Tying Guide Diagram</h3>
                
                <div className="flex-1 flex flex-col items-center justify-between">
                  
                  {/* Step Illustration Container */}
                  <div className="w-full bg-slate-950/90 border-2 border-slate-800 rounded-2xl p-2 flex items-center justify-center shadow-inner overflow-hidden aspect-square">
                    <img 
                      src={activeKnot.imageUrl} 
                      alt={`${activeKnot.name} Diagram`}
                      className="w-full h-full object-contain rounded-xl hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>

                  {/* Instruction description list */}
                  <div className="w-full mt-6 bg-slate-950/50 p-4 border border-slate-800 rounded-xl max-h-[160px] overflow-y-auto">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">Step-by-Step Instructions:</h4>
                    <ol className="text-sm text-slate-300 space-y-1.5 list-decimal list-inside font-mono">
                      {activeKnot.steps.map((step, idx) => (
                        <li key={idx} className="leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>

                </div>
              </div>

              {/* Quiz / Knowledge Check */}
              <div className="glass-panel border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <HelpCircle size={16} className="text-yellow-400" /> Seamanship Check
                  </h3>
                  
                  <p className="text-base text-slate-200 mb-6 font-bold">{activeKnot.quiz.question}</p>

                  <div className="space-y-3">
                    {activeKnot.quiz.options.map((opt, idx) => (
                      <button
                        key={idx}
                        disabled={quizSubmitted}
                        onClick={() => setSelectedQuizAnswer(idx)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all flex items-center justify-between ${
                          quizSubmitted
                            ? idx === activeKnot.quiz.answerIdx
                              ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
                              : idx === selectedQuizAnswer
                                ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                                : 'bg-slate-900/20 border-slate-800 text-slate-500'
                            : selectedQuizAnswer === idx
                              ? 'bg-blue-900/40 border-blue-500/80 text-blue-200'
                              : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                        }`}
                      >
                        <span>{opt}</span>
                        {quizSubmitted && idx === activeKnot.quiz.answerIdx && (
                          <span className="text-[10px] font-bold text-emerald-400 uppercase border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 rounded">Correct</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  {quizSubmitted ? (
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">EXPLANATION:</div>
                      <p className="text-sm text-slate-300 leading-relaxed">{activeKnot.quiz.explanation}</p>
                      <button
                        onClick={resetQuiz}
                        className="mt-4 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded border border-slate-700 text-slate-400 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                      >
                        <RefreshCw size={12} /> Retry Quiz
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={selectedQuizAnswer === null}
                      onClick={() => setQuizSubmitted(true)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-sm font-bold text-white rounded-xl transition-all shadow hover:shadow-emerald-500/20 uppercase tracking-widest"
                    >
                      Submit Answer
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* Practical tips */}
            <div className="bg-blue-950/20 border border-blue-900/30 rounded-2xl p-5 flex gap-4 items-start">
              <Info className="text-blue-400 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-sm font-bold text-blue-300 uppercase tracking-wider">Sailor's Tying Tip</h4>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed font-mono italic">"{activeKnot.tips}"</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
