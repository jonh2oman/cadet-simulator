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
  
  // Handheld Drag & Jelly Wire State
  const [micPos, setMicPos] = useState({ x: 0, y: 0 });
  const micPosRef = useRef({ x: 0, y: 0 });
  const isDraggingMic = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, startMicX: 0, startMicY: 0 });
  const springPoint = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const wireRef = useRef<SVGPathElement>(null);
  const wireInnerRef = useRef<SVGPathElement>(null);

  const weatherNoiseRef = useRef<any>(null);

  // Sync micPos to ref for the animation loop
  useEffect(() => {
    micPosRef.current = micPos;
  }, [micPos]);

  // Handle Dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingMic.current) return;
      setMicPos({
        x: dragStart.current.startMicX + (e.clientX - dragStart.current.x),
        y: dragStart.current.startMicY + (e.clientY - dragStart.current.y)
      });
    };
    const handleMouseUp = () => {
      if (isDraggingMic.current) {
        isDraggingMic.current = false;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Jelly Wire Physics Loop
  useEffect(() => {
    let animationFrameId: number;
    
    // Initialize spring point at rest
    springPoint.current.x = 160;
    springPoint.current.y = 120;

    const updateSpring = () => {
      const baseX = -10;
      const baseY = 200;
      
      const micX = 325 + micPosRef.current.x;
      const micY = 60 + micPosRef.current.y;

      const targetX = (baseX + micX) / 2;
      const dist = Math.hypot(micX - baseX, micY - baseY);
      const targetY = ((baseY + micY) / 2) + Math.max(150, dist * 0.7); // Droop

      const k = 0.03; // Tension (low for jelly effect)
      const damp = 0.85; // Friction

      const ax = (targetX - springPoint.current.x) * k;
      const ay = (targetY - springPoint.current.y) * k;

      springPoint.current.vx += ax;
      springPoint.current.vy += ay;
      springPoint.current.vx *= damp;
      springPoint.current.vy *= damp;

      springPoint.current.x += springPoint.current.vx;
      springPoint.current.y += springPoint.current.vy;

      if (wireRef.current && wireInnerRef.current) {
         const path = `M ${baseX} ${baseY} Q ${springPoint.current.x} ${springPoint.current.y} ${micX} ${micY}`;
         wireRef.current.setAttribute('d', path);
         wireInnerRef.current.setAttribute('d', path);
      }

      animationFrameId = requestAnimationFrame(updateSpring);
    };
    
    updateSpring();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

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
        
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Hardware Panel - Top Half */}
          <div className="w-full bg-slate-800/80 border-b border-slate-700/50 p-8 flex justify-center items-end min-h-[380px] shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)] select-none">
            
            <div className="relative mx-auto w-[650px] mt-12">
              
              {/* Coiled Cable Canvas */}
              <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
                <path ref={wireRef} d="" fill="transparent" stroke="#1e293b" strokeWidth="16" strokeLinecap="round" strokeDasharray="6 8" />
                <path ref={wireInnerRef} d="" fill="transparent" stroke="#0f172a" strokeWidth="8" strokeLinecap="round" strokeDasharray="6 8" />
              </svg>

              {/* Handheld Mic (Resting on top) */}
              <div 
                className="absolute -top-24 left-1/2 w-32 bg-gradient-to-b from-slate-800 to-slate-950 rounded-[2rem] border-2 border-slate-600 shadow-2xl z-20 flex flex-col items-center px-3 py-4 cursor-grab active:cursor-grabbing hover:brightness-110 transition-[filter]"
                style={{ transform: `translate(calc(-50% + ${micPos.x}px), ${micPos.y}px)` }}
                onMouseDown={(e) => {
                  isDraggingMic.current = true;
                  dragStart.current = { x: e.clientX, y: e.clientY, startMicX: micPos.x, startMicY: micPos.y };
                }}
              >
                {/* Speaker Grill */}
                <div className="w-full h-10 bg-slate-950 rounded-xl mb-3 flex flex-col justify-center gap-1 p-2 shadow-inner pointer-events-none">
                  {[1,2,3].map(i => <div key={i} className="h-1 w-full bg-slate-800 rounded-full"></div>)}
                </div>
                {/* Keypad */}
                <div className="grid grid-cols-3 gap-1.5 w-full">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button key={num} onClick={(e) => { e.stopPropagation(); setInputBuffer(p => p.length < 5 ? p + num : p); playStatic(50); }} className="h-6 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white font-bold shadow-sm active:translate-y-px">{num}</button>
                  ))}
                  <button onClick={(e) => { e.stopPropagation(); setInputBuffer(p => p.length < 5 && !p.includes('A') ? p + 'A' : p); playStatic(50); }} className="h-6 bg-purple-900/80 hover:bg-purple-800 rounded text-[10px] text-purple-200 font-bold shadow-sm active:translate-y-px">A</button>
                  <button onClick={(e) => { e.stopPropagation(); setInputBuffer(p => p.length < 5 ? p + '0' : p); playStatic(50); }} className="h-6 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white font-bold shadow-sm active:translate-y-px">0</button>
                  <button onClick={(e) => { e.stopPropagation(); setCurrentChannel('WX'); setInputBuffer(''); playStatic(300); }} className="h-6 bg-blue-900/80 hover:bg-blue-800 rounded text-[10px] text-blue-200 font-bold shadow-sm active:translate-y-px">WX</button>
                  <button onClick={(e) => { e.stopPropagation(); setInputBuffer(p => p.length < 5 && !p.includes('.') ? p + '.' : p); playStatic(50); }} className="h-6 bg-slate-700 hover:bg-slate-600 rounded text-[10px] text-white font-bold shadow-sm active:translate-y-px">.</button>
                  <button onClick={(e) => { e.stopPropagation(); setInputBuffer(''); playStatic(150); }} className="h-6 bg-red-900/80 hover:bg-red-800 rounded text-[10px] text-red-200 font-bold shadow-sm active:translate-y-px">CLR</button>
                  <button onClick={(e) => { e.stopPropagation(); if (inputBuffer) { setCurrentChannel(inputBuffer); setInputBuffer(''); playStatic(300); } }} className="h-6 bg-emerald-900/80 hover:bg-emerald-800 rounded text-[10px] text-emerald-200 font-bold shadow-sm active:translate-y-px">ENT</button>
                </div>
                {/* PTT Button */}
                <div 
                  className="absolute -left-2 top-8 w-2 h-16 bg-red-600 rounded-l-md border border-red-800 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.5)] cursor-pointer active:bg-red-500"
                  onMouseDown={(e) => { e.stopPropagation(); playStatic(100); }}
                ></div>
                {/* Mic Cable attach */}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-6 h-6 bg-slate-900 rounded-full z-[-1] pointer-events-none"></div>
              </div>

              {/* Base Unit */}
              <div className="relative w-full h-[220px] bg-gradient-to-b from-slate-800 to-slate-950 rounded-2xl border-2 border-slate-600 shadow-[0_30px_60px_rgba(0,0,0,0.8)] p-4 flex gap-4 z-10">
                
                {/* Left Speaker */}
                <div className="w-[140px] h-full bg-slate-900 rounded-xl border-2 border-slate-800 p-4 flex flex-col justify-center gap-3 shadow-inner relative">
                  <div className="text-white text-[12px] font-bold tracking-widest text-center absolute top-3 left-0 w-full">ICOM</div>
                  <div className="text-[8px] text-slate-500 font-mono absolute top-8 left-0 w-full text-center">VHF MARINE IC-M506</div>
                  <div className="mt-6 flex flex-col gap-2">
                    {[1,2,3,4,5].map(i => <div key={i} className="h-3 w-full bg-black rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]"></div>)}
                  </div>
                  {/* Cable port */}
                  <div className="absolute bottom-4 -left-2 w-4 h-8 bg-slate-950 rounded-r-md border-y border-r border-slate-700"></div>
                </div>

                {/* Center Screen Area */}
                <div className="flex-1 flex flex-col gap-2 relative">
                  <div className="flex-1 bg-[#ffb000] rounded-lg border-[6px] border-slate-900 shadow-[inset_0_0_30px_rgba(217,119,6,0.9)] p-4 relative flex flex-col overflow-hidden">
                    {/* Screen reflection */}
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-white/10 rounded-t-sm pointer-events-none"></div>
                    
                    {/* Screen Content */}
                    <div className="w-full flex justify-between items-start">
                      <div className="flex gap-2">
                        <div className="text-[10px] text-black/80 font-mono font-bold bg-black/10 px-1 rounded">25W</div>
                        <div className="text-[10px] text-black/80 font-mono font-bold bg-black/10 px-1 rounded">USA</div>
                        {currentChannel === 'WX' && <div className="text-[10px] text-black/80 font-mono font-bold bg-black/10 px-1 rounded animate-pulse">WX</div>}
                      </div>
                      <div className="text-[10px] text-black/80 font-mono font-bold bg-black/10 px-1 rounded">
                        {currentChannel === 'WX' ? 'RX' : 'TX'}
                      </div>
                    </div>

                    <div className="flex-1 flex items-center justify-between mt-2">
                      <div className="flex flex-col text-black/80 font-mono text-[10px] leading-tight">
                        <div>LAT: 45° 30'N</div>
                        <div>LON: 60° 15'W</div>
                        <div className="mt-1 font-bold">{new Date().toLocaleTimeString('en-US', {hour12: false, hour: '2-digit', minute: '2-digit'})} UTC</div>
                      </div>
                      <div className="flex items-start">
                        <div className="text-black/60 font-mono text-sm mt-2 mr-1">CH</div>
                        <div className="font-mono text-7xl text-black/90 font-bold tracking-tighter" style={{ fontFamily: '"Courier New", Courier, monospace' }}>
                          {inputBuffer ? inputBuffer : (currentChannel.length === 1 ? '0' + currentChannel : currentChannel)}
                        </div>
                      </div>
                    </div>
                    
                    {inputBuffer && (
                      <div className="absolute bottom-2 left-4 text-[10px] text-black/80 font-mono font-bold animate-pulse bg-black/10 px-2 py-0.5 rounded">INPUT...</div>
                    )}
                  </div>
                  
                  {/* 4 Soft Keys */}
                  <div className="flex justify-between px-4 h-6">
                    {['SCAN', 'DW', 'CH/WX', 'NAV'].map((lbl, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <button className="w-14 h-5 bg-slate-700 hover:bg-slate-600 rounded-b-lg border-b-2 border-slate-900 shadow-md active:translate-y-1 active:border-b-0 transition-all"></button>
                        <span className="text-[8px] text-white mt-1 font-bold">{lbl}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Controls */}
                <div className="w-[120px] h-full flex flex-col items-center justify-between py-2 relative">
                   {/* DISTRESS Flap */}
                   <div className="absolute top-0 right-0 w-12 h-8 bg-red-600 rounded-bl-xl border-b-2 border-l-2 border-red-800 shadow-md flex items-center justify-center cursor-pointer hover:bg-red-500 transition-colors">
                     <span className="text-[6px] text-white font-bold">DISTRESS</span>
                   </div>

                   {/* D-PAD & Enter */}
                   <div className="mt-8 relative w-20 h-20">
                     <button className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-6 bg-slate-700 rounded-t-lg border-t border-slate-500 shadow-sm flex items-center justify-center active:bg-slate-600"><span className="text-white text-[8px]">▲</span></button>
                     <button className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-6 bg-slate-700 rounded-b-lg border-b border-slate-900 shadow-sm flex items-center justify-center active:bg-slate-600"><span className="text-white text-[8px]">▼</span></button>
                     <button className="absolute top-1/2 left-0 -translate-y-1/2 w-6 h-8 bg-slate-700 rounded-l-lg border-l border-slate-500 shadow-sm flex items-center justify-center active:bg-slate-600"><span className="text-white text-[8px]">◀</span></button>
                     <button className="absolute top-1/2 right-0 -translate-y-1/2 w-6 h-8 bg-slate-700 rounded-r-lg border-r border-slate-900 shadow-sm flex items-center justify-center active:bg-slate-600"><span className="text-white text-[8px]">▶</span></button>
                     <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-slate-800 rounded-full border-2 border-slate-600 shadow-inner flex items-center justify-center active:bg-slate-700"><span className="text-white text-[8px] font-bold">ENT</span></button>
                   </div>
                   
                   {/* 16/9 Button & Knobs */}
                   <div className="flex w-full justify-between items-end mt-4 px-2">
                     <button 
                        onClick={() => { setCurrentChannel('16'); setInputBuffer(''); playStatic(300); }}
                        className="w-10 h-10 bg-blue-600 hover:bg-blue-500 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.8)] border-2 border-blue-400 flex items-center justify-center font-bold text-white text-xs active:scale-95 transition-all"
                     >
                       16
                     </button>
                     
                     <div className="flex flex-col items-center">
                       <div className="w-12 h-12 bg-slate-900 rounded-full border border-slate-700 shadow-[inset_0_2px_5px_rgba(255,255,255,0.1),0_5px_10px_rgba(0,0,0,0.8)] relative">
                         <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-white rounded-full"></div>
                         <div className="absolute inset-2 bg-slate-800 rounded-full shadow-inner"></div>
                       </div>
                       <span className="text-[8px] text-slate-400 mt-1 font-bold">VOL/SQ</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comms Log Panel - Bottom Half */}
          <div className="flex-1 p-8 flex flex-col bg-slate-900/90 overflow-hidden relative border-t-4 border-slate-950">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Live Communications Transcript</h3>
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
