import type { Course } from '../config/constants';

export const drawWaves = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camX: number,
  camY: number
) => {
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)'; // faint sky-blue waves
  ctx.lineWidth = 1.5;
  const waveSize = 100;
  const waveOffsetX = camX % waveSize;
  const waveOffsetY = camY % waveSize;
  const waveTime = Date.now() / 1000;

  for (let y = -waveOffsetY - waveSize; y < height + waveSize; y += waveSize * 0.5) {
    ctx.beginPath();
    for (let x = -waveOffsetX - waveSize; x < width + waveSize; x += waveSize) {
      const shift = Math.sin((x + y + waveTime * 50) * 0.02) * 10;
      if (x === -waveOffsetX - waveSize) {
        ctx.moveTo(x, y + shift);
      } else {
        ctx.quadraticCurveTo(x - waveSize / 2, y - 10 + shift, x, y + shift);
      }
    }
    ctx.stroke();
  }
};

export const drawIslands = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  islands: Array<{ points: number[][] }>,
  camX: number,
  camY: number
) => {
  islands.forEach(island => {
    ctx.save();
    ctx.translate(width / 2 - camX, height / 2 - camY);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    
    // Calculate center for scaling
    let cx = 0,
        cy = 0;
    island.points.forEach(p => { cx += p[0]; cy += p[1]; });
    cx /= island.points.length;
    cy /= island.points.length;
    
    const drawSmoothPoly = (points: number[][], scale: number = 1) => {
      ctx.beginPath();
      const scaledPoints = points.map(p => [cx + (p[0] - cx) * scale, cy + (p[1] - cy) * scale]);
      
      // Start at midpoint between last and first
      ctx.moveTo((scaledPoints[0][0] + scaledPoints[scaledPoints.length - 1][0]) / 2, 
                 (scaledPoints[0][1] + scaledPoints[scaledPoints.length - 1][1]) / 2);
                 
      for (let i = 0; i < scaledPoints.length; i++) {
        const next = scaledPoints[(i + 1) % scaledPoints.length];
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
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    island.points.forEach(p => {
      if (p[0] < minX) minX = p[0];
      if (p[0] > maxX) maxX = p[0];
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.35)'; // light yellow
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]); // reset
    
    ctx.restore();
  });
};

export const drawPasadenaLabels = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  labels: Array<{ name: string; x: number; y: number }>,
  camX: number,
  camY: number
) => {
  ctx.save();
  ctx.translate(width / 2 - camX, height / 2 - camY);
  
  labels.forEach(label => {
    // Draw a small icon/dot for the station
    ctx.fillStyle = '#f59e0b'; // Amber-500
    ctx.beginPath();
    ctx.arc(label.x, label.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Labeled text
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Draw subtle drop shadow text
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillText(label.name, label.x + 8, label.y + 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(label.name, label.x + 8, label.y);
  });

  ctx.restore();
};

export interface Particle {
  x: number;
  y: number;
  life: number;
  type?: 'wake' | 'smoke';
  vx?: number;
  vy?: number;
}

export const drawParticles = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  particles: Particle[],
  camX: number,
  camY: number
) => {
  particles.forEach(p => {
    if (p.type === 'smoke') {
      ctx.fillStyle = `rgba(148, 163, 184, ${p.life * 0.12})`;
      ctx.beginPath();
      ctx.arc(
        p.x - camX + width / 2,
        p.y - camY + height / 2,
        4 + (2.0 - p.life) * 14,
        0,
        Math.PI * 2
      );
      ctx.fill();
    } else {
      ctx.fillStyle = `rgba(255, 255, 255, ${p.life * 0.3})`;
      ctx.beginPath();
      ctx.arc(
        p.x - camX + width / 2,
        p.y - camY + height / 2,
        2 + (1.5 - p.life) * 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  });
};

export const drawBuoys = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  buoys: Array<{ id: string; x: number; y: number; type: 'port' | 'starboard' }>,
  camX: number,
  camY: number,
  draggingBuoyId: string | null,
  showPortBuoy: boolean,
  showStbdBuoy: boolean
) => {
  buoys.forEach(buoy => {
    if (buoy.type === 'port' && !showPortBuoy) return;
    if (buoy.type === 'starboard' && !showStbdBuoy) return;
    
    const screenX = buoy.x - camX + width / 2;
    const screenY = buoy.y - camY + height / 2;

    ctx.save();
    ctx.translate(screenX, screenY);
    
    if (draggingBuoyId === buoy.id) {
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
    }

    if (buoy.type === 'port') {
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-8, -10, 16, 20);
      ctx.strokeStyle = '#166534';
      ctx.strokeRect(-8, -10, 16, 20);
    } else if (buoy.type === 'starboard') {
      ctx.fillStyle = '#ef4444';
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
};

export const drawCustomBuoys = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  customBuoys: Array<{ x: number; y: number; color: 'yellow' | 'green' | 'red' }>,
  camX: number,
  camY: number
) => {
  customBuoys.forEach(buoy => {
    const screenX = buoy.x - camX + width / 2;
    const screenY = buoy.y - camY + height / 2;

    ctx.save();
    ctx.translate(screenX, screenY);
    
    const pulse = Math.sin(Date.now() / 200) * 4 + 8;
    ctx.strokeStyle = buoy.color === 'yellow'
      ? 'rgba(234, 179, 8, 0.4)'
      : buoy.color === 'green'
        ? 'rgba(34, 197, 94, 0.4)'
        : 'rgba(239, 68, 68, 0.4)';
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
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#a16207';
      ctx.stroke();
      
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-3, -11); ctx.lineTo(3, -7);
      ctx.moveTo(3, -11); ctx.lineTo(-3, -7);
      ctx.stroke();
    }

    ctx.restore();
  });
};

export const drawCourseGates = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  course: Course | null,
  camX: number,
  camY: number
) => {
  if (!course) return;

  course.gates.forEach((gate, idx) => {
    const x1 = gate.x1 - camX + width / 2;
    const y1 = gate.y1 - camY + height / 2;
    const x2 = gate.x2 - camX + width / 2;
    const y2 = gate.y2 - camY + height / 2;

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
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`GATE ${idx + 1}`, midX, midY - 12);
    ctx.restore();
  });
};

