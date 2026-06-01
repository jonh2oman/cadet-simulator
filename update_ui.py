with open("src/components/ShipSim.tsx", "r") as f:
    content = f.read()

# 1. Update puck tracking
render_hook = """      if (compassCardRef.current) compassCardRef.current.style.transform = `rotate(${-deg}deg)`;;
      }

      animationFrameId = requestAnimationFrame(render);"""

render_hook_new = """      if (compassCardRef.current) compassCardRef.current.style.transform = `rotate(${-deg}deg)`;;
      }

      const cyclicPuck = document.getElementById('cyclic-puck');
      if (cyclicPuck && controlsRef.current.simMode === 'heli') {
        const cx = (heliControlsRef.current.cyclicX / 100) * 72; 
        const cy = (heliControlsRef.current.cyclicY / 100) * 72;
        cyclicPuck.style.transform = `translate(${cx}px, ${cy}px)`;
      }

      animationFrameId = requestAnimationFrame(render);"""

content = content.replace(render_hook, render_hook_new)

# 2. Hide ship control panel using CSS display
ship_panel_str = """      {/* Modern Ship Control Panel */}
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
          transformOrigin: 'bottom center'
        }}"""

ship_panel_new = """      {/* Modern Ship Control Panel */}
      <div 
        onMouseDown={handleMouseDown}
        style={{ 
          transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
          transformOrigin: 'bottom center',
          display: simMode === 'ship' ? 'flex' : 'none'
        }}"""

content = content.replace(ship_panel_str, ship_panel_new)

# 3. Insert Heli UI and Mission Accomplished right before Welcome Screen
heli_ui = """      {simMode === 'heli' && (
        <div 
          onMouseDown={handleMouseDown}
          style={{ 
            transform: `translate(calc(-50% + ${panelPos.x}px), ${panelPos.y}px) scale(${panelScale})`,
            transformOrigin: 'bottom center'
          }}
          className={`absolute bottom-8 left-1/2 bg-slate-800 border-2 border-slate-700 rounded-xl p-6 flex flex-col gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-4px_10px_rgba(0,0,0,0.5)] ${isDragging ? 'cursor-grabbing' : 'cursor-grab'} z-20`}
        >
          <div className="flex justify-between items-start border-b border-slate-700 pb-3 px-2">
            <div>
              <h3 className="text-xs font-bold text-slate-300 tracking-widest font-mono">BELL FLIGHT SYSTEMS</h3>
              <p className="text-[9px] text-slate-500 font-mono tracking-widest mt-0.5">HELI-OPS FLIGHT CONTROLS</p>
            </div>
            <button 
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => {
                setSimMode('ship');
              }}
              className="px-3 py-1 font-mono text-[9px] font-bold uppercase tracking-widest rounded border transition-all mr-2 bg-red-900/50 text-red-400 border-red-700 hover:bg-red-800 hover:text-white"
            >
              RETURN TO SHIP
            </button>
          </div>

          <div className="flex gap-12 items-end px-4">
             <div className="flex flex-col items-center justify-end" onMouseDown={e => e.stopPropagation()}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">COLLECTIVE</span>
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={heliCollective}
                  onChange={(e) => setHeliCollective(parseInt(e.target.value))}
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' } as any}
                  className="w-8 h-48 accent-emerald-500 cursor-pointer"
                />
             </div>
             <div className="flex flex-col items-center justify-center" onMouseDown={e => e.stopPropagation()}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">CYCLIC</span>
                <div 
                  className="w-48 h-48 bg-slate-900 rounded-full border-[6px] border-slate-700 relative overflow-hidden shadow-inner flex items-center justify-center cursor-crosshair"
                  onMouseMove={(e) => {
                     if (e.buttons === 1) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left - 96; 
                        const y = e.clientY - rect.top - 96;
                        heliControlsRef.current.cyclicX = Math.max(-100, Math.min(100, (x / 96) * 100));
                        heliControlsRef.current.cyclicY = Math.max(-100, Math.min(100, (y / 96) * 100));
                     }
                  }}
                  onMouseUp={() => {
                     heliControlsRef.current.cyclicX = 0;
                     heliControlsRef.current.cyclicY = 0;
                  }}
                  onMouseLeave={() => {
                     heliControlsRef.current.cyclicX = 0;
                     heliControlsRef.current.cyclicY = 0;
                  }}
                >
                   <div className="absolute w-full h-0.5 bg-slate-800"></div>
                   <div className="absolute h-full w-0.5 bg-slate-800"></div>
                   <div id="cyclic-puck" className="w-12 h-12 bg-emerald-500 rounded-full absolute shadow-lg border-2 border-white pointer-events-none transition-transform duration-75"></div>
                </div>
             </div>
             <div className="flex flex-col items-center justify-end" onMouseDown={e => e.stopPropagation()}>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">YAW (PEDALS)</span>
                <input 
                  type="range"
                  min="-100"
                  max="100"
                  value={heliPedals}
                  onChange={(e) => setHeliPedals(parseInt(e.target.value))}
                  onMouseUp={() => setHeliPedals(0)}
                  onMouseLeave={() => setHeliPedals(0)}
                  className="w-48 h-8 accent-amber-500 cursor-pointer"
                />
             </div>
          </div>
        </div>
      )}

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

      {/* Welcome Screen Overlay */}"""

content = content.replace("      {/* Welcome Screen Overlay */}", heli_ui)

with open("src/components/ShipSim.tsx", "w") as f:
    f.write(content)

