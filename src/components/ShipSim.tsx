import React, { useRef, useEffect, useState } from 'react';
import ControlPortal from './ControlPortal';

const HorizontalThrusterLever = ({ label, value, onChange }: { label: string, value: number, onChange: (val: number) => void }) => {
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
          {/* Arm Base / Joint */}
          <div className="h-8 w-4 bg-gradient-to-r from-slate-500 to-slate-300 rounded-full absolute shadow-[inset_0_2px_2px_rgba(255,255,255,0.5)] z-0"></div>
          {/* Arm Shaft */}
          <div className="h-6 w-3 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-0 absolute"></div>
          {/* Grip */}
          <div className="h-16 w-8 bg-gradient-to-r from-slate-800 to-black rounded-lg shadow-[0_10px_15px_rgba(0,0,0,0.8),inset_2px_0_5px_rgba(255,255,255,0.3)] border border-slate-600 z-10 flex flex-col items-center justify-center relative">
             <div className="absolute top-2 bottom-2 left-1 w-2 bg-gradient-to-r from-white/20 to-transparent rounded-full pointer-events-none"></div>
             {/* Grip accents */}
             <div className="h-1.5 w-5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 my-1"></div>
             <div className="h-1.5 w-5 bg-amber-500 rounded-full shadow-[0_0_5px_rgba(245,158,11,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 my-1"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ShipSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedTextRef = useRef<HTMLSpanElement>(null);
  const compassTextRef = useRef<HTMLSpanElement>(null);
  const compassCardRef = useRef<HTMLDivElement>(null);

  // Ship physics state refs
  const shipState = useRef({
    x: 460,
    y: 150,
    heading: 0, // in radians
    speed: 0
  });
  
  const zoomRef = useRef(1);

  const buoys = useRef([
    { id: '1', type: 'port', x: 200, y: 200 }, // Green
    { id: '2', type: 'starboard', x: 200, y: 0 }, // Red
  ]);

  // Custom Buoy State
  const customBuoysRef = useRef<{ x: number; y: number; color: 'yellow' | 'green' | 'red' }[]>([]);
  const [customBuoyColor, setCustomBuoyColor] = useState<'yellow' | 'green' | 'red'>('yellow');

  // Pre-made Courses
  interface CourseGate {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    passed: boolean;
  }

  interface Course {
    id: string;
    name: string;
    description: string;
    gates: CourseGate[];
    berthRequired: boolean;
  }

  const PREMADE_COURSES: Course[] = [
    {
      id: 'archipelago_slalom',
      name: 'Archipelago Slalom',
      description: 'Depart from the dock, sail around the outer islands through 5 gate checkpoints, and safely return to park in the berth zone.',
      berthRequired: true,
      gates: [
        { x1: 250, y1: -50, x2: 450, y2: -50, passed: false }, // Outward Gate
        { x1: 50, y1: -360, x2: 250, y2: -360, passed: false }, // North-West Channel
        { x1: -150, y1: 100, x2: -150, y2: 300, passed: false }, // West Island Pass
        { x1: 50, y1: 700, x2: 250, y2: 700, passed: false }, // South Return Gate
        { x1: 350, y1: 320, x2: 500, y2: 320, passed: false } // Final Approach
      ]
    },
    {
      id: 'precision_entry',
      name: 'Precision Port Entry',
      description: 'Depart the dock, complete a slalom through a wide double-island channel, and return to the berth.',
      berthRequired: true,
      gates: [
        { x1: 300, y1: -80, x2: 480, y2: -80, passed: false }, // Harbor Exit
        { x1: 50, y1: 150, x2: 250, y2: 150, passed: false }, // Mid-Channel Slalom
        { x1: 350, y1: 350, x2: 520, y2: 350, passed: false } // Final Alignment
      ]
    }
  ];

  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const activeCourseRef = useRef<Course | null>(null);
  const courseStartTimeRef = useRef<number | null>(null);
  const [courseElapsedTime, setCourseElapsedTime] = useState<number>(0);
  const [courseCompleted, setCourseCompleted] = useState<boolean>(false);
  const courseCompletedRef = useRef<boolean>(false);
  const prevPosRef = useRef({ x: 460, y: 150 });
  const [isControlsPoppedOut, setIsControlsPoppedOut] = useState<boolean>(false);
  const [isSettingsPoppedOut, setIsSettingsPoppedOut] = useState<boolean>(false);
  const [engineSoundOn, setEngineSoundOn] = useState<boolean>(true);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineNodeRef = useRef<{ oscillators: OscillatorNode[], gainNode: GainNode } | null>(null);
  const hornNodeRef = useRef<{ oscillators: OscillatorNode[], gainNode: GainNode } | null>(null);
  const musicTimeoutsRef = useRef<number[]>([]);

  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.error('Audio error', e);
    }
  };

  const startCourse = (course: Course | null) => {
    const state = shipState.current;
    state.x = 460;
    state.y = 150;
    state.heading = 0;
    state.speed = 0;
    prevPosRef.current = { x: 460, y: 150 };
    setThrottle(0);
    setRudder(0);
    setBowThruster(0);
    setSternThruster(0);
    setIsDocked(false);

    if (course) {
      const clonedCourse = {
        ...course,
        gates: course.gates.map(g => ({ ...g, passed: false }))
      };
      setActiveCourse(clonedCourse);
      activeCourseRef.current = clonedCourse;
      const now = performance.now();
      courseStartTimeRef.current = now;
      setCourseElapsedTime(0);
      setCourseCompleted(false);
      courseCompletedRef.current = false;
      playBeep(600, 0.3);
    } else {
      setActiveCourse(null);
      activeCourseRef.current = null;
      courseStartTimeRef.current = null;
      setCourseCompleted(false);
      courseCompletedRef.current = false;
    }
  };

  // Check segment intersection
  const checkIntersection = (
    p0_x: number, p0_y: number, p1_x: number, p1_y: number,
    p2_x: number, p2_y: number, p3_x: number, p3_y: number
  ) => {
    const s1_x = p1_x - p0_x;
    const s1_y = p1_y - p0_y;
    const s2_x = p3_x - p2_x;
    const s2_y = p3_y - p2_y;

    const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / (-s2_x * s1_y + s1_x * s2_y);
    const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / (-s2_x * s1_y + s1_x * s2_y);

    if (s >= 0 && s <= 1 && t >= 0 && t <= 1) {
      return true;
    }
    return false;
  };

  // Engine & System controls
  const [throttle, setThrottle] = useState(0); // -100 to 100
  const [rudder, setRudder] = useState(0); // -45 to 45
  const [bowThruster, setBowThruster] = useState(0); // -100 to 100
  const [sternThruster, setSternThruster] = useState(0); // -100 to 100
  const [navLightsOn, setNavLightsOn] = useState(true);
  const [whiteLightsOn, setWhiteLightsOn] = useState(true);
  const [anchorDropped, setAnchorDropped] = useState(false);

  // Realism controls
  const [windSpeed, setWindSpeed] = useState(0); // 0-30 knots
  const [windDir, setWindDir] = useState(0); // 0-359 degrees
  const [currentSpeed, setCurrentSpeed] = useState(0); // 0-5 knots
  const [currentDir, setCurrentDir] = useState(90); // 0-359 degrees
  const [jettyType, setJettyType] = useState('straight');
  const [shipClass, setShipClass] = useState('patrol');
  const [envExpanded, setEnvExpanded] = useState(true);
  const [damageEnabled, setDamageEnabled] = useState(false);
  const [portMode, setPortMode] = useState<'home'|'random'>('home');
  const [, setIslands] = useState<Array<{points: number[][]}>>([]);
  const islandsRef = useRef<Array<{points: number[][]}>>([]);
  const [shipDamage, setShipDamage] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isDocked, setIsDocked] = useState(false);
  const [canTieUp, setCanTieUp] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const tieUpDataRef = useRef({ snapX: 460, snapY: 150, snapH: 0 });
  
  // Helicopter Sidequest States (Simplified for Sea Cadets)
  const [simMode, setSimMode] = useState<'ship' | 'heli'>('ship');
  const [heliAltitude, setHeliAltitude] = useState(0); // 0 to 100 feet
  const [heliSpeed, setHeliSpeed] = useState(0); // -10 to 30 knots
  const [missionAccomplished, setMissionAccomplished] = useState(false);

  // Buoy controls
  const [showPortBuoy, setShowPortBuoy] = useState(true);
  const [showStbdBuoy, setShowStbdBuoy] = useState(true);

  const controlsRef = useRef({
    throttle: 0, rudder: 0, bowThruster: 0, sternThruster: 0,
    navLightsOn: true, whiteLightsOn: false, anchorDropped: false,
    windSpeed: 0, windDir: 0, currentSpeed: 0, currentDir: 90, jettyType: 'straight',
    showPortBuoy: true, showStbdBuoy: true, shipClass: 'patrol', damageEnabled: false, portMode: 'home',
    isDocked: false, simMode: 'ship'
  });
  
  // Heli Physics State
  const heliState = useRef({
    x: 0, y: 0, altitude: 0, heading: 0, speed: 0,
    pitch: 0, roll: 0, yawRate: 0 
  });

  const heliControlsRef = useRef({
    altitude: 0, speed: 0, cyclicX: 0, cyclicY: 0
  });

  const particlesRef = useRef<{x: number, y: number, life: number}[]>([]);

  useEffect(() => {
    controlsRef.current = {
      throttle, rudder, bowThruster, sternThruster, navLightsOn, whiteLightsOn, anchorDropped,
      windSpeed, windDir, currentSpeed, currentDir, jettyType,
      showPortBuoy, showStbdBuoy, shipClass, damageEnabled, portMode, isDocked, simMode
    };
    heliControlsRef.current.altitude = heliAltitude;
    heliControlsRef.current.speed = heliSpeed;
  }, [throttle, rudder, bowThruster, sternThruster, navLightsOn, whiteLightsOn, anchorDropped, windSpeed, windDir, currentSpeed, currentDir, jettyType, showPortBuoy, showStbdBuoy, shipClass, damageEnabled, portMode, isDocked, simMode, heliAltitude, heliSpeed]);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const updateEngineSound = () => {
    if (!engineSoundOn || simMode !== 'ship') {
      stopEngineSound();
      return;
    }
    try {
      const ctx = getAudioContext();
      if (!engineNodeRef.current) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gainNode = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'triangle';

        filter.type = 'lowpass';
        filter.frequency.value = 80;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();

        engineNodeRef.current = { oscillators: [osc1, osc2], gainNode };
      }

      const absThrottle = Math.abs(throttle) / 100;
      const baseFreq = shipClass === 'zodiac' ? 55 : shipClass === 'patrol' ? 45 : shipClass === 'corvette' ? 35 : 28;
      
      const { oscillators, gainNode } = engineNodeRef.current;
      oscillators[0].frequency.setValueAtTime(baseFreq + absThrottle * baseFreq * 1.5, ctx.currentTime);
      oscillators[1].frequency.setValueAtTime((baseFreq + absThrottle * baseFreq * 1.5) * 1.02, ctx.currentTime);

      const targetGain = 0.05 + absThrottle * 0.08;
      gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
    } catch (e) {
      console.error('Engine sound error', e);
    }
  };

  const stopEngineSound = () => {
    if (engineNodeRef.current) {
      try {
        engineNodeRef.current.oscillators.forEach(osc => osc.stop());
      } catch (e) {}
      engineNodeRef.current = null;
    }
  };

  useEffect(() => {
    updateEngineSound();
    return () => stopEngineSound();
  }, [throttle, shipClass, simMode, engineSoundOn]);

  const startHorn = () => {
    try {
      const ctx = getAudioContext();
      if (hornNodeRef.current) return;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const osc3 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gainNode = ctx.createGain();

      let f1 = 80, f2 = 81, f3 = 160;
      let type: OscillatorType = 'sawtooth';
      let cutoff = 150;
      let vol = 0.25;

      if (shipClass === 'zodiac') {
        f1 = 380; f2 = 385; f3 = 760;
        type = 'sawtooth';
        cutoff = 800;
        vol = 0.15;
      } else if (shipClass === 'patrol') {
        f1 = 220; f2 = 223; f3 = 440;
        type = 'sawtooth';
        cutoff = 400;
        vol = 0.2;
      } else if (shipClass === 'corvette') {
        f1 = 130; f2 = 132; f3 = 260;
        type = 'sawtooth';
        cutoff = 250;
        vol = 0.22;
      }

      osc1.frequency.value = f1;
      osc2.frequency.value = f2;
      osc3.frequency.value = f3;

      osc1.type = type;
      osc2.type = type;
      osc3.type = 'triangle';

      filter.type = 'lowpass';
      filter.frequency.value = cutoff;

      osc1.connect(filter);
      osc2.connect(filter);
      osc3.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.05);

      osc1.start();
      osc2.start();
      osc3.start();

      hornNodeRef.current = { oscillators: [osc1, osc2, osc3], gainNode };
    } catch (e) {
      console.error('Horn sound error', e);
    }
  };

  const stopHorn = () => {
    if (hornNodeRef.current) {
      try {
        const ctx = getAudioContext();
        const { oscillators, gainNode } = hornNodeRef.current;
        gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        setTimeout(() => {
          try {
            oscillators.forEach(osc => osc.stop());
          } catch (e) {}
        }, 150);
      } catch (e) {}
      hornNodeRef.current = null;
    }
  };

  const shantyNotes = [
    { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 },
    { note: 'A4', dur: 1.0 }, { note: 'D4', dur: 1.0 }, { note: 'F4', dur: 1.0 }, { note: 'A4', dur: 1.0 },
    { note: 'G4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'G4', dur: 1.0 }, { note: 'G4', dur: 1.0 },
    { note: 'G4', dur: 1.0 }, { note: 'C4', dur: 1.0 }, { note: 'E4', dur: 1.0 }, { note: 'G4', dur: 1.0 },
    { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 }, { note: 'A4', dur: 1.0 },
    { note: 'A4', dur: 0.5 }, { note: 'B4', dur: 0.5 }, { note: 'C5', dur: 1.0 }, { note: 'B4', dur: 1.0 }, { note: 'A4', dur: 1.0 },
    { note: 'G4', dur: 1.0 }, { note: 'F4', dur: 1.0 }, { note: 'E4', dur: 1.0 }, { note: 'D4', dur: 1.0 },
    { note: 'D4', dur: 2.0 }
  ];

  const noteFreqs: { [key: string]: number } = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25
  };

  const playShantyLoop = (index = 0) => {
    if (!musicPlayingRef.current) return;
    try {
      const ctx = getAudioContext();
      const item = shantyNotes[index];
      const freq = noteFreqs[item.note];
      
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      const tempo = 140;
      const beatDuration = 60 / tempo;
      const duration = item.dur * beatDuration;
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.04, ctx.currentTime + duration - 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      
      osc.start();
      osc.stop(ctx.currentTime + duration);
      
      const nextIndex = (index + 1) % shantyNotes.length;
      const timeoutId = window.setTimeout(() => {
        playShantyLoop(nextIndex);
      }, duration * 1000);
      
      musicTimeoutsRef.current.push(timeoutId);
    } catch (e) {
      console.error(e);
    }
  };

  const stopMusic = () => {
    musicTimeoutsRef.current.forEach(t => clearTimeout(t));
    musicTimeoutsRef.current = [];
  };

  const musicPlayingRef = useRef<boolean>(false);
  useEffect(() => {
    musicPlayingRef.current = musicPlaying;
    if (musicPlaying) {
      playShantyLoop(0);
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [musicPlaying]);

  useEffect(() => {
    const generateIsland = (cx: number, cy: number, radius: number) => {
      const points: number[][] = [];
      const numPoints = 16;
      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * radius * 0.7; // 70% noise for realism
        points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
      }
      return { points };
    };

    if (portMode === 'home') {
      const homeIslands = [
        generateIsland(100, 500, 100),
        generateIsland(200, -200, 80)
      ];
      setIslands(homeIslands);
      islandsRef.current = homeIslands;
    } else {
      const newIslands = [];
      for(let i=0; i<4; i++) {
        let cx = (Math.random() * 1000) - 600; 
        let cy = (Math.random() - 0.5) * 1200;
        if (Math.abs(cx - 500) < 300 && Math.abs(cy - 50) < 300) {
          cx -= 400; 
        }
        newIslands.push(generateIsland(cx, cy, 50 + Math.random() * 60));
      }
      setIslands(newIslands);
      islandsRef.current = newIslands;
    }
  }, [portMode]);

  // Draggable & Resizable panel state
  const [panelScale, setPanelScale] = useState(1);
  const [panelPos, setPanelPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0, panelX: 0, panelY: 0 });

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
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    if ((e.target as HTMLElement).closest('.steering-wheel-container') || (e.target as HTMLElement).closest('.lever-container')) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panelX: panelPos.x, panelY: panelPos.y };
  };

  // Steering Mode
  const [steeringMode, setSteeringMode] = useState<'azimuth'|'wheel'>('azimuth');
  const [isTurningWheel, setIsTurningWheel] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

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

  // Canvas interaction for movable buoys
  const draggingBuoyRef = useRef<string | null>(null);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const dx_rect = clickX - rect.width / 2;
    const dy_rect = clickY - rect.height / 2;
    
    // object-cover scales uniformly to cover the element, keeping it centered.
    const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
    
    // Adjust dx and dy by the zoom level so clicks remain accurate when zoomed in or out
    const dx = (dx_rect / scale) / zoomRef.current;
    const dy = (dy_rect / scale) / zoomRef.current;
    
    const clientX = dx + canvas.width / 2;
    const clientY = dy + canvas.height / 2;
    
    // Convert to world space
    const state = shipState.current;
    
    // Helipad interaction
    if (controlsRef.current.simMode === 'ship' && controlsRef.current.shipClass === 'frigate') {
        const cosH = Math.cos(-state.heading);
        const sinH = Math.sin(-state.heading);
        const shipLocalX = dx * cosH - dy * sinH;
        const shipLocalY = dx * sinH + dy * cosH;
        
        // scale back to unscaled coordinates (frigate scale is 2.8125)
        const unscaledX = shipLocalX / 2.8125;
        const unscaledY = shipLocalY / 2.8125;
        
        // Helipad is at (0, 40) in unscaled coordinates
        if (Math.hypot(unscaledX, unscaledY - 40) < 25) {
           heliState.current = {
             x: state.x - Math.sin(state.heading) * (40 * 2.8125),
             y: state.y + Math.cos(state.heading) * (40 * 2.8125),
             heading: state.heading, altitude: 0, speed: 0, pitch: 0, roll: 0, yawRate: 0
           };
           setSimMode('heli');
           setThrottle(0);
           setRudder(0);
           state.speed = 0;
           return;
        }
    }

    const worldX = clientX + state.x - canvas.width / 2;
    const worldY = clientY + state.y - canvas.height / 2;

    for (const buoy of buoys.current) {
      if ((buoy.type === 'port' && !controlsRef.current.showPortBuoy) ||
          (buoy.type === 'starboard' && !controlsRef.current.showStbdBuoy)) continue;
          
      const dist = Math.hypot(buoy.x - worldX, buoy.y - worldY);
      if (dist < 30) {
        draggingBuoyRef.current = buoy.id;
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingBuoyRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    const dx_rect = clickX - rect.width / 2;
    const dy_rect = clickY - rect.height / 2;
    
    const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
    
    const dx = dx_rect / scale;
    const dy = dy_rect / scale;
    
    const clientX = dx + canvas.width / 2;
    const clientY = dy + canvas.height / 2;
    
    const state = shipState.current;
    const worldX = clientX + state.x - canvas.width / 2;
    const worldY = clientY + state.y - canvas.height / 2;

    const buoy = buoys.current.find(b => b.id === draggingBuoyRef.current);
    if (buoy) {
      buoy.x = worldX;
      buoy.y = worldY;
    }
  };

  const handleCanvasMouseUp = () => {
    draggingBuoyRef.current = null;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        startHorn();
        return;
      }

      if (controlsRef.current.simMode === 'heli') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          heliState.current.heading -= 0.1; // Turn left (Port)
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          heliState.current.heading += 0.1; // Turn right (Starboard)
        }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          setHeliSpeed(prev => Math.min(30, prev + 2)); // Speed up
        }
        if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
          e.preventDefault();
          setHeliSpeed(prev => Math.max(-10, prev - 2)); // Slow down / reverse
        }
        return;
      }

      if (e.key === 'ArrowLeft') { e.preventDefault(); setRudder(prev => Math.max(-45, prev - 5)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setRudder(prev => Math.min(45, prev + 5)); }
      if (e.key === 'q' || e.key === 'Q') { setThrottle(prev => Math.min(100, prev + 5)); }
      if (e.key === 'z' || e.key === 'Z') { setThrottle(prev => Math.max(-100, prev - 5)); }
      if (e.key === 'a' || e.key === 'A') { setThrottle(0); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        stopHorn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shipClass]);

  // Rendering loop for the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      if (isPausedRef.current) {
        lastTime = time;
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Update physics
      const state = shipState.current;
      const { throttle, rudder, bowThruster, sternThruster, navLightsOn, whiteLightsOn, windSpeed, windDir, currentSpeed, currentDir, shipClass } = controlsRef.current;
      
      // Class physics modifiers
      let inertia = 1; // 1 = small, <1 = larger (slower response)
      let turnInertia = 1;
      let visualScale = 1.5625; // (scaled up another 25%)
      let maxSpeedMultiplier = 0.35; // ~35 knots default (Patrol Boat)
      
      if (shipClass === 'zodiac') {
        inertia = 1.8; // Very fast acceleration
        turnInertia = 2.0; // Very fast turning
        visualScale = 0.78125; // Small size (scaled up another 25%)
        maxSpeedMultiplier = 0.40; // ~40 knots
      } else if (shipClass === 'corvette') {
        inertia = 0.5;
        turnInertia = 0.6;
        visualScale = 1.875; // (scaled up another 25%)
        maxSpeedMultiplier = 0.28; // ~28 knots
      } else if (shipClass === 'frigate') {
        inertia = 0.25;
        turnInertia = 0.3;
        visualScale = 2.8125; // (scaled up another 25%)
        maxSpeedMultiplier = 0.30; // ~30 knots
      }

      // Acceleration based on throttle (-100 to 100)
      const targetSpeed = (throttle / 10) * maxSpeedMultiplier; 
      state.speed += (targetSpeed - state.speed) * dt * 0.5 * inertia;

      // Turning based on rudder (-45 to 45) and speed
      if (Math.abs(state.speed) > 0.1) {
        const turnRate = (rudder / 45) * Math.min(Math.abs(state.speed), 5) * 0.5 * turnInertia;
        state.heading += (state.speed > 0 ? turnRate : -turnRate) * dt;
      }
      
      // Side thrusters for larger ships
      let lateralDx = 0;
      let lateralDy = 0;
      if (shipClass === 'corvette' || shipClass === 'frigate') {
        const bowT = bowThruster / 100;
        const sternT = sternThruster / 100;
        
        // Thrusters can only operate efficiently at low speeds
        const thrusterEfficiency = Math.max(0, 1 - Math.abs(state.speed) / 5);
        
        const thrusterTurnRate = (bowT - sternT) * 0.2 * turnInertia * thrusterEfficiency;
        state.heading += thrusterTurnRate * dt;
        
        const lateralDrift = (bowT + sternT) * 2.0 * thrusterEfficiency; // 2 units of lateral drift max
        const perpRad = state.heading + Math.PI / 2;
        lateralDx = Math.sin(perpRad) * lateralDrift;
        lateralDy = -Math.cos(perpRad) * lateralDrift;
      }

      if (controlsRef.current.isDocked) {
        state.speed = 0;
        state.x = tieUpDataRef.current.snapX;
        state.y = tieUpDataRef.current.snapY;
        state.heading = tieUpDataRef.current.snapH;
      }

      // Calculate environmental drift
      // Wind: blows FROM windDir. Converting to radians for math. Pushes towards windDir + 180.
      const windRad = (windDir + 180) * (Math.PI / 180);
      const windForce = controlsRef.current.anchorDropped ? 0 : (windSpeed / 30) * 3; // Max 3 units of drift
      const windDx = Math.sin(windRad) * windForce;
      const windDy = -Math.cos(windRad) * windForce; // -cos because Canvas Y is inverted

      // Current: Set is the direction current flows TOWARDS.
      const currentRad = currentDir * (Math.PI / 180);
      const currentForce = controlsRef.current.anchorDropped ? 0 : (currentSpeed / 5) * 4; // Max 4 units of drift
      const currentDx = Math.sin(currentRad) * currentForce;
      const currentDy = -Math.cos(currentRad) * currentForce;

      if (controlsRef.current.anchorDropped) {
        state.speed *= 0.92; // high drag when anchored
      }

      // Move ship (Engine thrust + Wind drift + Current drift + Lateral thrusters)
      const newX = state.x + (Math.sin(state.heading) * state.speed * 10 + windDx * 10 + currentDx * 10 + lateralDx * 10) * dt;
      const newY = state.y - (Math.cos(state.heading) * state.speed * 10 - windDy * 10 - currentDy * 10 - lateralDy * 10) * dt;

      // Collision Detection
      let collision = false;
      const shipRadius = 12 * visualScale;
      
      // Jetty & Bridge hitboxes
      let jettyRects: {x:number, y:number, w:number, h:number}[] = [];
      const dockWorldX = 500;
      const dockWorldY = 50;
      let berthZone = { x: -80, y: 20, w: 70, h: 160, snapX: 460, snapY: 150, snapH: 0 }; // default
      
      switch (controlsRef.current.jettyType) {
        case 'straight': 
          jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: 40, y: 80, w: 210, h: 40 }]; 
          berthZone = { x: -80, y: 20, w: 70, h: 160, snapX: 460, snapY: 150, snapH: 0 };
          break;
        case 'l-shape': 
          jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: -100, y: 0, w: 100, h: 40 }, { x: 40, y: 80, w: 210, h: 40 }]; 
          berthZone = { x: -80, y: 40, w: 80, h: 140, snapX: 460, snapY: 150, snapH: 0 };
          break;
        case 'u-shape': 
          jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: -100, y: 0, w: 100, h: 40 }, { x: -100, y: 160, w: 100, h: 40 }, { x: 40, y: 80, w: 210, h: 40 }]; 
          berthZone = { x: -100, y: 40, w: 100, h: 120, snapX: 450, snapY: 150, snapH: 0 };
          break;
        case 't-shape': 
          jettyRects = [{ x: -40, y: 80, w: 80, h: 40 }, { x: -80, y: -40, w: 40, h: 280 }, { x: 40, y: 80, w: 210, h: 40 }]; 
          berthZone = { x: -150, y: 20, w: 60, h: 160, snapX: 390, snapY: 150, snapH: 0 };
          break;
      }
      
      for (const rect of jettyRects) {
        const testX = Math.max(dockWorldX + rect.x, Math.min(newX, dockWorldX + rect.x + rect.w));
        const testY = Math.max(dockWorldY + rect.y, Math.min(newY, dockWorldY + rect.y + rect.h));
        const dist = Math.hypot(newX - testX, newY - testY);
        if (dist <= shipRadius) { collision = true; break; }
      }

      // Island & Mainland hitboxes
      if (!collision) {
        if (newX > dockWorldX + 250 - shipRadius) {
          collision = true;
        } else {
          for (const island of islandsRef.current) {
            // Approximate island with bounding box for simplicity
            let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
            island.points.forEach(p => {
              if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
              if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
            });
            const testX = Math.max(minX, Math.min(newX, maxX));
            const testY = Math.max(minY, Math.min(newY, maxY));
            if (Math.hypot(newX - testX, newY - testY) <= shipRadius) { collision = true; break; }
          }
        }
      }

      // Check Berthing Zone (Only if not docked)
      if (!controlsRef.current.isDocked) {
        const inZoneX = state.x >= dockWorldX + berthZone.x && state.x <= dockWorldX + berthZone.x + berthZone.w;
        const inZoneY = state.y >= dockWorldY + berthZone.y && state.y <= dockWorldY + berthZone.y + berthZone.h;
        const speedOk = Math.abs(state.speed) < 0.5;
        const isTieUpAvailable = inZoneX && inZoneY && speedOk;
        
        if (isTieUpAvailable) {
           tieUpDataRef.current = { snapX: berthZone.snapX, snapY: berthZone.snapY, snapH: berthZone.snapH };
        }
        
        // Pass to React State (limit frequency)
        setCanTieUp(prev => {
          if (prev !== isTieUpAvailable) return isTieUpAvailable;
          return prev;
        });
      } else {
        setCanTieUp(false);
      }

      if (collision) {
        // Bounce / Stop
        state.speed = -state.speed * 0.4; // Bounce back
        if (controlsRef.current.damageEnabled) {
          setShipDamage(d => Math.min(100, d + Math.abs(state.speed) * 15 + 2));
        }
      } else {
        state.x = newX;
        state.y = newY;
      }

      // Track course gate crossing
      const prevX = prevPosRef.current.x;
      const prevY = prevPosRef.current.y;
      prevPosRef.current = { x: state.x, y: state.y };

      const course = activeCourseRef.current;
      if (course && !courseCompletedRef.current) {
        const nextGateIndex = course.gates.findIndex(g => !g.passed);
        if (nextGateIndex !== -1) {
          const gate = course.gates[nextGateIndex];
          if (checkIntersection(prevX, prevY, state.x, state.y, gate.x1, gate.y1, gate.x2, gate.y2)) {
            gate.passed = true;
            playBeep(880, 0.2);
            setActiveCourse({ ...course });
          }
        } else {
          // All gates passed, check if berthing is needed
          if (course.berthRequired) {
            if (controlsRef.current.isDocked) {
              setCourseCompleted(true);
              courseCompletedRef.current = true;
              playBeep(1000, 0.15);
              setTimeout(() => playBeep(1300, 0.3), 150);
            }
          } else {
            setCourseCompleted(true);
            courseCompletedRef.current = true;
            playBeep(1000, 0.15);
            setTimeout(() => playBeep(1300, 0.3), 150);
          }
        }

        // Track elapsed time
        const now = performance.now();
        if (courseStartTimeRef.current !== null) {
          const elapsed = (now - courseStartTimeRef.current) / 1000;
          setCourseElapsedTime(elapsed);
        }
      }

      // No more wrap around screen, the world is endless (or bounded by islands)

      // Add wake particles if moving
      if (Math.abs(state.speed) > 0.5) {
        const sternX = state.x - Math.sin(state.heading) * (15 * visualScale);
        const sternY = state.y + Math.cos(state.heading) * (15 * visualScale);
        
        if (shipClass === 'patrol' || shipClass === 'corvette' || shipClass === 'frigate') {
          // Twin wakes for twin-thruster vessels
          // Offset perpendicular to heading
          const offsetX = Math.cos(state.heading) * (4 * visualScale);
          const offsetY = Math.sin(state.heading) * (4 * visualScale);
          
          // Port wake
          particlesRef.current.push({
            x: sternX - offsetX + (Math.random() - 0.5) * 4 * visualScale,
            y: sternY - offsetY + (Math.random() - 0.5) * 4 * visualScale,
            life: 1.5
          });
          // Starboard wake
          particlesRef.current.push({
            x: sternX + offsetX + (Math.random() - 0.5) * 4 * visualScale,
            y: sternY + offsetY + (Math.random() - 0.5) * 4 * visualScale,
            life: 1.5
          });
        } else {
          // Single wake for outboard/single-screw
          particlesRef.current.push({
            x: sternX + (Math.random() - 0.5) * 8 * visualScale,
            y: sternY + (Math.random() - 0.5) * 8 * visualScale,
            life: 1.5
          });
        }
      }

      // Helicopter Physics (Simplified for Sea Cadets)
      if (controlsRef.current.simMode === 'heli') {
         const hState = heliState.current;
         const hc = heliControlsRef.current;
         
         // Smoothly transition altitude to the target altitude
         hState.altitude += (hc.altitude - hState.altitude) * dt * 2.0;
         if (hState.altitude < 0.1) {
           hState.altitude = 0;
           hState.speed = 0; // If on the ground, speed is 0
         } else {
           // Smoothly transition speed to the target speed
           hState.speed += (hc.speed - hState.speed) * dt * 2.0;
         }
         
         // Move helicopter in the direction of its heading
         hState.x += Math.sin(hState.heading) * hState.speed * dt * 10; // Responsive speed multiplier
         hState.y -= Math.cos(hState.heading) * hState.speed * dt * 10;
 
         // Check Mission Accomplished (landed safely on Jetty LZ)
         if (hState.altitude === 0 && Math.abs(hState.speed) < 1) {
            // Is it on the LZ? LZ is at world coords dockWorldX + 150, dockWorldY + 100
            const lzX = dockWorldX + 150;
            const lzY = dockWorldY + 100;
            if (Math.hypot(hState.x - lzX, hState.y - lzY) < 30) {
               setMissionAccomplished(true);
            }
         }
      }

      // Clear canvas
      ctx.fillStyle = '#0f172a'; // slate-900 water color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      const camX = controlsRef.current.simMode === 'heli' ? heliState.current.x : state.x;
      const camY = controlsRef.current.simMode === 'heli' ? heliState.current.y + 150 : state.y;

      // Draw stylized dynamic water waves instead of grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // faint sky-blue waves
      ctx.lineWidth = 1.5;
      const waveSize = 100;
      const waveOffsetX = camX % waveSize;
      const waveOffsetY = camY % waveSize;
      const waveTime = Date.now() / 1000;

      for (let y = -waveOffsetY - waveSize; y < canvas.height + waveSize; y += waveSize * 0.5) {
        ctx.beginPath();
        for (let x = -waveOffsetX - waveSize; x < canvas.width + waveSize; x += waveSize) {
          const shift = Math.sin((x + y + waveTime * 50) * 0.02) * 10;
          if (x === -waveOffsetX - waveSize) {
            ctx.moveTo(x, y + shift);
          } else {
            ctx.quadraticCurveTo(x - waveSize/2, y - 10 + shift, x, y + shift);
          }
        }
        ctx.stroke();
      }

      // Draw islands
      islandsRef.current.forEach(island => {
        ctx.save();
        ctx.translate(canvas.width / 2 - camX, canvas.height / 2 - camY);
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 15;
        
        // Calculate center for scaling
        let cx = 0, cy = 0;
        island.points.forEach(p => { cx += p[0]; cy += p[1]; });
        cx /= island.points.length; cy /= island.points.length;
        
        const drawSmoothPoly = (points: number[][], scale: number = 1) => {
          ctx.beginPath();
          const scaledPoints = points.map(p => [cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale]);
          
          // Start at midpoint between last and first
          ctx.moveTo((scaledPoints[0][0] + scaledPoints[scaledPoints.length-1][0])/2, 
                     (scaledPoints[0][1] + scaledPoints[scaledPoints.length-1][1])/2);
                     
          for(let i=0; i<scaledPoints.length; i++) {
            const next = scaledPoints[(i+1)%scaledPoints.length];
            const curr = scaledPoints[i];
            const midX = (curr[0] + next[0]) / 2;
            const midY = (curr[1] + next[1]) / 2;
            // Curve through current point to midpoint
            ctx.quadraticCurveTo(curr[0], curr[1], midX, midY);
          }
          ctx.closePath();
          ctx.fill();
        };

        // Sand beach border
        ctx.fillStyle = '#fcd34d'; // amber-300
        drawSmoothPoly(island.points, 1.0);
        
        // Grass interior
        ctx.shadowColor = 'transparent';
        ctx.fillStyle = '#166534'; // green-800
        drawSmoothPoly(island.points, 0.85);
        
        // Bounding box collision indicator (sand/shoal obstacle warning)
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        island.points.forEach(p => {
          if (p[0] < minX) minX = p[0];
          if (p[0] > maxX) maxX = p[0];
          if (p[1] < minY) minY = p[1];
          if (p[1] > maxY) maxY = p[1];
        });
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)'; // light amber-200 / yellow-300
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
        ctx.setLineDash([]); // reset
        
        ctx.restore();
      });

      // Draw wake particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.life -= dt;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x - camX + canvas.width / 2, p.y - camY + canvas.height / 2, 2 + (1.5 - p.life) * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw buoys relative to ship (camera centered on ship)
      const { showPortBuoy, showStbdBuoy } = controlsRef.current;
      buoys.current.forEach(buoy => {
        if (buoy.type === 'port' && !showPortBuoy) return;
        if (buoy.type === 'starboard' && !showStbdBuoy) return;
        
        const screenX = buoy.x - camX + canvas.width / 2;
        const screenY = buoy.y - camY + canvas.height / 2;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        // Add a subtle highlight if we are dragging this buoy
        if (draggingBuoyRef.current === buoy.id) {
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 10;
        }

        if (buoy.type === 'port') {
          // Green Port Hand Buoy (Square/Flat top)
          ctx.fillStyle = '#22c55e'; // green-500
          ctx.fillRect(-8, -10, 16, 20);
          ctx.strokeStyle = '#166534';
          ctx.strokeRect(-8, -10, 16, 20);
        } else if (buoy.type === 'starboard') {
          // Red Starboard Hand Buoy (Conical/Pointy top)
          ctx.fillStyle = '#ef4444'; // red-500
          ctx.beginPath();
          ctx.moveTo(0, -15);
          ctx.lineTo(10, 10);
          ctx.lineTo(-10, 10);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#991b1b';
          ctx.stroke();
        }
        
        ctx.restore();
      });

      // Draw custom laid buoys
      customBuoysRef.current.forEach((buoy) => {
        const screenX = buoy.x - camX + canvas.width / 2;
        const screenY = buoy.y - camY + canvas.height / 2;

        ctx.save();
        ctx.translate(screenX, screenY);
        
        const pulse = Math.sin(Date.now() / 200) * 4 + 8;
        ctx.strokeStyle = buoy.color === 'yellow' ? 'rgba(234, 179, 8, 0.4)' : buoy.color === 'green' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, pulse, 0, Math.PI * 2);
        ctx.stroke();

        if (buoy.color === 'green') {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(-6, -8, 12, 16);
          ctx.strokeStyle = '#166534';
          ctx.strokeRect(-6, -8, 12, 16);
        } else if (buoy.color === 'red') {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(0, -12);
          ctx.lineTo(8, 8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#991b1b';
          ctx.stroke();
        } else {
          // Yellow Special Mark
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a16207';
          ctx.stroke();
          // X topmark
          ctx.strokeStyle = '#eab308';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-3, -11); ctx.lineTo(3, -7);
          ctx.moveTo(3, -11); ctx.lineTo(-3, -7);
          ctx.stroke();
        }

        ctx.restore();
      });

      // Draw active course gates
      if (course) {
        course.gates.forEach((gate, idx) => {
          const x1 = gate.x1 - camX + canvas.width / 2;
          const y1 = gate.y1 - camY + canvas.height / 2;
          const x2 = gate.x2 - camX + canvas.width / 2;
          const y2 = gate.y2 - camY + canvas.height / 2;

          const isNext = course.gates.findIndex(g => !g.passed) === idx;

          ctx.save();
          if (gate.passed) {
            ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          } else {
            ctx.strokeStyle = isNext ? 'rgba(234, 179, 8, 0.8)' : 'rgba(148, 163, 184, 0.3)';
            ctx.lineWidth = isNext ? 3 : 1.5;
            if (isNext) {
              ctx.setLineDash([8, 6]);
              ctx.lineDashOffset = -Date.now() / 100;
            } else {
              ctx.setLineDash([4, 4]);
            }
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
          ctx.restore();

          const drawGateBuoy = (bx: number, by: number, type: 'port' | 'starboard') => {
            ctx.save();
            ctx.translate(bx, by);
            
            const glowRadius = Math.sin(Date.now() / 150) * 5 + 10;
            ctx.shadowBlur = gate.passed ? 8 : (isNext ? glowRadius : 0);
            ctx.shadowColor = type === 'port' ? '#22c55e' : '#ef4444';

            if (type === 'port') {
              ctx.fillStyle = '#22c55e';
              ctx.fillRect(-8, -10, 16, 20);
              ctx.strokeStyle = '#166534';
              ctx.strokeRect(-8, -10, 16, 20);
              
              if (gate.passed || (Date.now() % 1000 < 500)) {
                ctx.fillStyle = '#4ade80';
                ctx.beginPath();
                ctx.arc(0, -13, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            } else {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(0, -15);
              ctx.lineTo(10, 10);
              ctx.lineTo(-10, 10);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#991b1b';
              ctx.stroke();

              if (gate.passed || (Date.now() % 1000 < 500)) {
                ctx.fillStyle = '#f87171';
                ctx.beginPath();
                ctx.arc(0, -18, 3, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            ctx.restore();
          };

          drawGateBuoy(x1, y1, 'port');
          drawGateBuoy(x2, y2, 'starboard');

          ctx.save();
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          ctx.fillStyle = gate.passed ? '#4ade80' : (isNext ? '#f59e0b' : '#94a3b8');
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(`GATE ${idx + 1}${gate.passed ? ' [OK]' : (isNext ? ' [TARGET]' : '')}`, midX, midY - 12);
          ctx.restore();
        });
      }

      // Draw the dock and mainland (relative to ship)
      const dockX = 500 - camX + canvas.width / 2;
      const dockY = 50 - camY + canvas.height / 2;
      
      // Draw Mainland continent attached to the right side of the dock
      ctx.save();
      ctx.translate(dockX, dockY);
      
      // Organic curved coastline
      ctx.beginPath();
      ctx.moveTo(250, -4000);
      for(let y = -4000; y <= 4000; y += 100) {
        // Procedural sine waves for irregular coast
        const xOffset = Math.sin(y * 0.01) * 40 + Math.sin(y * 0.05) * 15;
        ctx.lineTo(250 + xOffset, y);
      }
      ctx.lineTo(4250, 4000);
      ctx.lineTo(4250, -4000);
      ctx.closePath();
      
      ctx.lineWidth = 15;
      ctx.strokeStyle = '#1e3a8a'; // deep blue shallow edge
      ctx.stroke();
      
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#b45309'; // beach edge
      ctx.stroke();
      
      ctx.fillStyle = '#166534'; // green land
      ctx.fill();

      // Draw Berthing Zone Outline
      if (!controlsRef.current.isDocked) {
        ctx.strokeStyle = canTieUp ? 'rgba(52, 211, 153, 0.9)' : 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(berthZone.x, berthZone.y, berthZone.w, berthZone.h);
        
        ctx.fillStyle = canTieUp ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(berthZone.x, berthZone.y, berthZone.w, berthZone.h);
        
        ctx.fillStyle = canTieUp ? 'rgba(52, 211, 153, 0.9)' : 'rgba(255, 255, 255, 0.5)';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.setLineDash([]);
        const centerX = berthZone.x + berthZone.w / 2;
        const centerY = berthZone.y + berthZone.h / 2;
        if (canTieUp) {
          ctx.fillText('READY TO', centerX, centerY - 10);
          ctx.fillText('TIE UP', centerX, centerY + 10);
        } else {
          ctx.fillText('BERTH', centerX, centerY - 10);
          ctx.fillText('ZONE', centerX, centerY + 10);
        }
        ctx.textAlign = 'left'; // reset
        ctx.textBaseline = 'alphabetic'; // reset
      }

      ctx.restore();
      const { jettyType: currentJettyType, windSpeed: currentWindSpeed, windDir: currentWindDir } = controlsRef.current;
      
      ctx.save();
      ctx.translate(dockX, dockY);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#78350f'; // amber-900 wood
      ctx.strokeStyle = '#451a03';
      
      if (currentJettyType === 'straight') {
        ctx.fillRect(0, 0, 40, 200);
        ctx.strokeRect(0, 0, 40, 200);
        ctx.fillRect(40, 80, 210, 40);
        ctx.strokeRect(40, 80, 210, 40);
      } else if (currentJettyType === 'l-shape') {
        ctx.fillRect(0, 0, 40, 200);
        ctx.fillRect(-100, 0, 100, 40);
        ctx.fillRect(40, 80, 210, 40);
        ctx.strokeRect(0, 0, 40, 200);
        ctx.strokeRect(-100, 0, 100, 40);
        ctx.strokeRect(40, 80, 210, 40);
      } else if (currentJettyType === 'u-shape') {
        ctx.fillRect(0, 0, 40, 200);
        ctx.fillRect(-100, 0, 100, 40);
        ctx.fillRect(-100, 160, 100, 40);
        ctx.fillRect(40, 80, 210, 40);
        ctx.strokeRect(0, 0, 40, 200);
        ctx.strokeRect(-100, 0, 100, 40);
        ctx.strokeRect(-100, 160, 100, 40);
        ctx.strokeRect(40, 80, 210, 40);
      } else if (currentJettyType === 't-shape') {
        ctx.fillRect(-40, 80, 80, 40);
        ctx.fillRect(-80, -40, 40, 280);
        ctx.fillRect(40, 80, 210, 40);
        ctx.strokeRect(-40, 80, 80, 40);
        ctx.strokeRect(-80, -40, 40, 280);
        ctx.strokeRect(40, 80, 210, 40);
      }
      
      // Draw Windsock
      ctx.shadowColor = 'transparent'; // No shadow for windsock to keep it clean
      ctx.fillStyle = '#94a3b8'; // Pole
      ctx.fillRect(18, 10, 4, 4); 
      
      ctx.save();
      ctx.translate(20, 12);
      // Windsock points AWAY from wind direction
      ctx.rotate(currentWindDir);
      
      const sockLength = 20 + currentWindSpeed; // Length simulates droop: 10px if no wind, 40px at 30 knots
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(sockLength, -4);
      ctx.lineTo(sockLength, 4);
      ctx.lineTo(0, 6);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      if (currentWindSpeed > 5) {
        ctx.beginPath(); ctx.moveTo(sockLength * 0.3, -4); ctx.lineTo(sockLength * 0.4, -3); ctx.lineTo(sockLength * 0.4, 3); ctx.lineTo(sockLength * 0.3, 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sockLength * 0.7, -3); ctx.lineTo(sockLength * 0.8, -2); ctx.lineTo(sockLength * 0.8, 2); ctx.lineTo(sockLength * 0.7, 3); ctx.fill();
      }
      ctx.restore();
      
      // Draw Helipad (Mission LZ)
      ctx.save();
      ctx.translate(150, 100);
      ctx.shadowColor = 'transparent';
      
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; // Red outer circle
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff'; // White inner circle
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#ef4444'; // Red inner circle
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('H', 0, 0);
      ctx.restore();
      
      ctx.restore();

      // Draw Mooring lines if docked
      if (controlsRef.current.isDocked) {
        ctx.save();
        ctx.translate(dockX, dockY);
        ctx.strokeStyle = '#d97706'; // amber-600 rope
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 2]);
        
        ctx.beginPath();
        // Bow line
        ctx.moveTo(-40, 60); ctx.lineTo(10, 20);
        // Stern line
        ctx.moveTo(-40, 140); ctx.lineTo(10, 180);
        // Spring lines
        ctx.moveTo(-40, 80); ctx.lineTo(10, 120);
        ctx.moveTo(-40, 120); ctx.lineTo(10, 80);
        ctx.stroke();
        ctx.restore();
      }

      // Draw the ship
      ctx.save();
      const shipScreenX = state.x - camX + canvas.width / 2;
      const shipScreenY = state.y - camY + canvas.height / 2;
      ctx.translate(shipScreenX, shipScreenY);
      ctx.rotate(state.heading);
      ctx.scale(visualScale, visualScale);
      
      // Ship shadow
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 8;
      ctx.shadowOffsetY = 8;
      
      const isMilitary = shipClass === 'corvette' || shipClass === 'frigate';
      const isZodiac = shipClass === 'zodiac';
      
      if (isZodiac) {
        // Zodiac (RHIB) rendering
        ctx.fillStyle = '#1e293b'; // Black/dark slate pontoons
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-8, -20, 16, 40, 8);
        else ctx.fillRect(-8, -20, 16, 40);
        ctx.fill();
        
        ctx.fillStyle = '#94a3b8'; // Grey rigid hull inside
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-5, -15, 10, 32, 5);
        else ctx.fillRect(-5, -15, 10, 32);
        ctx.fill();

        ctx.fillStyle = '#f8fafc'; // Center console
        ctx.fillRect(-3, 0, 6, 6);
        ctx.fillStyle = '#0f172a'; // Outboard motor
        ctx.fillRect(-2, 20, 4, 4);

      } else if (isMilitary) {
        // Military Elongated Hull
        const lengthMultiplier = shipClass === 'frigate' ? 2.0 : 1.5;
        const bowY = -28 * lengthMultiplier;
        const sternY = 26 * lengthMultiplier;
        
        ctx.fillStyle = '#475569'; // Dark navy grey
        ctx.beginPath();
        ctx.moveTo(0, bowY);
        // Flatter, sharper curves for military
        ctx.bezierCurveTo(10, bowY + 10, 12, 0, 10, sternY);
        ctx.lineTo(-10, sternY);
        ctx.bezierCurveTo(-12, 0, -10, bowY + 10, 0, bowY);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.stroke();

        // Helipad on the aft deck
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, sternY - 12, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#94a3b8';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('H', 0, sternY - 12);
        
        if (shipClass === 'frigate') {
          const heliY = sternY - 12;
          
          // Tail boom
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-0.5, heliY + 2, 1, 6);
          
          // Helicopter body
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(-2, heliY - 4, 4, 7, 1.5);
          else ctx.fillRect(-2, heliY - 4, 4, 7);
          ctx.fill();
          
          // Cockpit glass
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(0, heliY - 2.5, 1.5, Math.PI, 0);
          ctx.fill();

          // Spinning Main rotor
          ctx.save();
          ctx.translate(0, heliY - 0.5);
          ctx.rotate((Date.now() % 1000) / 1000 * Math.PI * 2 * 10);
          ctx.fillStyle = 'rgba(200, 200, 200, 0.5)';
          ctx.fillRect(-6, -0.5, 12, 1);
          ctx.fillRect(-0.5, -6, 1, 12);
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Spinning Tail rotor
          ctx.save();
          ctx.translate(0.5, heliY + 7.5);
          ctx.rotate((Date.now() % 1000) / 1000 * Math.PI * 2 * 15);
          ctx.fillStyle = 'rgba(200, 200, 200, 0.8)';
          ctx.fillRect(-1.5, -0.25, 3, 0.5);
          ctx.restore();
        }

        // Bridge / Superstructure
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-6, -10, 12, 18 * lengthMultiplier, 2);
        else ctx.fillRect(-6, -10, 12, 18 * lengthMultiplier);
        ctx.fill();
        
        // VLS / Forward deck gun
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(0, bowY + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-0.5, bowY + 8, 1, 7); // Barrel
      } else {
        // Standard Patrol Boat (curved boat shape)
        ctx.fillStyle = '#94a3b8'; // slate-400
        ctx.beginPath();
        ctx.moveTo(0, -28);
        ctx.bezierCurveTo(14, -15, 14, 15, 10, 26);
        ctx.quadraticCurveTo(0, 28, -10, 26);
        ctx.bezierCurveTo(-14, 15, -14, -15, 0, -28);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#475569';
        ctx.stroke();
        
        // Deck details
        ctx.fillStyle = '#f8fafc'; // Cabin
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-8, -2, 16, 14, 4);
        else ctx.fillRect(-8, -2, 16, 14);
        ctx.fill();
        
        ctx.fillStyle = '#64748b'; // Aft deck
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-8, 15, 16, 9, 2);
        else ctx.fillRect(-8, 15, 16, 9);
        ctx.fill();
      }

      // Draw deployed anchor
      if (controlsRef.current.anchorDropped) {
        ctx.save();
        const bowY = isMilitary ? -28 * (shipClass === 'frigate' ? 2.0 : 1.5) : -28;
        
        ctx.strokeStyle = '#94a3b8'; // Chain color
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, bowY);
        ctx.lineTo(-12, bowY - 15);
        ctx.stroke();

        ctx.translate(-12, bowY - 15);
        ctx.rotate(-state.heading); // Anchor sits on seafloor
        
        ctx.fillStyle = '#cbd5e1'; 
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI*2); 
        ctx.fill();
        ctx.fillRect(-0.5, 1.5, 1, 8); 
        ctx.fillRect(-3, 3, 6, 1); 
        ctx.beginPath();
        ctx.arc(0, 7, 4, 0, Math.PI, false); 
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#cbd5e1';
        ctx.stroke();
        
        ctx.restore();
      }

      // Draw Maple Leaf on all ships (Canadian feel)
      ctx.fillStyle = '#ef4444';
      ctx.save();
      if (isZodiac) {
        ctx.translate(0, -10);
        ctx.scale(0.5, 0.5);
      } else if (isMilitary) {
        const bowY = -28 * (shipClass === 'frigate' ? 2.0 : 1.5);
        ctx.translate(0, bowY + 25);
      } else {
        ctx.translate(0, -15);
      }
      
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(1, -1); ctx.lineTo(4, -1); ctx.lineTo(1.5, 1);
      ctx.lineTo(3, 4); ctx.lineTo(0, 2); ctx.lineTo(-3, 4);
      ctx.lineTo(-1.5, 1); ctx.lineTo(-4, -1); ctx.lineTo(-1, -1);
      ctx.closePath();
      ctx.fill();
      // Stem
      ctx.fillRect(-0.5, 2, 1, 3);
      ctx.restore();
      
      // Navigation lights (Port & Starboard)
      if (navLightsOn) {
        ctx.shadowBlur = 8;
        // Port (Red)
        ctx.fillStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
        ctx.beginPath(); ctx.arc(-9, -15, 3, 0, Math.PI * 2); ctx.fill();
        // Starboard (Green)
        ctx.fillStyle = '#22c55e';
        ctx.shadowColor = '#22c55e';
        ctx.beginPath(); ctx.arc(9, -15, 3, 0, Math.PI * 2); ctx.fill();
      }
      
      // White Lights (Masthead and Stern)
      if (whiteLightsOn) {
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        // Stern (White)
        ctx.beginPath(); ctx.arc(0, 22, 2, 0, Math.PI * 2); ctx.fill();
        // Masthead (White) - located centrally on the cabin roof
        ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI * 2); ctx.fill();
      }
      
      // Side Thruster Visuals
      if (controlsRef.current.bowThruster !== 0 || controlsRef.current.sternThruster !== 0) {
        if (shipClass === 'corvette' || shipClass === 'frigate') {
           const lengthMultiplier = shipClass === 'frigate' ? 2.0 : 1.5;
           const bowY = -28 * lengthMultiplier;
           const sternY = 26 * lengthMultiplier;
           
           ctx.fillStyle = 'rgba(248, 250, 252, 0.8)'; // Foamy white water
           ctx.shadowBlur = 4;
           ctx.shadowColor = 'rgba(255,255,255,0.5)';
           
           if (controlsRef.current.bowThruster !== 0) {
              // Positive = thrust STBD (push ship right), so water shoots PORT (left)
              const bowT = controlsRef.current.bowThruster;
              const intensity = Math.abs(bowT) / 100;
              const dir = bowT > 0 ? -1 : 1; 
              ctx.beginPath(); 
              ctx.arc(dir * 12, bowY + 20, 2 + intensity * 4, 0, Math.PI * 2); 
              ctx.fill();
           }
           if (controlsRef.current.sternThruster !== 0) {
              const sternT = controlsRef.current.sternThruster;
              const intensity = Math.abs(sternT) / 100;
              const dir = sternT > 0 ? -1 : 1; 
              ctx.beginPath(); 
              ctx.arc(dir * 12, sternY - 20, 2 + intensity * 4, 0, Math.PI * 2); 
              ctx.fill();
           }
        }
      }

      ctx.restore(); // restore ship transform
      
      // Draw Detached Helicopter
      if (controlsRef.current.simMode === 'heli') {
        ctx.save();
        const hState = heliState.current;
        const heliScreenX = hState.x - camX + canvas.width / 2;
        const heliScreenY = hState.y - camY + canvas.height / 2;
        
        ctx.translate(heliScreenX, heliScreenY);
        ctx.rotate(hState.heading);
        
        // Shadow (simulate altitude)
        if (hState.altitude > 0) {
           ctx.save();
           ctx.translate(hState.altitude * 0.5, hState.altitude * 0.5);
           ctx.fillStyle = 'rgba(0,0,0,0.3)';
           ctx.beginPath();
           if (ctx.roundRect) ctx.roundRect(-4, -8, 8, 14, 3);
           else ctx.fillRect(-4, -8, 8, 14);
           ctx.fill();
           ctx.restore();
        }
        
        // Draw Helicopter body
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-1, 4, 2, 12); // tail boom
        
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-4, -8, 8, 14, 3);
        else ctx.fillRect(-4, -8, 8, 14);
        ctx.fill();
        
        // Cockpit glass
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, -5, 3, Math.PI, 0);
        ctx.fill();
        
        // Spinning Main rotor
        ctx.save();
        ctx.translate(0, -1);
        const rotorSpeed = hState.altitude > 0.1 || controlsRef.current.simMode === 'heli' ? 20 : 0;
        ctx.rotate((Date.now() % 1000) / 1000 * Math.PI * 2 * rotorSpeed);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#475569';
        ctx.fillRect(-1.5, -20, 3, 40);
        ctx.fillRect(-20, -1.5, 40, 3);
        ctx.restore();
        
        ctx.restore();
      }
      
      ctx.restore(); // restore global zoom scale

      // Update UI HUD
      if (speedTextRef.current) {
        speedTextRef.current.innerText = (Math.abs(state.speed) * 10).toFixed(1) + ' kts';
      }
      if (compassTextRef.current || compassCardRef.current) {
        // Ship heading: 0 is North (Up), 90 is East (Right)
        // Screen coords: North is -y, East is +x.
        let deg = Math.round(state.heading * (180 / Math.PI)) % 360;
        if (deg < 0) deg += 360;
        if (compassTextRef.current) compassTextRef.current.innerText = `${deg.toString().padStart(3, '0')}°`;
        if (compassCardRef.current) compassCardRef.current.style.transform = `rotate(${-deg}deg)`;
      }

      const cyclicPuck = document.getElementById('cyclic-puck');
      if (cyclicPuck && controlsRef.current.simMode === 'heli') {
        const cx = (heliControlsRef.current.cyclicX / 100) * 72; 
        const cy = (heliControlsRef.current.cyclicY / 100) * 72;
        cyclicPuck.style.transform = `translate(${cx}px, ${cy}px)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const settingsPanelJSX = (isPopped: boolean) => (
    <div className="glass-panel p-5 rounded-xl w-80 max-h-[85vh] overflow-y-auto custom-scrollbar">
      <h3 className="text-emerald-400 font-bold mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest text-sm flex items-center justify-between sticky top-0 bg-slate-900/60 backdrop-blur-md z-10">
        <span>Realism Settings</span>
        <div className="flex items-center gap-1.5">
          {isPopped ? (
            <button
              onClick={() => setIsSettingsPoppedOut(false)}
              className="px-1.5 py-0.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[9px] uppercase font-mono tracking-wider transition-all"
              title="Dock settings panel"
            >
              Dock
            </button>
          ) : (
            <button
              onClick={() => setIsSettingsPoppedOut(true)}
              className="px-1.5 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] uppercase font-mono tracking-wider transition-all"
              title="Pop out settings panel"
            >
              Pop Out
            </button>
          )}
          {damageEnabled && shipDamage > 0 && <span className="text-red-500 text-[10px]">DMG: {Math.round(shipDamage)}%</span>}
        </div>
      </h3>
      
      <div className="space-y-4">
        {/* Wind Speed */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
            <span>WIND SPEED</span>
            <span className="text-amber-400">{windSpeed} KTS</span>
          </div>
          <input type="range" min="0" max="30" value={windSpeed} onChange={(e) => setWindSpeed(parseInt(e.target.value))} className="w-full accent-amber-500" />
        </div>

        {/* Wind Direction */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
            <span>WIND DIR (FROM)</span>
            <span className="text-amber-400">{windDir}°</span>
          </div>
          <input type="range" min="0" max="359" value={windDir} onChange={(e) => setWindDir(parseInt(e.target.value))} className="w-full accent-amber-500" />
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Current Speed */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
            <span>CURRENT (SET)</span>
            <span className="text-blue-400">{currentSpeed} KTS</span>
          </div>
          <input type="range" min="0" max="5" step="0.5" value={currentSpeed} onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))} className="w-full accent-blue-500" />
        </div>

        {/* Current Direction */}
        <div>
          <div className="flex justify-between text-xs text-slate-400 font-mono mb-1">
            <span>CURRENT DIR (TOWARDS)</span>
            <span className="text-blue-400">{currentDir}°</span>
          </div>
          <input type="range" min="0" max="359" value={currentDir} onChange={(e) => setCurrentDir(parseInt(e.target.value))} className="w-full accent-blue-500" />
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Jetty Select */}
        <div>
          <div className="text-xs text-slate-400 font-mono mb-1">JETTY GEOMETRY</div>
          <select 
            value={jettyType} 
            onChange={(e) => setJettyType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 font-mono outline-none"
          >
            <option value="straight">Straight Wharf</option>
            <option value="l-shape">L-Shaped Pier</option>
            <option value="u-shape">U-Shaped Slip</option>
            <option value="t-shape">T-Shaped Pier</option>
          </select>
        </div>

        {/* Ship Class Select */}
        <div className="pt-2">
          <div className="text-xs text-slate-400 font-mono mb-1">VESSEL CLASS</div>
          <select 
            value={shipClass} 
            onChange={(e) => setShipClass(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 font-mono outline-none mb-2"
          >
            <option value="zodiac">Zodiac</option>
            <option value="patrol">Patrol Boat</option>
            <option value="corvette">Corvette</option>
            <option value="frigate">Frigate</option>
          </select>
          
          <div className="glass-panel-inner rounded-xl p-3 mt-2 text-xs font-mono">
            {shipClass === 'zodiac' && (
              <>
                <div className="flex justify-between mb-1"><span className="text-slate-400">LOA:</span> <span className="text-emerald-400">5 meters</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">POWER:</span> <span className="text-amber-400">150 HP</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">TOP SPEED:</span> <span className="text-blue-400">40+ knots</span></div>
                <div className="mt-2 text-slate-300">Fast, highly agile inflatable boat with single outboard motor. Instant response time.</div>
              </>
            )}
            {shipClass === 'patrol' && (
              <>
                <div className="flex justify-between mb-1"><span className="text-slate-400">LOA:</span> <span className="text-emerald-400">24 meters</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">POWER:</span> <span className="text-amber-400">3,000 HP</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">TOP SPEED:</span> <span className="text-blue-400">35 knots</span></div>
                <div className="mt-2 text-slate-300">Standard patrol craft with twin azimuth thrusters. Highly maneuverable, low inertia.</div>
              </>
            )}
            {shipClass === 'corvette' && (
              <>
                <div className="flex justify-between mb-1"><span className="text-slate-400">LOA:</span> <span className="text-emerald-400">85 meters</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">POWER:</span> <span className="text-amber-400">20,000 HP</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">TOP SPEED:</span> <span className="text-blue-400">28 knots</span></div>
                <div className="mt-2 text-slate-300">Medium military vessel. Moderate inertia. Equipped with Bow Thruster.</div>
              </>
            )}
            {shipClass === 'frigate' && (
              <>
                <div className="flex justify-between mb-1"><span className="text-slate-400">LOA:</span> <span className="text-emerald-400">135 meters</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">POWER:</span> <span className="text-amber-400">45,000 HP</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">TOP SPEED:</span> <span className="text-blue-400">30 knots</span></div>
                <div className="mt-2 text-slate-300">Large military vessel. High inertia. Equipped with Bow & Stern Thrusters, and Helipad.</div>
              </>
            )}
          </div>
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Buoy Toggles */}
        <div>
          <div className="text-xs text-slate-400 font-mono mb-2">BUOYS (DRAG ON CANVAS TO MOVE)</div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showPortBuoy} onChange={e => setShowPortBuoy(e.target.checked)} className="accent-emerald-500 w-4 h-4" />
              Port (Green)
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
              <input type="checkbox" checked={showStbdBuoy} onChange={e => setShowStbdBuoy(e.target.checked)} className="accent-red-500 w-4 h-4" />
              Stbd (Red)
            </label>
          </div>
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Custom Buoy Laying */}
        <div>
          <div className="text-xs text-slate-400 font-mono mb-2">CUSTOM BUOY LAYING</div>
          <div className="flex gap-2 mb-2">
            <select
              value={customBuoyColor}
              onChange={(e) => setCustomBuoyColor(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs text-slate-200 font-mono outline-none"
            >
              <option value="yellow">Special Mark (Yellow)</option>
              <option value="green">Port Hand (Green)</option>
              <option value="red">Starboard Hand (Red)</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                const state = shipState.current;
                customBuoysRef.current.push({
                  x: state.x,
                  y: state.y,
                  color: customBuoyColor
                });
                playBeep(523, 0.1);
              }}
              className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs rounded transition-all active:scale-95 shadow-lg shadow-amber-950/20"
            >
              LAY BUOY
            </button>
            <button 
              onClick={() => {
                customBuoysRef.current = [];
                playBeep(330, 0.1);
              }}
              className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-mono text-xs rounded transition-all active:scale-95 border border-slate-600"
            >
              CLEAR ALL
            </button>
          </div>
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Training Courses */}
        <div>
          <div className="text-xs text-slate-400 font-mono mb-2">TRAINING COURSES</div>
          <select 
            value={activeCourse ? activeCourse.id : ''} 
            onChange={(e) => {
              const val = e.target.value;
              const selected = PREMADE_COURSES.find(c => c.id === val);
              startCourse(selected || null);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-slate-200 font-mono outline-none mb-2"
          >
            <option value="">Free Sailing (No Course)</option>
            {PREMADE_COURSES.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {activeCourse && (
            <div className="glass-panel-inner rounded-xl p-3 mt-2 text-xs font-mono space-y-1.5">
              <div className="text-slate-300 font-bold">{activeCourse.name}</div>
              <div className="text-slate-400 text-[10px] leading-normal">{activeCourse.description}</div>
              <div className="flex justify-between">
                <span className="text-slate-400">Progress:</span>
                <span className="text-emerald-400 font-bold">
                  {activeCourse.gates.filter(g => g.passed).length} / {activeCourse.gates.length} Gates
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Elapsed:</span>
                <span className="text-amber-400 font-bold">
                  {Math.floor(courseElapsedTime / 60)}m {Math.floor(courseElapsedTime % 60)}s
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px w-full bg-slate-800 my-2"></div>

        {/* Port and Damage Settings */}
        <div>
          <div className="text-xs text-slate-400 font-mono mb-2">SCENARIO OPTIONS</div>
          
          <div className="flex gap-2 mb-3 bg-slate-950 p-1 rounded border border-slate-700">
            <button 
              onClick={() => setPortMode('home')}
              className={`flex-1 px-2 py-1 text-xs font-mono rounded ${portMode === 'home' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              HOME PORT
            </button>
            <button 
              onClick={() => setPortMode('random')}
              className={`flex-1 px-2 py-1 text-xs font-mono rounded ${portMode === 'random' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              RANDOM
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mb-2">
            <input type="checkbox" checked={damageEnabled} onChange={e => setDamageEnabled(e.target.checked)} className="accent-red-500 w-4 h-4" />
            Enable Collision Damage
          </label>
          {damageEnabled && shipDamage > 0 && (
            <button 
              onClick={() => setShipDamage(0)}
              className="text-xs text-red-400 hover:text-red-300 underline"
            >
              Repair Ship
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return (
    <div className="flex-1 relative bg-slate-900 overflow-hidden w-full h-full">
      <div 
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={(e) => {
          // Adjust zoom
          const newZoom = zoomRef.current * (1 - Math.sign(e.deltaY) * 0.1);
          zoomRef.current = Math.max(0.2, Math.min(5, newZoom));
        }}
      >
        <canvas 
          ref={canvasRef}
          className="w-full h-full"
          width={window.innerWidth}
          height={window.innerHeight}
        />
      </div>
      
      {/* CRT Overlay for aesthetic */}
      <div className="absolute inset-0 screen-crt opacity-30 mix-blend-overlay pointer-events-none"></div>

      {/* Environment Settings Panel (Collapsible) */}
      {!isSettingsPoppedOut && (
        <div className={`absolute top-6 right-0 transition-transform duration-300 z-20 flex ${envExpanded ? 'translate-x-0 pr-6' : 'translate-x-full'}`}>
          {/* Sidebar Trigger */}
          <button 
            onClick={() => setEnvExpanded(!envExpanded)}
            className="absolute -left-8 top-4 glass-panel w-8 h-12 flex items-center justify-center rounded-l-xl text-slate-400 hover:text-white"
          >
            {envExpanded ? '▶' : '◀'}
          </button>
          {settingsPanelJSX(false)}
        </div>
      )}

      {isSettingsPoppedOut && (
        <ControlPortal 
          onClose={() => setIsSettingsPoppedOut(false)}
          windowName="ShipSettings"
          windowTitle="Realism & Environmental Settings"
          width={360}
          height={750}
          scrollbars="yes"
        >
          {settingsPanelJSX(true)}
        </ControlPortal>
      )}

      {/* Modern Ship Control Panel */}
      {(() => {
        const controlPanel = (
          <div 
            onMouseDown={isControlsPoppedOut ? undefined : handleMouseDown}
            style={{ 
              transform: isControlsPoppedOut ? 'scale(1)' : `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
              transformOrigin: 'bottom center',
              display: simMode === 'ship' ? 'flex' : 'none',
              position: isControlsPoppedOut ? 'relative' : 'absolute',
              left: isControlsPoppedOut ? 'auto' : '50%',
              bottom: isControlsPoppedOut ? 'auto' : '2rem'
            }}
            className={`glass-panel p-6 flex flex-col gap-6 rounded-2xl ${isControlsPoppedOut ? '' : (isDragging ? 'cursor-grabbing' : 'cursor-grab')} z-20`}
          >
            {/* Panel Scale Buttons */}
            <div className="absolute top-2 left-10 text-[8px] text-slate-500 font-mono flex items-center gap-1.5 z-30" onMouseDown={e => e.stopPropagation()}>
              {!isControlsPoppedOut ? (
                <>
                  SCALE:
                  {[{label: 'XS', val: 0.5}, {label: 'S', val: 0.75}, {label: 'M', val: 1.0}, {label: 'L', val: 1.25}, {label: 'XL', val: 1.5}].map(sz => (
                    <button
                      key={sz.label}
                      onClick={() => setPanelScale(sz.val)}
                      className={`px-1.5 py-0.5 rounded ${panelScale === sz.val ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                      {sz.label}
                    </button>
                  ))}
                  <span className="text-slate-600 mx-1">|</span>
                  <button
                    onClick={() => setIsControlsPoppedOut(true)}
                    className="px-2 py-0.5 bg-blue-600 text-white hover:bg-blue-500 rounded font-bold uppercase tracking-wider text-[8px]"
                  >
                    Pop Out Console
                  </button>
                </>
              ) : (
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">
                  🖥️ External Control Deck Active
                </span>
              )}
            </div>

        {/* Panel details: Screws */}
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
          
          {/* HUD Indicators (Moved to Compass section) */}
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
          
          {/* Side Thrusters (Corvette/Frigate only) */}
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
              {/* Inner Slot */}
              <div className="absolute w-6 h-48 bg-slate-950 rounded-full shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex justify-center">
                <div className="w-0.5 h-full bg-white/10"></div>
              </div>
              
              {/* Scale Markings */}
              <div className="absolute inset-y-4 left-1 flex flex-col justify-between py-1 font-mono text-[9px] font-bold text-slate-800 pointer-events-none">
                <span>100</span><span>50</span><span>0</span><span>-50</span><span>-100</span>
              </div>
              <div className="absolute inset-y-4 right-1 flex flex-col justify-between py-1 font-mono text-[9px] font-bold text-slate-800 pointer-events-none text-right tracking-tighter">
                <span>AHD</span><span></span><span></span><span></span><span>AST</span>
              </div>

              {/* The Lever Arm and Handle */}
              <div 
                className="absolute left-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
                style={{ top: `${50 - (throttle / 2)}%`, transition: isDraggingLever ? 'none' : 'top 0.1s ease-out' }}
              >
                {/* Arm Base / Joint */}
                <div className="w-8 h-4 bg-gradient-to-r from-slate-500 to-slate-300 rounded-t-lg -mb-1 shadow-[inset_0_2px_2px_rgba(255,255,255,0.5)]"></div>
                {/* Arm Shaft */}
                <div className="w-4 h-6 bg-gradient-to-r from-slate-400 via-slate-200 to-slate-400 shadow-[inset_0_0_5px_rgba(0,0,0,0.5)] z-0"></div>
                {/* Grip */}
                <div className="w-20 h-10 bg-gradient-to-b from-slate-800 to-black rounded-lg shadow-[0_10px_15px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.3)] border border-slate-600 -mt-2 z-10 flex items-center justify-center relative">
                   <div className="absolute top-1 left-2 right-2 h-2 bg-gradient-to-b from-white/20 to-transparent rounded-full pointer-events-none"></div>
                   {/* Grip accents */}
                   <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 mx-1"></div>
                   <div className="w-1.5 h-5 bg-blue-500 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8),inset_0_1px_3px_rgba(0,0,0,0.8)] opacity-90 mx-1"></div>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lever <span className="text-slate-500 font-normal">[Q/Z]</span></span>
          </div>

          {/* Traditional Compass */}
          <div className="flex flex-col items-center px-2 pt-0 justify-end">
             {/* Speed & Heading Readouts */}
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
               {/* Fixed Lubber Line */}
               <div className="absolute top-0 w-1 h-3 bg-red-500 z-20 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>
               <div className="absolute top-3 w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500 z-20"></div>
               
               {/* Rotating Compass Card */}
               <div ref={compassCardRef} className="absolute inset-0 rounded-full flex items-center justify-center z-10 transition-transform duration-75">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-700"></div>
                  <span className="absolute top-2 text-[10px] font-bold text-slate-300">N</span>
                  <span className="absolute right-2 text-[10px] font-bold text-slate-300">E</span>
                  <span className="absolute bottom-2 text-[10px] font-bold text-slate-300">S</span>
                  <span className="absolute left-2 text-[10px] font-bold text-slate-300">W</span>
                  <div className="absolute w-full h-px bg-slate-700"></div>
                  <div className="absolute h-full w-px bg-slate-700"></div>
                  {/* Tick marks */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                    <div key={deg} className="absolute w-full h-full flex items-start justify-center" style={{ transform: `rotate(${deg}deg)` }}>
                      <div className="w-0.5 h-1.5 bg-slate-500 mt-1"></div>
                    </div>
                  ))}
               </div>
             </div>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6">GYROCOMPASS</span>
          </div>
          
          {/* Divider */}
          <div className="h-48 w-0.5 bg-gradient-to-b from-transparent via-slate-700 to-transparent"></div>
          
          {/* Steering UI */}
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
                {/* Scale markings on the base */}
                <div className="absolute inset-1 rounded-full border-4 border-transparent pointer-events-none" style={{
                  borderTopColor: '#ef4444', borderLeftColor: '#ef4444', // Red for port
                  borderRightColor: '#10b981', borderBottomColor: '#10b981', // Green for stbd
                  transform: 'rotate(-45deg)' 
                }}></div>
                {/* Hide the bottom half of the scale since rudder only goes to 45 */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-slate-900 z-0 rounded-b-full"></div>
                {/* Base center circle */}
                <div className="absolute inset-5 rounded-full bg-slate-950 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] z-0">
                  {/* Tick marks around the dial */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-amber-500"></div>
                  <div className="absolute top-2.5 left-4 w-2 h-0.5 bg-red-500 rotate-45"></div>
                  <div className="absolute top-2.5 right-4 w-2 h-0.5 bg-emerald-500 -rotate-45"></div>
                </div>

                {/* Rotating Azimuth Puck */}
                <div 
                  className="absolute inset-0 transition-transform duration-75 z-10"
                  style={{ transform: `rotate(${rudder}deg)` }}
                >
                  {/* Protruding Handle (Lever pointing down towards user) */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-5 h-16 bg-gradient-to-r from-slate-700 via-slate-500 to-slate-800 rounded-b-lg origin-top z-0" style={{ transform: 'rotate(180deg)' }}>
                    <div className="w-full h-8 bg-gradient-to-b from-slate-800 to-black rounded-b-lg absolute bottom-0 shadow-[0_5px_10px_rgba(0,0,0,0.8)] border-x border-b border-slate-600"></div>
                  </div>
                  
                  {/* The Black Knob */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-b from-slate-700 to-slate-900 rounded-full border-[3px] border-slate-800 shadow-[0_10px_20px_rgba(0,0,0,0.8),inset_0_2px_5px_rgba(255,255,255,0.2)] flex items-center justify-center z-10">
                    <div className="w-16 h-16 bg-slate-950 rounded-full shadow-inner flex items-center justify-center">
                      {/* Compass Star Logo */}
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
                {/* Background housing */}
                <div className="absolute inset-0 bg-slate-900 rounded-full border-[4px] border-slate-800 shadow-[inset_0_10px_20px_rgba(0,0,0,0.8)]"></div>
                
                {/* Wheel element rotated by rudder state */}
                <div 
                  className="absolute inset-0 transition-transform duration-75"
                  style={{ transform: `rotate(${rudder}deg)` }}
                >
                  {/* Wheel outer rim */}
                  <div className="absolute inset-4 rounded-full border-8 border-amber-900 shadow-xl"></div>
                  {/* Wheel inner hub */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-amber-800 rounded-full border-2 border-amber-600 shadow-md z-10">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-amber-900 rounded-full"></div>
                  </div>
                  
                  {/* Spokes */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
                    <div 
                      key={angle}
                      className="absolute top-1/2 left-1/2 w-1.5 h-[80px] bg-amber-800 border-x border-amber-900 origin-bottom"
                      style={{ 
                        transform: `translateX(-50%) translateY(-100%) rotate(${angle}deg)`,
                        transformOrigin: 'bottom center'
                      }}
                    >
                      {/* Handle grips sticking out past rim */}
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

      if (isControlsPoppedOut) {
        return (
          <ControlPortal onClose={() => setIsControlsPoppedOut(false)}>
            {controlPanel}
          </ControlPortal>
        );
      }

      return controlPanel;
    })()}

      {/* Docking Button Overlays */}
      {isDocked && (
        <button 
          onClick={() => {
            setIsDocked(false);
            setThrottle(0);
          }}
          className="absolute z-10 bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(234,88,12,0.8)] border-4 border-orange-400 tracking-widest text-lg transition-transform hover:scale-105"
        >
          SLIP THE JETTY
        </button>
      )}

      {!isDocked && canTieUp && (
        <button 
          onClick={() => {
            setIsDocked(true);
            setThrottle(0);
            setRudder(0);
          }}
          className="absolute z-10 bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(16,185,129,0.8)] border-4 border-emerald-400 tracking-widest text-lg transition-transform hover:scale-105 animate-bounce"
        >
          TIE UP SECURELY
        </button>
      )}

      {/* Physics Panels & Environment Overlays */}

      {simMode === 'heli' && (
        <div className="absolute top-24 right-8 bg-slate-900/90 p-4 rounded-lg border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] z-20 w-72 pointer-events-none">
           <h3 className="text-emerald-400 font-bold mb-2 tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             EASTER EGG MISSION
           </h3>
           <p className="text-sm text-slate-300">
             Use the Flight Controls panel to fly the helicopter to the mainland Jetty and land safely on the Red & White Helipad (LZ) to complete the mission.
           </p>
        </div>
      )}

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
             onMouseDown={(e) => e.stopPropagation()}
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
           {/* Keyboard Instructions Info Bar */}
           <div className="text-[10px] text-emerald-400/80 font-mono bg-emerald-950/20 border border-emerald-500/20 px-3 py-2 rounded-lg w-full text-center">
             💡 Use <b>ARROW KEYS</b> or <b>WASD</b> to Steer & Fly!
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

           {/* Quick Action Steering Buttons for Touch/Click */}
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

      {missionAccomplished && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
          <div className="bg-slate-900 border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)] rounded-2xl p-12 flex flex-col items-center animate-bounce">
             <h2 className="text-5xl font-bold text-emerald-400 mb-6 drop-shadow-md">MISSION ACCOMPLISHED</h2>
             <p className="text-slate-300 text-xl mb-8">You successfully navigated the helicopter to the Jetty Landing Zone.</p>
             <button 
               onClick={() => {
                 setMissionAccomplished(false);
                 setSimMode('ship');
               }}
               className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-lg uppercase tracking-widest"
             >
               Return to Ship
             </button>
          </div>
        </div>
      )}

      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div className="absolute inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl max-w-2xl w-full p-8 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col items-center">
              <img src="./logo.png" alt="Cadet Simulator Logo" className="w-32 h-32 mb-6 drop-shadow-xl" />
              
              <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">CADET SIMULATOR</h1>
              <p className="text-slate-400 text-center mb-8 max-w-lg">
                Welcome to the digital helm. Practice ship handling, navigation, and maneuvering in dynamic environments. Learn to master wind, current, and momentum.
              </p>
              
              <div className="grid grid-cols-2 gap-6 w-full mb-8">
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl shadow-inner">
                  <h3 className="text-amber-400 font-mono text-sm mb-3 border-b border-slate-800 pb-2">KEYBOARD CONTROLS</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex justify-between items-center"><span>Steer Port/Stbd</span> <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono shadow-sm">← / →</kbd></li>
                    <li className="flex justify-between items-center"><span>Increase Thrust</span> <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono shadow-sm">Q</kbd></li>
                    <li className="flex justify-between items-center"><span>Decrease Thrust</span> <kbd className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono shadow-sm">Z</kbd></li>
                  </ul>
                </div>
                
                <div className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl shadow-inner">
                  <h3 className="text-emerald-400 font-mono text-sm mb-3 border-b border-slate-800 pb-2">MOUSE CONTROLS</h3>
                  <ul className="space-y-3 text-sm text-slate-300">
                    <li className="flex justify-between items-center"><span>Steering Wheel</span> <span className="text-xs text-slate-400 font-medium">Click & Drag</span></li>
                    <li className="flex justify-between items-center"><span>Move Panel</span> <span className="text-xs text-slate-400 font-medium">Drag Top Plate</span></li>
                    <li className="flex justify-between items-center"><span>Move Buoys</span> <span className="text-xs text-slate-400 font-medium">Drag on Water</span></li>
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => setShowWelcome(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-10 rounded-full transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)] hover:shadow-[0_0_25px_rgba(217,119,6,0.6)] hover:-translate-y-0.5 uppercase tracking-widest text-sm active:scale-95"
              >
                Take the Helm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Course Completed Modal */}
      {courseCompleted && activeCourse && (
        <div className="absolute inset-0 z-[110] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900/90 border border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.4)] rounded-2xl max-w-md w-full p-8 relative text-center">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900">
              <span className="text-4xl">🏆</span>
            </div>
            <h2 className="text-3xl font-bold text-white mt-12 mb-2 tracking-wide">COURSE COMPLETED!</h2>
            <p className="text-slate-400 text-sm mb-6">Excellent seamanship, Cadet!</p>
            
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl shadow-inner mb-6 text-left font-mono text-sm space-y-2">
              <div className="flex justify-between"><span className="text-slate-400">Course:</span> <span className="text-slate-200">{activeCourse.name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Time Taken:</span> <span className="text-amber-400">{Math.floor(courseElapsedTime / 60)}m {Math.floor(courseElapsedTime % 60)}s</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Vessel Class:</span> <span className="text-emerald-400 uppercase">{shipClass}</span></div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const selected = PREMADE_COURSES.find(c => c.id === activeCourse.id);
                  startCourse(selected || null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase tracking-wider text-xs active:scale-95"
              >
                Retry Course
              </button>
              <button 
                onClick={() => {
                  startCourse(null);
                }}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-all border border-slate-700 uppercase tracking-wider text-xs active:scale-95"
              >
                Free Sailing
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
