import { create } from 'zustand';

export interface SimState {
  throttle: number;
  rudder: number;
  bowThruster: number;
  sternThruster: number;
  navLightsOn: boolean;
  whiteLightsOn: boolean;
  anchorDropped: boolean;
  windSpeed: number;
  windDir: number;
  currentSpeed: number;
  currentDir: number;
  jettyType: string;
  shipClass: string;
  damageEnabled: boolean;
  portMode: 'home' | 'random' | 'pasadena';
  isDocked: boolean;
  simMode: 'ship' | 'heli';
  engineSoundOn: boolean;
  shipDamage: number;
}

type StateSetter<T> = T | ((prev: T) => T);

interface SimStore extends SimState {
  setThrottle: (v: StateSetter<number>) => void;
  setRudder: (v: StateSetter<number>) => void;
  setBowThruster: (v: StateSetter<number>) => void;
  setSternThruster: (v: StateSetter<number>) => void;
  setNavLightsOn: (v: StateSetter<boolean>) => void;
  setWhiteLightsOn: (v: StateSetter<boolean>) => void;
  setAnchorDropped: (v: StateSetter<boolean>) => void;
  setWindSpeed: (v: StateSetter<number>) => void;
  setWindDir: (v: StateSetter<number>) => void;
  setCurrentSpeed: (v: StateSetter<number>) => void;
  setCurrentDir: (v: StateSetter<number>) => void;
  setJettyType: (v: StateSetter<string>) => void;
  setShipClass: (v: StateSetter<string>) => void;
  setDamageEnabled: (v: StateSetter<boolean>) => void;
  setPortMode: (v: StateSetter<'home' | 'random' | 'pasadena'>) => void;
  setIsDocked: (v: StateSetter<boolean>) => void;
  setSimMode: (v: StateSetter<'ship' | 'heli'>) => void;
  setEngineSoundOn: (v: StateSetter<boolean>) => void;
  setShipDamage: (v: StateSetter<number>) => void;
  updateState: (payload: Partial<SimState>) => void;
}

// Named channel for tab-to-tab or portal window syncing
const bc = new BroadcastChannel('cadet_sim_channel');

export const useSimStore = create<SimStore>((set, get) => {
  // Listen for synchronization updates from other contexts
  bc.onmessage = (event) => {
    const { type, payload } = event.data;
    if (type === 'sync_state') {
      set(payload);
    }
  };

  const sync = (newState: Partial<SimState>) => {
    bc.postMessage({ type: 'sync_state', payload: newState });
  };

  const resolve = <T>(val: StateSetter<T>, current: T): T => {
    return typeof val === 'function' ? (val as Function)(current) : val;
  };

  return {
    throttle: 0,
    rudder: 0,
    bowThruster: 0,
    sternThruster: 0,
    navLightsOn: true,
    whiteLightsOn: true,
    anchorDropped: false,
    windSpeed: 0,
    windDir: 0,
    currentSpeed: 0,
    currentDir: 90,
    jettyType: 'straight',
    shipClass: 'patrol',
    damageEnabled: false,
    portMode: 'home',
    isDocked: false,
    simMode: 'ship',
    engineSoundOn: true,
    shipDamage: 0,

    setThrottle: (val) => {
      const throttle = resolve(val, get().throttle);
      set({ throttle });
      sync({ throttle });
    },
    setRudder: (val) => {
      const rudder = resolve(val, get().rudder);
      set({ rudder });
      sync({ rudder });
    },
    setBowThruster: (val) => {
      const bowThruster = resolve(val, get().bowThruster);
      set({ bowThruster });
      sync({ bowThruster });
    },
    setSternThruster: (val) => {
      const sternThruster = resolve(val, get().sternThruster);
      set({ sternThruster });
      sync({ sternThruster });
    },
    setNavLightsOn: (val) => {
      const navLightsOn = resolve(val, get().navLightsOn);
      set({ navLightsOn });
      sync({ navLightsOn });
    },
    setWhiteLightsOn: (val) => {
      const whiteLightsOn = resolve(val, get().whiteLightsOn);
      set({ whiteLightsOn });
      sync({ whiteLightsOn });
    },
    setAnchorDropped: (val) => {
      const anchorDropped = resolve(val, get().anchorDropped);
      set({ anchorDropped });
      sync({ anchorDropped });
    },
    setWindSpeed: (val) => {
      const windSpeed = resolve(val, get().windSpeed);
      set({ windSpeed });
      sync({ windSpeed });
    },
    setWindDir: (val) => {
      const windDir = resolve(val, get().windDir);
      set({ windDir });
      sync({ windDir });
    },
    setCurrentSpeed: (val) => {
      const currentSpeed = resolve(val, get().currentSpeed);
      set({ currentSpeed });
      sync({ currentSpeed });
    },
    setCurrentDir: (val) => {
      const currentDir = resolve(val, get().currentDir);
      set({ currentDir });
      sync({ currentDir });
    },
    setJettyType: (val) => {
      const jettyType = resolve(val, get().jettyType);
      set({ jettyType });
      sync({ jettyType });
    },
    setShipClass: (val) => {
      const shipClass = resolve(val, get().shipClass);
      set({ shipClass });
      sync({ shipClass });
    },
    setDamageEnabled: (val) => {
      const damageEnabled = resolve(val, get().damageEnabled);
      set({ damageEnabled });
      sync({ damageEnabled });
    },
    setPortMode: (val) => {
      const portMode = resolve(val, get().portMode);
      set({ portMode });
      sync({ portMode });
    },
    setIsDocked: (val) => {
      const isDocked = resolve(val, get().isDocked);
      set({ isDocked });
      sync({ isDocked });
    },
    setSimMode: (val) => {
      const simMode = resolve(val, get().simMode);
      set({ simMode });
      sync({ simMode });
    },
    setEngineSoundOn: (val) => {
      const engineSoundOn = resolve(val, get().engineSoundOn);
      set({ engineSoundOn });
      sync({ engineSoundOn });
    },
    setShipDamage: (val) => {
      const shipDamage = resolve(val, get().shipDamage);
      set({ shipDamage });
      sync({ shipDamage });
    },

    updateState: (payload) => {
      set(payload);
      sync(payload);
    }
  };
});
