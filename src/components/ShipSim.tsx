import React, { useRef, useEffect, useState } from 'react';

export default function ShipSim() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedTextRef = useRef<HTMLSpanElement>(null);
  const compassTextRef = useRef<HTMLSpanElement>(null);
  const compassDialRef = useRef<HTMLDivElement>(null);

  // Ship physics state refs
  const shipState = useRef({
    x: 400,
    y: 300,
    heading: 0, // in radians
    speed: 0
  });

  const buoys = useRef([
    { id: '1', type: 'port', x: 600, y: 100 }, // Green
    { id: '2', type: 'starboard', x: 700, y: 100 }, // Red
  ]);

  // Engine & System controls
  const [throttle, setThrottle] = useState(0);
  const [rudder, setRudder] = useState(0);
  const [navLightsOn, setNavLightsOn] = useState(true);
  const [whiteLightsOn, setWhiteLightsOn] = useState(true);

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
  
  // Buoy controls
  const [showPortBuoy, setShowPortBuoy] = useState(true);
  const [showStbdBuoy, setShowStbdBuoy] = useState(true);

  const controlsRef = useRef({ 
    throttle: 0, rudder: 0, navLightsOn: true, whiteLightsOn: true,
    windSpeed: 0, windDir: 0, currentSpeed: 0, currentDir: 0, jettyType: 'straight',
    showPortBuoy: true, showStbdBuoy: true, shipClass: 'patrol', damageEnabled: false, portMode: 'home'
  });
  const particlesRef = useRef<{x: number, y: number, life: number}[]>([]);

  useEffect(() => {
    controlsRef.current = {
      throttle, rudder, navLightsOn, whiteLightsOn,
      windSpeed, windDir, currentSpeed, currentDir, jettyType,
      showPortBuoy, showStbdBuoy, shipClass, damageEnabled, portMode
    };
  }, [throttle, rudder, navLightsOn, whiteLightsOn, windSpeed, windDir, currentSpeed, currentDir, jettyType, showPortBuoy, showStbdBuoy, shipClass, damageEnabled, portMode]);

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
        generateIsland(800, 300, 100),
        generateIsland(200, -100, 80)
      ];
      setIslands(homeIslands);
      islandsRef.current = homeIslands;
    } else {
      const newIslands = [];
      for(let i=0; i<4; i++) {
        // Keep them slightly away from the jetty (500, 50)
        let cx = (Math.random() - 0.5) * 1200 + 500;
        let cy = (Math.random() - 0.5) * 800;
        if (Math.abs(cx - 500) < 150 && Math.abs(cy - 50) < 150) {
          cx += 200; cy += 200;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON') return;
    // Don't drag if we are turning the wheel
    if ((e.target as HTMLElement).closest('.steering-wheel-container')) return;
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
    
    // atan2(dy, dx) gives angle from 3 o'clock. We want 12 o'clock to be 0.
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    
    // Normalize to -180 to 180
    if (angle > 180) angle -= 360;
    
    // Clamp to -45 to 45
    if (angle > 45) angle = 45;
    if (angle < -45) angle = -45;
    
    setRudder(Math.round(angle));
  };

  useEffect(() => {
    if (!isTurningWheel) return;
    const handleMouseMove = (e: MouseEvent) => {
      updateWheelAngle(e.clientX, e.clientY);
    };
    const handleMouseUp = () => setIsTurningWheel(false);
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
    // Convert to world space
    const state = shipState.current;
    const worldX = clientX + state.x - canvas.width / 2;
    const worldY = clientY + state.y - canvas.height / 2;

    // Check collision with buoys
    for (const buoy of buoys.current) {
      if ((buoy.type === 'port' && !controlsRef.current.showPortBuoy) ||
          (buoy.type === 'starboard' && !controlsRef.current.showStbdBuoy)) continue;
          
      const dist = Math.hypot(buoy.x - worldX, buoy.y - worldY);
      if (dist < 30) { // 30px hit radius
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
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    
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
      if (e.key === 'ArrowLeft') { e.preventDefault(); setRudder(prev => Math.max(-45, prev - 5)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setRudder(prev => Math.min(45, prev + 5)); }
      if (e.key === 'q' || e.key === 'Q') { setThrottle(prev => Math.min(100, prev + 5)); }
      if (e.key === 'z' || e.key === 'Z') { setThrottle(prev => Math.max(-100, prev - 5)); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Rendering loop for the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Update physics
      const state = shipState.current;
      const { throttle, rudder, navLightsOn, whiteLightsOn, windSpeed, windDir, currentSpeed, currentDir, shipClass } = controlsRef.current;
      
      // Class physics modifiers
      let inertia = 1; // 1 = small, <1 = larger (slower response)
      let turnInertia = 1;
      let visualScale = 1;
      let maxSpeedMultiplier = 1;
      
      if (shipClass === 'zodiac') {
        inertia = 1.8; // Very fast acceleration
        turnInertia = 2.0; // Very fast turning
        visualScale = 0.5; // Small size
        maxSpeedMultiplier = 1.5; // High top speed
      } else if (shipClass === 'corvette') {
        inertia = 0.5;
        turnInertia = 0.6;
        visualScale = 1.2;
      } else if (shipClass === 'frigate') {
        inertia = 0.25;
        turnInertia = 0.3;
        visualScale = 1.8;
      }

      // Acceleration based on throttle (-100 to 100)
      const targetSpeed = (throttle / 10) * maxSpeedMultiplier; 
      state.speed += (targetSpeed - state.speed) * dt * 0.5 * inertia;

      // Turning based on rudder (-45 to 45) and speed
      if (Math.abs(state.speed) > 0.1) {
        const turnRate = (rudder / 45) * Math.min(Math.abs(state.speed), 5) * 0.5 * turnInertia;
        state.heading += (state.speed > 0 ? turnRate : -turnRate) * dt;
      }

      // Calculate environmental drift
      // Wind: blows FROM windDir. Converting to radians for math. Pushes towards windDir + 180.
      const windRad = (windDir + 180) * (Math.PI / 180);
      const windForce = (windSpeed / 30) * 3; // Max 3 units of drift
      const windDx = Math.sin(windRad) * windForce;
      const windDy = -Math.cos(windRad) * windForce; // -cos because Canvas Y is inverted

      // Current: Set is the direction current flows TOWARDS.
      const currentRad = currentDir * (Math.PI / 180);
      const currentForce = (currentSpeed / 5) * 4; // Max 4 units of drift (currents are strong)
      const currentDx = Math.sin(currentRad) * currentForce;
      const currentDy = -Math.cos(currentRad) * currentForce;

      // Move ship (Engine thrust + Wind drift + Current drift)
      const newX = state.x + (Math.sin(state.heading) * state.speed * 10 + windDx * 10 + currentDx * 10) * dt;
      const newY = state.y - (Math.cos(state.heading) * state.speed * 10 - windDy * 10 - currentDy * 10) * dt;

      // Collision Detection
      let collision = false;
      const shipRadius = 18 * visualScale;
      
      // Jetty hitboxes
      let jettyRects: {x:number, y:number, w:number, h:number}[] = [];
      const dockWorldX = 500;
      const dockWorldY = 50;
      switch (controlsRef.current.jettyType) {
        case 'straight': jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }]; break;
        case 'l-shape': jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: 40, y: 0, w: 100, h: 40 }]; break;
        case 'u-shape': jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: 40, y: 0, w: 100, h: 40 }, { x: 40, y: 160, w: 100, h: 40 }]; break;
        case 't-shape': jettyRects = [{ x: 0, y: 50, w: 40, h: 100 }, { x: -60, y: 0, w: 160, h: 40 }]; break;
      }
      
      for (const rect of jettyRects) {
        const testX = Math.max(dockWorldX + rect.x, Math.min(newX, dockWorldX + rect.x + rect.w));
        const testY = Math.max(dockWorldY + rect.y, Math.min(newY, dockWorldY + rect.y + rect.h));
        const dist = Math.hypot(newX - testX, newY - testY);
        if (dist <= shipRadius) { collision = true; break; }
      }

      // Island hitboxes
      if (!collision) {
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

      // No more wrap around screen, the world is endless (or bounded by islands)

      // Add wake particles if moving
      if (Math.abs(state.speed) > 0.5) {
        const sternX = state.x - Math.sin(state.heading) * (15 * visualScale);
        const sternY = state.y + Math.cos(state.heading) * (15 * visualScale);
        particlesRef.current.push({
          x: sternX + (Math.random() - 0.5) * 8 * visualScale,
          y: sternY + (Math.random() - 0.5) * 8 * visualScale,
          life: 1.5
        });
      }

      // Clear canvas
      ctx.fillStyle = '#0f172a'; // slate-900 water color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stylized dynamic water waves instead of grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // faint sky-blue waves
      ctx.lineWidth = 1.5;
      const waveSize = 100;
      const waveOffsetX = state.x % waveSize;
      const waveOffsetY = state.y % waveSize;
      const t = time / 1000; // animated over time

      for (let y = -waveOffsetY - waveSize; y < canvas.height + waveSize; y += waveSize * 0.5) {
        ctx.beginPath();
        for (let x = -waveOffsetX - waveSize; x < canvas.width + waveSize; x += waveSize) {
          const shift = Math.sin((x + y + t * 50) * 0.02) * 10;
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
        ctx.translate(canvas.width / 2 - state.x, canvas.height / 2 - state.y);
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
        
        ctx.restore();
      });

      // Draw wake particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      particlesRef.current.forEach(p => {
        p.life -= dt;
        ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.3})`;
        ctx.beginPath();
        ctx.arc(p.x - state.x + canvas.width / 2, p.y - state.y + canvas.height / 2, 2 + (1.5 - p.life) * 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw buoys relative to ship (camera centered on ship)
      const { showPortBuoy, showStbdBuoy } = controlsRef.current;
      buoys.current.forEach(buoy => {
        if (buoy.type === 'port' && !showPortBuoy) return;
        if (buoy.type === 'starboard' && !showStbdBuoy) return;
        
        const screenX = buoy.x - state.x + canvas.width / 2;
        const screenY = buoy.y - state.y + canvas.height / 2;

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

      // Draw the dock (relative to ship)
      const dockX = 500 - state.x + canvas.width / 2;
      const dockY = 50 - state.y + canvas.height / 2;
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
      } else if (currentJettyType === 'l-shape') {
        ctx.fillRect(0, 0, 40, 200);
        ctx.strokeRect(0, 0, 40, 200);
        ctx.fillRect(40, 0, 100, 40);
        ctx.strokeRect(40, 0, 100, 40);
      } else if (currentJettyType === 'u-shape') {
        ctx.fillRect(0, 0, 40, 200);
        ctx.fillRect(40, 0, 100, 40);
        ctx.fillRect(40, 160, 100, 40);
        ctx.strokeRect(0, 0, 40, 200);
        ctx.strokeRect(40, 0, 100, 40);
        ctx.strokeRect(40, 160, 100, 40);
      } else if (currentJettyType === 't-shape') {
        ctx.fillRect(0, 50, 40, 100);
        ctx.strokeRect(0, 50, 40, 100);
        ctx.fillRect(-60, 0, 160, 40);
        ctx.strokeRect(-60, 0, 160, 40);
      }
      
      // Draw Windsock
      ctx.shadowColor = 'transparent'; // No shadow for windsock to keep it clean
      ctx.fillStyle = '#94a3b8'; // Pole
      ctx.fillRect(18, 10, 4, 4); 
      
      ctx.save();
      ctx.translate(20, 12);
      // Windsock points AWAY from wind direction
      ctx.rotate((currentWindDir + 180) * (Math.PI / 180));
      
      // Length simulates droop: 10px if no wind, 40px at 30 knots
      const sockLength = 10 + (currentWindSpeed / 30) * 30;
      
      // Draw striped windsock (orange)
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(sockLength, -2);
      ctx.lineTo(sockLength, 2);
      ctx.lineTo(0, 5);
      ctx.fill();
      
      // White stripes
      ctx.fillStyle = '#ffffff';
      if (sockLength > 15) {
        ctx.beginPath(); ctx.moveTo(sockLength * 0.3, -4); ctx.lineTo(sockLength * 0.4, -3); ctx.lineTo(sockLength * 0.4, 3); ctx.lineTo(sockLength * 0.3, 4); ctx.fill();
        ctx.beginPath(); ctx.moveTo(sockLength * 0.7, -3); ctx.lineTo(sockLength * 0.8, -2); ctx.lineTo(sockLength * 0.8, 2); ctx.lineTo(sockLength * 0.7, 3); ctx.fill();
      }
      ctx.restore();

      ctx.restore();

      // Draw the ship
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
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
      
      ctx.restore();

      // Update UI HUD
      if (speedTextRef.current) {
        speedTextRef.current.innerText = (Math.abs(state.speed) * 10).toFixed(1) + ' kts';
      }
      if (compassTextRef.current || compassDialRef.current) {
        let deg = (state.heading * 180 / Math.PI) % 360;
        if (deg < 0) deg += 360;
        if (compassTextRef.current) compassTextRef.current.innerText = deg.toFixed(0).padStart(3, '0') + '°';
        if (compassDialRef.current) compassDialRef.current.style.transform = `rotate(${-deg}deg)`;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex-1 relative bg-slate-900 overflow-hidden w-full h-full">
      <div 
        className="absolute inset-0 cursor-crosshair"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
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
      <div className={`absolute top-6 right-0 transition-transform duration-300 z-20 flex ${envExpanded ? 'translate-x-0 pr-6' : 'translate-x-full'}`}>
        
        {/* Toggle Handle */}
        <button 
          onClick={() => setEnvExpanded(!envExpanded)}
          className="absolute -left-8 top-4 bg-slate-900/95 border-y border-l border-slate-700/80 w-8 h-12 flex items-center justify-center rounded-l-xl shadow-lg text-slate-400 hover:text-white backdrop-blur-md"
        >
          {envExpanded ? '▶' : '◀'}
        </button>

        <div className="bg-slate-900/95 border border-slate-700/80 p-5 rounded-xl shadow-2xl w-80 backdrop-blur-md">
          <h3 className="text-emerald-400 font-bold mb-4 border-b border-slate-800 pb-2 uppercase tracking-widest text-sm flex items-center justify-between">
            <span>Realism Settings</span>
            {damageEnabled && shipDamage > 0 && <span className="text-red-500 text-xs">DMG: {Math.round(shipDamage)}%</span>}
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
              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 font-mono outline-none"
            >
              <option value="zodiac">Zodiac (Fast, Agile)</option>
              <option value="patrol">Patrol Boat (Small)</option>
              <option value="corvette">Corvette (Military Medium)</option>
              <option value="frigate">Frigate (Military Large)</option>
            </select>
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

      {/* Modern Ship Control Panel */}
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
          transformOrigin: 'bottom center'
        }}
        className={`absolute bottom-8 left-1/2 bg-slate-800 border-2 border-slate-700 rounded-xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-4px_10px_rgba(0,0,0,0.5)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-20`}
      >
        {/* Panel Scale Buttons */}
        <div className="absolute top-2 left-10 text-[8px] text-slate-500 font-mono flex items-center gap-1 z-30" onMouseDown={e => e.stopPropagation()}>
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
        </div>

        {/* Panel details: Screws */}
        <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-45"></div></div>
        <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 -rotate-12"></div></div>
        <div className="absolute bottom-3 left-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-90"></div></div>
        <div className="absolute bottom-3 right-3 w-2.5 h-2.5 rounded-full bg-slate-600 shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.2)] flex items-center justify-center"><div className="w-full h-0.5 bg-slate-800 rotate-0"></div></div>

        {/* Top Label Plate */}
        <div className="flex justify-between items-start border-b border-slate-700 pb-3 px-2">
          <div>
            <h3 className="text-xs font-bold text-slate-300 tracking-widest font-mono">KONGSBERG</h3>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">AZIMUTH THRUSTER UNIT MK-IV</p>
          </div>
          
          {/* HUD Indicators */}
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
               <span className="text-[7px] text-slate-500 font-mono mb-1">SPEED</span>
               <div className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 min-w-[45px] text-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                 <span ref={speedTextRef} className="text-xs text-emerald-400 font-mono drop-shadow-[0_0_2px_rgba(52,211,153,0.5)]">0.0 kts</span>
               </div>
            </div>
            <div className="flex flex-col items-center">
               <span className="text-[7px] text-slate-500 font-mono mb-1">HEADING</span>
               <div className="bg-slate-950 border border-slate-700 rounded px-2 py-0.5 flex items-center gap-1.5 min-w-[55px] justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
                 <div className="w-2.5 h-2.5 rounded-full flex flex-col items-center relative bg-slate-800 border border-slate-600 overflow-hidden">
                   <div ref={compassDialRef} className="absolute inset-0">
                     <div className="w-0.5 h-1.5 bg-red-500 mx-auto"></div>
                   </div>
                 </div>
                 <span ref={compassTextRef} className="text-xs text-amber-400 font-mono drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]">000°</span>
               </div>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
              <span className="text-[7px] text-slate-400 font-mono">SYS OK</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8),inset_0_1px_2px_rgba(255,255,255,0.5)]"></div>
              <span className="text-[7px] text-slate-400 font-mono">MANUAL</span>
            </div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex gap-12 items-end px-4">
          
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
            <div className="bg-slate-950 border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] rounded p-2 w-24 text-center">
              <span className="text-xs text-slate-500 block mb-1 font-mono">THRUST</span>
              <span className={`text-xl font-mono ${throttle === 0 ? 'text-slate-500' : throttle > 0 ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]' : 'text-blue-400 drop-shadow-[0_0_5px_rgba(96,165,250,0.8)]'}`}>
                {throttle > 0 ? `+${throttle}` : throttle < 0 ? throttle : '00'}%
              </span>
            </div>
            
            <div className="relative w-16 h-48 bg-slate-900 rounded-lg border-x-4 border-y-8 border-slate-950 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex items-center justify-center">
              {/* Track ticks */}
              <div className="absolute inset-y-2 left-1 flex flex-col justify-between py-2">
                {[100, 50, 0, -50, -100].map(val => (
                  <div key={val} className="flex items-center gap-1">
                    <div className="w-1.5 h-0.5 bg-slate-700"></div>
                    <span className="text-[8px] font-mono text-slate-600">{val}</span>
                  </div>
                ))}
              </div>
              
              {/* Center marker */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-amber-500/30 -translate-y-1/2 z-0"></div>
              
              <input 
                type="range" 
                min="-100" 
                max="100" 
                value={throttle} 
                onChange={(e) => setThrottle(parseInt(e.target.value))}
                className="throttle-lever absolute w-48 h-2 -rotate-90 origin-center outline-none z-10 cursor-pointer" 
              />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Lever <span className="text-slate-500 font-normal">[Q/Z]</span></span>
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

            <div className="bg-slate-950 border border-slate-700 shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)] rounded p-2 w-32 text-center">
              <span className="text-xs text-slate-500 block mb-1 font-mono">HEADING CMD</span>
              <span className={`text-xl font-mono ${rudder === 0 ? 'text-slate-500' : 'text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]'}`}>
                {rudder > 0 ? "STBD " + rudder.toString().padStart(2, '0') : rudder < 0 ? "PORT " + Math.abs(rudder).toString().padStart(2, '0') : '00°'}
              </span>
            </div>
            
            {steeringMode === 'azimuth' ? (
              <div className="relative w-64 h-24 bg-slate-900 rounded-full border-[6px] border-slate-950 shadow-[inset_0_5px_15px_rgba(0,0,0,1)] flex items-center px-4 mt-6 mb-6">
                {/* Tick marks */}
                <div className="absolute inset-x-8 top-1 flex justify-between pointer-events-none">
                   {[-45, -30, -15, 0, 15, 30, 45].map(val => (
                      <div key={val} className="flex flex-col items-center">
                        <div className={`w-0.5 h-1.5 ${val === 0 ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                      </div>
                   ))}
                </div>

                <input 
                  type="range" 
                  min="-45" 
                  max="45" 
                  value={rudder} 
                  onChange={(e) => setRudder(parseInt(e.target.value))}
                  className="azimuth-knob w-full outline-none z-10 cursor-pointer" 
                />
              </div>
            ) : (
              <div 
                ref={wheelRef}
                className="steering-wheel-container relative w-36 h-36 mt-2 mb-2 rounded-full cursor-pointer touch-none"
                onMouseDown={(e) => { setIsTurningWheel(true); updateWheelAngle(e.clientX, e.clientY); }}
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
      </div>

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

    </div>
  );
}
