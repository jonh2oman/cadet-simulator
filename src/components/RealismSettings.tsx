import { useState, useEffect } from 'react';
import { useSimStore } from '../store/simStore';
import { SHIP_SPECS } from '../config/constants';
import { parseGeoJSONToIslands } from '../utils/mapLoader';

interface RealismSettingsProps {
  isPopped: boolean;
  setIsSettingsPoppedOut: (v: boolean) => void;
  customBuoysRef: React.MutableRefObject<Array<{ x: number; y: number; color: 'yellow' | 'green' | 'red' }>>;
  playBeep: (freq?: number, duration?: number) => void;
  shipState: React.MutableRefObject<{ x: number; y: number; heading: number; speed: number }>;
  setIslands: (islands: Array<{points: number[][]}>) => void;
}

export default function RealismSettings({ 
  isPopped, 
  setIsSettingsPoppedOut,
  customBuoysRef,
  playBeep,
  shipState,
  setIslands
}: RealismSettingsProps) {
  const {
    windSpeed, setWindSpeed,
    windDir, setWindDir,
    currentSpeed, setCurrentSpeed,
    currentDir, setCurrentDir,
    jettyType, setJettyType,
    shipClass, setShipClass,
    damageEnabled, setDamageEnabled,
    portMode,
    shipDamage,
    showPortBuoy, setShowPortBuoy,
    showStbdBuoy, setShowStbdBuoy
  } = useSimStore();

  const [customBuoyColor, setCustomBuoyColor] = useState<'yellow' | 'green' | 'red'>('yellow');

  // Custom GeoJSON Map States
  const [refLat, setRefLat] = useState<number>(49.2367); // Default to Deer Lake center
  const [refLon, setRefLon] = useState<number>(-122.9774);
  const [scaleMeters, setScaleMeters] = useState<number>(1.0);
  const [uploadedGeoJSON, setUploadedGeoJSON] = useState<any>(null);

  // Dynamic projection effect
  useEffect(() => {
    if (portMode === 'custom') {
      if (uploadedGeoJSON) {
        const customIslands = parseGeoJSONToIslands(uploadedGeoJSON, refLat, refLon, scaleMeters);
        setIslands(customIslands);
      } else {
        setIslands([]);
      }
    }
  }, [uploadedGeoJSON, refLat, refLon, scaleMeters, portMode]);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setUploadedGeoJSON(json);
        playBeep(880, 0.2);
      } catch (err) {
        console.error("Failed to parse GeoJSON", err);
        alert("Failed to parse GeoJSON file. Please check that it is valid JSON.");
        playBeep(220, 0.3);
      }
    };
    reader.readAsText(file);
  };

  const currentSpec = SHIP_SPECS[shipClass];

  return (
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
              className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[10px] uppercase font-bold tracking-wider transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)]"
              title="Pop out environmental controls"
            >
              Pop Out ↗
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
            <option value="patrol" disabled={portMode === 'pasadena'}>Patrol Boat {portMode === 'pasadena' && '(LOCKED)'}</option>
            <option value="corvette" disabled={portMode === 'pasadena'}>Corvette {portMode === 'pasadena' && '(LOCKED)'}</option>
            <option value="frigate" disabled={portMode === 'pasadena'}>Frigate {portMode === 'pasadena' && '(LOCKED)'}</option>
          </select>
          
          <div className="glass-panel-inner rounded-xl p-3 mt-2 text-xs font-mono">
            {currentSpec && (
              <>
                <div className="flex justify-between mb-1"><span className="text-slate-400">LOA:</span> <span className="text-emerald-400">{currentSpec.loa}</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">POWER:</span> <span className="text-amber-400">{currentSpec.power}</span></div>
                <div className="flex justify-between mb-1"><span className="text-slate-400">TOP SPEED:</span> <span className="text-blue-400">{currentSpec.topSpeed}</span></div>
                <div className="mt-2 text-slate-300">{currentSpec.description}</div>
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
              Starboard (Red)
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

        {/* Custom GeoJSON Map section */}
        {portMode === 'custom' && (
          <>
            <div className="h-px w-full bg-slate-800 my-2"></div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-3">
              <div className="text-xs text-slate-400 font-mono border-b border-slate-900 pb-1 uppercase tracking-widest font-bold">
                🗺️ Custom Map GeoJSON
              </div>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">REFERENCE LATITUDE</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  value={refLat} 
                  onChange={(e) => setRefLat(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">REFERENCE LONGITUDE</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  value={refLon} 
                  onChange={(e) => setRefLon(parseFloat(e.target.value) || 0)} 
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 font-mono outline-none"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
                  <span>SCALE MULTIPLIER</span>
                  <span className="text-emerald-400">{scaleMeters.toFixed(1)}x</span>
                </div>
                <input 
                  type="range" 
                  min="0.1" 
                  max="5.0" 
                  step="0.1" 
                  value={scaleMeters} 
                  onChange={(e) => setScaleMeters(parseFloat(e.target.value))} 
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-mono mb-1">CHOOSE FILE</label>
                <input 
                  type="file" 
                  accept=".json,.geojson" 
                  onChange={handleFileChange} 
                  className="w-full text-xs text-slate-400 font-mono file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700 cursor-pointer"
                />
              </div>
            </div>
          </>
        )}

        {/* Realism toggles */}
        <div className="h-px w-full bg-slate-800 my-2"></div>
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer mb-2">
            <input type="checkbox" checked={damageEnabled} onChange={e => setDamageEnabled(e.target.checked)} className="accent-red-500 w-4 h-4" />
            Enable Structural Damage
          </label>
        </div>
      </div>
    </div>
  );
}
