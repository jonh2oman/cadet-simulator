// Web Worker for Cadet Simulator Physics Calculations

interface ShipState {
  x: number;
  y: number;
  heading: number;
  speed: number;
}

interface ShipCoefficients {
  windage: number;
  draft: number;
}

const SHIP_COEFFICIENTS: Record<string, ShipCoefficients> = {
  zodiac: { windage: 1.5, draft: 0.4 },
  patrol: { windage: 1.0, draft: 1.0 },
  corvette: { windage: 1.2, draft: 1.3 },
  frigate: { windage: 1.6, draft: 1.8 }
};

let state: ShipState = { x: 460, y: 150, heading: 0, speed: 0 };
let prevPos = { x: 460, y: 150 };

// Helm inputs
let throttle = 0;
let rudder = 0;
let bowThruster = 0;
let sternThruster = 0;

// Environment inputs
let windSpeed = 0;
let windDir = 0;
let currentSpeed = 0;
let currentDir = 90;
let portMode: 'home' | 'random' | 'pasadena' | 'custom' = 'home';
let shipClass = 'patrol';
let damageEnabled = false;
let anchorDropped = false;
let isDocked = false;
let snapX = 460;
let snapY = 150;
let snapH = 0;

// Checkpoint gates and islands
interface Gate {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  passed: boolean;
}
let gates: Gate[] = [];
let islands: { points: number[][] }[] = [];

// Helper check segment intersection
const checkIntersection = (
  p0_x: number, p0_y: number, p1_x: number, p1_y: number,
  p2_x: number, p2_y: number, p3_x: number, p3_y: number
) => {
  const s1_x = p1_x - p0_x;
  const s1_y = p1_y - p0_y;
  const s2_x = p3_x - p2_x;
  const s2_y = p3_y - p2_y;

  const denom = -s2_x * s1_y + s1_x * s2_y;
  if (Math.abs(denom) < 0.0001) return false;

  const s = (-s1_y * (p0_x - p2_x) + s1_x * (p0_y - p2_y)) / denom;
  const t = (s2_x * (p0_y - p2_y) - s2_y * (p0_x - p2_x)) / denom;

  return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
};

// Physics tick interval
let tickIntervalId: any = null;

