// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between five screens: title, play, paused, game over and win.
//
// ?seed=N fixes the farm layout. ?shot=start|play|grease|win (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_GREASE, EVENT_HIT, EVENT_OVER, EVENT_PICKUP, EVENT_SLIP, EVENT_WIN, EVENT_ZONE, EVENT_GATE } from './world.js';
import {
  ACTION_CONFIRM, ACTION_GREASE, ACTION_JUMP, ACTION_MUTE, ACTION_PAUSE,
  ACTION_PAY, ACTION_RESTART, ACTION_SLIDE, createInput,
} from './input.js';
import { createAudio } from './audio.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each hit.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    audio.unlock();
    audio.gobble();
    announce('Playing. Gravy 100. Reach the getaway goose.');
  }

  function endGame(won) {
    screen = won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.score > best) {
      best = Math.floor(world.state.score);
      saveBest(best);
    }
    if (won) audio.win();
    else audio.lose();
    announce(won
      ? `Getaway! Score ${Math.floor(world.state.score)}. Best ${best}.`
      : `Game over. Score ${Math.floor(world.state.score)}. Best ${best}.`);
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_MUTE) {
      const muted = audio.toggleMute();
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) {
      startGame();
      input.takeActions();
      return;
    }
    if (actions & ACTION_RESTART && (screen === SCREEN_OVER || screen === SCREEN_WIN)) {
      startGame();
      input.takeActions();
      return;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    } else if (actions & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
    }
    return actions;
  }

  function step(actions) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { dir: 0, jump: false, slide: false, grease: false, pay: false }, true);
      return;
    }
    const controls = {
      dir: input.direction(),
      jump: Boolean(actions & ACTION_JUMP),
      slide: Boolean(actions & ACTION_SLIDE),
      grease: Boolean(actions & ACTION_GREASE),
      pay: Boolean(actions & ACTION_PAY),
    };
    const events = world.step(STEP, controls, false);
    if (events & EVENT_PICKUP) audio.pickup();
    if (events & EVENT_GREASE) audio.grease();
    if (events & EVENT_SLIP) audio.slip();
    if (events & EVENT_GATE) audio.gate();
    if (events & EVENT_ZONE) {
      audio.zone();
      announce(`${world.state.zone === 1 ? 'Zone 2: the corn maze.' : 'Zone 3: creek road.'} ${world.state.zone === 1 ? 'Slide under the corn.' : 'Mind the creek.'}`);
    }
    if (events & EVENT_HIT) {
      audio.splat();
      announce(world.state.gravy <= 20 ? `Hit. Gravy ${Math.ceil(world.state.gravy)} — nearly dry!` : `Hit. Gravy ${Math.ceil(world.state.gravy)}.`);
    }
    if (events & EVENT_WIN) endGame(true);
    else if (events & EVENT_OVER) endGame(false);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const actions = handleActions();
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let guard = 0;
      let stepActions = actions;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY) && guard < 20) {
        step(stepActions);
        // One-shot presses (grease, pay, jump) fire on the first sub-step only, so a slow
        // frame never spends the same grease twice.
        stepActions = 0;
        accumulator -= STEP;
        guard += 1;
      }
      if (guard >= 20) accumulator = 0;
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
    window.__ready = true;
    window.__state = {
      screen, score: Math.floor(world.state.score), distance: Math.floor(world.state.distance),
      gravy: Math.ceil(world.state.gravy), zone: world.state.zone,
      won: world.state.won, over: world.state.over, farmerDist: Math.round(world.state.farmerDist),
    };
  }

  // Leaving the tab pauses a running game rather than letting the farmer catch up unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Gravy Heist. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
