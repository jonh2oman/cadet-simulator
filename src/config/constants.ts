export interface CourseGate {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  passed: boolean;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  gates: CourseGate[];
  berthRequired: boolean;
}

export const PREMADE_COURSES: Course[] = [
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

export interface ShipSpec {
  loa: string;
  power: string;
  topSpeed: string;
  description: string;
  visualScale: number;
}

export const SHIP_SPECS: Record<string, ShipSpec> = {
  zodiac: {
    loa: '5 meters',
    power: '150 HP',
    topSpeed: '40+ knots',
    description: 'Fast, highly agile inflatable boat with single outboard motor. Instant response time.',
    visualScale: 0.78125
  },
  patrol: {
    loa: '24 meters',
    power: '3,000 HP',
    topSpeed: '35 knots',
    description: 'Standard patrol craft with twin azimuth thrusters. Highly maneuverable, low inertia.',
    visualScale: 1.5625
  },
  corvette: {
    loa: '85 meters',
    power: '20,000 HP',
    topSpeed: '28 knots',
    description: 'Medium military vessel. Moderate inertia. Equipped with Bow Thruster.',
    visualScale: 1.875
  },
  frigate: {
    loa: '135 meters',
    power: '45,000 HP',
    topSpeed: '30 knots',
    description: 'Large military vessel. High inertia. Equipped with Bow & Stern Thrusters, and Helipad.',
    visualScale: 2.8125
  }
};

export interface PasadenaLabel {
  name: string;
  x: number;
  y: number;
}

export const PASADENA_LABELS: PasadenaLabel[] = [
  { name: 'LITTLE RAPIDS', x: -1500, y: 1750 },
  { name: 'PASADENA Yacht Club', x: 500, y: 380 },
  { name: 'PYNN\'S BROOK', x: 0, y: 250 },
  { name: 'SAINT JUDES', x: 600, y: -350 },
  { name: 'LAKE SIDING', x: 1200, y: -950 },
  { name: 'NICHOLSVILLE / DEER LAKE', x: 1800, y: -1550 }
];
