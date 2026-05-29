import { useState, useEffect, useRef } from 'react';
import { Radio } from 'lucide-react';
import { scenarios } from '../scenarios';
import type { RadioMessage } from '../scenarios';

declare global {
  interface Window {
    audioCtx?: AudioContext;
    staticBuffer?: AudioBuffer;
  }
}

// Initialize Web Audio API for static noise
const getAudioCtx = () => {
  if (!window.audioCtx) {
    window.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create static buffer
    const bufferSize = window.audioCtx.sampleRate * 2; // 2 seconds
    window.staticBuffer = window.audioCtx.createBuffer(1, bufferSize, window.audioCtx.sampleRate);
    const data = window.staticBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  return window.audioCtx;
};

const playStatic = (duration = 300, continuous = false): any => {
  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') ctx.resume();
  
  const noise = ctx.createBufferSource();
  noise.buffer = window.staticBuffer || null;
  noise.loop = continuous;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  
  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
  
  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  noise.start();
  if (!continuous) {
    setTimeout(() => {
      try { noise.stop(); } catch (e) {}
    }, duration);
  }
  return noise;
};

export default function RadioGame() {
  const [activeScenario, setActiveScenario] = useState<string>('distress-mayday');
  const [currentNodeId, setCurrentNodeId] = useState<string>('start');
  const [commsLog, setCommsLog] = useState<RadioMessage[]>([]);
  const [currentChannel, setCurrentChannel] = useState<string>('16');
  const [inputBuffer, setInputBuffer] = useState<string>('');
  
  const weatherNoiseRef = useRef<any>(null);

  useEffect(() => {
    // Initialize scenario
    const node = scenarios[activeScenario]?.[currentNodeId];
    if (node && currentNodeId === 'start') {
      setCommsLog(node.messages);
    }
  }, [activeScenario, currentNodeId]);

  // Handle Audio & Channel Changes
  useEffect(() => {
    window.speechSynthesis.cancel();
    if (weatherNoiseRef.current) {
      try { weatherNoiseRef.current.stop(); } catch(e) {}
      weatherNoiseRef.current = null;
    }

    if (currentChannel === 'WX' || currentChannel === '1.00' || currentChannel === '1') {
      // Play weather broadcast
      weatherNoiseRef.current = playStatic(0, true);
      
      const weatherScript = "Marine forecast for the coastal waters. Wind northwest 15 to 20 knots. Seas 2 to 4 feet. Chance of showers. Visibility 5 nautical miles. End of message.";
      const msg = new SpeechSynthesisUtterance(weatherScript);
      msg.rate = 0.85;
      msg.pitch = 0.7;
      msg.onend = () => {
        if (weatherNoiseRef.current) {
          try { weatherNoiseRef.current.stop(); } catch(e) {}
          weatherNoiseRef.current = null;
        }
      };
      window.speechSynthesis.speak(msg);
    }

    return () => {
      window.speechSynthesis.cancel();
      if (weatherNoiseRef.current) {
        try { weatherNoiseRef.current.stop(); } catch(e) {}
      }
    };
  }, [currentChannel]);

  // Keyboard support for typing channels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in a text field (if any exist later)
      if (e.target instanceof HTMLElement && e.target.tagName === 'INPUT') return;

      if (e.key >= '0' && e.key <= '9') {
        setInputBuffer(p => p.length < 5 ? p + e.key : p);
      } else if (e.key === '.') {
        setInputBuffer(p => p.length < 5 && !p.includes('.') ? p + '.' : p);
      } else if (e.key === 'a' || e.key === 'A') {
        setInputBuffer(p => p.length < 5 && !p.includes('A') ? p + 'A' : p);
      } else if (e.key === 'Enter') {
        if (inputBuffer) {
          setCurrentChannel(inputBuffer);
          setInputBuffer('');
          playStatic(300);
        }
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        setInputBuffer('');
        playStatic(150);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputBuffer]);

  // Voice acting for NPC traffic
  useEffect(() => {
    if (commsLog.length === 0) return;
    const lastMsg = commsLog[commsLog.length - 1];
    
    // Only voice NPC messages
    if (lastMsg.speaker !== 'CADET' && lastMsg.speaker !== 'OTHER') {
      window.speechSynthesis.cancel();
      
      // Start static background
      if (weatherNoiseRef.current) {
        try { weatherNoiseRef.current.stop(); } catch(e) {}
      }
      weatherNoiseRef.current = playStatic(0, true);
      
      const msg = new SpeechSynthesisUtterance(lastMsg.text);
      msg.rate = 0.95;
      
      // Give different pitches based on the speaker to make them sound like different people
      if (lastMsg.speaker === 'COAST GUARD') msg.pitch = 0.9;
      else if (lastMsg.speaker === 'TUGBOAT') msg.pitch = 0.6;
      else if (lastMsg.speaker === 'MARINA') msg.pitch = 1.1;
      else msg.pitch = 1.0;

      msg.onend = () => {
        if (weatherNoiseRef.current) {
          try { weatherNoiseRef.current.stop(); } catch(e) {}
          weatherNoiseRef.current = null;
        }
      };
      
      window.speechSynthesis.speak(msg);
    }
  }, [commsLog]);

  const changeScenario = (id: string) => {
    setActiveScenario(id);
    setCurrentNodeId('start');
  };

  const handleOptionClick = (nextNode: string) => {
    const node = scenarios[activeScenario]?.[nextNode];
    if (node) {
      setCommsLog(prev => [...prev, ...node.messages]);
      setCurrentNodeId(nextNode);
    }
  };

  return (
    <div className="w-full h-full bg-slate-900 flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background CRT styling */}
      <div className="absolute inset-0 screen-crt opacity-20 mix-blend-overlay pointer-events-none"></div>

      <div className="w-full max-w-5xl h-full max-h-[850px] glass-panel border border-slate-700/50 rounded-2xl flex flex-col shadow-2xl z-10 overflow-hidden">
        
        {/* Radio Header */}
        <div className="p-6 border-b border-slate-700/50 bg-slate-800/80 flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Radio className="text-emerald-400" size={32} />
            <div>
              <h2 className="text-xl font-bold text-slate-200">VHF Marine Radio Console</h2>
              <p className="text-slate-400 text-xs tracking-widest uppercase mt-1">Communications Training Simulator</p>
            </div>
          </div>
          <select 
            value={activeScenario}
            onChange={(e) => changeScenario(e.target.value)}
            className="bg-slate-950 border-2 border-slate-700 text-sm text-emerald-400 font-mono rounded px-4 py-2 outline-none shadow-inner"
          >
            <option value="distress-mayday">Scenario: DISTRESS (MAYDAY)</option>
            <option value="medical-panpan">Scenario: MEDICAL (PAN-PAN)</option>
            <option value="hazard-securite">Scenario: HAZARD (SECURITE)</option>
            <option value="bridge-to-bridge">Scenario: BRIDGE-TO-BRIDGE</option>
          </select>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          {/* Hardware Panel */}
          <div className="w-1/3 min-w-[320px] bg-slate-800 border-r border-slate-700/50 p-6 flex flex-col shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]">
            <div className="bg-slate-950 rounded-2xl p-6 border-4 border-slate-700 shadow-inner relative overflow-hidden flex-1 flex flex-col justify-start items-center">
              <div className="absolute inset-0 bg-green-900/10 mix-blend-screen pointer-events-none"></div>
              
              <div className="w-full flex justify-between items-start mb-6">
                <div className="text-right">
                  <div className="text-xs text-emerald-500/70 font-mono tracking-widest">INT / 1W</div>
                  <div className={`text-sm font-mono mt-2 ${currentChannel === 'WX' ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
                    {currentChannel === 'WX' ? 'RX ONLY' : 'TX READY'}
                  </div>
                </div>
              </div>

              {/* Display */}
              <div className="bg-slate-900/50 w-full rounded-lg border-2 border-slate-800 p-4 flex flex-col items-end mb-6 relative shadow-inner h-28 justify-center">
                <div className="absolute top-2 left-3 text-xs text-emerald-500/50 font-mono">CH</div>
                <div className="font-mono text-6xl text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)] font-bold tracking-tighter">
                  {inputBuffer ? inputBuffer : (currentChannel.length === 1 ? '0' + currentChannel : currentChannel)}
                </div>
                {inputBuffer && (
                  <div className="absolute bottom-2 left-3 text-xs text-amber-500 font-mono animate-pulse">INPUT...</div>
                )}
              </div>
              
              {/* Numpad */}
              <div className="grid grid-cols-4 gap-2 w-full mt-auto">
                {[1, 2, 3].map(num => (
                  <button 
                    key={num}
                    onClick={() => { setInputBuffer(p => p.length < 5 ? p + num : p); playStatic(50); }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xl text-slate-300 font-bold transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => { setInputBuffer(p => p.length < 5 && !p.includes('A') ? p + 'A' : p); playStatic(50); }}
                  className="py-2 bg-purple-900/40 hover:bg-purple-800/60 text-purple-400 rounded-lg text-xl font-bold transition-all border-b-4 border-purple-950 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  A
                </button>
                {[4, 5, 6].map(num => (
                  <button 
                    key={num}
                    onClick={() => { setInputBuffer(p => p.length < 5 ? p + num : p); playStatic(50); }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xl text-slate-300 font-bold transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => { setCurrentChannel('WX'); setInputBuffer(''); playStatic(300); }}
                  className="py-2 bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 rounded-lg text-lg font-bold transition-all border-b-4 border-blue-950 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  WX
                </button>
                {[7, 8, 9].map(num => (
                  <button 
                    key={num}
                    onClick={() => { setInputBuffer(p => p.length < 5 ? p + num : p); playStatic(50); }}
                    className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xl text-slate-300 font-bold transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => { setCurrentChannel('16'); setInputBuffer(''); playStatic(300); }}
                  className="py-2 bg-orange-900/40 hover:bg-orange-800/60 text-orange-400 rounded-lg text-lg font-bold transition-all border-b-4 border-orange-950 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  16/9
                </button>
                <button 
                  onClick={() => { setInputBuffer(p => p.length < 5 && !p.includes('.') ? p + '.' : p); playStatic(50); }}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xl text-slate-300 font-bold transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  .
                </button>
                <button 
                  onClick={() => { setInputBuffer(p => p.length < 5 ? p + '0' : p); playStatic(50); }}
                  className="py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xl text-slate-300 font-bold transition-all border-b-4 border-slate-900 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  0
                </button>
                <button 
                  onClick={() => { setInputBuffer(''); playStatic(150); }}
                  className="py-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 rounded-lg text-lg font-bold transition-all border-b-4 border-red-950 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  CLR
                </button>
                <button 
                  onClick={() => { if (inputBuffer) { setCurrentChannel(inputBuffer); setInputBuffer(''); playStatic(300); } }}
                  className="py-2 bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 rounded-lg text-lg font-bold transition-all border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1 shadow-md font-mono">
                  ENT
                </button>
              </div>
            </div>
          </div>
          
          {/* Comms Log Panel */}
          <div className="flex-1 p-8 flex flex-col bg-slate-900/80 overflow-hidden relative">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Live Communications Transcript</h3>
            <div className="flex-1 overflow-y-auto pr-4 space-y-4 font-mono text-base">
              
              {commsLog.map((msg, idx) => (
                <div key={idx} className={"rounded-xl p-5 border-2 shadow-lg " + (msg.speaker === 'CADET' ? 'bg-blue-950/40 border-blue-900/50 ml-12' : 'bg-slate-800/80 border-slate-700/80 mr-12')}>
                  <div className="text-xs text-slate-400 mb-2 font-bold">{msg.speaker}</div>
                  <div className={msg.speaker === 'CADET' ? 'text-emerald-300 text-lg' : 'text-blue-200 text-lg'}>"{msg.text}"</div>
                  
                  {msg.options && (
                    <div className="mt-6 flex flex-col gap-3">
                      {(scenarios[activeScenario]?.[currentNodeId]?.expectedChannel && currentChannel !== scenarios[activeScenario]?.[currentNodeId]?.expectedChannel?.toString() && idx === commsLog.length - 1) ? (
                        <div className="text-red-400 font-bold animate-pulse text-sm border border-red-900/50 bg-red-950/40 p-4 rounded-lg text-center tracking-widest shadow-inner">
                          [ TUNE TO CH {scenarios[activeScenario]?.[currentNodeId]?.expectedChannel} TO CONTINUE ]
                        </div>
                      ) : (
                        <>
                          <div className="text-xs text-amber-500/80 font-bold mb-1">SELECT YOUR RESPONSE:</div>
                          {msg.options.map((opt, optIdx) => (
                            <button 
                              key={optIdx}
                              onClick={() => handleOptionClick(opt.nextNode)}
                              className="text-left px-5 py-3 bg-slate-900 hover:bg-slate-700 rounded-lg border border-slate-600 text-sm text-slate-200 transition-all shadow hover:shadow-emerald-500/20 hover:border-emerald-500/50"
                            >
                              {opt.text}
                            </button>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
