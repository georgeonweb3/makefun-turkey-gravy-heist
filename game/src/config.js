// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical area;
// the renderer scales it to the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720, groundY: 640 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** 10 scrolled pixels = 1 metre of escape. */
export const PX_PER_METRE = 10;

/** Zone boundaries in metres: barnyard, corn maze, creek road, then the getaway goose. */
export const ZONE_LENGTH = 1200;
export const TOTAL_DISTANCE = 3600;

export const TURKEY = {
  width: 64,
  height: 58,
  slideHeight: 30,
  baseX: 260,
  minX: 110,
  maxX: 520,
  moveSpeed: 260,
  jumpVelocity: -880,
  gravity: 2500,
  invulnerable: 1.6,
};

export const GRAVY = {
  start: 100,
  max: 100,
  hitLoss: 15,
  caughtLoss: 20,
  gateHitLoss: 10,
  creekLoss: 15,
  greaseCost: 8,
  gatePrice: 15,
  dripGain: 8,
  cornGain: 4,
  goldenGain: 20,
};

export const SPEED = { base: 460, perZone: 45 };

export const FARMER = {
  startDistance: 180,
  closeInPerSecond: 1.6,
  stumbleLoss: 25,
  caughtReset: 120,
  greasePushback: 140,
  greaseScore: 50,
};

export const SCORE = {
  perMetre: 1,
  corn: 10,
  drip: 15,
  golden: 50,
  slip: 50,
  gatePaid: 25,
  gateJumped: 40,
  winGravyBonus: 10,
};

export const SPAWN = {
  interval: 0.85,
  minGapPx: 300,
  maxItems: 48,
  maxPickups: 24,
  maxSlicks: 8,
};

export const PALETTE = {
  skyBarnyardTop: '#ffb347',
  skyBarnyardBottom: '#ffe3a3',
  skyCornTop: '#7ec850',
  skyCornBottom: '#f7e08a',
  skyCreekTop: '#7a6fc0',
  skyCreekBottom: '#ffb37a',
  groundBarnyard: '#a9713f',
  groundCorn: '#8a6a2f',
  groundCreek: '#6b5a44',
  grassBarnyard: '#7fae4a',
  grassCorn: '#5d9b3a',
  grassCreek: '#4f7a52',
  turkeyBody: '#8a5a2b',
  turkeyWing: '#6e4520',
  turkeyHead: '#c98a4b',
  turkeyBeak: '#e8a13c',
  turkeyWattle: '#d43d2a',
  turkeyTail: '#5d3a1a',
  gravy: '#e8b64c',
  farmerShirt: '#3b6fd4',
  farmerOveralls: '#2b4a8f',
  farmerHat: '#d8b25a',
  dog: '#7a4a22',
  kidShirt: '#e05252',
  tractor: '#c0392b',
  goose: '#f4f1e6',
  panel: 'rgba(20, 16, 10, 0.82)',
  text: '#fff7e6',
  muted: '#d8c9a8',
  danger: '#ff5a4e',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'gravy-heist.best';

export const ZONES = [
  { name: 'ZONE 1 — THE BARNYARD', pursuer: 'Farmer Jed', hint: 'Jump the hay. Mind the dog.' },
  { name: 'ZONE 2 — THE CORN MAZE', pursuer: 'The twins with nets', hint: 'Slide under the corn. Watch the nets.' },
  { name: 'ZONE 3 — CREEK ROAD', pursuer: 'The tractor', hint: 'Mind the creek. The goose is waiting.' },
];
