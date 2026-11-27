// Keyboard and pointer input. Held keys give a steering direction; one-shot presses (start,
// jump, slide, grease, pay, pause, mute) are queued as bit flags and taken once by the loop, so a
// press between two frames is never lost and never counted twice.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_JUMP = 4;
export const ACTION_SLIDE = 8;
export const ACTION_GREASE = 16;
export const ACTION_PAY = 32;
export const ACTION_MUTE = 64;
export const ACTION_RESTART = 128;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const JUMP = new Set(['ArrowUp', 'KeyW', 'Space']);
const SLIDE = new Set(['ArrowDown', 'KeyS']);
const GREASE = new Set(['KeyG', 'KeyK']);
const PAY = new Set(['KeyB']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);
const CONFIRM = new Set(['Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target) {
  let left = false;
  let right = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (JUMP.has(event.code)) { if (!event.repeat) actions |= ACTION_JUMP | ACTION_CONFIRM; }
    else if (SLIDE.has(event.code)) { if (!event.repeat) actions |= ACTION_SLIDE; }
    else if (GREASE.has(event.code)) { if (!event.repeat) actions |= ACTION_GREASE; }
    else if (PAY.has(event.code)) { if (!event.repeat) actions |= ACTION_PAY; }
    else if (MUTE.has(event.code)) { if (!event.repeat) actions |= ACTION_MUTE; }
    else if (RESTART.has(event.code)) { if (!event.repeat) actions |= ACTION_RESTART; }
    else if (CONFIRM.has(event.code)) { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (PAUSE.has(event.code)) { if (!event.repeat) actions |= ACTION_PAUSE; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
  });
  // Click / tap: confirm on menus, jump while playing.
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM | ACTION_JUMP;
  });

  return {
    /** -1 for left, 1 for right, 0 for neither or both. */
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