export const drawShip = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  shipClass: string,
  state: { x: number; y: number; heading: number; speed: number },
  anchorDropped: boolean,
  navLightsOn: boolean,
  whiteLightsOn: boolean,
  bowThruster: number,
  sternThruster: number
) => {
  const isZodiac = shipClass === 'zodiac';
  const isMilitary = shipClass === 'corvette' || shipClass === 'frigate';

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate(state.heading);

  if (isZodiac) {
    // Inflatable tubes
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#ef4444'; // Red tubes

    ctx.beginPath();
    ctx.arc(-8, -12, 5, Math.PI, Math.PI * 1.5);
    ctx.lineTo(8, -17);
    ctx.arc(8, -12, 5, Math.PI * 1.5, 0);
    ctx.lineTo(13, 20);
    ctx.arc(8, 20, 5, 0, Math.PI * 0.5);
    ctx.lineTo(-8, 25);
    ctx.arc(-8, 20, 5, Math.PI * 0.5, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#cbd5e1'; // Grey deck floor
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.lineTo(5, -12);
    ctx.lineTo(8, 20);
    ctx.lineTo(-8, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#64748b'; // Aft transom board
    ctx.fillRect(-8, 20, 16, 3);

    // Blower console
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(-3, 0, 6, 6);
    // Outboard motor
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-2, 20, 4, 4);

  } else if (isMilitary) {
    const lengthMultiplier = shipClass === 'frigate' ? 2.0 : 1.5;
    const bowY = -28 * lengthMultiplier;
    const sternY = 26 * lengthMultiplier;
    
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(0, bowY);
    ctx.bezierCurveTo(10, bowY + 10, 12, 0, 10, sternY);
    ctx.lineTo(-10, sternY);
    ctx.bezierCurveTo(-12, 0, -10, bowY + 10, 0, bowY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Helipad
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
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-0.5, heliY + 2, 1, 6);
      
      ctx.beginPath();
      ctx.fillRect(-2, heliY - 4, 4, 7);
      ctx.fill();
      
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
    ctx.fillRect(-6, -10, 12, 18 * lengthMultiplier);
    ctx.fill();
    
    // VLS / Forward deck gun
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(0, bowY + 15, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-0.5, bowY + 8, 1, 7);
  } else {
    // Standard Patrol Boat
    ctx.fillStyle = '#94a3b8';
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
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.fillRect(-8, -2, 16, 14);
    ctx.fill();
    
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.fillRect(-8, 15, 16, 9);
    ctx.fill();
  }

  // Draw deployed anchor
  if (anchorDropped) {
    ctx.save();
    const bowY = isMilitary ? -28 * (shipClass === 'frigate' ? 2.0 : 1.5) : -28;
    
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, bowY);
    ctx.lineTo(-12, bowY - 15);
    ctx.stroke();

    ctx.translate(-12, bowY - 15);
    ctx.rotate(-state.heading);
    
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
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
  ctx.fillRect(-0.5, 2, 1, 3);
  ctx.restore();
  
  // Navigation lights (Port & Starboard)
  if (navLightsOn) {
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.beginPath(); ctx.arc(-9, -15, 3, 0, Math.PI * 2); ctx.fill();
    
    ctx.fillStyle = '#22c55e';
    ctx.shadowColor = '#22c55e';
    ctx.beginPath(); ctx.arc(9, -15, 3, 0, Math.PI * 2); ctx.fill();
  }
  
  // White Lights (Masthead and Stern)
  if (whiteLightsOn) {
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.beginPath(); ctx.arc(0, 22, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 4, 3, 0, Math.PI * 2); ctx.fill();
  }
  
  // Side Thruster Visuals
  if (bowThruster !== 0 || sternThruster !== 0) {
    if (shipClass === 'corvette' || shipClass === 'frigate') {
       const lengthMultiplier = shipClass === 'frigate' ? 2.0 : 1.5;
       const bowY = -28 * lengthMultiplier;
       const sternY = 26 * lengthMultiplier;
       
       ctx.fillStyle = 'rgba(248, 250, 252, 0.8)';
       ctx.shadowBlur = 4;
       ctx.shadowColor = 'rgba(255,255,255,0.5)';
       
       if (bowThruster !== 0) {
          const intensity = Math.abs(bowThruster) / 100;
          const dir = bowThruster > 0 ? -1 : 1; 
          ctx.beginPath(); 
          ctx.arc(dir * 12, bowY + 20, 2 + intensity * 4, 0, Math.PI * 2); 
          ctx.fill();
       }
       if (sternThruster !== 0) {
          const intensity = Math.abs(sternThruster) / 100;
          const dir = sternThruster > 0 ? -1 : 1; 
          ctx.beginPath(); 
          ctx.arc(dir * 12, sternY - 20, 2 + intensity * 4, 0, Math.PI * 2); 
          ctx.fill();
       }
    }
  }

  ctx.restore();
};

export const drawHelicopter = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camX: number,
  camY: number,
  heliState: { x: number; y: number; altitude: number; heading: number; speed: number }
) => {
  ctx.save();
  const heliScreenX = heliState.x - camX + width / 2;
  const heliScreenY = heliState.y - camY + height / 2;
  
  ctx.translate(heliScreenX, heliScreenY);
  ctx.rotate(heliState.heading);
  
  // Shadow
  if (heliState.altitude > 0) {
     ctx.save();
     ctx.translate(heliState.altitude * 0.5, heliState.altitude * 0.5);
     ctx.fillStyle = 'rgba(0,0,0,0.3)';
     ctx.beginPath();
     ctx.fillRect(-4, -8, 8, 14);
     ctx.fill();
     ctx.restore();
  }
  
  // Helicopter body
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-1, 4, 2, 12); // tail boom
  
  ctx.beginPath();
  ctx.fillRect(-4, -8, 8, 14);
  ctx.fill();
  
  // Cockpit glass
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, -5, 3, Math.PI, 0);
  ctx.fill();
  
  // Spinning Main rotor
  ctx.save();
  ctx.translate(0, -1);
  const rotorSpeed = heliState.altitude > 0.1 ? 20 : 0;
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
};

export const drawMainland = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  camX: number,
  camY: number
) => {
  ctx.save();
  ctx.translate(width / 2 - camX + 500, height / 2 - camY + 50);
  
  ctx.beginPath();
  ctx.moveTo(250, -4000);
  for (let y = -4000; y <= 4000; y += 100) {
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
  ctx.strokeStyle = '#fcd34d'; // beach edge (amber-300 matches islands!)
  ctx.stroke();
  
  ctx.fillStyle = '#166534'; // green land (green-800 matches islands!)
  ctx.fill();
  
  ctx.restore();
};
