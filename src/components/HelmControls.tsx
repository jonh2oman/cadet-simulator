import React, { useRef, useEffect, useState } from 'react';
import { useSimStore } from '../store/simStore';

const HorizontalThrusterLever = ({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (val: number) => void;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const updateFromEvent = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let pct = x / rect.width; // 0 to 1 (left to right)
    pct = Math.max(0, Math.min(1, pct));
    const val = Math.round((pct * 200) - 100);
    if (Math.abs(val) < 5) onChange(0);
    else onChange(val);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateFromEvent(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isDragging) {
      updateFromEvent(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="bg-slate-950 border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] rounded p-2 w-32 text-center">
        <span className="text-[10px] text-slate-500 block mb-1 font-mono tracking-widest">{label}</span>
        <span className={`text-sm font-mono ${value === 0 ? 'text-slate-500' : 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]'}`}>
          {value > 0 ? `STBD ${value}%` : value < 0 ? `PORT ${Math.abs(value)}%` : '00%'}
        </span>
      </div>
      
      <div 
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={(e) => { e.stopPropagation(); onChange(0); }}
        className="lever-container relative h-14 w-40 bg-gradient-to-b from-slate-400 via-slate-100 to-slate-400 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_-5px_10px_rgba(0,0,0,0.5),inset_0_5px_10px_rgba(255,255,255,0.8)] border border-slate-300 flex items-center justify-center cursor-pointer select-none touch-none overflow-hidden"
      >
        {/* Inner Slot */}
        <div className="absolute h-5 w-32 bg-slate-950 rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex flex-col justify-center">
          <div className="w-full h-0.5 bg-white/10"></div>
        </div>
        
        {/* Scale Markings */}
        <div className="absolute inset-x-3 top-1 flex justify-between px-1 font-mono text-[9px] font-bold text-slate-800 pointer-events-none">
          <span>PORT</span><span>0</span><span>STBD</span>
        </div>

        {/* The Lever Arm and Handle */}
        <div 
          className="absolute top-1/2 w-10 h-16 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center pointer-events-none z-10"
          style={{ left: `${50 + (value / 2 * 0.8)}%`, transition: isDragging ? 'none' : 'left 0.1s ease-out' }}
        >
          <div className="h-8 w-4 bg-gradient-to-r from-slate-500 to-slate-300 rounded-full absolute shadow-[inset_0_2px_2px_rgba(255,255,255,0.5)] z-0"></div>
          <div className="h-6 w-3 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-0 absolute"></div>
          <div className="h-16 w-8 bg-gradient-to-r from-slate-800 to-black rounded-lg shadow-[0_10px_15px_rgba(0,0,0,0.8),inset_2px_0_5px_rgba(255,255,255,0.3)] border border-slate-600 z-10 flex flex-col items-center justify-center relative">
             <div className="absolute top-2 bottom-2 left-1 w-2 bg-gradient-to-r from-white/20 to-transparent rounded-full pointer-events-none"></div>
             <div className="h-1.5 w-5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 my-1"></div>
             <div className="h-1.5 w-5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 my-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HelmControlsProps {
  isControlsPoppedOut: boolean;
  setIsControlsPoppedOut: (v: boolean) => void;
  isPaused: boolean;
  setIsPaused: (v: boolean) => void;
  isPausedRef: React.MutableRefObject<boolean>;
  startHorn: () => void;
  stopHorn: () => void;
  heliState: React.MutableRefObject<{
    x: number;
    y: number;
    altitude: number;
    heading: number;
    speed: number;
    pitch: number;
    roll: number;
    yawRate: number;
  }>;
  speedTextRef: React.RefObject<HTMLSpanElement | null>;
  compassTextRef: React.RefObject<HTMLSpanElement | null>;
  compassCardRef: React.RefObject<HTMLDivElement | null>;
}

export default function HelmControls({
  isControlsPoppedOut,
  setIsControlsPoppedOut,
  isPaused,
  setIsPaused,
  isPausedRef,
  startHorn,
  stopHorn,
  heliState,
  speedTextRef,
  compassTextRef,
  compassCardRef
}: HelmControlsProps) {
  const {
    throttle, setThrottle,
    rudder, setRudder,
    bowThruster, setBowThruster,
    sternThruster, setSternThruster,
    navLightsOn, setNavLightsOn,
    whiteLightsOn, setWhiteLightsOn,
    anchorDropped, setAnchorDropped,
    shipClass,
    simMode, setSimMode,
    engineSoundOn, setEngineSoundOn,
    musicPlaying, setMusicPlaying,
    heliAltitude, setHeliAltitude,
    heliSpeed, setHeliSpeed
  } = useSimStore();

  const [panelScale, setPanelScale] = useState(1);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

  const [steeringMode, setSteeringMode] = useState<'azimuth' | 'wheel'>('azimuth');
  const [isTurningWheel, setIsTurningWheel] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Custom Throttle Lever State
  const [isDraggingLever, setIsDraggingLever] = useState(false);
  const leverTrackRef = useRef<HTMLDivElement>(null);

  const updateLeverFromEvent = (e: React.PointerEvent) => {
    if (!leverTrackRef.current) return;
    const rect = leverTrackRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    let pct = 1 - (y / rect.height); // 0 to 1 (bottom to top)
    pct = Math.max(0, Math.min(1, pct));
    const val = Math.round((pct * 200) - 100);
    if (Math.abs(val) < 5) setThrottle(0);
    else setThrottle(val);
  };

  const handleLeverPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingLever(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    updateLeverFromEvent(e);
  };

  const handleLeverPointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isDraggingLever) {
      updateLeverFromEvent(e);
    }
  };

  const handleLeverPointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingLever(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || ((e.target as HTMLElement).tagName === 'BUTTON' && !(e.target as HTMLElement).closest('.scale-button'))) return;
    if ((e.target as HTMLElement).closest('.steering-wheel-container') || (e.target as HTMLElement).closest('.lever-container')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panelX: panelPos.x, panelY: panelPos.y };
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPanelPos({
        x: dragStart.current.panelX + (e.clientX - dragStart.current.x),
        y: dragStart.current.panelY + (e.clientY - dragStart.current.y)
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const updateWheelAngle = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle > 180) angle -= 360;
    if (angle > 45) angle = 45;
    if (angle < -45) angle = -45;
    if (Math.abs(angle) < 6) angle = 0;
    
    setRudder(Math.round(angle));
  };

  useEffect(() => {
    if (!isTurningWheel) return;
    const handlePointerMove = (e: PointerEvent) => {
      updateWheelAngle(e.clientX, e.clientY);
    };
    const handlePointerUp = () => setIsTurningWheel(false);
    
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isTurningWheel]);

  // Helicopter cyclic puck visual updates
  useEffect(() => {
    const puck = document.getElementById('cyclic-puck');
    if (!puck || simMode !== 'heli') return;
    
    const handleCyclicUpdate = () => {
      // Stub for tracking cyclic updates visually via DOM if needed
    };
    window.addEventListener('keydown', handleCyclicUpdate);
    return () => window.removeEventListener('keydown', handleCyclicUpdate);
  }, [simMode]);

  const controlPanel = (
    <div 
      onMouseDown={isControlsPoppedOut ? undefined : handleMouseDown}
      style={{ 
        transform: isControlsPoppedOut ? `scale(${panelScale})` : `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
        transformOrigin: isControlsPoppedOut ? 'center center' : 'bottom center',
        display: simMode === 'ship' ? 'flex' : 'none',
        position: isControlsPoppedOut ? 'relative' : 'absolute',
        left: isControlsPoppedOut ? 'auto' : '50%',
        bottom: isControlsPoppedOut ? 'auto' : '2rem'
      }}
      className={`glass-panel p-6 flex flex-col gap-6 rounded-2xl ${isControlsPoppedOut ? '' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')} z-20`}
    >
      {/* Panel Scale Buttons */}
      <div className="absolute top-2 left-10 text-[8px] text-slate-500 font-mono flex items-center gap-1.5 z-30" onMouseDown={e => e.stopPropagation()}>
        SCALE:
        {[{label: 'XS', val: 0.5}, {label: 'S', val: 0.75}, {label: 'M', val: 1.0}, {label: 'L', val: 1.25}, {label: 'XL', val: 1.5}].map(sz => (
          <button
            key={sz.label}
            onClick={() => setPanelScale(sz.val)}
            className={`px-1.5 py-0.5 rounded scale-button ${panelScale === sz.val ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {sz.label}
          </button>
        ))}
        <span className="text-slate-600 mx-1">|</span>
        {!isControlsPoppedOut ? (
          <button
            onClick={() => setIsControlsPoppedOut(true)}
            className="px-2 py-0.5 bg-blue-600 text-white hover:bg-blue-500 rounded font-bold uppercase tracking-wider text-[8px] scale-button"
          >
            Pop Out Console
          </button>
        ) : (
          <button
            onClick={() => setIsControlsPoppedOut(false)}
            className="px-2 py-0.5 bg-rose-600 text-white hover:bg-rose-500 rounded font-bold uppercase tracking-wider text-[8px] scale-button"
          >
            Dock Console
          </button>
        )}
      </div>

      {/* Screws design */}
      <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-45"></div></div>
      <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 -rotate-12"></div></div>
      <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-90"></div></div>
      <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-0"></div></div>

      {/* Top Label Plate */}
      <div className="flex justify-between items-start border-b border-slate-700 pb-3 px-2">
        <div>
          <h3 className="text-xs font-bold text-slate-300 tracking-widest font-mono">H2OMAN CONTROLS</h3>
          <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">AZIMUTH THRUSTER UNIT LT(N)-H2O</p>
        </div>
        
        <div className="flex gap-4 items-center flex-1 justify-end mr-4">
          <button 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setAnchorDropped(!anchorDropped)}
            className={`px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg border-b-[3px] active:translate-y-[2px] active:border-b-[1px] transition-all flex-1 max-w-[180px] ${
              anchorDropped 
                ? 'bg-gradient-to-b from-amber-700 to-amber-900 text-amber-200 border-amber-950 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                : 'bg-gradient-to-b from-slate-600 to-slate-800 text-slate-200 border-slate-950 hover:from-slate-500 hover:to-slate-700 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            }`}
          >
            {anchorDropped ? 'WEIGH ANCHOR' : 'DROP ANCHOR'}
          </button>
          <button 
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => {
              setIsPaused(!isPaused);
              isPausedRef.current = !isPaused;
            }}
            className={`px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg border-b-[3px] active:translate-y-[2px] active:border-b-[1px] transition-all flex-1 max-w-[180px] mr-4 ${
              isPaused 
                ? 'bg-gradient-to-b from-red-700 to-red-900 text-red-200 border-red-950 animate-pulse shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)]' 
                : 'bg-gradient-to-b from-slate-600 to-slate-800 text-slate-200 border-slate-950 hover:from-slate-500 hover:to-slate-700 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.2)]'
            }`}
          >
            {isPaused ? 'RESUME' : 'PAUSE'}
          </button>
          <button 
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => { e.stopPropagation(); startHorn(); }}
            onPointerUp={(e) => { e.stopPropagation(); stopHorn(); }}
            onPointerLeave={(e) => { e.stopPropagation(); stopHorn(); }}
            className="px-6 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest rounded-lg border-b-[3px] active:translate-y-[2px] active:border-b-[1px] transition-all flex-1 max-w-[180px] mr-4 bg-gradient-to-b from-red-600 to-red-800 text-red-100 border-red-950 hover:from-red-500 hover:to-red-700 active:from-red-700 active:to-red-900 shadow-[0_4px_8px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.4)] select-none touch-none"
          >
            📣 HORN [H]
          </button>
          <div className="flex gap-3 glass-panel-inner p-2 rounded-lg items-center" onMouseDown={e => e.stopPropagation()}>
            <button 
              onClick={() => setMusicPlaying(!musicPlaying)}
              className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${musicPlaying ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              🎵 MUSIC: {musicPlaying ? 'ON' : 'OFF'}
            </button>
            <button 
              onClick={() => setEngineSoundOn(!engineSoundOn)}
              className={`px-2 py-1 rounded text-[9px] font-mono font-bold uppercase transition-all ${engineSoundOn ? 'bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
            >
              🔊 ENG: {engineSoundOn ? 'ON' : 'OFF'}
            </button>
            <div className="h-4 w-px bg-slate-700 mx-1"></div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
              <span className="text-[8px] text-slate-400 font-mono">SYS OK</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
              <span className="text-[8px] text-slate-400 font-mono">MANUAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex gap-12 items-end px-4">
        {/* Side Thrusters */}
        {(shipClass === 'corvette' || shipClass === 'frigate') && (
          <div className="flex flex-col gap-4 border-r border-slate-700 pr-8 mr-[-16px]">
            <HorizontalThrusterLever label="BOW THRUSTER" value={bowThruster} onChange={setBowThruster} />
            <HorizontalThrusterLever label="STERN THRUSTER" value={sternThruster} onChange={setSternThruster} />
          </div>
        )}

        {/* Lighting Toggles */}
        <div className="flex flex-col gap-6 justify-end border-r border-slate-700 pr-8 mr-[-16px]">
          <div className="text-center">
            <button 
              onClick={() => setNavLightsOn(!navLightsOn)}
              className={`w-12 h-12 rounded-full border-[3px] shadow-inner flex items-center justify-center transition-all ${navLightsOn ? 'bg-emerald-500/20 border-emerald-500 shadow-[inset_0_0_10px_rgba(16,185,129,0.5),0_0_15px_rgba(16,185,129,0.4)]' : 'bg-slate-900 border-slate-700'}`}
            >
              <div className={`w-3 h-3 rounded-full ${navLightsOn ? 'bg-emerald-400' : 'bg-slate-700'}`}></div>
            </button>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 block">NAV LTS</span>
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => setWhiteLightsOn(!whiteLightsOn)}
              className={`w-12 h-12 rounded-full border-[3px] shadow-inner flex items-center justify-center transition-all ${whiteLightsOn ? 'bg-slate-200/20 border-slate-300 shadow-[inset_0_0_10px_rgba(255,255,255,0.5),0_0_15px_rgba(255,255,255,0.4)]' : 'bg-slate-900 border-slate-700'}`}
            >
              <div className={`w-3 h-3 rounded-full ${whiteLightsOn ? 'bg-white' : 'bg-slate-700'}`}></div>
            </button>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 block">MAST LTS</span>
          </div>
        </div>

        {/* Vertical Throttle Lever */}
        <div className="flex flex-col items-center gap-4">
          <div className="glass-panel-inner p-2 w-24 text-center rounded-lg">
            <span className="text-xs text-slate-500 block mb-1 font-mono">THRUST</span>
            <span className={`text-xl font-mono ${throttle === 0 ? 'text-slate-500' : throttle > 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]'}`}>
              {throttle > 0 ? `+${throttle}` : throttle < 0 ? throttle : '00'}%
            </span>
          </div>
          
          {/* Realistic Throttle Base */}
          <div 
            ref={leverTrackRef}
            onPointerDown={handleLeverPointerDown}
            onPointerMove={handleLeverPointerMove}
            onPointerUp={handleLeverPointerUp}
            className="lever-container relative w-24 h-56 bg-gradient-to-r from-slate-400 via-slate-100 to-slate-400 rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_-5px_10px_rgba(0,0,0,0.5),inset_0_5px_10px_rgba(255,255,255,0.8)] border border-slate-300 flex items-center justify-center cursor-pointer select-none touch-none overflow-hidden"
          >
            <div className="absolute w-6 h-48 bg-slate-950 rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex justify-center">
              <div className="w-0.5 h-full bg-white/10"></div>
            </div>
            
            <div className="absolute inset-y-4 left-1 flex flex-col justify-between py-1 font-mono text-[9px] font-bold text-slate-800 pointer-events-none">
              <span>100</span><span>50</span><span>0</span><span>-50</span><span>-100</span>
            </div>
            <div className="absolute inset-y-4 right-1 flex flex-col justify-between py-1 font-mono text-[9px] font-bold text-slate-800 pointer-events-none text-right tracking-tighter">
              <span>AHD</span><span></span><span></span><span></span><span>AST</span>
            </div>

            {/* Handle */}
            <div 
              className="absolute left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
              style={{ top: `${50 - (throttle / 2)}%`, transition: isDraggingLever ? 'none' : 'top 0.1s ease-out' }}
            >
              <div className="w-8 h-4 bg-gradient-to-r from-slate-500 to-slate-300 rounded-t-lg -mb-1 shadow-[inset_0_2px_2px_rgba(255,255,255,0.5)]"></div>
              <div className="w-4 h-6 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-0"></div>
              <div className="w-20 h-10 bg-gradient-to-b from-slate-800 to-black rounded-lg shadow-[0_10px_15px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.3)] border border-slate-600 -mt-2 z-10 flex items-center justify-center relative">
                 <div className="absolute top-1 left-2 right-2 h-2 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none"></div>
                 <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 mx-1"></div>
                 <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 mx-1"></div>
              </div>
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lever <span className="text-slate-500 font-normal">[W/X]</span></span>
        </div>

        {/* Gyrocompass */}
        <div className="flex flex-col items-center px-2 pt-0 justify-end">
           <div className="flex gap-4 mb-10 mt-[-10px]">
             <div className="flex flex-col items-center">
               <span className="text-[10px] text-slate-500 font-mono mb-1 font-bold tracking-widest">SPEED</span>
               <div className="glass-panel-inner px-4 py-2 min-w-[85px] text-center rounded-lg">
                 <span ref={speedTextRef} className="text-xl text-emerald-400 font-mono drop-shadow-[0_0_5px_rgba(52,211,153,0.5)] tracking-wider">0.0 kts</span>
               </div>
             </div>
             <div className="flex flex-col items-center">
               <span className="text-[10px] text-slate-500 font-mono mb-1 font-bold tracking-widest">HEADING</span>
               <div className="glass-panel-inner px-4 py-2 min-w-[85px] text-center rounded-lg">
                 <span ref={compassTextRef} className="text-xl text-amber-400 font-mono drop-shadow-[0_0_5px_rgba(251,191,36,0.5)] tracking-wider">000°</span>
               </div>
             </div>
           </div>

           <div className="relative w-32 h-32 bg-slate-900 rounded-full border-4 border-slate-950 shadow-[0_5px_15px_rgba(0,0,0,0.5),inset_0_5px_15px_rgba(0,0,0,1)] flex items-center justify-center overflow-hidden">
             <div className="absolute top-0 w-1 h-3 bg-red-500 z-20 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
             <div className="absolute top-3 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500 z-20"></div>
             
             <div ref={compassCardRef} className="absolute inset-0 rounded-full flex items-center justify-center z-10 transition-transform duration-75">
                <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                <span className="absolute top-2 text-[10px] font-bold text-slate-300">N</span>
                <span className="absolute right-2 text-[10px] font-bold text-slate-300">E</span>
                <span className="absolute bottom-2 text-[10px] font-bold text-slate-300">S</span>
                <span className="absolute left-2 text-[10px] font-bold text-slate-300">W</span>
                <div className="absolute w-full h-px bg-slate-700"></div>
                <div className="absolute h-full w-px bg-slate-700"></div>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <div key={deg} className="absolute w-full h-full flex items-start justify-center" style={{ transform: `rotate(${deg}deg)` }}>
                    <div className="w-0.5 h-1.5 bg-slate-500 mt-1"></div>
                  </div>
                ))}
             </div>
           </div>
           <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">GYROCOMPASS</span>
        </div>
        
        <div className="h-48 w-0.5 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
        
        {/* Steering Dial */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-2 mb-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setSteeringMode('azimuth')}
              className={`px-3 py-1 text-[9px] font-bold tracking-widest rounded ${steeringMode === 'azimuth' ? 'bg-amber-500 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              AZIMUTH
            </button>
            <button 
              onClick={() => setSteeringMode('wheel')}
              className={`px-3 py-1 text-[9px] font-bold tracking-widest rounded ${steeringMode === 'wheel' ? 'bg-amber-500 text-slate-900 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-slate-500 hover:text-slate-300'}`}
            >
              WHEEL
            </button>
          </div>

          <div className="glass-panel-inner p-2 w-32 text-center rounded-lg">
            <span className="text-xs text-slate-500 block mb-1 font-mono">HEADING CMD</span>
            <span className={`text-xl font-mono ${rudder > 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : rudder < 0 ? 'text-red-400 drop-shadow-[0_0_5px_rgba(248,113,113,0.8)]' : 'text-slate-500'}`}>
              {rudder > 0 ? "STBD " + rudder.toString().padStart(2, '0') : rudder < 0 ? "PORT " + Math.abs(rudder).toString().padStart(2, '0') : '00°'}
            </span>
          </div>
          
          {steeringMode === 'azimuth' ? (
            <div 
              ref={wheelRef}
              className="steering-wheel-container relative w-36 h-36 mt-2 mb-2 rounded-full cursor-pointer touch-none flex items-center justify-center bg-slate-900 border-[4px] border-slate-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)]"
              onPointerDown={(e) => { setIsTurningWheel(true); updateWheelAngle(e.clientX, e.clientY); }}
            >
              <div className="absolute inset-1 rounded-full border-4 border-transparent pointer-events-none" style={{
                borderTopColor: '#ef4444', borderLeftColor: '#ef4444',
                borderRightColor: '#10b981', borderBottomColor: '#10b981',
                transform: 'rotate(-45deg)' 
              }}></div>
              <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-900 z-0 rounded-b-full"></div>
              <div className="absolute inset-5 rounded-full bg-slate-950 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] z-0">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-amber-500"></div>
                <div className="absolute top-2.5 left-4 w-2 h-0.5 bg-red-500 rotate-45"></div>
                <div className="absolute top-2.5 right-4 w-2 h-0.5 bg-emerald-500 -rotate-45"></div>
              </div>

              <div 
                className="absolute inset-0 transition-transform duration-75 z-10"
                style={{ transform: `rotate(${rudder}deg)` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-5 h-16 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 rounded-b-lg origin-top z-0" style={{ transform: 'rotate(180deg)' }}>
                  <div className="w-full h-8 bg-gradient-to-b from-slate-800 to-black rounded-b-lg absolute bottom-0 shadow-[0_5px_10px_rgba(0,0,0,0.8)] border-x border-b border-slate-600"></div>
                </div>
                
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border-[3px] border-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center z-10">
                  <div className="w-16 h-16 bg-slate-950 rounded-full shadow-inner flex items-center justify-center">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-1.5 h-10 bg-gradient-to-r from-slate-300 to-slate-500 relative">
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-b-[4px] border-l-transparent border-r-transparent border-b-white"></div>
                        </div>
                        <div className="absolute w-10 h-1.5 bg-gradient-to-b from-slate-300 to-slate-500"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center rotate-45">
                        <div className="w-1 h-7 bg-slate-600"></div>
                        <div className="absolute w-7 h-1 bg-slate-600"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div 
              ref={wheelRef}
              className="steering-wheel-container relative w-36 h-36 mt-2 mb-2 rounded-full cursor-pointer touch-none"
              onPointerDown={(e) => { setIsTurningWheel(true); updateWheelAngle(e.clientX, e.clientY); }}
            >
              <div className="absolute inset-0 bg-slate-900 rounded-full border-[4px] border-slate-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)]"></div>
              
              <div 
                className="absolute inset-0 transition-transform duration-75"
                style={{ transform: `rotate(${rudder}deg)` }}
              >
                <div className="absolute inset-4 rounded-full border-8 border-amber-900 shadow-xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-800 rounded-full border-2 border-amber-600 shadow-md z-10">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-900 rounded-full"></div>
                </div>
                
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                  <div 
                    key={angle}
                    className="absolute top-1/2 left-1/2 w-1.5 h-[80px] bg-amber-800 border-x border-amber-900 origin-bottom"
                    style={{ 
                      transform: `translateX(-50%) translateY(-100%) rotate(${angle}deg)`,
                      transformOrigin: 'bottom center'
                    }}
                  >
                    <div className={`absolute top-[-15px] left-1/2 -translate-x-1/2 w-3 h-4 rounded-t-full ${i === 0 ? 'bg-slate-300' : 'bg-amber-700'}`}></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Steering <span className="text-slate-500 font-normal">[←/→]</span></span>
        </div>
      </div>
    </div>
  );

  const heliFlightPanel = (
    <div 
      style={{ 
        display: simMode === 'heli' ? 'flex' : 'none'
      }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 glass-panel p-6 flex flex-col gap-6 rounded-2xl z-50 min-w-[340px]"
    >
      <div className="flex justify-between items-center border-b border-white/10 pb-3">
         <div>
            <h3 className="text-xs font-bold text-emerald-400 tracking-widest font-mono">HELI-OPS FLIGHT CONTROLS</h3>
         </div>
         <button 
           onClick={() => {
             setSimMode('ship');
             setHeliSpeed(0);
             setHeliAltitude(0);
           }}
           className="px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded-lg border bg-red-950/40 text-red-400 border-red-800/50 hover:bg-red-800 hover:text-white transition-all shadow-[0_0_10px_rgba(239,68,68,0.2)]"
         >
           RETURN TO SHIP
         </button>
      </div>

      <div className="flex flex-col gap-5 items-center w-full">
         <div className="text-[10px] text-emerald-400/80 font-mono bg-emerald-950/20 border border-emerald-500/20 px-3 py-2 rounded-lg w-full text-center">
           💡 WASD/Arrows to Steer & Fly! SPACE/SHIFT (or Q/Z) to Climb/Descend!
         </div>

         {/* HEIGHT / ALTITUDE */}
         <div className="flex w-full items-center justify-between gap-4" onMouseDown={e => e.stopPropagation()}>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest w-24">FLIGHT HEIGHT</span>
            <input 
              type="range"
              min="0"
              max="100"
              value={heliAltitude}
              onChange={(e) => setHeliAltitude(parseInt(e.target.value))}
              className="flex-1 h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <span className="text-xs font-mono text-emerald-400 w-10 text-right">{heliAltitude} ft</span>
         </div>
         
         {/* SPEED */}
         <div className="flex w-full items-center justify-between gap-4" onMouseDown={e => e.stopPropagation()}>
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest w-24">FLIGHT SPEED</span>
            <input 
              type="range"
              min="-10"
              max="30"
              value={heliSpeed}
              onChange={(e) => setHeliSpeed(parseInt(e.target.value))}
              className="flex-1 h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <span className="text-xs font-mono text-sky-400 w-10 text-right">{heliSpeed} kts</span>
         </div>

         {/* Quick Action Steering Buttons */}
         <div className="flex gap-2 w-full pt-1" onMouseDown={e => e.stopPropagation()}>
            <button 
              onClick={() => { heliState.current.heading -= 0.15; }}
              className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 tracking-wider font-mono transition-all"
            >
              ◀ STEER PORT
            </button>
            <button 
              onClick={() => { heliState.current.heading += 0.15; }}
              className="flex-1 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 tracking-wider font-mono transition-all"
            >
              STEER STBD ▶
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <>
      {controlPanel}
      {heliFlightPanel}
    </>
  );
}
