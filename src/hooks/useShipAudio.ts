import { useEffect, useRef } from 'react';

export interface UseShipAudioProps {
  simMode: 'ship' | 'heli';
  shipClass: string;
  throttle: number;
  engineSoundOn: boolean;
  heliSpeed: number;
  heliAltitude: number;
  musicPlaying: boolean;
}

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

export function useShipAudio({
  simMode,
  shipClass,
  throttle,
  engineSoundOn,
  heliSpeed,
  heliAltitude,
  musicPlaying
}: UseShipAudioProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const engineNodeRef = useRef<any>(null);
  const hornNodeRef = useRef<{ oscillators: OscillatorNode[], gainNode: GainNode } | null>(null);
  const musicTimeoutsRef = useRef<number[]>([]);
  const musicPlayingRef = useRef<boolean>(false);

  const getAudioContext = (): AudioContext => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const createNoiseBuffer = (ctx: AudioContext) => {
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  };

  const playBeep = (freq = 800, duration = 0.15) => {
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Audio error playing beep', e);
    }
  };

  const stopEngineSound = () => {
    if (engineNodeRef.current) {
      try {
        engineNodeRef.current.oscillators.forEach((osc: OscillatorNode) => {
          try { osc.stop(); } catch (e) {}
        });
        if (engineNodeRef.current.turboOsc) {
          try { engineNodeRef.current.turboOsc.stop(); } catch (e) {}
        }
        if (engineNodeRef.current.turbineOsc) {
          try { engineNodeRef.current.turbineOsc.stop(); } catch (e) {}
        }
        if (engineNodeRef.current.lfo) {
          try { engineNodeRef.current.lfo.stop(); } catch (e) {}
        }
        if (engineNodeRef.current.noiseSource) {
          try { engineNodeRef.current.noiseSource.stop(); } catch (e) {}
        }
        if (engineNodeRef.current.washSource) {
          try { engineNodeRef.current.washSource.stop(); } catch (e) {}
        }
        if (engineNodeRef.current.compressor) {
          try { engineNodeRef.current.compressor.disconnect(); } catch (e) {}
        }
      } catch (e) {}
      engineNodeRef.current = null;
    }
  };

  const updateEngineSound = () => {
    if (!engineSoundOn) {
      stopEngineSound();
      return;
    }
    try {
      const ctx = getAudioContext();
      
      let compressor = engineNodeRef.current?.compressor;
      if (!compressor) {
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-14, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(4, ctx.currentTime);
        compressor.attack.setValueAtTime(0.01, ctx.currentTime);
        compressor.release.setValueAtTime(0.15, ctx.currentTime);
        compressor.connect(ctx.destination);
      }

      if (simMode === 'heli') {
        if (!engineNodeRef.current || engineNodeRef.current.type !== 'heli') {
          stopEngineSound();
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          const filter = ctx.createBiquadFilter();
          
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = createNoiseBuffer(ctx);
          noiseSource.loop = true;
          const noiseFilter = ctx.createBiquadFilter();
          const noiseGain = ctx.createGain();
          
          const gainNode = ctx.createGain();

          osc1.type = 'sawtooth';
          osc2.type = 'sawtooth';
          lfo.type = 'sawtooth';

          osc1.connect(filter);
          filter.type = 'lowpass';
          filter.frequency.value = 250;
          filter.connect(gainNode);

          osc2.connect(gainNode);

          lfoGain.gain.value = 0.6;
          lfo.connect(lfoGain);
          lfoGain.connect(noiseGain.gain);

          noiseFilter.type = 'bandpass';
          noiseFilter.frequency.value = 180;
          noiseFilter.Q.value = 1.5;
          noiseSource.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(gainNode);

          const mainLfoGain = ctx.createGain();
          mainLfoGain.gain.value = 0.45;
          lfo.connect(mainLfoGain);
          mainLfoGain.connect(gainNode.gain);

          osc1.start();
          osc2.start();
          lfo.start();
          noiseSource.start();

          gainNode.connect(compressor);

          engineNodeRef.current = { 
            oscillators: [osc1, osc2], 
            lfo, 
            filter, 
            noiseSource, 
            noiseFilter, 
            noiseGain, 
            gainNode,
            compressor,
            type: 'heli'
          };
        }

        const speedRatio = heliSpeed / 30;
        const altRatio = heliAltitude / 100;
        const { oscillators, lfo, filter, noiseFilter, noiseGain, gainNode } = engineNodeRef.current;

        oscillators[0].frequency.setValueAtTime(120 + speedRatio * 90 + altRatio * 50, ctx.currentTime);
        oscillators[1].frequency.setValueAtTime(50 + speedRatio * 30, ctx.currentTime);
        if (lfo) {
          lfo.frequency.setValueAtTime(10 + speedRatio * 8, ctx.currentTime);
        }
        if (filter) {
          filter.frequency.setValueAtTime(250 + speedRatio * 150, ctx.currentTime);
        }
        if (noiseFilter) {
          noiseFilter.frequency.setValueAtTime(180 + speedRatio * 120, ctx.currentTime);
        }
        if (noiseGain) {
          noiseGain.gain.setValueAtTime(0.08 + speedRatio * 0.08, ctx.currentTime);
        }

        const targetGain = 0.07 + speedRatio * 0.09 + altRatio * 0.04;
        gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
        return;
      }

      if (simMode === 'ship') {
        if (!engineNodeRef.current || engineNodeRef.current.type !== 'ship' || engineNodeRef.current.shipClass !== shipClass) {
          stopEngineSound();

          const oscs: OscillatorNode[] = [];
          let turboOsc: OscillatorNode | undefined;
          let turbineOsc: OscillatorNode | undefined;
          let lfo: OscillatorNode | undefined;
          const filter = ctx.createBiquadFilter();
          const rumbleGain = ctx.createGain();
          const modulatorGain = ctx.createGain();
          const gainNode = ctx.createGain();

          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = createNoiseBuffer(ctx);
          noiseSource.loop = true;
          const noiseFilter = ctx.createBiquadFilter();
          const noiseGain = ctx.createGain();
          const bubblingModGain = ctx.createGain();

          const washSource = ctx.createBufferSource();
          washSource.buffer = createNoiseBuffer(ctx);
          washSource.loop = true;
          const washFilter = ctx.createBiquadFilter();
          const washGain = ctx.createGain();

          lfo = ctx.createOscillator();
          lfo.type = 'sawtooth';
          const lfoGain = ctx.createGain();
          lfo.connect(lfoGain);

          let turboGain: GainNode | undefined;
          let turbineGain: GainNode | undefined;

          rumbleGain.connect(modulatorGain);
          modulatorGain.connect(gainNode);
          
          noiseSource.connect(noiseFilter);
          noiseFilter.connect(noiseGain);
          noiseGain.connect(bubblingModGain);
          bubblingModGain.connect(gainNode);

          if (shipClass === 'zodiac') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc2.type = 'square';
            
            osc1.connect(filter);
            osc2.connect(filter);
            oscs.push(osc1, osc2);

            filter.type = 'lowpass';
            filter.frequency.value = 400;

            rumbleGain.gain.value = 0.55;
            
            lfoGain.gain.value = 0.15;
            modulatorGain.gain.value = 0.85;
            lfoGain.connect(modulatorGain.gain);
            lfoGain.connect(bubblingModGain.gain);
            bubblingModGain.gain.value = 0.7;

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 350;
            noiseFilter.Q.value = 1.0;

          } else if (shipClass === 'patrol') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            const osc4 = ctx.createOscillator();
            
            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc3.type = 'triangle';
            osc4.type = 'triangle';

            osc1.connect(filter);
            osc2.connect(filter);
            osc3.connect(filter);
            osc4.connect(filter);
            oscs.push(osc1, osc2, osc3, osc4);

            filter.type = 'lowpass';
            filter.frequency.value = 180;

            rumbleGain.gain.value = 0.45;

            lfoGain.gain.value = 0.2;
            modulatorGain.gain.value = 0.8;
            lfoGain.connect(modulatorGain.gain);

            turboOsc = ctx.createOscillator();
            turboOsc.type = 'sine';
            turboGain = ctx.createGain();
            turboGain.gain.value = 0.005;
            turboOsc.connect(turboGain);
            turboGain.connect(gainNode);

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 120;
            noiseFilter.Q.value = 1.2;
            lfoGain.connect(bubblingModGain.gain);
            bubblingModGain.gain.value = 0.7;

            washFilter.type = 'bandpass';
            washFilter.frequency.value = 250;
            washFilter.Q.value = 0.8;
            washSource.connect(washFilter);
            washFilter.connect(washGain);
            washGain.connect(gainNode);

          } else if (shipClass === 'corvette') {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();
            const osc4 = ctx.createOscillator();

            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc3.type = 'triangle';
            osc4.type = 'triangle';

            osc1.connect(filter);
            osc2.connect(filter);
            osc3.connect(filter);
            osc4.connect(filter);
            oscs.push(osc1, osc2, osc3, osc4);

            filter.type = 'lowpass';
            filter.frequency.value = 120;

            rumbleGain.gain.value = 0.50;

            lfoGain.gain.value = 0.25;
            modulatorGain.gain.value = 0.75;
            lfoGain.connect(modulatorGain.gain);

            turboOsc = ctx.createOscillator();
            turboOsc.type = 'sine';
            turboGain = ctx.createGain();
            turboGain.gain.value = 0.003;
            turboOsc.connect(turboGain);
            turboGain.connect(gainNode);

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 80;
            noiseFilter.Q.value = 1.5;
            lfoGain.connect(bubblingModGain.gain);
            bubblingModGain.gain.value = 0.65;

            washFilter.type = 'bandpass';
            washFilter.frequency.value = 180;
            washFilter.Q.value = 0.6;
            washSource.connect(washFilter);
            washFilter.connect(washGain);
            washGain.connect(gainNode);

          } else {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const osc3 = ctx.createOscillator();

            osc1.type = 'sawtooth';
            osc2.type = 'sawtooth';
            osc3.type = 'triangle';

            osc1.connect(filter);
            osc2.connect(filter);
            osc3.connect(filter);
            oscs.push(osc1, osc2, osc3);

            filter.type = 'lowpass';
            filter.frequency.value = 110;

            rumbleGain.gain.value = 0.45;

            lfoGain.gain.value = 0.2;
            modulatorGain.gain.value = 0.8;
            lfoGain.connect(modulatorGain.gain);

            turbineOsc = ctx.createOscillator();
            turbineOsc.type = 'sine';
            turbineGain = ctx.createGain();
            turbineGain.gain.value = 0.002;
            turbineOsc.connect(turbineGain);
            turbineGain.connect(gainNode);

            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.value = 90;
            noiseFilter.Q.value = 1.3;
            lfoGain.connect(bubblingModGain.gain);
            bubblingModGain.gain.value = 0.7;

            washFilter.type = 'bandpass';
            washFilter.frequency.value = 150;
            washFilter.Q.value = 0.5;
            washSource.connect(washFilter);
            washFilter.connect(washGain);
            washGain.connect(gainNode);
          }

          oscs.forEach(osc => osc.start());
          if (turboOsc) turboOsc.start();
          if (turbineOsc) turbineOsc.start();
          if (lfo) lfo.start();
          
          noiseSource.start();
          washSource.start();

          filter.connect(rumbleGain);
          gainNode.connect(compressor);

          engineNodeRef.current = {
            oscillators: oscs,
            turboOsc,
            turbineOsc,
            lfo,
            filter,
            rumbleGain,
            modulatorGain,
            bubblingModGain,
            noiseSource,
            noiseFilter,
            noiseGain,
            washSource,
            washFilter,
            washGain,
            gainNode,
            compressor,
            type: 'ship',
            shipClass,
            turboGain,
            turbineGain
          };
        }

        const absThrottle = Math.abs(throttle) / 100;
        const baseFreq = shipClass === 'zodiac' ? 65 : shipClass === 'patrol' ? 45 : shipClass === 'corvette' ? 32 : 26;
        const engineFreq = baseFreq + absThrottle * baseFreq * 1.5;

        const currentRef = engineNodeRef.current;
        const { oscillators, turboOsc, turbineOsc, lfo, filter, noiseFilter, noiseGain, washFilter, washGain, gainNode } = currentRef;

        if (shipClass === 'zodiac') {
          oscillators[0].frequency.setValueAtTime(engineFreq, ctx.currentTime);
          oscillators[1].frequency.setValueAtTime(engineFreq * 2.0, ctx.currentTime);
          if (lfo) lfo.frequency.setValueAtTime(8 + absThrottle * 22, ctx.currentTime);
          if (filter) filter.frequency.setValueAtTime(engineFreq * 3.5, ctx.currentTime);
          if (noiseFilter) noiseFilter.frequency.setValueAtTime(300 + absThrottle * 200, ctx.currentTime);
          if (noiseGain) noiseGain.gain.setValueAtTime(0.04 + absThrottle * 0.08, ctx.currentTime);
        } else if (shipClass === 'patrol') {
          oscillators[0].frequency.setValueAtTime(engineFreq, ctx.currentTime);
          oscillators[1].frequency.setValueAtTime(engineFreq * 0.992, ctx.currentTime);
          oscillators[2].frequency.setValueAtTime(engineFreq * 0.5, ctx.currentTime);
          oscillators[3].frequency.setValueAtTime(engineFreq * 0.992 * 0.5, ctx.currentTime);
          if (lfo) lfo.frequency.setValueAtTime(5 + absThrottle * 9, ctx.currentTime);
          if (filter) filter.frequency.setValueAtTime(engineFreq * 2.8, ctx.currentTime);
          
          if (turboOsc) {
            turboOsc.frequency.setValueAtTime(650 + absThrottle * 1400, ctx.currentTime);
            const tg = currentRef.turboGain;
            if (tg) tg.gain.setValueAtTime(Math.pow(absThrottle, 1.8) * 0.025, ctx.currentTime);
          }
          if (noiseFilter) noiseFilter.frequency.setValueAtTime(100 + absThrottle * 80, ctx.currentTime);
          if (noiseGain) noiseGain.gain.setValueAtTime(0.03 + absThrottle * 0.05, ctx.currentTime);
          if (washFilter) washFilter.frequency.setValueAtTime(200 + absThrottle * 150, ctx.currentTime);
          if (washGain) washGain.gain.setValueAtTime(0.02 + absThrottle * 0.08, ctx.currentTime);
        } else if (shipClass === 'corvette') {
          oscillators[0].frequency.setValueAtTime(engineFreq, ctx.currentTime);
          oscillators[1].frequency.setValueAtTime(engineFreq * 0.995, ctx.currentTime);
          oscillators[2].frequency.setValueAtTime(engineFreq * 0.5, ctx.currentTime);
          oscillators[3].frequency.setValueAtTime(engineFreq * 0.995 * 0.5, ctx.currentTime);
          if (lfo) lfo.frequency.setValueAtTime(4 + absThrottle * 7, ctx.currentTime);
          if (filter) filter.frequency.setValueAtTime(engineFreq * 2.2, ctx.currentTime);
          if (turboOsc) {
            turboOsc.frequency.setValueAtTime(400 + absThrottle * 800, ctx.currentTime);
            const tg = currentRef.turboGain;
            if (tg) tg.gain.setValueAtTime(Math.pow(absThrottle, 1.8) * 0.015, ctx.currentTime);
          }
          if (noiseFilter) noiseFilter.frequency.setValueAtTime(70 + absThrottle * 50, ctx.currentTime);
          if (noiseGain) noiseGain.gain.setValueAtTime(0.04 + absThrottle * 0.06, ctx.currentTime);
          if (washFilter) washFilter.frequency.setValueAtTime(150 + absThrottle * 100, ctx.currentTime);
          if (washGain) washGain.gain.setValueAtTime(0.03 + absThrottle * 0.09, ctx.currentTime);
        } else if (shipClass === 'frigate') {
          oscillators[0].frequency.setValueAtTime(engineFreq, ctx.currentTime);
          oscillators[1].frequency.setValueAtTime(engineFreq * 0.993, ctx.currentTime);
          oscillators[2].frequency.setValueAtTime(engineFreq * 0.5, ctx.currentTime);
          if (lfo) lfo.frequency.setValueAtTime(3.8 + absThrottle * 6.5, ctx.currentTime);
          if (filter) filter.frequency.setValueAtTime(engineFreq * 2.5, ctx.currentTime);
          if (turbineOsc) {
            turbineOsc.frequency.setValueAtTime(1000 + absThrottle * 2200, ctx.currentTime);
            const tg = currentRef.turbineGain;
            if (tg) tg.gain.setValueAtTime(Math.pow(absThrottle, 2.0) * 0.02, ctx.currentTime);
          }
          if (noiseFilter) noiseFilter.frequency.setValueAtTime(80 + absThrottle * 60, ctx.currentTime);
          if (noiseGain) noiseGain.gain.setValueAtTime(0.03 + absThrottle * 0.05, ctx.currentTime);
          if (washFilter) washFilter.frequency.setValueAtTime(120 + absThrottle * 120, ctx.currentTime);
          if (washGain) washGain.gain.setValueAtTime(0.04 + absThrottle * 0.11, ctx.currentTime);
        }

        const targetGain = 0.35 + absThrottle * 0.45;
        gainNode.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.1);
      }
    } catch (e) {
      console.error('Engine sound error', e);
    }
  };

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
      console.error('Error playing shanty notes', e);
    }
  };

  const stopMusic = () => {
    musicTimeoutsRef.current.forEach(t => clearTimeout(t));
    musicTimeoutsRef.current = [];
  };

  // React to engineSoundOn, simMode, shipClass, throttle, speeds, altitudes changes
  useEffect(() => {
    updateEngineSound();
    return () => stopEngineSound();
  }, [throttle, shipClass, simMode, engineSoundOn, heliSpeed, heliAltitude]);

  // React to musicPlaying state
  useEffect(() => {
    musicPlayingRef.current = musicPlaying;
    if (musicPlaying) {
      playShantyLoop(0);
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [musicPlaying]);

  return {
    playBeep,
    startHorn,
    stopHorn
  };
}
