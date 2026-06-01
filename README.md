# 🚢 Maritime Cadet Simulator

Welcome to the **Maritime Cadet Simulator**, a premium, interactive web-based simulator designed for cadet training and nautical enthusiasts. The simulator models realistic ship physics, environmental factors (wind, currents, daylight), advanced controls, and real-time procedural audio synthesis using the Web Audio API.

---

## 🌟 Key Features

### 1. Realistic Vessel Simulation
Choose from four distinct ship classes, each with authentic handling profiles, inertia, and visual scales:
*   **Zodiac Inflatable**: High agility, fast acceleration, Twin-Outboard engine profile.
*   **Patrol Boat**: Medium weight, twin diesels, balanced propulsion.
*   **Corvette Warship**: Twin shafts, massive displacement, slow response time.
*   **Frigate**: Large capital ship featuring CODAG (Combined Diesel and Gas Turbine) propulsion.

### 2. Helicopter Flight Mini-Game
Switch simulation modes from ship handler to helicopter pilot! Fly a Search and Rescue (SAR) helicopter with simulated altitude controls, cyclic pitch navigation, and real-time helipad landing trials.

### 3. Advanced Control Deck
*   **Split Azimuth Levers**: Independent port and starboard throttle settings.
*   **Dual Maneuvering Thrusters**: Independent bow thrusters and stern thrusters.
*   **Anchor System**: Fully operational anchor that halts vessel drift and pivots the ship on the tide.
*   **Popped-out Instrument Consoles**: Open settings panels and control consoles in secondary monitors/windows using React Portals with synchronized scaling.

### 4. Procedural Sound Engine (Web Audio API)
Generates high-fidelity engine and environmental sounds completely in real-time:
*   **Cylinder Firing Strokes**: Modulated LFO thumps that scale dynamically with engine RPM and throttle load.
*   **Twin-Engine Phasing Beats**: Detuned oscillator paths for twin-shaft vessels (Patrol Boat, Corvette, Frigate) to simulate signature engine room phasing.
*   **Exhaust Bubbling**: White noise passed through bandpass filters, modulated by cylinder stroke frequencies.
*   **Propeller Water Churn & Wake Wash**: Propeller wake splashing that scales in pitch and volume with actual underway speed and load.
*   **Turbocharger & Gas Turbine Whine**: Non-linear whistles (700Hz - 4.5kHz) that whistle under high-thrust loads.
*   **Safety Compressor**: A `DynamicsCompressorNode` operates as a final limiter, producing warm, saturated presence without digital speaker clipping.

### 5. Training Scenarios
Embark on structured training courses to test your navigation:
*   **Harbor Exit**: Navigate narrow channels out into the open sea.
*   **Mid-Channel Slalom**: Weave between port and starboard buoys.
*   **Final Docking Alignment**: Master tight turns to dock your vessel securely.

### 6. Auxiliary Maritime Modules
Enhance your nautical knowledge with built-in educational decks:
*   **Signal Flags & Alphabet**: Study international maritime flag signaling.
*   **Knot Tying Academy**: Step-by-step interactive diagrams for Bowline, Figure Eight, Reef Knot, Sheet Bend, Clove Hitch, and Round Turn.
*   **Marine Radio Comm Simulator**: Practice standard communication protocols under simulated distress (Mayday, Pan-Pan, Securite) scenarios.

---

## ⌨️ Control Deck Shortcuts

Interact directly with the controls using your keyboard:
*   `W` / `X` - Smoothly advance or retard Throttle
*   `S` - Quick throttle cutoff (0%)
*   `Left Arrow` / `Right Arrow` - Steer Rudder
*   `A` / `D` - Momentary Bow Thruster (Port / Starboard)
*   `Z` / `C` - Momentary Stern Thruster (Port / Starboard)
*   `H` - Sound ship's horn (tone depends on the active vessel's displacement)

---

## 🛠️ Developer Getting Started

To launch the simulator locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

### 3. Build for Production
```bash
npm run build
```

---

## 📂 Project Architecture

*   `src/components/ShipSim.tsx` - Core simulation physics loop, rendering canvas, and procedural Audio Synthesizer.
*   `src/components/ControlPortal.tsx` - React Portal integration managing secondary popped-out control windows and event forwarders.
*   `src/components/KnotsModule.tsx` - Knot tying training module.
*   `src/components/RadioGame.tsx` - VHF Radio distress communications trainer.
*   `src/components/FlagsGame.tsx` - Maritime flag identification board.
