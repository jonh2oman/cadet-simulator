import { useState, useEffect, useRef } from 'react';
import { Clock, BookOpen, CheckCircle, Info, RefreshCw, Play, Award, Zap, Sun, Moon } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  answerIdx: number;
  explanation: string;
}

interface SpeedPrompt {
  question: string;
  options: string[];
  answer: string;
  type: 'to24' | 'to12';
}

export default function ClockModule() {
  const [activeTab, setActiveTab] = useState<'learn' | 'match' | 'drill' | 'quiz'>('learn');

  // Time Matcher State
  const [targetTime, setTargetTime] = useState({ hour: 14, minute: 30 }); // 24-hour format
  const [userHour, setUserHour] = useState(12); // 1-12 for analog hands
  const [userMinute, setUserMinute] = useState(0); // 0-59
  const [userIsPm, setUserIsPm] = useState(false);
  const [matcherFeedback, setMatcherFeedback] = useState<{ status: 'correct' | 'incorrect' | null; message: string }>({ status: null, message: '' });

  // Speed Drill State
  const [drillActive, setDrillActive] = useState(false);
  const [drillPrompt, setDrillPrompt] = useState<SpeedPrompt | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    return parseInt(localStorage.getItem('nautical_clock_highscore') || '0', 10);
  });
  const [timeLeft, setTimeLeft] = useState(10);
  const [drillFeedback, setDrillFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const timerRef = useRef<any>(null);

  // Quiz State
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Constants
  const quizzes: QuizQuestion[] = [
    {
      question: 'A radio report states "Vessel coordinates updated at 0830Z". What does the "Z" represent?',
      options: [
        'Zone Time (local time of the vessel)',
        'Zero Hour (midnight local time)',
        'Zulu Time (Coordinated Universal Time / UTC)',
        'Zenith Time (when the sun is highest)'
      ],
      answerIdx: 2,
      explanation: 'In maritime, military, and aviation communication, the letter "Z" stands for Zulu Time, which refers to Coordinated Universal Time (UTC). This keeps timekeeping consistent across different time zones.'
    },
    {
      question: 'Your vessel is operating in timezone UTC+3. If you receive a distress alert marked at 1315Z, what is the corresponding local time?',
      options: [
        '10:15 AM (1015)',
        '4:15 PM (1615)',
        '1:15 PM (1315)',
        '9:15 PM (2115)'
      ],
      answerIdx: 1,
      explanation: 'To find local time, add the UTC offset (+3 hours) to the Zulu time (13:15 + 3 = 16:15). 16:15 in 12-hour format is 4:15 PM.'
    },
    {
      question: 'Using the quick "Minus 2" memory trick, what is 21:45 in standard 12-hour time?',
      options: [
        '11:45 PM',
        '8:45 PM',
        '9:45 PM',
        '7:45 PM'
      ],
      answerIdx: 2,
      explanation: 'The "Minus 2" trick states that for times from 13:00 to 23:00, you can subtract 2 from the second hour digit (1 from the 2, and 2 from the 1 = 9) to quickly identify the PM hour. So, 21:45 becomes 9:45 PM.'
    },
    {
      question: 'Which of the following represents the correct verbal pronunciation of the time 0805 in maritime radio operations?',
      options: [
        '"Eight oh five"',
        '"Zero-eight-zero-five"',
        '"Oh-eight-hundred-five"',
        '"Zero-eight-hundred-five"'
      ],
      answerIdx: 1,
      explanation: 'Under maritime radio regulations, digits are read individually. 0805 is pronounced as "Zero-eight-zero-five" to avoid misunderstandings over poor radio connections.'
    },
    {
      question: 'What is the correct 24-hour representation for 12:15 AM (fifteen minutes past midnight)?',
      options: [
        '12:15',
        '00:15',
        '24:15',
        '12:15 AM'
      ],
      answerIdx: 1,
      explanation: 'Midnight is represented as 00:00. Therefore, 12:15 AM is written as 00:15. 12:15 in the 24-hour clock represents 12:15 PM (noon).'
    }
  ];

  // Helper to generate a random 24h/12h matching prompt
  const generateDrillPrompt = (): SpeedPrompt => {
    const hours24 = Math.floor(Math.random() * 24);
    const minutes = Math.floor(Math.random() * 12) * 5; // increments of 5 minutes
    const isPm = hours24 >= 12;
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    const minStr = minutes.toString().padStart(2, '0');
    const time24Str = `${hours24.toString().padStart(2, '0')}:${minStr}`;
    const time12Str = `${hours12}:${minStr} ${isPm ? 'PM' : 'AM'}`;

    const to24 = Math.random() > 0.5;
    
    // Create options
    const correctAns = to24 ? time24Str : time12Str;
    const optionsSet = new Set<string>([correctAns]);

    while (optionsSet.size < 4) {
      const h24Rand = Math.floor(Math.random() * 24);
      const mRand = Math.floor(Math.random() * 12) * 5;
      const isPmRand = h24Rand >= 12;
      const h12Rand = h24Rand % 12 === 0 ? 12 : h24Rand % 12;
      const mStrRand = mRand.toString().padStart(2, '0');
      
      const opt = to24 
        ? `${h24Rand.toString().padStart(2, '0')}:${mStrRand}`
        : `${h12Rand}:${mStrRand} ${isPmRand ? 'PM' : 'AM'}`;
      optionsSet.add(opt);
    }

    return {
      question: to24 ? `Convert ${time12Str} to 24-Hour format:` : `Convert ${time24Str} to 12-Hour format:`,
      options: Array.from(optionsSet).sort(() => Math.random() - 0.5),
      answer: correctAns,
      type: to24 ? 'to24' : 'to12'
    };
  };

  // Time Matcher Generator
  const generateNewMatcherTime = () => {
    const randomHour = Math.floor(Math.random() * 24);
    const randomMinute = Math.floor(Math.random() * 12) * 5;
    setTargetTime({ hour: randomHour, minute: randomMinute });
    setMatcherFeedback({ status: null, message: '' });
  };

  const verifyMatcherTime = () => {
    // Convert user analog time to 24-hour
    let calculatedHour = userHour;
    if (userIsPm) {
      if (userHour !== 12) calculatedHour += 12;
    } else {
      if (userHour === 12) calculatedHour = 0;
    }

    if (calculatedHour === targetTime.hour && userMinute === targetTime.minute) {
      setMatcherFeedback({
        status: 'correct',
        message: 'Perfect Match! You set the hands and AM/PM context correctly.'
      });
    } else {
      const target12Hour = targetTime.hour % 12 === 0 ? 12 : targetTime.hour % 12;
      const targetPeriod = targetTime.hour >= 12 ? 'PM' : 'AM';
      setMatcherFeedback({
        status: 'incorrect',
        message: `Incorrect. Try positioning the hour hand to ${target12Hour}, the minute hand to ${targetTime.minute}, and selecting ${targetPeriod}.`
      });
    }
  };

  // Speed Drill Game Logic
  const startDrill = () => {
    setDrillActive(true);
    setScore(0);
    setDrillFeedback(null);
    setTimeLeft(10);
    setDrillPrompt(generateDrillPrompt());
  };

  const handleDrillAnswer = (selected: string) => {
    if (!drillPrompt || drillFeedback) return;

    if (selected === drillPrompt.answer) {
      const timeBonus = Math.round(timeLeft * 10);
      const points = 100 + timeBonus;
      setScore(prev => {
        const newScore = prev + points;
        if (newScore > highScore) {
          setHighScore(newScore);
          localStorage.setItem('nautical_clock_highscore', newScore.toString());
        }
        return newScore;
      });
      setDrillFeedback({ isCorrect: true, text: `Correct! +${points} pts` });
    } else {
      setDrillFeedback({ isCorrect: false, text: `Wrong! Correct answer was ${drillPrompt.answer}` });
    }

    setTimeout(() => {
      setDrillFeedback(null);
      setTimeLeft(10);
      setDrillPrompt(generateDrillPrompt());
    }, 1200);
  };

  // Speed Drill Timer Effect
  useEffect(() => {
    if (!drillActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          clearInterval(timerRef.current!);
          setDrillActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [drillActive, drillPrompt]);

  // Initial generators
  useEffect(() => {
    generateNewMatcherTime();
  }, []);

  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* CRT scan lines */}
      <div className="absolute inset-0 screen-crt opacity-25 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-7xl h-full max-h-[850px] glass-panel border border-slate-700/50 rounded-2xl flex flex-col shadow-2xl z-10 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700/50 bg-slate-800/80 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Clock className="text-blue-400 animate-pulse" size={32} />
            <div>
              <h2 className="text-xl font-bold text-slate-200">24-Hour Clock & Maritime Timekeeping</h2>
              <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">Nautical Navigation Training</p>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 p-2 gap-2 flex-shrink-0">
          <button
            onClick={() => { setActiveTab('learn'); setDrillActive(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'learn'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <BookOpen size={16} /> Learn & Shortcuts
          </button>
          <button
            onClick={() => { setActiveTab('match'); setDrillActive(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'match'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Clock size={16} /> Time Matcher
          </button>
          <button
            onClick={() => { setActiveTab('drill'); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'drill'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Zap size={16} /> Speed Drill Game
          </button>
          <button
            onClick={() => { setActiveTab('quiz'); setDrillActive(false); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === 'quiz'
                ? 'bg-blue-600/30 border border-blue-500/50 text-blue-200 shadow-md'
                : 'text-slate-400 hover:bg-slate-800/50'
            }`}
          >
            <Award size={16} /> Knowledge Quiz
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col bg-slate-900/40">
          
          {/* TAB 1: Learn & Shortcuts */}
          {activeTab === 'learn' && (
            <div className="space-y-6">
              
              {/* Concept Intro */}
              <div className="glass-panel border border-slate-800 p-6 rounded-2xl">
                <h3 className="text-2xl font-bold text-slate-100 mb-4">Why use the 24-Hour Clock?</h3>
                <p className="text-slate-300 leading-relaxed text-base">
                  In maritime, aviation, and military operations, clear and unambiguous communication is vital. The standard 12-hour clock (with AM and PM) introduces risks of confusion—a radio message scheduled at "8 o'clock" could mean morning or night. By using the 24-hour clock, every hour of the day has a unique value from **00:00 (Midnight)** to **23:59 (11:59 PM)**, removing all doubt.
                </p>
                <div className="mt-4 p-4 bg-slate-950/40 border border-slate-800 rounded-xl flex gap-3 text-sm text-slate-400 leading-relaxed">
                  <Info className="text-blue-400 mt-0.5 flex-shrink-0" size={18} />
                  <span>
                    <strong>Maritime Formatting:</strong> Sailors often omit the colon and write the time as four digits followed by time-zone indicators (e.g. <strong>0800</strong> or <strong>2145Z</strong>). It is pronounced digit-by-digit, like <em>"zero-eight-hundred"</em> or <em>"two-one-four-five"</em>.
                  </span>
                </div>
              </div>

              {/* Memory Shortcuts & Tricks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="glass-panel border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-blue-300 mb-3 uppercase tracking-wider">The "Minus 2" Shortcut</h4>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Converting afternoon and evening times (13:00 to 23:00) to standard PM hours is easy if you use the <strong>Minus 2</strong> rule. 
                      Instead of subtracting 12, just subtract 2 from the second digit and drop the leading 1.
                    </p>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-sm">
                      <div className="flex justify-between text-slate-300">
                        <span>1<strong>7</strong>:00</span>
                        <span>➔</span>
                        <span>(7 - 2) = <strong>5</strong>:00 PM</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>1<strong>9</strong>:30</span>
                        <span>➔</span>
                        <span>(9 - 2) = <strong>7</strong>:30 PM</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>2<strong>2</strong>:15</span>
                        <span>➔</span>
                        <span>(2 - 2) = 1<strong>0</strong>:15 PM</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-slate-500 italic">
                    *Note: For 20:00 to 23:00, you retain a 1 in the tens digit (e.g. 22 becomes 10).
                  </div>
                </div>

                <div className="glass-panel border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-emerald-300 mb-3 uppercase tracking-wider">Zulu Time (UTC)</h4>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">
                      Because vessels cross time zones constantly, coordinating actions requires a global reference. 
                      <strong>Zulu Time (Z)</strong> is the military/maritime word for UTC (Coordinated Universal Time) or Greenwich Mean Time (GMT).
                    </p>
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
                      <p className="text-slate-300">
                        <strong>Local Time:</strong> The time zone of your current geographic position.
                      </p>
                      <p className="text-slate-300">
                        <strong>Zulu Time:</strong> 18:00 Local in Halifax (UTC-3) translates to <strong>2100Z</strong> (18:00 + 3 hours).
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 p-2 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 rounded text-xs flex items-center gap-2">
                    <CheckCircle size={14} /> Always use Zulu Time for global radio coordinates and weather logs.
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: Time Matcher */}
          {activeTab === 'match' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center justify-center">
              
              {/* Interactive Analog SVG Clock */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-[300px] h-[300px] rounded-full shadow-2xl flex items-center justify-center border-4 border-slate-700 bg-slate-950">
                  {/* Sky/Day Backdrop inside clock */}
                  <div className={`absolute inset-0 rounded-full transition-all duration-500 ${userIsPm ? 'bg-slate-950/90' : 'bg-sky-950/40'}`}>
                    {userIsPm ? (
                      <Moon className="absolute top-12 left-1/2 -translate-x-1/2 text-yellow-100/20" size={48} />
                    ) : (
                      <Sun className="absolute top-12 left-1/2 -translate-x-1/2 text-amber-500/20 animate-spin-slow" size={48} />
                    )}
                  </div>

                  {/* Clock Face SVG */}
                  <svg className="w-full h-full z-10" viewBox="0 0 200 200">
                    {/* Tick marks */}
                    {[...Array(12)].map((_, i) => {
                      const angle = (i * 30 * Math.PI) / 180;
                      const x1 = 100 + 82 * Math.sin(angle);
                      const y1 = 100 - 82 * Math.cos(angle);
                      const x2 = 100 + 90 * Math.sin(angle);
                      const y2 = 100 - 90 * Math.cos(angle);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#475569"
                          strokeWidth={i % 3 === 0 ? "3" : "1.5"}
                        />
                      );
                    })}

                    {/* Numbers */}
                    {[...Array(12)].map((_, i) => {
                      const angle = ((i + 1) * 30 * Math.PI) / 180;
                      const x = 100 + 70 * Math.sin(angle);
                      const y = 105 - 70 * Math.cos(angle);
                      return (
                        <text
                          key={i}
                          x={x}
                          y={y}
                          fill="#94a3b8"
                          fontSize="12"
                          fontWeight="bold"
                          textAnchor="middle"
                        >
                          {i + 1}
                        </text>
                      );
                    })}

                    {/* Hour Hand */}
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 40 * Math.sin(((userHour * 30 + userMinute * 0.5) * Math.PI) / 180)}
                      y2={100 - 40 * Math.cos(((userHour * 30 + userMinute * 0.5) * Math.PI) / 180)}
                      stroke="#ffffff"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />

                    {/* Minute Hand */}
                    <line
                      x1="100"
                      y1="100"
                      x2={100 + 60 * Math.sin((userMinute * 6 * Math.PI) / 180)}
                      y2={100 - 60 * Math.cos((userMinute * 6 * Math.PI) / 180)}
                      stroke="#3b82f6"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />

                    {/* Center Dot */}
                    <circle cx="100" cy="100" r="5" fill="#f43f5e" />
                  </svg>
                </div>
                
                {/* AM/PM toggle */}
                <div className="flex mt-6 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800 gap-1.5">
                  <button
                    onClick={() => setUserIsPm(false)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      !userIsPm ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Sun size={14} /> AM (00:00 - 11:59)
                  </button>
                  <button
                    onClick={() => setUserIsPm(true)}
                    className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      userIsPm ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <Moon size={14} /> PM (12:00 - 23:59)
                  </button>
                </div>
              </div>

              {/* Match Controls */}
              <div className="glass-panel border border-slate-800 p-6 rounded-2xl flex flex-col justify-between h-full min-h-[300px]">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">TIME MATCHER</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-xs text-slate-400 uppercase">Target Time:</span>
                    <span className="text-2xl font-mono font-bold text-emerald-400">
                      {targetTime.hour.toString().padStart(2, '0')}:{targetTime.minute.toString().padStart(2, '0')}
                    </span>
                  </div>

                  {/* Interactive sliders */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>HOUR HAND</span>
                        <span className="font-mono text-white font-bold">{userHour}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={userHour}
                        onChange={(e) => { setUserHour(parseInt(e.target.value, 10)); setMatcherFeedback({ status: null, message: '' }); }}
                        className="w-full accent-blue-500 bg-slate-850 h-2 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-slate-400 mb-2">
                        <span>MINUTE HAND</span>
                        <span className="font-mono text-white font-bold">{userMinute.toString().padStart(2, '0')}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="55"
                        step="5"
                        value={userMinute}
                        onChange={(e) => { setUserMinute(parseInt(e.target.value, 10)); setMatcherFeedback({ status: null, message: '' }); }}
                        className="w-full accent-blue-500 bg-slate-850 h-2 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-850 space-y-4">
                  {matcherFeedback.status && (
                    <div className={`p-4 rounded-xl border text-sm ${
                      matcherFeedback.status === 'correct' 
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}>
                      {matcherFeedback.message}
                    </div>
                  )}

                  <div className="flex gap-4">
                    {matcherFeedback.status === 'correct' ? (
                      <button
                        onClick={generateNewMatcherTime}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-xl transition-all shadow uppercase tracking-widest flex items-center justify-center gap-2"
                      >
                        Next Time <RefreshCw size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={verifyMatcherTime}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white rounded-xl transition-all shadow uppercase tracking-widest"
                      >
                        Verify Match
                      </button>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Speed Drill Game */}
          {activeTab === 'drill' && (
            <div className="flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
              
              {!drillActive ? (
                <div className="glass-panel border border-slate-800 p-8 rounded-2xl text-center w-full">
                  <Zap className="text-yellow-400 mx-auto mb-4 animate-bounce" size={48} />
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">Clock Translation Speed Drill</h3>
                  <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    Test your instant translation recall! You will have 10 seconds per question to convert between 12-hour and 24-hour clocks. Points are awarded based on remaining time.
                  </p>
                  
                  <div className="flex justify-center gap-8 mb-8 text-slate-300">
                    <div>
                      <div className="text-xs text-slate-500 uppercase tracking-widest">High Score</div>
                      <div className="text-3xl font-mono font-bold text-yellow-400 mt-1">{highScore}</div>
                    </div>
                  </div>

                  <button
                    onClick={startDrill}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-sm font-bold text-white rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 mx-auto shadow-lg hover:shadow-blue-500/20"
                  >
                    <Play size={16} /> Start Game
                  </button>
                </div>
              ) : (
                <div className="glass-panel border border-slate-800 p-6 rounded-2xl w-full">
                  
                  {/* Score & Time Bar */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="text-slate-400 text-xs font-bold uppercase">SCORE: <span className="text-base font-mono text-emerald-400 ml-1">{score}</span></div>
                    <div className="text-slate-400 text-xs font-bold uppercase">HIGH: <span className="text-base font-mono text-slate-300 ml-1">{highScore}</span></div>
                  </div>

                  <div className="w-full bg-slate-950/80 rounded-full h-3 border border-slate-800 overflow-hidden mb-8 shadow-inner">
                    <div 
                      className={`h-full transition-all duration-100 rounded-full ${
                        timeLeft > 4 ? 'bg-blue-500' : 'bg-red-500 animate-pulse'
                      }`}
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    />
                  </div>

                  {/* Question Prompt */}
                  {drillPrompt && (
                    <div className="text-center mb-8">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{drillPrompt.type === 'to24' ? '12h ➔ 24h' : '24h ➔ 12h'}</p>
                      <h3 className="text-3xl font-bold text-white font-mono">{drillPrompt.question.split(': ')[0]}</h3>
                      <h4 className="text-4xl font-extrabold text-blue-400 font-mono mt-3">{drillPrompt.question.split(': ')[1]}</h4>
                    </div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4">
                    {drillPrompt?.options.map((opt, idx) => (
                      <button
                        key={idx}
                        disabled={!!drillFeedback}
                        onClick={() => handleDrillAnswer(opt)}
                        className={`py-4 rounded-xl border text-base font-mono font-bold transition-all ${
                          drillFeedback 
                            ? opt === drillPrompt.answer
                              ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                              : 'bg-slate-950/20 border-slate-900 text-slate-600'
                            : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>

                  {/* Instant Feedback Overlay */}
                  {drillFeedback && (
                    <div className={`mt-6 p-3 rounded-xl border text-center font-bold text-sm ${
                      drillFeedback.isCorrect
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}>
                      {drillFeedback.text}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* TAB 4: Quiz */}
          {activeTab === 'quiz' && (
            <div className="space-y-6 max-w-4xl mx-auto w-full">
              {quizzes.map((q, idx) => (
                <div key={idx} className="glass-panel border border-slate-800 p-6 rounded-2xl">
                  <div className="flex gap-3 mb-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-900/40 border border-blue-800 flex items-center justify-center text-xs font-bold text-blue-300">
                      {idx + 1}
                    </span>
                    <h4 className="text-base font-bold text-slate-200">{q.question}</h4>
                  </div>

                  <div className="space-y-2 pl-9">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = selectedQuizAnswers[idx] === optIdx;
                      const isCorrect = q.answerIdx === optIdx;
                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                          className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex justify-between items-center ${
                            quizSubmitted
                              ? isCorrect
                                ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-300'
                                : isSelected
                                  ? 'bg-rose-950/40 border-rose-500/80 text-rose-300'
                                  : 'bg-slate-950/20 border-slate-900 text-slate-600'
                              : isSelected
                                ? 'bg-blue-900/40 border-blue-500/80 text-blue-200'
                                : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && isCorrect && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900">Correct</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="mt-4 ml-9 p-3 bg-slate-950/60 border border-slate-850 rounded-xl text-xs text-slate-400 leading-relaxed">
                      <span className="font-bold text-slate-300 block mb-1">EXPLANATION:</span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}

              <div className="pt-4 flex justify-between items-center">
                {quizSubmitted ? (
                  <button
                    onClick={() => { setSelectedQuizAnswers({}); setQuizSubmitted(false); }}
                    className="px-6 py-3 bg-slate-850 hover:bg-slate-800 text-sm font-bold text-slate-400 border border-slate-700 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 shadow"
                  >
                    <RefreshCw size={14} /> Reset Quiz
                  </button>
                ) : (
                  <button
                    disabled={Object.keys(selectedQuizAnswers).length < quizzes.length}
                    onClick={() => setQuizSubmitted(true)}
                    className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-sm font-bold text-white rounded-xl transition-all shadow uppercase tracking-widest"
                  >
                    Submit Answers
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
