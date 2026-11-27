// All drawing: the farm in three zones, the turkey and its gravy boat, the farmer's family,
// the HUD and the title / pause / win / game-over screens. The canvas is a fixed 1280x720
// logical area scaled to the window; nothing here knows about rules.
import { FIELD, PALETTE, FONT, ZONES } from './config.js';
import {
  KIND_HAY, KIND_FENCE, KIND_GATE, KIND_CORN, KIND_PUDDLE, KIND_DOG, KIND_KID,
  KIND_TRACTOR, KIND_CREEK, KIND_DRIP, KIND_CORN_PICKUP, KIND_GOLDEN,
} from './world.js';

export const SCREEN_TITLE = 0;
export const SCREEN_PLAY = 1;
export const SCREEN_PAUSED = 2;
export const SCREEN_OVER = 3;
export const SCREEN_WIN = 4;

const SKIES = [
  [PALETTE.skyBarnyardTop, PALETTE.skyBarnyardBottom, PALETTE.groundBarnyard, PALETTE.grassBarnyard],
  [PALETTE.skyCornTop, PALETTE.skyCornBottom, PALETTE.groundCorn, PALETTE.grassCorn],
  [PALETTE.skyCreekTop, PALETTE.skyCreekBottom, PALETTE.groundCreek, PALETTE.grassCreek],
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = Math.round(FIELD.width * scale * dpr);
    canvas.height = Math.round(FIELD.height * scale * dpr);
    canvas.style.width = `${Math.round(FIELD.width * scale)}px`;
    canvas.style.height = `${Math.round(FIELD.height * scale)}px`;
    ctx.setTransform(canvas.width / FIELD.width, 0, 0, canvas.height / FIELD.height, 0, 0);
  }
  window.addEventListener('resize', fit);
  fit();

  function drawSky(state) {
    const [top, bottom] = SKIES[state.zone];
    const g = ctx.createLinearGradient(0, 0, 0, FIELD.groundY);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.groundY);
    // Sun / moon.
    ctx.fillStyle = state.zone === 2 ? '#f7ead0' : '#ffd76a';
    ctx.beginPath();
    ctx.arc(1080, state.zone === 2 ? 110 : 90, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 215, 106, 0.25)';
    ctx.beginPath();
    ctx.arc(1080, state.zone === 2 ? 110 : 90, 62, 0, Math.PI * 2);
    ctx.fill();
    // Drifting clouds (seeded by scroll so they move with the world).
    ctx.fillStyle = 'rgba(255, 250, 235, 0.85)';
    for (let i = 0; i < 4; i += 1) {
      const cx = ((i * 397 - state.scroll * (0.12 + i * 0.03)) % 1500 + 1500) % 1500 - 110;
      const cy = 70 + i * 42;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 62, 20, 0, 0, Math.PI * 2);
      ctx.ellipse(cx + 44, cy + 6, 44, 16, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBackdrop(state) {
    const scroll = state.scroll;
    // Rolling hills.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    for (let i = 0; i < 5; i += 1) {
      const hx = ((i * 430 - scroll * 0.25) % 1700 + 1700) % 1700 - 200;
      ctx.beginPath();
      ctx.ellipse(hx, FIELD.groundY - 10, 260, 70, 0, Math.PI, Math.PI * 2);
      ctx.fill();
    }
    if (state.zone === 0) {
      // Red barn + silo, parallax slow.
      const bx = 900 - ((scroll * 0.35) % 1600);
      ctx.fillStyle = '#a83226';
      ctx.fillRect(bx, 420, 220, 180);
      ctx.fillStyle = '#7e241b';
      ctx.beginPath();
      ctx.moveTo(bx - 14, 424);
      ctx.lineTo(bx + 110, 330);
      ctx.lineTo(bx + 234, 424);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f4ead2';
      ctx.fillRect(bx + 88, 500, 44, 100);
      ctx.strokeStyle = '#f4ead2';
      ctx.lineWidth = 5;
      ctx.strokeRect(bx + 88, 500, 44, 100);
      ctx.beginPath();
      ctx.moveTo(bx + 88, 500);
      ctx.lineTo(bx + 132, 600);
      ctx.moveTo(bx + 132, 500);
      ctx.lineTo(bx + 88, 600);
      ctx.stroke();
      // Silo.
      ctx.fillStyle = '#c9ced6';
      ctx.fillRect(bx + 240, 380, 62, 220);
      ctx.fillStyle = '#9aa0ab';
      ctx.beginPath();
      ctx.ellipse(bx + 271, 380, 31, 18, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      // Fence posts along the back.
      ctx.fillStyle = '#6b4a26';
      for (let x = -((scroll * 0.6) % 90); x < FIELD.width; x += 90) {
        ctx.fillRect(x, 596, 8, 44);
      }
      ctx.fillRect(0, 606, FIELD.width, 6);
      ctx.fillRect(0, 626, FIELD.width, 6);
    } else if (state.zone === 1) {
      // Corn rows marching past.
      ctx.fillStyle = '#3f7d2c';
      for (let i = 0; i < 14; i += 1) {
        const cx = ((i * 130 - scroll * 0.7) % 1500 + 1500) % 1500 - 100;
        const h = 150 + (i % 3) * 26;
        ctx.fillRect(cx, FIELD.groundY - h, 14, h);
        ctx.fillStyle = '#57a83e';
        ctx.beginPath();
        ctx.ellipse(cx + 7, FIELD.groundY - h - 12, 26, 34, (i % 2 ? -0.4 : 0.4), 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#3f7d2c';
      }
      // Scarecrow.
      const sx = 640 - ((scroll * 0.5) % 1900);
      ctx.strokeStyle = '#5d3a1a';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(sx, 470);
      ctx.lineTo(sx, 620);
      ctx.moveTo(sx - 42, 510);
      ctx.lineTo(sx + 42, 510);
      ctx.stroke();
      ctx.fillStyle = '#e8c33c';
      ctx.beginPath();
      ctx.arc(sx, 462, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#3b6fd4';
      ctx.fillRect(sx - 34, 486, 68, 62);
    } else {
      // Creek road: pine trees and the creek glittering behind the road.
      ctx.fillStyle = '#2c4a2e';
      for (let i = 0; i < 8; i += 1) {
        const tx = ((i * 220 - scroll * 0.45) % 1500 + 1500) % 1500 - 100;
        ctx.beginPath();
        ctx.moveTo(tx, 430);
        ctx.lineTo(tx - 42, 560);
        ctx.lineTo(tx + 42, 560);
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(tx - 6, 556, 12, 84);
      }
      ctx.fillStyle = '#5fa8d3';
      ctx.fillRect(0, 596, FIELD.width, 44);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 10; i += 1) {
        const wx = ((i * 173 - scroll * 0.9) % 1400 + 1400) % 1400 - 60;
        ctx.fillRect(wx, 610 + (i % 3) * 8, 46, 3);
      }
    }
  }

  function drawGround(state) {
    const [, , ground, grass] = SKIES[state.zone];
    ctx.fillStyle = ground;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, FIELD.height - FIELD.groundY);
    ctx.fillStyle = grass;
    ctx.fillRect(0, FIELD.groundY, FIELD.width, 14);
    // Ground texture: tufts and pebbles scrolling by.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    for (let i = 0; i < 26; i += 1) {
      const gx = ((i * 173 - state.scroll) % 1400 + 1400) % 1400 - 60;
      const gy = FIELD.groundY + 24 + ((i * 37) % 52);
      ctx.fillRect(gx, gy, 10, 4);
    }
    // The pond in the background, where slipped pursuers land.
    if (state.splashTimer > 0) {
      ctx.fillStyle = '#4fa8d3';
      ctx.beginPath();
      ctx.ellipse(180, FIELD.groundY - 6, 120, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText('SPLASH!', 180, FIELD.groundY - 40);
    }
  }

  function drawSlicks(state) {
    for (const s of state.slicks) {
      if (!s.active) continue;
      ctx.fillStyle = 'rgba(232, 182, 76, 0.75)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.width / 2, FIELD.groundY - 4, s.width / 2, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 240, 190, 0.9)';
      ctx.beginPath();
      ctx.ellipse(s.x + s.width / 2 - 18, FIELD.groundY - 6, 26, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPickups(state) {
    for (const p of state.pickups) {
      if (!p.active) continue;
      const bobY = Math.sin(p.bob) * 5;
      const y = p.y + bobY;
      if (p.kind === KIND_DRIP) {
        // A golden gravy drip.
        ctx.fillStyle = PALETTE.gravy;
        ctx.beginPath();
        ctx.ellipse(p.x + 14, y + 14, 13, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.ellipse(p.x + 10, y + 9, 5, 7, -0.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Corn cob / golden corn.
        ctx.fillStyle = p.kind === KIND_GOLDEN ? '#ffd94a' : '#f2c94c';
        ctx.beginPath();
        ctx.ellipse(p.x + 14, y + 14, 11, 15, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.kind === KIND_GOLDEN ? '#fff3a0' : '#d8a93a';
        for (let r = 0; r < 3; r += 1) ctx.fillRect(p.x + 6 + r * 7, y + 4, 2, 20);
        ctx.fillStyle = '#57a83e';
        ctx.fillRect(p.x + 12, y - 6, 4, 10);
      }
    }
  }

  function drawObstacles(state) {
    for (const item of state.items) {
      if (!item.active) continue;
      const x = item.x;
      const y = item.y;
      ctx.save();
      if (item.slipping > 0) {
        ctx.translate(x + item.width / 2, y + item.height / 2);
        ctx.rotate(-0.9);
        ctx.translate(-item.width / 2, -item.height / 2);
      }
      if (item.kind === KIND_HAY) {
        ctx.fillStyle = '#d8a93a';
        roundRect(ctx, x, y, item.width, item.height, 10);
        ctx.fill();
        ctx.strokeStyle = '#a87f22';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 12);
        ctx.lineTo(x + item.width - 6, y + 12);
        ctx.moveTo(x + 6, y + item.height - 12);
        ctx.lineTo(x + item.width - 6, y + item.height - 12);
        ctx.stroke();
      } else if (item.kind === KIND_FENCE) {
        ctx.fillStyle = '#7a5230';
        ctx.fillRect(x, y, 8, item.height);
        ctx.fillRect(x + item.width - 8, y, 8, item.height);
        ctx.fillRect(x, y + 8, item.width, 8);
        ctx.fillRect(x, y + 34, item.width, 8);
        ctx.fillRect(x, y + 58, item.width, 8);
      } else if (item.kind === KIND_GATE) {
        if (item.paid) {
          ctx.fillStyle = 'rgba(122, 82, 48, 0.35)';
          ctx.fillRect(x, y, 8, item.height);
          ctx.fillRect(x + item.width - 8, y, 8, item.height);
          ctx.fillStyle = '#7ec850';
          ctx.font = 'bold 18px ' + FONT;
          ctx.textAlign = 'center';
          ctx.fillText('OPEN!', x + item.width / 2, y - 10);
        } else {
          ctx.fillStyle = '#5d3a1a';
          ctx.fillRect(x, y, item.width, item.height);
          ctx.fillStyle = '#e8b64c';
          ctx.beginPath();
          ctx.arc(x + item.width / 2, y + 34, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#3a2410';
          ctx.beginPath();
          ctx.arc(x + item.width / 2, y + 34, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff7e6';
          ctx.font = 'bold 15px ' + FONT;
          ctx.textAlign = 'center';
          ctx.fillText('TOLL', x + item.width / 2, y + 70);
          ctx.fillText('15', x + item.width / 2, y + 90);
        }
      } else if (item.kind === KIND_CORN) {
        ctx.fillStyle = '#3f7d2c';
        for (let s = 0; s < 3; s += 1) {
          const sx = x + 8 + s * 26;
          ctx.fillRect(sx, y, 12, item.height);
          ctx.beginPath();
          ctx.ellipse(sx + 6, y - 6, 20, 26, (s % 2 ? -0.3 : 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fff7e6';
        ctx.font = 'bold 15px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('DUCK!', x + item.width / 2, y - 34);
      } else if (item.kind === KIND_PUDDLE) {
        ctx.fillStyle = '#6b4a2f';
        ctx.beginPath();
        ctx.ellipse(x + item.width / 2, y + 7, item.width / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(x + item.width / 2 - 20, y + 5, 26, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (item.kind === KIND_DOG) {
        drawDog(x, y, item.width, item.height, state.elapsed);
        ctx.fillStyle = '#fff7e6';
        ctx.font = 'bold 15px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('BISCUIT!', x + item.width / 2, y - 12);
      } else if (item.kind === KIND_KID) {
        drawKid(x, y, item.width, item.height);
      } else if (item.kind === KIND_TRACTOR) {
        drawTractor(x, y, item.width, item.height, state.elapsed);
      } else if (item.kind === KIND_CREEK) {
        ctx.fillStyle = '#3d8fc4';
        ctx.fillRect(x, FIELD.groundY, item.width, FIELD.height - FIELD.groundY);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(x + 20, FIELD.groundY + 20, 40, 3);
        ctx.fillRect(x + 100, FIELD.groundY + 44, 50, 3);
        ctx.fillStyle = '#fff7e6';
        ctx.font = 'bold 15px ' + FONT;
        ctx.textAlign = 'center';
        ctx.fillText('JUMP THE CREEK!', x + item.width / 2, y - 12);
      }
      ctx.restore();
    }
  }

  function drawDog(x, y, w, h, t) {
    const bob = Math.sin(t * 14) * 3;
    ctx.fillStyle = PALETTE.dog;
    ctx.beginPath();
    ctx.ellipse(x + w / 2, y + h - 16 + bob, 30, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + w - 12, y + 12 + bob, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d3617';
    ctx.beginPath();
    ctx.moveTo(x + w - 24, y + 6 + bob);
    ctx.lineTo(x + w - 18, y - 8 + bob);
    ctx.lineTo(x + w - 10, y + 4 + bob);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2b1a0c';
    ctx.beginPath();
    ctx.arc(x + w - 2, y + 12 + bob, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5d3617';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(x + 8, y + h - 6);
    ctx.lineTo(x + 22, y + h - 18 + bob);
    ctx.moveTo(x + w - 14, y + h - 6);
    ctx.lineTo(x + w - 28, y + h - 18 - bob);
    ctx.stroke();
    ctx.strokeStyle = '#8a5a2b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h - 22 + bob);
    ctx.quadraticCurveTo(x - 8, y + h - 30 + bob, x + 2, y + h - 40 + bob);
    ctx.stroke();
  }

  function drawKid(x, y, w, h) {
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x + 8, y + h - 22, 10, 22);
    ctx.fillRect(x + w - 18, y + h - 22, 10, 22);
    ctx.fillStyle = PALETTE.kidShirt;
    ctx.fillRect(x + 4, y + 26, w - 8, 34);
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 14, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5d3a1a';
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 8, 13, Math.PI, Math.PI * 2);
    ctx.fill();
    // The net, held high.
    ctx.strokeStyle = '#d8d2c4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + w - 6, y + 30);
    ctx.lineTo(x + w + 16, y - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + w + 22, y - 12, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    for (let i = -1; i <= 1; i += 1) {
      ctx.moveTo(x + w + 22 + i * 9, y - 26);
      ctx.lineTo(x + w + 22 + i * 9, y + 2);
      ctx.moveTo(x + w + 8, y - 12 + i * 9);
      ctx.lineTo(x + w + 36, y - 12 + i * 9);
    }
    ctx.stroke();
  }

  function drawTractor(x, y, w, h, t) {
    ctx.fillStyle = PALETTE.tractor;
    ctx.fillRect(x + 18, y + 34, w - 60, 52);
    ctx.fillRect(x + w - 78, y + 4, 56, 82);
    ctx.fillStyle = '#bfe3f2';
    ctx.fillRect(x + w - 70, y + 12, 40, 34);
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(x + 34, y + h - 22, 26, 0, Math.PI * 2);
    ctx.arc(x + w - 40, y + h - 16, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6b6b6b';
    ctx.beginPath();
    ctx.arc(x + 34, y + h - 22, 10, 0, Math.PI * 2);
    ctx.arc(x + w - 40, y + h - 16, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath();
    ctx.arc(x + w - 4, y + 44, 8 + Math.sin(t * 6) * 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a7a7a';
    ctx.fillRect(x + 30, y - 6, 8, 26);
  }

  function drawTurkey(state, ghost) {
    const p = state.player;
    const run = state.elapsed * 14;
    const legSwing = p.onGround ? Math.sin(run) * 10 : 8;
    const bob = p.onGround ? Math.abs(Math.sin(run)) * -4 : 0;
    const x = p.x;
    const y = p.y + bob;
    ctx.save();
    if (ghost) ctx.globalAlpha = 0.55;
    if (p.invulnerable > 0 && Math.floor(state.elapsed * 12) % 2 === 0) ctx.globalAlpha = 0.35;
    // Tail fan.
    ctx.fillStyle = PALETTE.turkeyTail;
    for (let i = -2; i <= 2; i += 1) {
      ctx.save();
      ctx.translate(x + 8, y + 22);
      ctx.rotate(i * 0.42 - 0.5);
      ctx.beginPath();
      ctx.ellipse(0, -26, 9, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    // Legs (feet stay with the body, even mid-jump).
    ctx.strokeStyle = '#e8a13c';
    ctx.lineWidth = 5;
    const feetY = y + 54;
    ctx.beginPath();
    ctx.moveTo(x + 26, y + 46);
    ctx.lineTo(x + 26 + legSwing, feetY);
    ctx.moveTo(x + 40, y + 46);
    ctx.lineTo(x + 40 - legSwing, feetY);
    ctx.stroke();
    // Ground shadow, so the bird reads against the barn and the fence.
    if (p.onGround) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(x + 34, FIELD.groundY + 6, 34, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Body.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(x + 34, y + 28, 32, 24, -0.15, 0, Math.PI * 2);
    ctx.fill();
    // Wing.
    ctx.fillStyle = PALETTE.turkeyWing;
    ctx.beginPath();
    ctx.ellipse(x + 28, y + 28, 18, 12, -0.5 + Math.sin(run) * 0.08, 0, Math.PI * 2);
    ctx.fill();
    // The stolen gravy boat, strapped on the turkey's back.
    ctx.fillStyle = '#f4f1e6';
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 2);
    ctx.lineTo(x + 50, y + 2);
    ctx.lineTo(x + 44, y + 14);
    ctx.lineTo(x + 20, y + 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.gravy;
    ctx.beginPath();
    ctx.ellipse(x + 32, y + 3, 16, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d2c4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 50, y + 4);
    ctx.quadraticCurveTo(x + 60, y + 2, x + 56, y + 10);
    ctx.stroke();
    // Head + neck.
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.ellipse(x + 58, y + 2, 9, 20, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 64, y - 14, 13, 0, Math.PI * 2);
    ctx.fill();
    // Beak + wattle + eye.
    ctx.fillStyle = PALETTE.turkeyBeak;
    ctx.beginPath();
    ctx.moveTo(x + 74, y - 16);
    ctx.lineTo(x + 88, y - 12);
    ctx.lineTo(x + 74, y - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyWattle;
    ctx.beginPath();
    ctx.ellipse(x + 70, y - 2, 5, 8, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x + 67, y - 17, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFarmer(state) {
    if (state.won) return;
    const dist = state.farmerDist;
    if (dist > 190) return;
    const x = state.player.x - 70 - dist * 1.4;
    const y = FIELD.groundY - 96;
    const slipping = state.farmerSlipping > 0;
    ctx.save();
    if (slipping) {
      ctx.translate(x + 26, y + 48);
      ctx.rotate(-1.1);
      ctx.translate(-(x + 26), -(y + 48));
    }
    // Legs mid-run.
    ctx.strokeStyle = PALETTE.farmerOveralls;
    ctx.lineWidth = 9;
    const swing = Math.sin(state.elapsed * 12) * 12;
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 52);
    ctx.lineTo(x + 18 + swing, FIELD.groundY);
    ctx.moveTo(x + 34, y + 52);
    ctx.lineTo(x + 34 - swing, FIELD.groundY);
    ctx.stroke();
    // Overalls + shirt.
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(x + 10, y + 40, 32, 30);
    ctx.fillStyle = PALETTE.farmerShirt;
    ctx.fillRect(x + 8, y + 16, 36, 28);
    ctx.fillStyle = PALETTE.farmerOveralls;
    ctx.fillRect(x + 12, y + 16, 6, 28);
    ctx.fillRect(x + 34, y + 16, 6, 28);
    // Arms pumping.
    ctx.strokeStyle = PALETTE.farmerShirt;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 22);
    ctx.lineTo(x - 6, y + 34 - swing);
    ctx.moveTo(x + 42, y + 22);
    ctx.lineTo(x + 58, y + 34 + swing);
    ctx.stroke();
    // Head + hat.
    ctx.fillStyle = '#e8c39a';
    ctx.beginPath();
    ctx.arc(x + 26, y + 8, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.farmerHat;
    ctx.beginPath();
    ctx.ellipse(x + 26, y - 2, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(x + 14, y - 14, 24, 12);
    ctx.fillStyle = '#fff7e6';
    ctx.font = 'bold 15px ' + FONT;
    ctx.textAlign = 'center';
    const labelX = Math.max(50, Math.min(1230, x + 26));
    ctx.fillText(slipping ? 'WHOA—!' : 'FARMER JED', labelX, y - 22);
    ctx.restore();
  }

  function drawGoose(state) {
    if (!state.won) return;
    const x = state.gooseX;
    const y = FIELD.groundY - 74;
    ctx.fillStyle = PALETTE.goose;
    ctx.beginPath();
    ctx.ellipse(x + 40, y + 40, 42, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + 78, y + 6, 10, 30, 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 88, y - 20, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a13c';
    ctx.beginPath();
    ctx.moveTo(x + 100, y - 22);
    ctx.lineTo(x + 118, y - 17);
    ctx.lineTo(x + 100, y - 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(x + 92, y - 24, 3, 0, Math.PI * 2);
    ctx.fill();
    // Red getaway scarf.
    ctx.fillStyle = '#d43d2a';
    ctx.fillRect(x + 62, y + 8, 26, 10);
    ctx.fillRect(x + 62, y + 18, 10, 26);
    // The turkey riding along, tiny and triumphant.
    ctx.fillStyle = PALETTE.turkeyBody;
    ctx.beginPath();
    ctx.ellipse(x + 34, y + 8, 20, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyHead;
    ctx.beginPath();
    ctx.arc(x + 50, y - 6, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawHud(state, screen, best) {
    // Top bar.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, 12, 12, 560, 64, 12);
    ctx.fill();
    // Gravy gauge.
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 17px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText('GRAVY', 28, 36);
    ctx.fillStyle = '#3a2f1c';
    roundRect(ctx, 100, 22, 220, 22, 11);
    ctx.fill();
    const frac = Math.max(0, state.gravy / 100);
    ctx.fillStyle = frac > 0.5 ? PALETTE.gravy : frac > 0.25 ? '#e87f2e' : PALETTE.danger;
    if (frac > 0) {
      roundRect(ctx, 100, 22, 220 * frac, 22, 11);
      ctx.fill();
    }
    // The number sits on the gold bar when gravy is high, on the dark track when low.
    ctx.fillStyle = 100 + 220 * frac > 205 ? '#1a1a1a' : '#fff7e6';
    ctx.font = 'bold 15px ' + FONT;
    ctx.fillText(`${Math.ceil(state.gravy)}`, 196, 38);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '15px ' + FONT;
    ctx.fillText('health + money', 330, 38);
    // Score + distance.
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 28, 64);
    ctx.font = '16px ' + FONT;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText(`${Math.floor(state.distance)} m  ·  ${ZONES[state.zone].name}`, 190, 64);
    // Farmer proximity meter, top right.
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, FIELD.width - 332, 12, 320, 64, 12);
    ctx.fill();
    ctx.fillStyle = state.farmerDist < 50 ? PALETTE.danger : PALETTE.text;
    ctx.font = 'bold 17px ' + FONT;
    ctx.textAlign = 'left';
    ctx.fillText(`FARMER JED: ${Math.round(state.farmerDist)}m behind`, FIELD.width - 316, 36);
    ctx.fillStyle = '#3a2f1c';
    roundRect(ctx, FIELD.width - 316, 46, 288, 12, 6);
    ctx.fill();
    ctx.fillStyle = state.farmerDist < 50 ? PALETTE.danger : '#7ec850';
    roundRect(ctx, FIELD.width - 316, 46, 288 * Math.min(1, state.farmerDist / 190), 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(20, 16, 10, 0.82)';
    const bestText = `BEST ${best}`;
    const bestW = ctx.measureText(bestText).width + 24;
    roundRect(ctx, FIELD.width - 16 - bestW, 86, bestW, 26, 8);
    ctx.fill();
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '13px ' + FONT;
    ctx.textAlign = 'right';
    ctx.fillText(bestText, FIELD.width - 28, 104);
    // Controls hint.
    if (screen === SCREEN_PLAY) {
      ctx.fillStyle = 'rgba(20, 16, 10, 0.6)';
      roundRect(ctx, 12, FIELD.height - 40, 760, 28, 8);
      ctx.fill();
      ctx.fillStyle = PALETTE.text;
      ctx.font = '15px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('SPACE jump  ·  ↓ slide  ·  G spill grease (8 gravy)  ·  B pay toll gate (15)  ·  P pause  ·  M mute', 24, FIELD.height - 21);
    }
    // Toast (play screen only, so it never pokes out from behind a panel).
    if (screen === SCREEN_PLAY && state.toastTimer > 0) {
      ctx.font = 'bold 19px ' + FONT;
      ctx.fillStyle = PALETTE.panel;
      const w = ctx.measureText(state.toast).width + 36;
      roundRect(ctx, (FIELD.width - w) / 2, 96, w, 40, 10);
      ctx.fill();
      ctx.fillStyle = '#ffd76a';
      ctx.textAlign = 'center';
      ctx.fillText(state.toast, FIELD.width / 2, 123);
    }
    // Zone banner (play screen only).
    if (screen === SCREEN_PLAY && state.bannerTimer > 0) {
      ctx.globalAlpha = Math.min(1, state.bannerTimer);
      ctx.fillStyle = 'rgba(20, 16, 10, 0.55)';
      ctx.fillRect(0, 250, FIELD.width, 84);
      ctx.fillStyle = '#ffd76a';
      ctx.font = 'bold 44px ' + FONT;
      ctx.textAlign = 'center';
      ctx.fillText(state.banner, FIELD.width / 2, 296);
      ctx.fillStyle = PALETTE.text;
      ctx.font = '20px ' + FONT;
      ctx.fillText(ZONES[state.zone].hint, FIELD.width / 2, 324);
      ctx.globalAlpha = 1;
    }
  }

  function panel(x, y, w, h) {
    ctx.fillStyle = PALETTE.panel;
    roundRect(ctx, x, y, w, h, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 215, 106, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(240, 78, 800, 520);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 64px ' + FONT;
    ctx.fillText('GRAVY HEIST', 640, 168);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '22px ' + FONT;
    ctx.fillText('The turkey stole the farmer\u2019s gravy boat.', 640, 208);
    ctx.fillText('Now run for your life across the farm.', 640, 238);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 19px ' + FONT;
    ctx.fillText('GRAVY IS YOUR HEALTH AND YOUR MONEY', 640, 288);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '18px ' + FONT;
    ctx.fillText('Hits cost gravy. Pick up drips and corn to refill it.', 640, 318);
    ctx.fillText('Spend gravy to bribe the toll gates — or jump them.', 640, 344);
    ctx.fillText('Spill grease (G) and slide the farmer\u2019s family into the pond.', 640, 370);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '17px ' + FONT;
    ctx.fillText('3 zones: Barnyard → Corn Maze → Creek Road. Reach the getaway goose!', 640, 410);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillText('SPACE / CLICK — START', 640, 470);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '16px ' + FONT;
    ctx.fillText('SPACE jump · ↓ slide · G grease · B pay gate · P pause · M mute', 640, 506);
    ctx.fillText('Seeded runs: add ?seed=42 to the URL for a fixed farm.', 640, 532);
    if (best > 0) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 18px ' + FONT;
      ctx.fillText(`BEST SCORE: ${best}`, 640, 566);
    }
  }

  function drawPaused(state) {
    ctx.fillStyle = 'rgba(20, 12, 6, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(440, 250, 400, 200);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 44px ' + FONT;
    ctx.fillText('PAUSED', 640, 330);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '19px ' + FONT;
    ctx.fillText('The farmer waits for no bird.', 640, 372);
    ctx.fillText('P / SPACE — keep running', 640, 406);
  }

  function drawOver(state, best) {
    ctx.fillStyle = 'rgba(20, 6, 6, 0.55)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(340, 150, 600, 400);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.danger;
    ctx.font = 'bold 52px ' + FONT;
    ctx.fillText(state.overReason === 'caught' ? 'CAUGHT!' : 'OUT OF GRAVY!', 640, 236);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '20px ' + FONT;
    ctx.fillText(state.overReason === 'caught'
      ? 'Farmer Jed finally got his hands on the boat.'
      : 'The gravy boat ran dry — and so did your luck.', 640, 276);
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 640, 336);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '19px ' + FONT;
    ctx.fillText(`Distance ${Math.floor(state.distance)} m  ·  ${ZONES[state.zone].name}`, 640, 372);
    ctx.fillText(`Slips ${state.slips}  ·  Corn ${state.cornCount}  ·  Best ${best}`, 640, 402);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '17px ' + FONT;
    ctx.fillText('Tip: spill grease when Farmer Jed closes in — it is cheaper than getting caught.', 640, 448);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillText('SPACE / CLICK — RUN AGAIN', 640, 506);
  }

  function drawWin(state, best) {
    ctx.fillStyle = 'rgba(10, 30, 12, 0.45)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    panel(300, 120, 680, 440);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 52px ' + FONT;
    ctx.fillText('GETAWAY!', 640, 206);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '21px ' + FONT;
    ctx.fillText('The goose is airborne. The gravy boat is yours.', 640, 248);
    ctx.fillText('Farmer Jed is still standing in the creek, waving a fork.', 640, 278);
    ctx.font = 'bold 26px ' + FONT;
    ctx.fillStyle = '#ffd76a';
    ctx.fillText(`SCORE ${Math.floor(state.score)}`, 640, 336);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '19px ' + FONT;
    ctx.fillText(`Gravy left ${Math.ceil(state.gravy)}  × 10 bonus  ·  Slips ${state.slips}  ·  Corn ${state.cornCount}`, 640, 372);
    ctx.fillText(`Time ${Math.floor(state.elapsed)}s  ·  Best ${best}`, 640, 402);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = '17px ' + FONT;
    ctx.fillText('The farm will never forget the bird who stole Thanksgiving.', 640, 448);
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 22px ' + FONT;
    ctx.fillText('SPACE / CLICK — STEAL AGAIN', 640, 506);
  }

  function draw(state, screen, best) {
    ctx.clearRect(0, 0, FIELD.width, FIELD.height);
    drawSky(state);
    drawBackdrop(state);
    drawGround(state);
    drawSlicks(state);
    drawPickups(state);
    drawObstacles(state);
    drawFarmer(state);
    if (!state.won) drawTurkey(state, false);
    drawGoose(state);
    drawHud(state, screen, best);
    if (screen === SCREEN_TITLE) drawTitle(state, best);
    else if (screen === SCREEN_PAUSED) drawPaused(state);
    else if (screen === SCREEN_OVER) drawOver(state, best);
    else if (screen === SCREEN_WIN) drawWin(state, best);
  }

  return { draw };
}
