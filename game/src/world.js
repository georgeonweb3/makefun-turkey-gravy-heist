// GRAVY HEIST rules and state, with no drawing and no browser in it: the turkey, the three
// farm zones, the farmer's family closing in, the gravy economy (health AND currency), grease
// slicks, toll gates and the getaway goose. step() advances one fixed step and returns what
// happened as bit flags, so the caller can react without the world knowing about screens or
// sound. Nothing here allocates after createWorld returns.
import {
  FIELD, GRAVY, SCORE, SPEED, FARMER, SPAWN, TURKEY, ZONE_LENGTH, TOTAL_DISTANCE,
  PX_PER_METRE,
} from './config.js';

export const KIND_HAY = 0;
export const KIND_FENCE = 1;
export const KIND_GATE = 2;
export const KIND_CORN = 3;
export const KIND_PUDDLE = 4;
export const KIND_DOG = 5;
export const KIND_KID = 6;
export const KIND_TRACTOR = 7;
export const KIND_CREEK = 8;

export const KIND_DRIP = 0;
export const KIND_CORN_PICKUP = 1;
export const KIND_GOLDEN = 2;

export const EVENT_HIT = 1;
export const EVENT_PICKUP = 2;
export const EVENT_SLIP = 4;
export const EVENT_ZONE = 8;
export const EVENT_GATE = 16;
export const EVENT_WIN = 32;
export const EVENT_OVER = 64;
export const EVENT_GREASE = 128;

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function createWorld(random) {
  const player = {
    x: TURKEY.baseX, y: FIELD.groundY - TURKEY.height, vy: 0,
    width: TURKEY.width, height: TURKEY.height,
    onGround: true, sliding: false, slideTimer: 0, invulnerable: 0, slowTimer: 0,
  };
  const items = [];
  for (let i = 0; i < SPAWN.maxItems; i += 1) {
    items.push({ active: false, kind: KIND_HAY, x: 0, y: 0, width: 0, height: 0, extra: 0, paid: false, slipping: 0, passed: false });
  }
  const pickups = [];
  for (let i = 0; i < SPAWN.maxPickups; i += 1) {
    pickups.push({ active: false, kind: KIND_DRIP, x: 0, y: 0, width: 0, height: 0, bob: 0 });
  }
  const slicks = [];
  for (let i = 0; i < SPAWN.maxSlicks; i += 1) {
    slicks.push({ active: false, x: 0, width: 0, life: 0 });
  }
  const state = {
    player, items, pickups, slicks,
    scroll: 0, distance: 0, gravy: GRAVY.start, score: 0,
    zone: 0, farmerDist: FARMER.startDistance, farmerSlipping: 0,
    speed: SPEED.base, elapsed: 0, spawnTimer: 1.2, gateSpawned: [false, false],
    slips: 0, cornCount: 0, drips: 0, gatesPaid: 0, gatesJumped: 0,
    won: false, over: false, overReason: '',
    toast: '', toastTimer: 0, banner: '', bannerTimer: 0,
    gooseX: 0, splashTimer: 0, slowMo: 0,
  };

  function reset() {
    player.x = TURKEY.baseX;
    player.y = FIELD.groundY - TURKEY.height;
    player.vy = 0;
    player.width = TURKEY.width;
    player.height = TURKEY.height;
    player.onGround = true;
    player.sliding = false;
    player.slideTimer = 0;
    player.invulnerable = 0;
    player.slowTimer = 0;
    for (const item of items) { item.active = false; item.slipping = 0; item.paid = false; item.passed = false; }
    for (const p of pickups) p.active = false;
    for (const s of slicks) s.active = false;
    state.scroll = 0;
    state.distance = 0;
    state.gravy = GRAVY.start;
    state.score = 0;
    state.zone = 0;
    state.farmerDist = FARMER.startDistance;
    state.farmerSlipping = 0;
    state.speed = SPEED.base;
    state.elapsed = 0;
    state.spawnTimer = 1.2;
    state.gateSpawned = [false, false];
    state.slips = 0;
    state.cornCount = 0;
    state.drips = 0;
    state.gatesPaid = 0;
    state.gatesJumped = 0;
    state.won = false;
    state.over = false;
    state.overReason = '';
    state.toast = '';
    state.toastTimer = 0;
    state.banner = 'ZONE 1 — THE BARNYARD';
    state.bannerTimer = 2.4;
    state.gooseX = 0;
    state.splashTimer = 0;
    state.slowMo = 0;
  }

  function setToast(text) {
    state.toast = text;
    state.toastTimer = 2.2;
  }

  function freeItem() {
    for (let i = 0; i < items.length; i += 1) if (!items[i].active) return items[i];
    return null;
  }
  function freePickup() {
    for (let i = 0; i < pickups.length; i += 1) if (!pickups[i].active) return pickups[i];
    return null;
  }
  function freeSlick() {
    for (let i = 0; i < slicks.length; i += 1) if (!slicks[i].active) return slicks[i];
    return null;
  }

  function spawnObstacle() {
    const item = freeItem();
    if (item === null) return;
    const zone = state.zone;
    const roll = random();
    let kind = KIND_HAY;
    if (zone === 0) kind = roll < 0.34 ? KIND_HAY : roll < 0.58 ? KIND_FENCE : roll < 0.78 ? KIND_DOG : roll < 0.92 ? KIND_PUDDLE : KIND_HAY;
    else if (zone === 1) kind = roll < 0.3 ? KIND_CORN : roll < 0.52 ? KIND_KID : roll < 0.72 ? KIND_HAY : roll < 0.88 ? KIND_FENCE : KIND_PUDDLE;
    else kind = roll < 0.3 ? KIND_TRACTOR : roll < 0.55 ? KIND_CREEK : roll < 0.72 ? KIND_FENCE : roll < 0.88 ? KIND_DOG : KIND_PUDDLE;
    item.active = true;
    item.kind = kind;
    item.x = FIELD.width + 60;
    item.extra = 0;
    item.paid = false;
    item.slipping = 0;
    item.passed = false;
    if (kind === KIND_HAY) { item.width = 56; item.height = 46; }
    else if (kind === KIND_FENCE) { item.width = 30; item.height = 72; }
    else if (kind === KIND_CORN) { item.width = 84; item.height = 64; }
    else if (kind === KIND_PUDDLE) { item.width = 130; item.height = 14; }
    else if (kind === KIND_DOG) { item.width = 74; item.height = 44; item.extra = 90; }
    else if (kind === KIND_KID) { item.width = 52; item.height = 78; item.extra = 70; }
    else if (kind === KIND_TRACTOR) { item.width = 168; item.height = 112; }
    else if (kind === KIND_CREEK) { item.width = 190; item.height = 8; }
    item.y = kind === KIND_PUDDLE || kind === KIND_CREEK ? FIELD.groundY - item.height : FIELD.groundY - item.height;
  }

  function spawnPickupLine() {
    // A short arc of 3 pickups: sometimes low (run through), sometimes high (jump for).
    const high = random() < 0.45;
    const kind = random() < 0.14 ? KIND_GOLDEN : random() < 0.55 ? KIND_DRIP : KIND_CORN_PICKUP;
    for (let i = 0; i < 3; i += 1) {
      const p = freePickup();
      if (p === null) return;
      p.active = true;
      p.kind = kind;
      p.width = kind === KIND_GOLDEN ? 34 : 28;
      p.height = p.width;
      p.x = FIELD.width + 80 + i * 56;
      p.y = high ? FIELD.groundY - 150 - Math.abs(i - 1) * -22 : FIELD.groundY - 52;
      p.bob = random() * 6.28;
    }
  }

  function spawnGate(zoneIndex) {
    const item = freeItem();
    if (item === null) return;
    item.active = true;
    item.kind = KIND_GATE;
    item.width = 44;
    item.height = 118;
    item.x = FIELD.width + 60;
    item.y = FIELD.groundY - item.height;
    item.extra = 0;
    item.paid = false;
    item.slipping = 0;
    item.passed = false;
  }

  function spillGrease() {
    if (state.gravy <= GRAVY.greaseCost) return false;
    const slick = freeSlick();
    if (slick === null) return false;
    state.gravy -= GRAVY.greaseCost;
    slick.active = true;
    slick.x = player.x - 40;
    slick.width = 150;
    slick.life = 4;
    // The farmer is right behind you: a fresh slick sends him sliding into the pond.
    if (state.farmerDist < 150 && state.farmerSlipping <= 0) {
      state.farmerSlipping = 1.1;
      state.farmerDist += FARMER.greasePushback;
      state.score += FARMER.greaseScore;
      state.slips += 1;
      state.splashTimer = 1.0;
      setToast('FARMER JED SLID INTO THE POND!  +50');
      return true;
    }
    setToast('Grease spilled!  -8 gravy');
    return true;
  }

  function payGate() {
    for (const item of items) {
      if (!item.active || item.kind !== KIND_GATE || item.paid) continue;
      const ahead = item.x - (player.x + player.width);
      if (ahead > -20 && ahead < 320 && state.gravy >= GRAVY.gatePrice) {
        item.paid = true;
        state.gravy -= GRAVY.gatePrice;
        state.score += SCORE.gatePaid;
        state.gatesPaid += 1;
        setToast('GATE BRIBED WITH GRAVY  +25');
        return true;
      }
    }
    return false;
  }

  function hitPlayer(loss, reason) {
    if (player.invulnerable > 0 || state.over || state.won) return EVENT_HIT;
    state.gravy = Math.max(0, state.gravy - loss);
    player.invulnerable = TURKEY.invulnerable;
    state.farmerDist = Math.max(0, state.farmerDist - FARMER.stumbleLoss);
    setToast(`${reason}  -${loss} gravy`);
    if (state.gravy <= 0) {
      state.over = true;
      state.overReason = 'gravy';
      return EVENT_HIT | EVENT_OVER;
    }
    return EVENT_HIT;
  }

  function step(dt, controls, attract) {
    const c = controls || { dir: 0, jump: false, slide: false, grease: false, pay: false };
    let events = 0;
    state.elapsed += dt;
    if (state.toastTimer > 0) state.toastTimer -= dt;
    if (state.bannerTimer > 0) state.bannerTimer -= dt;
    if (state.splashTimer > 0) state.splashTimer -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;
    if (player.slowTimer > 0) player.slowTimer -= dt;

    // Speed: base + per zone, slowed by mud.
    let speed = SPEED.base + SPEED.perZone * state.zone;
    if (player.slowTimer > 0) speed *= 0.55;
    state.speed = speed;
    state.scroll += speed * dt;
    if (!attract) {
      state.distance += (speed * dt) / PX_PER_METRE;
      state.score += (speed * dt) / PX_PER_METRE * SCORE.perMetre;
    }

    // Steering: nudge the turkey left/right inside its lane.
    player.x += c.dir * TURKEY.moveSpeed * dt;
    player.x = Math.max(TURKEY.minX, Math.min(TURKEY.maxX, player.x));

    // Jump / slide.
    if (c.jump && player.onGround && !attract) {
      player.vy = TURKEY.jumpVelocity;
      player.onGround = false;
      events |= 0;
    }
    if (c.slide && player.onGround) {
      player.sliding = true;
      player.slideTimer = 0.55;
    }
    if (player.slideTimer > 0) {
      player.slideTimer -= dt;
      if (player.slideTimer <= 0) player.sliding = false;
    }
    player.height = player.sliding ? TURKEY.slideHeight : TURKEY.height;
    player.vy += TURKEY.gravity * dt;
    player.y += player.vy * dt;
    const groundTop = FIELD.groundY - player.height;
    if (player.y >= groundTop) {
      player.y = groundTop;
      player.vy = 0;
      player.onGround = true;
    } else {
      player.onGround = false;
    }

    // Grease + gate payment are one-shot actions.
    if (c.grease && !attract) {
      if (spillGrease()) events |= EVENT_GREASE | (state.farmerSlipping > 0 ? EVENT_SLIP : 0);
    }
    if (c.pay && !attract) {
      if (payGate()) events |= EVENT_GATE;
    }

    // The farmer closes in; slipping buys distance.
    if (!attract && !state.won) {
      if (state.farmerSlipping > 0) state.farmerSlipping -= dt;
      else state.farmerDist = Math.max(0, state.farmerDist - FARMER.closeInPerSecond * dt);
      if (state.farmerDist <= 0) {
        state.gravy = Math.max(0, state.gravy - GRAVY.caughtLoss);
        state.farmerDist = FARMER.caughtReset;
        player.invulnerable = TURKEY.invulnerable;
        setToast('FARMER JED GRABBED YOU!  -20 gravy');
        events |= EVENT_HIT;
        if (state.gravy <= 0) {
          state.over = true;
          state.overReason = 'caught';
          events |= EVENT_OVER;
          return events;
        }
      }
    }

    // Zone gates spawn just before each boundary.
    if (!attract) {
      for (let z = 0; z < 2; z += 1) {
        if (!state.gateSpawned[z] && state.distance >= (z + 1) * ZONE_LENGTH - 90) {
          state.gateSpawned[z] = true;
          spawnGate(z);
          setToast(`TOLL GATE AHEAD — press B to pay ${GRAVY.gatePrice} gravy, or JUMP it!`);
        }
      }
      const zone = Math.min(2, Math.floor(state.distance / ZONE_LENGTH));
      if (zone !== state.zone) {
        state.zone = zone;
        state.banner = zone === 1 ? 'ZONE 2 — THE CORN MAZE' : 'ZONE 3 — CREEK ROAD';
        state.bannerTimer = 2.4;
        events |= EVENT_ZONE;
      }
    }

    // Spawning.
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnObstacle();
      if (random() < 0.55) spawnPickupLine();
      state.spawnTimer = SPAWN.interval * (0.8 + random() * 0.5);
    }

    // Move obstacles left; resolve collisions.
    for (const item of items) {
      if (!item.active) continue;
      item.x -= (speed + item.extra) * dt;
      if (item.slipping > 0) {
        item.slipping -= dt;
        item.x -= 260 * dt;
        item.y += 120 * dt;
        if (item.slipping <= 0) item.active = false;
        continue;
      }
      if (item.x + item.width < -80) { item.active = false; continue; }
      // Slicks trip dogs and kids.
      if ((item.kind === KIND_DOG || item.kind === KIND_KID) && !attract) {
        for (const s of slicks) {
          if (s.active && item.x < s.x + s.width && item.x + item.width > s.x) {
            item.slipping = 0.9;
            state.score += SCORE.slip;
            state.slips += 1;
            state.splashTimer = 1.0;
            setToast(item.kind === KIND_DOG ? 'BISCUIT SLID INTO THE POND!  +50' : 'A TWIN SLID INTO THE POND!  +50');
            events |= EVENT_SLIP;
            break;
          }
        }
        if (item.slipping > 0) continue;
      }
      if (attract || state.over || state.won) continue;
      if (item.kind === KIND_PUDDLE) {
        if (player.onGround && overlaps(player, item)) {
          player.slowTimer = 0.6;
          item.active = false;
        }
        continue;
      }
      if (item.kind === KIND_CREEK) {
        if (player.onGround && player.x + player.width > item.x + 14 && player.x < item.x + item.width - 14) {
          state.gravy = Math.max(0, state.gravy - GRAVY.creekLoss);
          player.invulnerable = TURKEY.invulnerable;
          player.y = FIELD.groundY - player.height - 130;
          player.vy = -260;
          player.onGround = false;
          player.x = item.x + item.width + 10;
          state.splashTimer = 1.0;
          setToast('SPLASH! You fell in the creek  -15 gravy');
          events |= EVENT_HIT;
          if (state.gravy <= 0) {
            state.over = true;
            state.overReason = 'gravy';
            events |= EVENT_OVER;
          }
        }
        continue;
      }
      if (item.kind === KIND_GATE) {
        if (item.paid) {
          if (player.x > item.x + item.width) item.active = false;
          continue;
        }
        // Jumped clean over it?
        if (player.x + player.width > item.x && player.x < item.x + item.width) {
          if (player.y + player.height <= item.y + 26) {
            if (!item.passed) {
              item.passed = true;
              state.score += SCORE.gateJumped;
              state.gatesJumped += 1;
              setToast('CLEARED THE GATE!  +40');
              events |= EVENT_GATE;
            }
            continue;
          }
          if (player.invulnerable <= 0) {
            item.active = false;
            events |= hitPlayer(GRAVY.gateHitLoss, 'SMACKED INTO THE TOLL GATE');
          }
        }
        continue;
      }
      // Corn rows: slide under them (they are tall but the turkey ducks), or jump over.
      if (item.kind === KIND_CORN) {
        const duckBox = { x: player.x, y: FIELD.groundY - TURKEY.slideHeight, width: player.width, height: TURKEY.slideHeight };
        const hitBox = player.sliding ? duckBox : player;
        if (overlaps(hitBox, item)) {
          if (player.sliding) {
            // Ducked clean under the stalks.
            if (!item.passed) {
              item.passed = true;
              state.score += 15;
              setToast('DUCKED THE CORN!  +15');
            }
            continue;
          }
          events |= hitPlayer(GRAVY.hitLoss, 'TANGLED IN THE CORN');
          item.active = false;
        }
        continue;
      }
      if (overlaps(player, item)) {
        const label = item.kind === KIND_HAY ? 'TRIPPED ON A HAY BALE'
          : item.kind === KIND_FENCE ? 'CLIPPED THE FENCE'
          : item.kind === KIND_DOG ? 'BISCUIT BOWLED YOU OVER'
          : item.kind === KIND_KID ? 'CAUGHT IN A NET'
          : 'RUN OVER BY THE TRACTOR';
        events |= hitPlayer(GRAVY.hitLoss, label);
        item.active = false;
        if (events & EVENT_OVER) return events;
      }
    }

    // Pickups drift left and bob; collect on overlap.
    for (const p of pickups) {
      if (!p.active) continue;
      p.x -= speed * dt;
      p.bob += dt * 4;
      if (p.x + p.width < -40) { p.active = false; continue; }
      if (attract || state.over || state.won) continue;
      const box = { x: p.x - 6, y: p.y - 6, width: p.width + 12, height: p.height + 12 };
      if (overlaps(player, box)) {
        p.active = false;
        if (p.kind === KIND_DRIP) {
          state.gravy = Math.min(GRAVY.max, state.gravy + GRAVY.dripGain);
          state.score += SCORE.drip;
          state.drips += 1;
          setToast('GRAVY DRIP!  +8 gravy');
        } else if (p.kind === KIND_CORN_PICKUP) {
          state.gravy = Math.min(GRAVY.max, state.gravy + GRAVY.cornGain);
          state.score += SCORE.corn;
          state.cornCount += 1;
        } else {
          state.gravy = Math.min(GRAVY.max, state.gravy + GRAVY.goldenGain);
          state.score += SCORE.golden;
          state.cornCount += 1;
          setToast('GOLDEN CORN!  +20 gravy');
        }
        events |= EVENT_PICKUP;
      }
    }

    // Slicks age out.
    for (const s of slicks) {
      if (!s.active) continue;
      s.life -= dt;
      if (s.life <= 0) s.active = false;
    }

    // The win: reach the getaway goose at the end of creek road.
    if (!attract && !state.won && state.distance >= TOTAL_DISTANCE) {
      state.won = true;
      state.gooseX = player.x + 320;
      state.score += Math.round(state.gravy) * SCORE.winGravyBonus;
      events |= EVENT_WIN;
    }
    if (state.won) state.gooseX = Math.max(880, state.gooseX - speed * dt * 0.4);

    return events;
  }

  reset();
  return { state, reset, step, spillGrease, payGate };
}
