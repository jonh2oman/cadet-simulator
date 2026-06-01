import React, { useRef, useEffect, useState } from 'react';
import ControlPortal from './ControlPortal';
import { useSimStore } from '../store/simStore';
import { useShipAudio } from '../hooks/useShipAudio';
import { PREMADE_COURSES, SHIP_SPECS, PASADENA_LABELS } from '../config/constants';
import type { Course } from '../config/constants';
import * as renderer from '../utils/renderer';
import RealismSettings from './RealismSettings';
import HelmControls from './HelmControls';
import WelcomeScreen from './WelcomeScreen';
import MissionAccomplishedModal from './MissionAccomplishedModal';
import CourseCompletedModal from './CourseCompletedModal';

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

  const buoys = useRef<Array<{ id: string; type: 'port' | 'starboard'; x: number; y: number }>>([
    { id: '1', type: 'port', x: 200, y: 200 }, // Green
    { id: '2', type: 'starboard', x: 200, y: 0 }, // Red
  ]);

  const customBuoysRef = useRef<{ x: number; y: number; color: 'yellow' | 'green' | 'red' }[]>([]);

  // Simulation settings synced via Zustand
  const {
    throttle, setThrottle,
    rudder, setRudder,
    bowThruster, setBowThruster,
    sternThruster, setSternThruster,
    windSpeed,
    windDir,
    currentSpeed,
    currentDir,
    jettyType,
    shipClass, setShipClass,
    damageEnabled,
    portMode, setPortMode,
    setShipDamage,
    isDocked, setIsDocked,
    simMode, setSimMode,
    engineSoundOn,
    musicPlaying,
    heliAltitude, setHeliAltitude,
    heliSpeed, setHeliSpeed,
    missionAccomplished, setMissionAccomplished,
    showPortBuoy,
    showStbdBuoy,
    activeCourse, setActiveCourse,
    courseElapsedTime, setCourseElapsedTime,
    courseCompleted, setCourseCompleted
  } = useSimStore();

  const [islands, setIslands] = useState<Array<{points: number[][]}>>([]);
  const islandsRef = useRef<Array<{points: number[][]}>>([]);
  
  const physicsWorkerRef = useRef<Worker | null>(null);
  const tieUpDataRef = useRef({ snapX: 460, snapY: 150, snapH: 0 });
  const courseStartTimeRef = useRef<number | null>(null);
  const prevPosRef = useRef({ x: 460, y: 150 });
  
  const [isControlsPoppedOut, setIsControlsPoppedOut] = useState<boolean>(false);
  const [isSettingsPoppedOut, setIsSettingsPoppedOut] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [canTieUp, setCanTieUp] = useState(false);

  // Heli physics states
  const heliState = useRef({
    x: 0, y: 0, altitude: 0, heading: 0, speed: 0,
    pitch: 0, roll: 0, yawRate: 0 
  });


  const particlesRef = useRef<{x: number, y: number, life: number, type?: 'wake' | 'smoke', vx?: number, vy?: number}[]>([]);

  // Setup sound synthesizer effects
  const { playBeep, startHorn, stopHorn } = useShipAudio({
    simMode,
    shipClass,
    throttle,
    engineSoundOn,
    heliSpeed,
    heliAltitude,
    musicPlaying
  });

  const startCourse = (course: Course | null) => {
    const state = shipState.current;
    const isPasadena = useSimStore.getState().portMode === 'pasadena';
    const startX = isPasadena ? 500 : 460;
    const startY = isPasadena ? 120 : 150;
    state.x = startX;
    state.y = startY;
    state.heading = 0;
    state.speed = 0;
    prevPosRef.current = { x: startX, y: startY };
    setThrottle(0);
    setRudder(0);
    setBowThruster(0);
    setSternThruster(0);
    setIsDocked(false);
    tieUpDataRef.current = { snapX: startX, snapY: startY, snapH: 0 };

    if (course) {
      const clonedCourse = {
        ...course,
        gates: course.gates.map(g => ({ ...g, passed: false }))
      };
      setActiveCourse(clonedCourse);
      courseStartTimeRef.current = performance.now();
      setCourseElapsedTime(0);
      setCourseCompleted(false);
      playBeep(600, 0.3);
    } else {
      setActiveCourse(null);
      courseStartTimeRef.current = null;
      setCourseCompleted(false);
    }
  };

  // Generate Map Islands
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
    } else if (portMode === 'pasadena') {
      const nwPoints: number[][] = [];
      const sePoints: number[][] = [];
      
      // Generate NW Shore (y = -x - 1500) - Much wider channel
      for (let x = -3000; x <= 3000; x += 150) {
        const baseY = -x - 1500;
        const noiseX = (Math.random() - 0.5) * 35;
        const noiseY = (Math.random() - 0.5) * 35;
        nwPoints.push([x + noiseX, baseY + noiseY]);
      }
      nwPoints.push([3000, -3000], [-3000, -3000]);
      
      // Generate SE Shore (y = -x + 2200) with custom Pasadena Cadet Yacht Club harbor peninsula
      for (let x = 3000; x >= -3000; x -= 100) {
        let baseY = -x + 2200;
        if (x >= 600 && x <= 800) {
          const ratio = (x - 600) / 200;
          baseY = ratio * (-x + 2200) + (1 - ratio) * 250;
        } else if (x >= 400 && x < 600) {
          baseY = 250;
        } else if (x >= 200 && x < 400) {
          const ratio = (400 - x) / 200;
          baseY = ratio * (-x + 2200) + (1 - ratio) * 250;
        }
        const noiseX = (Math.random() - 0.5) * 25;
        const noiseY = (Math.random() - 0.5) * 25;
        sePoints.push([x + noiseX, baseY + noiseY]);
      }
      sePoints.push([-3000, 3000], [3000, 3000]);
      
      const pasadenaIslands = [
        { points: nwPoints },
        { points: sePoints }
      ];
      setIslands(pasadenaIslands);
      islandsRef.current = pasadenaIslands;
    } else if (portMode === 'custom') {
      // Do nothing, islands will be loaded and updated by the uploader in RealismSettings.tsx
    } else {
      const newIslands = [];
      for (let i = 0; i < 4; i++) {
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

  // Instantiate background physics Web Worker
  useEffect(() => {
    const worker = new Worker(new URL('../workers/physics.worker.ts', import.meta.url), {
      type: 'module'
    });
    physicsWorkerRef.current = worker;
    
    worker.postMessage({
      type: 'init',
      payload: {
        x: shipState.current.x,
        y: shipState.current.y,
        heading: shipState.current.heading,
        speed: shipState.current.speed,
        shipClass,
        portMode,
        isDocked,
        snapX: tieUpDataRef.current.snapX,
        snapY: tieUpDataRef.current.snapY,
        snapH: tieUpDataRef.current.snapH
      }
    });

    worker.onmessage = (e) => {
      const { type, payload } = e.data;
      if (type === 'physics_update') {
        shipState.current.x = payload.x;
        shipState.current.y = payload.y;
        shipState.current.heading = payload.heading;
        shipState.current.speed = payload.speed;
        
        setCanTieUp(payload.canTieUp);
        
        if (payload.collision) {
          if (useSimStore.getState().damageEnabled) {
            setShipDamage(d => Math.min(100, d + payload.collisionImpact * 15 + 2));
          }
          playBeep(120, 0.15); // collision thump
        }
        
        if (payload.crossedGateIndex !== -1) {
          const active = useSimStore.getState().activeCourse;
          if (active) {
            const updatedGates = [...active.gates];
            updatedGates[payload.crossedGateIndex] = {
              ...updatedGates[payload.crossedGateIndex],
              passed: true
            };
            setActiveCourse({ ...active, gates: updatedGates });
            playBeep(880, 0.25); // checkpoint gate crossed
          }
        }
        
        tieUpDataRef.current = {
          snapX: payload.snapX,
          snapY: payload.snapY,
          snapH: payload.snapH
        };
      }
    };
    
    return () => {
      worker.postMessage({ type: 'stop' });
      worker.terminate();
    };
  }, []);

  // Sync islands list to physics worker when map loads
  useEffect(() => {
    if (physicsWorkerRef.current) {
      physicsWorkerRef.current.postMessage({
        type: 'set_islands',
        payload: { islands }
      });
    }
  }, [islands]);

  // Sync steering inputs to physics worker
  useEffect(() => {
    if (physicsWorkerRef.current) {
      physicsWorkerRef.current.postMessage({
        type: 'update_inputs',
        payload: {
          throttle,
          rudder,
          bowThruster,
          sternThruster,
          windSpeed,
          windDir,
          currentSpeed,
          currentDir,
          jettyType,
          shipClass,
          damageEnabled,
          portMode,
          isDocked,
          simMode,
          snapX: tieUpDataRef.current.snapX,
          snapY: tieUpDataRef.current.snapY,
          snapH: tieUpDataRef.current.snapH
        }
      });
    }
  }, [throttle, rudder, bowThruster, sternThruster, windSpeed, windDir, currentSpeed, currentDir, jettyType, shipClass, damageEnabled, portMode, isDocked, simMode]);

  // Reset positions when map mode changes
  useEffect(() => {
    const isPasadena = portMode === 'pasadena';
    const startX = isPasadena ? 500 : 460;
    const startY = isPasadena ? 120 : 150;
    const state = shipState.current;
    
    state.x = startX;
    state.y = startY;
    state.heading = 0;
    state.speed = 0;
    prevPosRef.current = { x: startX, y: startY };
    
    setThrottle(0);
    setRudder(0);
    setBowThruster(0);
    setSternThruster(0);
    setIsDocked(false);
    tieUpDataRef.current = { snapX: startX, snapY: startY, snapH: 0 };
    
    if (physicsWorkerRef.current) {
      physicsWorkerRef.current.postMessage({
        type: 'reset_position',
        payload: { x: startX, y: startY, heading: 0, speed: 0, isDocked: false, snapX: startX, snapY: startY, snapH: 0 }
      });
    }
    
    if (isPasadena) {
      setShipClass('zodiac');
    }
  }, [portMode]);

  // Monitor activeCourse completion reactively
  useEffect(() => {
    if (activeCourse && !courseCompleted) {
      const allPassed = activeCourse.gates.every(g => g.passed);
      if (allPassed) {
        if (activeCourse.berthRequired) {
          if (isDocked) {
            setCourseCompleted(true);
            playBeep(1000, 0.15);
            setTimeout(() => playBeep(1300, 0.3), 150);
          }
        } else {
          setCourseCompleted(true);
          playBeep(1000, 0.15);
          setTimeout(() => playBeep(1300, 0.3), 150);
        }
      }
    }
  }, [activeCourse, isDocked, courseCompleted]);

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
    
    const scale = Math.max(rect.width / canvas.width, rect.height / canvas.height);
    const dx = (dx_rect / scale) / zoomRef.current;
    const dy = (dy_rect / scale) / zoomRef.current;
    
    const clientX = dx + canvas.width / 2;
    const clientY = dy + canvas.height / 2;
    
    const state = shipState.current;

    // Helipad interaction
    if (useSimStore.getState().simMode === 'ship' && useSimStore.getState().shipClass === 'frigate') {
        const cosH = Math.cos(-state.heading);
        const sinH = Math.sin(-state.heading);
        const shipLocalX = dx * cosH - dy * sinH;
        const shipLocalY = dx * sinH + dy * cosH;
        
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
           setHeliAltitude(30);
           setHeliSpeed(0);
           setThrottle(0);
           setRudder(0);
           state.speed = 0;
           return;
        }
    }

    const worldX = clientX + state.x - canvas.width / 2;
    const worldY = clientY + state.y - canvas.height / 2;

    for (const buoy of buoys.current) {
      if ((buoy.type === 'port' && !showPortBuoy) ||
          (buoy.type === 'starboard' && !showStbdBuoy)) continue;
          
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

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        if (e.repeat) return;
        e.preventDefault();
        startHorn();
        return;
      }

      if (useSimStore.getState().simMode === 'heli') {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          heliState.current.heading -= 0.1;
        }
        if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          e.preventDefault();
          heliState.current.heading += 0.1;
        }
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
          e.preventDefault();
          setHeliSpeed(prev => Math.min(30, prev + 2));
        }
        if (e.key === 'ArrowDown' || e.key === 'x' || e.key === 'X') {
          e.preventDefault();
          setHeliSpeed(prev => Math.max(-10, prev - 2));
        }
        if (e.key === ' ' || e.key === 'Spacebar' || e.key === 'q' || e.key === 'Q' || e.key === 'PageUp') {
          e.preventDefault();
          setHeliAltitude(prev => Math.min(100, prev + 5));
        }
        if (e.key === 'Shift' || e.key === 'z' || e.key === 'Z' || e.key === 'PageDown') {
          e.preventDefault();
          setHeliAltitude(prev => Math.max(0, prev - 5));
        }
        return;
      }

      if (e.key === 'ArrowLeft') { e.preventDefault(); setRudder(prev => Math.max(-45, prev - 5)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setRudder(prev => Math.min(45, prev + 5)); }
      if (e.key === 'w' || e.key === 'W') { setThrottle(prev => Math.min(100, prev + 5)); }
      if (e.key === 'x' || e.key === 'X') { setThrottle(prev => Math.max(-100, prev - 5)); }
      if (e.key === 's' || e.key === 'S') { setThrottle(0); }
      
      if (e.key === 'a' || e.key === 'A') { setBowThruster(-100); }
      if (e.key === 'd' || e.key === 'D') { setBowThruster(100); }
      if (e.key === 'z' || e.key === 'Z') { setSternThruster(-100); }
      if (e.key === 'c' || e.key === 'C') { setSternThruster(100); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        stopHorn();
      }
      
      if (useSimStore.getState().simMode === 'ship') {
        if (e.key === 'a' || e.key === 'A' || e.key === 'd' || e.key === 'D') {
          setBowThruster(0);
        }
        if (e.key === 'z' || e.key === 'Z' || e.key === 'c' || e.key === 'C') {
          setSternThruster(0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shipClass]);

  // Main Animation rendering frame loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const render = (time: number) => {
      if (isPausedRef.current) {
        lastTime = time;
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      frameCount++;
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Extract details from Zustand store (fresh lookup)
      const currentStore = useSimStore.getState();
      const state = shipState.current;
      const visualScale = SHIP_SPECS[currentStore.shipClass]?.visualScale || 1.5625;
      
      const dockWorldX = 500;
      const dockWorldY = 50;

      // Update active Course Elapsed Time
      if (currentStore.activeCourse && !currentStore.courseCompleted) {
        const now = performance.now();
        if (courseStartTimeRef.current !== null) {
          const elapsed = (now - courseStartTimeRef.current) / 1000;
          setCourseElapsedTime(elapsed);
        }
      }

      // Add wake particles if moving
      if (Math.abs(state.speed) > 0.5) {
        let localSternY = 26;
        if (currentStore.shipClass === 'zodiac') localSternY = 20;
        else if (currentStore.shipClass === 'corvette') localSternY = 39;
        else if (currentStore.shipClass === 'frigate') localSternY = 52;

        const sternX = state.x - Math.sin(state.heading) * (localSternY * visualScale);
        const sternY = state.y + Math.cos(state.heading) * (localSternY * visualScale);
        
        if (currentStore.shipClass === 'patrol' || currentStore.shipClass === 'corvette' || currentStore.shipClass === 'frigate') {
          const offsetX = Math.cos(state.heading) * (4 * visualScale);
          const offsetY = Math.sin(state.heading) * (4 * visualScale);
          
          particlesRef.current.push({
            x: sternX - offsetX + (Math.random() - 0.5) * 4 * visualScale,
            y: sternY - offsetY + (Math.random() - 0.5) * 4 * visualScale,
            life: 1.5
          });
          particlesRef.current.push({
            x: sternX + offsetX + (Math.random() - 0.5) * 4 * visualScale,
            y: sternY + offsetY + (Math.random() - 0.5) * 4 * visualScale,
            life: 1.5
          });
        } else {
          particlesRef.current.push({
            x: sternX + (Math.random() - 0.5) * 8 * visualScale,
            y: sternY + (Math.random() - 0.5) * 8 * visualScale,
            life: 1.5
          });
        }
      }

      // Funnel Stack smoke particle emission
      if (currentStore.simMode === 'ship' && frameCount % 6 === 0) {
        const windAngle = (currentStore.windDir + 180) * (Math.PI / 180);
        const windVel = currentStore.windSpeed * 0.15;
        const windVx = Math.cos(windAngle) * windVel;
        const windVy = Math.sin(windAngle) * windVel;

        const cosH = Math.cos(state.heading);
        const sinH = Math.sin(state.heading);

        const spawnSmoke = (localX: number, localY: number) => {
          const worldX = state.x + (localX * cosH - localY * sinH);
          const worldY = state.y + (localX * sinH + localY * cosH);
          const exhaustVx = -cosH * (4 + Math.abs(state.speed) * 0.3) + windVx;
          const exhaustVy = -sinH * (4 + Math.abs(state.speed) * 0.3) + windVy;

          particlesRef.current.push({
            x: worldX,
            y: worldY,
            vx: exhaustVx,
            vy: exhaustVy,
            life: 2.0,
            type: 'smoke'
          });
        };

        if (currentStore.shipClass === 'corvette') {
          spawnSmoke(2 * visualScale, 0);
        } else if (currentStore.shipClass === 'frigate') {
          spawnSmoke(8 * visualScale, 0);
          spawnSmoke(-4 * visualScale, 0);
        } else if (currentStore.shipClass === 'patrol') {
          spawnSmoke(-8 * visualScale, -2 * visualScale);
          spawnSmoke(-8 * visualScale, 2 * visualScale);
        }
      }

      // Helicopter calculations
      if (currentStore.simMode === 'heli') {
         const hState = heliState.current;
         hState.altitude += (currentStore.heliAltitude - hState.altitude) * dt * 2.0;
         if (hState.altitude < 0.1) {
           hState.altitude = 0;
           hState.speed = 0;
         } else {
           hState.speed += (currentStore.heliSpeed - hState.speed) * dt * 2.0;
         }
         
         hState.x += Math.sin(hState.heading) * hState.speed * dt * 10;
         hState.y -= Math.cos(hState.heading) * hState.speed * dt * 10;
  
         if (hState.altitude === 0 && Math.abs(hState.speed) < 1) {
            const lzX = dockWorldX + 150;
            const lzY = dockWorldY + 100;
            if (Math.hypot(hState.x - lzX, hState.y - lzY) < 30) {
               setMissionAccomplished(true);
            }
         }
      }

      // Clear Canvas
      ctx.fillStyle = '#0f172a'; // slate-900 water color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(zoomRef.current, zoomRef.current);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      const camX = currentStore.simMode === 'heli' ? heliState.current.x : state.x;
      const camY = currentStore.simMode === 'heli' ? heliState.current.y + 150 : state.y;

      // Draw waves
      renderer.drawWaves(ctx, canvas.width, canvas.height, camX, camY);

      // Draw mainland shoreline for home/random map modes
      if (currentStore.portMode === 'home' || currentStore.portMode === 'random') {
        renderer.drawMainland(ctx, canvas.width, canvas.height, camX, camY);
      }

      // Draw dock site boundary limits
      ctx.save();
      ctx.translate(canvas.width / 2 - camX, canvas.height / 2 - camY);
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 10;
      
      // Draw Jetties
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      
      if (currentStore.portMode === 'pasadena') {
         ctx.save();
         ctx.translate(dockWorldX, dockWorldY);
         
         const drawFloatingDock = (x: number, y: number, w: number, h: number) => {
           ctx.save();
           // Draw white floating pontoon base
           ctx.fillStyle = '#f8fafc'; // white/slate-50
           ctx.strokeStyle = '#475569';
           ctx.lineWidth = 1.5;
           ctx.fillRect(x, y, w, h);
           ctx.strokeRect(x, y, w, h);

           // Draw wooden walkway insert
           ctx.fillStyle = '#d97706'; // amber-600 wood tone
           ctx.fillRect(x + 1.5, y + 2, w - 3, h - 4);

           // Draw gangway connection to shore
           ctx.fillStyle = '#475569';
           ctx.fillRect(x + 1, 200, w - 2, -120 + y);
           ctx.fillStyle = '#94a3b8';
           ctx.fillRect(x + 2, 200, w - 4, -120 + y);
           ctx.restore();
         };

         // Draw Left & Right Breakwaters (straight stone piers)
         ctx.fillStyle = '#334155';
         ctx.strokeStyle = '#1e293b';
         ctx.lineWidth = 4;
         ctx.fillRect(-130, 45, 20, 155);
         ctx.strokeRect(-130, 45, 20, 155);
         ctx.fillRect(110, 45, 20, 155);
         ctx.strokeRect(110, 45, 20, 155);

         // Draw floating finger piers
         drawFloatingDock(-35, 80, 8, 80);
         drawFloatingDock(27, 80, 8, 80);

         // Pasadena LZ (Helipad)
         ctx.fillStyle = '#334155';
         ctx.fillRect(130, 80, 40, 40);
         ctx.strokeRect(130, 80, 40, 40);
         
         ctx.strokeStyle = '#ef4444';
         ctx.lineWidth = 3;
         ctx.beginPath();
         ctx.arc(150, 100, 12, 0, Math.PI * 2);
         ctx.stroke();
         ctx.fillStyle = '#ef4444';
         ctx.font = 'bold 12px monospace';
         ctx.textAlign = 'center';
         ctx.textBaseline = 'middle';
         ctx.fillText('H', 150, 100);

         ctx.restore();
      } else {
         // Deer Lake / home maps breakwater straight jetties
         switch (currentStore.jettyType) {
           case 'straight':
             ctx.fillRect(dockWorldX - 10, dockWorldY, 20, 160);
             ctx.strokeRect(dockWorldX - 10, dockWorldY, 20, 160);
             break;
           case 'l-shape':
             ctx.fillRect(dockWorldX - 10, dockWorldY, 20, 160);
             ctx.strokeRect(dockWorldX - 10, dockWorldY, 20, 160);
             ctx.fillRect(dockWorldX - 10, dockWorldY + 140, 120, 20);
             ctx.strokeRect(dockWorldX - 10, dockWorldY + 140, 120, 20);
             break;
           case 'u-shape':
             ctx.fillRect(dockWorldX - 60, dockWorldY, 20, 160);
             ctx.strokeRect(dockWorldX - 60, dockWorldY, 20, 160);
             ctx.fillRect(dockWorldX + 40, dockWorldY, 20, 160);
             ctx.strokeRect(dockWorldX + 40, dockWorldY, 20, 160);
             ctx.fillRect(dockWorldX - 60, dockWorldY, 120, 20);
             ctx.strokeRect(dockWorldX - 60, dockWorldY, 120, 20);
             break;
           case 't-shape':
             ctx.fillRect(dockWorldX - 10, dockWorldY, 20, 160);
             ctx.strokeRect(dockWorldX - 10, dockWorldY, 20, 160);
             ctx.fillRect(dockWorldX - 80, dockWorldY + 140, 160, 20);
             ctx.strokeRect(dockWorldX - 80, dockWorldY + 140, 160, 20);
             break;
         }
      }
      ctx.restore();

      // Draw islands
      renderer.drawIslands(ctx, canvas.width, canvas.height, islandsRef.current, camX, camY);

      // Draw Pasadena site labels
      if (currentStore.portMode === 'pasadena') {
        renderer.drawPasadenaLabels(ctx, canvas.width, canvas.height, PASADENA_LABELS, camX, camY);
      }

      // Update smoke particle movements
      const windAngle = (currentStore.windDir + 180) * (Math.PI / 180);
      const windVel = currentStore.windSpeed * 0.2;
      const windVx = Math.cos(windAngle) * windVel;
      const windVy = Math.sin(windAngle) * windVel;

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.life -= dt;
        if (p.type === 'smoke') {
          p.x += (p.vx || 0) * dt + windVx * dt * 25;
          p.y += (p.vy || 0) * dt + windVy * dt * 25;
          if (p.vx) p.vx *= 0.95;
          if (p.vy) p.vy *= 0.95;
        }
      });

      // Draw smoke / wake particles
      renderer.drawParticles(ctx, canvas.width, canvas.height, particlesRef.current, camX, camY);

      // Draw buoys
      renderer.drawBuoys(
        ctx,
        canvas.width,
        canvas.height,
        buoys.current,
        camX,
        camY,
        draggingBuoyRef.current,
        showPortBuoy,
        showStbdBuoy
      );

      // Draw custom placed buoys
      renderer.drawCustomBuoys(ctx, canvas.width, canvas.height, customBuoysRef.current, camX, camY);

      // Draw active course checkpoints
      renderer.drawCourseGates(ctx, canvas.width, canvas.height, currentStore.activeCourse, camX, camY);

      // Draw vessel
      renderer.drawShip(
        ctx,
        canvas.width,
        canvas.height,
        currentStore.shipClass,
        state,
        currentStore.anchorDropped,
        currentStore.navLightsOn,
        currentStore.whiteLightsOn,
        currentStore.bowThruster,
        currentStore.sternThruster,
        currentStore.rudder
      );

      // Draw detached helicopter
      if (currentStore.simMode === 'heli') {
        renderer.drawHelicopter(ctx, canvas.width, canvas.height, camX, camY, heliState.current);
      }

      ctx.restore();

      // Write direct UI values to HUD
      if (speedTextRef.current) {
        speedTextRef.current.innerText = (Math.abs(state.speed) * 10).toFixed(1) + ' kts';
      }
      const posDisplay = document.getElementById('pos-display');
      if (posDisplay) {
        posDisplay.innerText = `X: ${Math.round(state.x)} Y: ${Math.round(state.y)}`;
      }
      if (compassTextRef.current || compassCardRef.current) {
        let deg = Math.round(state.heading * (180 / Math.PI)) % 360;
        if (deg < 0) deg += 360;
        if (compassTextRef.current) compassTextRef.current.innerText = `${deg.toString().padStart(3, '0')}°`;
        if (compassCardRef.current) compassCardRef.current.style.transform = `rotate(${-deg}deg)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden select-none">
      
      {/* Action Header / Top Dashboard */}
      <div className="absolute top-6 left-8 right-8 flex justify-between items-center z-10 pointer-events-none">
        <div className="flex gap-4 items-center">
          <div className="glass-panel px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400">MAP:</span>
            <select
              value={portMode}
              onChange={(e) => setPortMode(e.target.value as any)}
              className="bg-transparent text-emerald-400 font-mono text-xs border-none outline-none cursor-pointer"
            >
              <option value="home">Deer Lake (Home)</option>
              <option value="random">Open Bay (Random)</option>
              <option value="pasadena">Pasadena Coast</option>
              <option value="custom">Custom GeoJSON Map</option>
            </select>
          </div>

          <div className="glass-panel px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400">POS:</span>
            <span id="pos-display" className="text-xs font-mono text-emerald-400">X: 0 Y: 0</span>
          </div>
          
          <div className="glass-panel px-4 py-2 flex items-center gap-2 pointer-events-auto">
            <span className="text-[10px] font-mono text-slate-400">ZOOM:</span>
            <button onClick={() => { zoomRef.current = Math.min(2.5, zoomRef.current + 0.15); }} className="text-slate-300 hover:text-white px-1 font-bold font-mono text-sm">+</button>
            <span className="text-xs font-mono text-emerald-400 min-w-[32px] text-center">{Math.round(zoomRef.current * 100)}%</span>
            <button onClick={() => { zoomRef.current = Math.max(0.4, zoomRef.current - 0.15); }} className="text-slate-300 hover:text-white px-1 font-bold font-mono text-sm">-</button>
          </div>
        </div>

        <div className="flex gap-4 pointer-events-auto items-center">
          {PREMADE_COURSES.map(course => (
            <button
              key={course.id}
              onClick={() => {
                if (activeCourse && activeCourse.id === course.id) {
                  startCourse(null);
                } else {
                  startCourse(course);
                }
              }}
              className={`px-4 py-2 font-mono text-xs font-bold rounded-lg border transition-all ${
                activeCourse && activeCourse.id === course.id
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                  : 'glass-panel border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white'
              }`}
            >
              🏁 {course.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Simulation Canvas */}
      <canvas
        ref={canvasRef}
        width={1100}
        height={650}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        className="w-full h-full object-cover pointer-events-auto block"
      />

      {/* Realism & Environmental Settings Panel */}
      {isSettingsPoppedOut ? (
        <ControlPortal 
          onClose={() => setIsSettingsPoppedOut(false)}
          windowName="ShipSettings"
          windowTitle="Realism & Environmental Settings"
          width={360}
          height={750}
          scrollbars="yes"
        >
          <RealismSettings 
            isPopped={true} 
            setIsSettingsPoppedOut={setIsSettingsPoppedOut} 
            customBuoysRef={customBuoysRef}
            playBeep={playBeep}
            shipState={shipState}
            setIslands={setIslands}
          />
        </ControlPortal>
      ) : (
        <div className="absolute top-24 right-8 z-20">
          <RealismSettings 
            isPopped={false} 
            setIsSettingsPoppedOut={setIsSettingsPoppedOut} 
            customBuoysRef={customBuoysRef}
            playBeep={playBeep}
            shipState={shipState}
            setIslands={setIslands}
          />
        </div>
      )}

      {/* Modern Vessel Controls Console Panel */}
      {isControlsPoppedOut ? (
        <ControlPortal onClose={() => setIsControlsPoppedOut(false)}>
          <HelmControls
            isControlsPoppedOut={true}
            setIsControlsPoppedOut={setIsControlsPoppedOut}
            isPaused={isPaused}
            setIsPaused={setIsPaused}
            isPausedRef={isPausedRef}
            startHorn={startHorn}
            stopHorn={stopHorn}
            heliState={heliState}
            speedTextRef={speedTextRef}
            compassTextRef={compassTextRef}
            compassCardRef={compassCardRef}
          />
        </ControlPortal>
      ) : (
        <HelmControls
          isControlsPoppedOut={false}
          setIsControlsPoppedOut={setIsControlsPoppedOut}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          isPausedRef={isPausedRef}
          startHorn={startHorn}
          stopHorn={stopHorn}
          heliState={heliState}
          speedTextRef={speedTextRef}
          compassTextRef={compassTextRef}
          compassCardRef={compassCardRef}
        />
      )}

      {/* Docking Button Overlays */}
      {isDocked && (
        <button 
          onClick={() => {
            setIsDocked(false);
            setThrottle(0);
          }}
          className="absolute z-10 bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(234,88,12,0.8)] border-4 border-orange-400 tracking-widest text-lg transition-transform hover:scale-105 pointer-events-auto"
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
          className="absolute z-10 bottom-12 left-1/2 -translate-x-1/2 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full shadow-[0_0_30px_rgba(16,185,129,0.8)] border-4 border-emerald-400 tracking-widest text-lg transition-transform hover:scale-105 animate-bounce pointer-events-auto"
        >
          TIE UP SECURELY
        </button>
      )}

      {/* Easter Egg Helicopter Objective Details */}
      {simMode === 'heli' && (
        <div className="absolute top-24 left-8 bg-slate-900/90 p-4 rounded-lg border-2 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)] z-20 w-72 pointer-events-none">
           <h3 className="text-emerald-400 font-bold mb-2 tracking-widest flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
             EASTER EGG MISSION
           </h3>
           <p className="text-sm text-slate-300">
             Use the Flight Controls panel to fly the helicopter to the mainland Jetty and land safely on the Red & White Helipad (LZ) to complete the mission.
           </p>
        </div>
      )}

      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <WelcomeScreen onTakeHelm={() => setShowWelcome(false)} />
      )}

      {/* Helicopter Mission Accomplished Modal */}
      {missionAccomplished && (
        <MissionAccomplishedModal 
          onReturnToShip={() => {
            setMissionAccomplished(false);
            setSimMode('ship');
          }}
        />
      )}

      {/* Course Completed Modal */}
      {courseCompleted && activeCourse && (
        <CourseCompletedModal
          activeCourse={activeCourse}
          courseElapsedTime={courseElapsedTime}
          shipClass={shipClass}
          onRetry={() => {
            const selected = PREMADE_COURSES.find(c => c.id === activeCourse.id);
            startCourse(selected || null);
          }}
          onFreeSailing={() => startCourse(null)}
        />
      )}

    </div>
  );
}
