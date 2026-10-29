// fx.js — Lemo-Opuscar 80s Cel Anime demo (MIT): flare, lamp, trail
// Effects: rain (3-drawing cycle), splashes, speed lines (ryūsen, 流線), lens flare, light streaks, tail-light trails
import { rng, rgba, mix, TAU, hash, W, H } from './cel.js';

export function flare(e, x, y, s = 1, col = '#bfe6ff', o = {}) {
  e.save(); e.globalCompositeOperation = 'lighter';
  const core = e.createRadialGradient(x, y, 0, x, y, 180 * s);
  core.addColorStop(0, rgba('#ffffff', .95)); core.addColorStop(.12, rgba(col, .6)); core.addColorStop(1, rgba(col, 0));
  e.fillStyle = core; e.beginPath(); e.arc(x, y, 180 * s, 0, TAU); e.fill();
  // horizontal streak
  const L = (o.streak ?? 900) * s, hh = 5 * s;
  const gr = e.createLinearGradient(x - L, 0, x + L, 0);
  gr.addColorStop(0, rgba(col, 0)); gr.addColorStop(.5, rgba(mix(col, '#ffffff', .6), .9)); gr.addColorStop(1, rgba(col, 0));
  e.fillStyle = gr; e.fillRect(x - L, y - hh, L * 2, hh * 2);
  e.fillStyle = rgba('#ffffff', .8); e.fillRect(x - L * .3, y - 1.2 * s, L * .6, 2.4 * s);
  // star burst (4 + 2 rays)
  const spikes = o.spikes ?? 6, rot = o.rot ?? .3;
  for (let k = 0; k < spikes; k++) {
    const a = rot + k * TAU / spikes, len = (k % 2 ? 160 : 300) * s;
    e.save(); e.translate(x, y); e.rotate(a);
    const sg = e.createLinearGradient(0, 0, len, 0); sg.addColorStop(0, rgba('#ffffff', .8)); sg.addColorStop(1, rgba(col, 0));
    e.fillStyle = sg; e.beginPath(); e.moveTo(0, -3 * s); e.lineTo(len, 0); e.lineTo(0, 3 * s); e.fill(); e.restore();
  }
  // ghosts
  if (o.ghosts !== false) {
    const cx = W / 2, cy = H / 2, dx = cx - x, dy = cy - y;
    const G = [[.35, 40, '#7fffd4', .16], [.62, 22, '#ff9fe0', .22], [1.15, 70, '#8fb0ff', .1], [1.4, 30, '#ffe08a', .18], [1.75, 110, '#b08aff', .07]];
    for (const [k, r, c, a] of G) {
      const gx = x + dx * k * 2, gy = y + dy * k * 2;
      e.fillStyle = rgba(c, a * (o.ghostA ?? 1)); e.beginPath();
      for (let j = 0; j < 6; j++) { const aa = j * TAU / 6 + .3; e[j ? 'lineTo' : 'moveTo'](gx + Math.cos(aa) * r * s, gy + Math.sin(aa) * r * s); }
      e.fill();
    }
  }
  e.restore();
}

// Glow point (small backlit light source, tōka-kō 透过光): solid bright core on scene, coloured light on glow
export function lamp(g, e, x, y, r, col, a = 1) {
  if (g) { g.fillStyle = mix(col, '#ffffff', .7); g.beginPath(); g.arc(x, y, r * .45, 0, TAU); g.fill(); }
  if (e) { const gr = e.createRadialGradient(x, y, 0, x, y, r * 3); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(.3, rgba(col, a * .5)); gr.addColorStop(1, rgba(col, 0)); e.fillStyle = gr; e.beginPath(); e.arc(x, y, r * 3, 0, TAU); e.fill(); }
}

// Light trail: glowing strip along a polyline (tail-light smear)
export function trail(g, e, pts, col, w = 6) {
  for (const [ctx, ww, a] of [[e, w * 3, .7], [e, w, 1], [g, w * .5, .9]]) {
    if (!ctx) continue;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < pts.length; i++) {
      const f = 1 - i / pts.length;
      ctx.strokeStyle = rgba(ctx === g ? mix(col, '#ffffff', .6) : col, a * f); ctx.lineWidth = ww * (.4 + .6 * f);
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.restore();
  }
}