const startPhysicsTick = () => {
  if (tickIntervalId) clearInterval(tickIntervalId);
  
  const dt = 1 / 60; // 60Hz tick rate
  
  tickIntervalId = setInterval(() => {
    // 1. Determine coefficients
    let inertia = 1;
    let turnInertia = 1;
    let visualScale = 1.5625;
    let maxSpeedMultiplier = 0.35;
    
    if (shipClass === 'zodiac') {
      inertia = 1.8;
      turnInertia = 2.0;
      visualScale = 0.78125;
      maxSpeedMultiplier = 0.40;
    } else if (shipClass === 'corvette') {
      inertia = 0.5;
      turnInertia = 0.25;
      visualScale = 1.875;
      maxSpeedMultiplier = 0.28;
    } else if (shipClass === 'frigate') {
      inertia = 0.25;
      turnInertia = 0.10;
      visualScale = 2.8125;
      maxSpeedMultiplier = 0.30;
    }

    const shipRadius = 12 * visualScale;
    const coeffs = SHIP_COEFFICIENTS[shipClass] || { windage: 1.0, draft: 1.0 };

    // 2. Compute Target Speeds & Acceleration
    const targetSpeed = (throttle / 10) * maxSpeedMultiplier; 
    state.speed += (targetSpeed - state.speed) * dt * 0.5 * inertia;

    // Turning based on rudder
    if (Math.abs(state.speed) > 0.1) {
      const turnRate = (rudder / 45) * Math.min(Math.abs(state.speed), 5) * 0.2 * turnInertia;
      state.heading += (state.speed > 0 ? turnRate : -turnRate) * dt;
    }

    // Side thrusters for larger ships
    let lateralDx = 0;
    let lateralDy = 0;
    if (shipClass === 'corvette' || shipClass === 'frigate') {
      const bowT = bowThruster / 100;
      const sternT = sternThruster / 100;
      
      const thrusterEfficiency = Math.max(0, 1 - Math.abs(state.speed) / 5);
      const thrusterTurnRate = (bowT - sternT) * 0.06 * turnInertia * thrusterEfficiency;
      state.heading += thrusterTurnRate * dt;
      
      const lateralDrift = (bowT + sternT) * 0.5 * thrusterEfficiency;
      const perpRad = state.heading + Math.PI / 2;
      lateralDx = Math.sin(perpRad) * lateralDrift;
      lateralDy = -Math.cos(perpRad) * lateralDrift;
    }

    // Docked override
    if (isDocked) {
      state.speed = 0;
      state.x = snapX;
      state.y = snapY;
      state.heading = snapH;
    }

    // Calculate environmental drift (windage / draft scaled by mass inertia)
    const windRad = (windDir + 180) * (Math.PI / 180);
    const windForce = anchorDropped ? 0 : (windSpeed / 30) * 3 * (coeffs.windage / inertia);
    const windDx = Math.sin(windRad) * windForce;
    const windDy = -Math.cos(windRad) * windForce;

    const currentRad = currentDir * (Math.PI / 180);
    const currentForce = anchorDropped ? 0 : (currentSpeed / 5) * 4 * (coeffs.draft / inertia);
    const currentDx = Math.sin(currentRad) * currentForce;
    const currentDy = -Math.cos(currentRad) * currentForce;

    if (anchorDropped) {
      state.speed *= 0.92;
    }

    // Update proposed position
    const newX = state.x + (Math.sin(state.heading) * state.speed * 10 + windDx * 10 + currentDx * 10 + lateralDx * 10) * dt;
    const newY = state.y - (Math.cos(state.heading) * state.speed * 10 - windDy * 10 - currentDy * 10 - lateralDy * 10) * dt;

    // 3. Collision Checks
    let collision = false;
    let jettyRects: { x: number, y: number, w: number, h: number }[] = [];
    const dockWorldX = 500;
    const dockWorldY = 50;

    let berthZone = { x: -80, y: 20, w: 70, h: 160, snapX: 460, snapY: 150, snapH: 0 };

    if (portMode === 'pasadena') {
      jettyRects = [
        { x: -130, y: 45, w: 20, h: 155 },
        { x: 110, y: 45, w: 20, h: 155 },
        { x: -35, y: 80, w: 8, h: 80 },
        { x: 27, y: 80, w: 8, h: 80 }
      ];
      berthZone = { x: -27, y: 80, w: 54, h: 80, snapX: 500, snapY: 120, snapH: 0 };
    } else {
      // Build dynamic jetty rects for main maps based on type (simulated)
      // Since jettyType can change, we build custom lists
      jettyRects = [{ x: 0, y: 0, w: 40, h: 200 }, { x: 40, y: 80, w: 210, h: 40 }]; // Default straight
    }

    // Check jetty bounding boxes
    for (const rect of jettyRects) {
      const testX = Math.max(dockWorldX + rect.x, Math.min(newX, dockWorldX + rect.x + rect.w));
      const testY = Math.max(dockWorldY + rect.y, Math.min(newY, dockWorldY + rect.y + rect.h));
      const dist = Math.hypot(newX - testX, newY - testY);
      if (dist <= shipRadius) { collision = true; break; }
    }

    // Island & Mainland hitboxes
    if (!collision) {
      if (portMode === 'pasadena') {
        const minChannelY = -newX - 1500 + shipRadius;
        let maxChannelY = -newX + 2200;
        if (newX >= 600 && newX <= 800) {
          const ratio = (newX - 600) / 200;
          maxChannelY = ratio * (-newX + 2200) + (1 - ratio) * 250;
        } else if (newX >= 400 && newX < 600) {
          maxChannelY = 250;
        } else if (newX >= 200 && newX < 400) {
          const ratio = (400 - newX) / 200;
          maxChannelY = ratio * (-newX + 2200) + (1 - ratio) * 250;
        }
        maxChannelY -= shipRadius;

        if (newY <= minChannelY || newY >= maxChannelY) {
          collision = true;
        }
      } else if (portMode === 'custom') {
        // Dynamic map, skip the default right-hand wall boundary check!
        for (const island of islands) {
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          island.points.forEach(p => {
            if (p[0] < minX) minX = p[0]; if (p[0] > maxX) maxX = p[0];
            if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1];
          });
          const testX = Math.max(minX, Math.min(newX, maxX));
          const testY = Math.max(minY, Math.min(newY, maxY));
          if (Math.hypot(newX - testX, newY - testY) <= shipRadius) { collision = true; break; }
        }
      } else {
        if (newX > dockWorldX + 250 - shipRadius) {
          collision = true;
        } else {
          for (const island of islands) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
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
    }

    let collisionImpact = 0;
    if (collision) {
      collisionImpact = Math.abs(state.speed);
      state.speed = -state.speed * 0.4;
    } else {
      state.x = newX;
      state.y = newY;
    }

    // 4. Check Berthing Zone (Tying up availability)
    let isTieUpAvailable = false;
    if (!isDocked) {
      const inZoneX = state.x >= dockWorldX + berthZone.x && state.x <= dockWorldX + berthZone.x + berthZone.w;
      const inZoneY = state.y >= dockWorldY + berthZone.y && state.y <= dockWorldY + berthZone.y + berthZone.h;
      const speedOk = Math.abs(state.speed) < 0.5;
      isTieUpAvailable = inZoneX && inZoneY && speedOk;
      
      if (isTieUpAvailable) {
        snapX = berthZone.snapX;
        snapY = berthZone.snapY;
        snapH = berthZone.snapH;
      }
    }

    // 5. Track course checkpoints gate crossing
    let crossedGateIndex = -1;
    const nextGateIndex = gates.findIndex(g => !g.passed);
    if (nextGateIndex !== -1) {
      const gate = gates[nextGateIndex];
      if (checkIntersection(prevPos.x, prevPos.y, state.x, state.y, gate.x1, gate.y1, gate.x2, gate.y2)) {
        crossedGateIndex = nextGateIndex;
        gates[nextGateIndex].passed = true;
      }
    }

    prevPos = { x: state.x, y: state.y };

    // 6. Post back current state to main thread
    self.postMessage({
      type: 'physics_update',
      payload: {
        x: state.x,
        y: state.y,
        heading: state.heading,
        speed: state.speed,
        collision,
        collisionImpact,
        canTieUp: isTieUpAvailable,
        crossedGateIndex,
        snapX,
        snapY,
        snapH
      }
    });

  }, 1000 / 60);
};

// Event handlers
self.onmessage = (e) => {
  const { type, payload } = e.data;
  
  switch (type) {
    case 'init':
      state = {
        x: payload.x,
        y: payload.y,
        heading: payload.heading || 0,
        speed: payload.speed || 0
      };
      prevPos = { x: state.x, y: state.y };
      shipClass = payload.shipClass || 'patrol';
      portMode = payload.portMode || 'home';
      isDocked = payload.isDocked || false;
      snapX = payload.snapX || 460;
      snapY = payload.snapY || 150;
      snapH = payload.snapH || 0;
      startPhysicsTick();
      break;
      
    case 'update_inputs':
      throttle = payload.throttle !== undefined ? payload.throttle : throttle;
      rudder = payload.rudder !== undefined ? payload.rudder : rudder;
      bowThruster = payload.bowThruster !== undefined ? payload.bowThruster : bowThruster;
      sternThruster = payload.sternThruster !== undefined ? payload.sternThruster : sternThruster;
      windSpeed = payload.windSpeed !== undefined ? payload.windSpeed : windSpeed;
      windDir = payload.windDir !== undefined ? payload.windDir : windDir;
      currentSpeed = payload.currentSpeed !== undefined ? payload.currentSpeed : currentSpeed;
      currentDir = payload.currentDir !== undefined ? payload.currentDir : currentDir;
      shipClass = payload.shipClass !== undefined ? payload.shipClass : shipClass;
      portMode = payload.portMode !== undefined ? payload.portMode : portMode;
      damageEnabled = payload.damageEnabled !== undefined ? payload.damageEnabled : damageEnabled;
      anchorDropped = payload.anchorDropped !== undefined ? payload.anchorDropped : anchorDropped;
      isDocked = payload.isDocked !== undefined ? payload.isDocked : isDocked;
      if (payload.snapX !== undefined) snapX = payload.snapX;
      if (payload.snapY !== undefined) snapY = payload.snapY;
      if (payload.snapH !== undefined) snapH = payload.snapH;
      break;
      
    case 'set_islands':
      islands = payload.islands || [];
      break;
      
    case 'start_course':
      gates = (payload.gates || []).map((g: any) => ({ ...g, passed: false }));
      break;
      
    case 'reset_position':
      state.x = payload.x;
      state.y = payload.y;
      state.heading = payload.heading || 0;
      state.speed = payload.speed || 0;
      prevPos = { x: state.x, y: state.y };
      isDocked = payload.isDocked !== undefined ? payload.isDocked : isDocked;
      if (payload.snapX !== undefined) snapX = payload.snapX;
      if (payload.snapY !== undefined) snapY = payload.snapY;
      if (payload.snapH !== undefined) snapH = payload.snapH;
      break;
      
    case 'stop':
      if (tickIntervalId) {
        clearInterval(tickIntervalId);
        tickIntervalId = null;
      }
      break;
  }
};
