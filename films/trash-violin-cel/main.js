// 쓰레기로 만든 바이올린 — 80s Cel Anime, 1080×1920, no narration: subtitles + original score, played back as a videotape
import { canvas, W, H, TAU, cel, poly, path, line, limb, airbrush, vgrad, mix, rgba, rng, hash, LWK } from './cel.js';
import { makePost } from './post.js';
import { PAL } from './pal.js';
import { head80 } from './head80.js';
import { flare, lamp } from './fx.js';
import * as A from './art.js';
import { DUR, BEAT, SHOP0, THEME0, SHOTS, shotAt, T, SUBS, TITLE, LABELS } from './story.js';

const qs = new URLSearchParams(location.search);
const [sc, g] = canvas(W, H), [gc, e] = canvas(W, H), [ovc, ov] = canvas(W, H);
const post = makePost(document.getElementById('gl'));
for (const f of ['700 54px "Gothic A1"', '400 120px "Black Han Sans"']) await document.fonts.load(f, '쓰레기로 만든 바이올린 카테우라');

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, t) => a + (b - a) * t;
const seg = (t, a, b) => clamp((t - a) / (b - a)), ss = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const eio = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const f12 = t => Math.floor(t * 12) / 12, f8 = t => Math.floor(t * 8) / 8;   // characters on twos, performance beats on threes
const reset = c => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none'; };

// ---------- painted plates (once) ----------
const PLT = {};
function plate(w, h, fn) { const [c, x] = canvas(w, h); fn(x, w, h); return c; }
function speckle(x, x0, y0, w, h, n, cols, seed, r0 = 3, r1 = 12) { const R = rng(seed); for (let i = 0; i < n; i++) { x.fillStyle = rgba(cols[Math.floor(R() * cols.length)], .35 + R() * .4); x.beginPath(); x.ellipse(x0 + R() * w, y0 + R() * h, r0 + R() * (r1 - r0), (r0 + R() * (r1 - r0)) * .6, R() * 3, 0, TAU); x.fill(); } }
function build() {
  const Ps = PAL.smog, Pd = PAL.dusk;
  // the ground under the hands (smog): mud, soft painted trash, then cel trash
  PLT.ground = plate(W, H, (x) => { vgrad(x, 0, 0, W, H, [[0, '#8f8676'], [1, '#6f6658']]); speckle(x, 0, 0, W, H, 900, ['#9c9282', '#7a7062', '#a8a090', '#6a6052'], 3, 8, 40); for (let i = 0; i < 40; i++) airbrush(x, hash(i) * W, hash(i + 7) * H, 120 + hash(i + 3) * 200, 80 + hash(i + 5) * 120, '#5e5548', .35, 1); A.trash(x, Ps, -60, -60, W + 60, H + 60, 90, .95, 21); });
  PLT.groundDusk = plate(W, H, (x) => { vgrad(x, 0, 0, W, H, [[0, '#a2705e'], [1, '#6e4a52']]); speckle(x, 0, 0, W, H, 700, ['#b8826a', '#8a5a5a', '#c89a7a'], 4, 8, 40); A.trash(x, Pd, -60, 700, W + 60, H + 60, 40, .9, 22); airbrush(x, W * .7, 200, 700, 500, '#ffc890', .35, 1); });
  // the mountain (world 2400 × 4300, smog)
  PLT.mount = plate(2400, 4300, (x, w, h) => {
    vgrad(x, 0, 0, w, h, [[0, '#a9a596'], [.45, '#c4bdac'], [1, '#8a8070']]);
    for (let i = 0; i < 9; i++) airbrush(x, hash(i) * w, 300 + hash(i + 2) * 1400, 400, 120, '#d8d2c2', .5, 1);   // smog clouds
    x.fillStyle = '#9a9a92'; for (let i = 0; i < 40; i++) { const bx = i * 62, bh = 60 + hash(i + 11) * 220; x.fillRect(bx, 1980 - bh, 50, bh); }   // city far away
    x.fillStyle = '#8a7c6a'; x.beginPath(); x.moveTo(-50, h); x.lineTo(-50, 2900); x.bezierCurveTo(500, 2500, 800, 2000, 1180, 1880); x.bezierCurveTo(1500, 1950, 1900, 2400, 2450, 2800); x.lineTo(2450, h); x.closePath(); x.fill();
    x.save(); x.clip(); speckle(x, 0, 1850, w, h - 1850, 6000, ['#a8987e', '#6a5e4c', '#c8b896', '#7f8a96', '#b07a5a', '#5f7f6a'], 7, 4, 22); for (let i = 0; i < 30; i++) airbrush(x, hash(i + 40) * w, 2000 + hash(i + 41) * 2300, 300, 160, '#5a4e40', .35, 1); x.restore();
    for (let i = 0; i < 8; i++) { const sx = 300 + hash(i + 60) * 1800; airbrush(x, sx, 1900 + hash(i + 61) * 600, 60, 380, '#cfc8b8', .35, 1); }   // smoke columns
  });
  // the shack wall (window scene)
  PLT.wall = plate(W + 120, H, (x, w, h) => {
    vgrad(x, 0, 0, w, h, [[0, '#8e9294'], [1, '#6e7274']]);
    for (let i = 0; i < w; i += 36) { x.fillStyle = i % 72 ? '#7c8082' : '#9aa0a2'; x.fillRect(i, 0, 18, h); }
    for (let i = 0; i < 8; i++) airbrush(x, hash(i + 3) * w, hash(i + 4) * h, 160, 260, '#8a5a3a', .35, 1);   // rust
    x.fillStyle = '#5a4434'; x.fillRect(230, 400, 680, 680); x.fillStyle = '#2a2028'; x.fillRect(270, 440, 600, 600);
  });
  PLT.bench = plate(W, H, (x) => {
    vgrad(x, 0, 0, W, H, [[0, '#2a2026'], [.55, '#3a2c2a'], [1, '#1e1618']]);
    for (let i = 0; i < 12; i++) airbrush(x, hash(i + 80) * W, 200 + hash(i + 81) * 600, 40 + hash(i + 82) * 60, 40 + hash(i + 82) * 60, '#ffd28a', .25, .2);
    x.fillStyle = '#7a5232'; x.fillRect(-20, 1100, W + 40, 900); for (let i = 0; i < 9; i++) { x.fillStyle = i % 2 ? '#6e4a2c' : '#86603c'; x.fillRect(-20, 1100 + i * 100, W + 40, 50); }
    airbrush(x, W / 2, 1300, 700, 300, '#ffd8a0', .25, 1);
    A.trash(x, PAL.stage, -40, 1500, W + 40, 1900, 14, .9, 5);
  });
  for (const [k, P, sky] of [['bustS', PAL.smog, ['#b4b0a2', '#9a958a']], ['bustD', PAL.dusk, ['#ffb27a', '#8a5a8a']]]) PLT[k] = plate(W, H, (x) => {
    vgrad(x, 0, 0, W, H, [[0, sky[0]], [.6, sky[1]], [1, sky[1]]]);
    if (k === 'bustD') { airbrush(x, 240, 420, 520, 300, '#ffe0a0', .6, 1); for (let i = 0; i < 6; i++) airbrush(x, hash(i + 90) * W, 200 + hash(i + 91) * 500, 300, 60, '#ffc8a0', .5, 1); }
    x.fillStyle = k === 'bustD' ? '#7a4a5a' : '#7c7a74'; for (let i = 0; i < 12; i++) { const bx = -40 + i * 100, bh = 300 + hash(i + 95) * 260; x.fillRect(bx, 1300 - bh, 90, bh + 700); }
  });
  // alley: three parallax layers at dusk
  PLT.far = plate(3000, H, (x, w, h) => { vgrad(x, 0, 0, w, h, [[0, '#6a4a8a'], [.35, '#e88a6a'], [.6, '#ffc890'], [1, '#ffc890']]); for (let i = 0; i < 14; i++) airbrush(x, hash(i + 100) * w, 160 + hash(i + 101) * 500, 380, 70, '#ffb0a0', .45, 1); airbrush(x, 600, 820, 220, 220, '#fff0b0', .9, .7);
    x.fillStyle = '#8a5a7a'; for (let i = 0; i < 60; i++) { const bx = i * 52, bh = 120 + hash(i + 103) * 160; x.fillRect(bx, 1020 - bh, 44, bh + 900); } });
  PLT.mid = plate(4200, H, (x, w, h) => {
    const cols = ['#5fa8a0', '#f2cf6b', '#e8786a', '#7ab86a', '#8aa8d8', '#e8a0b8'];
    for (let i = 0; i < 24; i++) {
      const bx = i * 180 + hash(i) * 30, bw = 160 + hash(i + 1) * 40, bh = 420 + hash(i + 2) * 200, by = 1330, c = cols[i % cols.length];
      cel(x, poly([[bx, by], [bx, by - bh], [bx + bw, by - bh - 10], [bx + bw, by]]), { f: c, s: mix(c, '#4a2a4a', .4), so: [-26, 0], l: mix(c, '#2a1424', .6), lw: 2.4 });
      x.fillStyle = mix(c, '#4a2a4a', .25); for (let k = bx + 14; k < bx + bw - 8; k += 22) x.fillRect(k, by - bh, 6, bh);
      cel(x, poly([[bx - 18, by - bh + 6], [bx + bw / 2, by - bh - 30], [bx + bw + 20, by - bh - 4], [bx + bw + 20, by - bh + 14], [bx - 18, by - bh + 24]]), { f: '#8a7a86', s: '#5a4a5a', so: [0, -6], l: '#2a1a2a', lw: 2 });
      cel(x, poly([[bx + bw * .25, by], [bx + bw * .25, by - bh * .6], [bx + bw * .55, by - bh * .6], [bx + bw * .55, by]]), { f: '#3a2434', l: '#1a0a14', lw: 2 });
    }
    for (let i = 0; i < 9; i++) { const lx = 120 + i * 470; line(x, [[lx, 760], [lx + 200, 790], [lx + 400, 768]], '#3a2434', 2); for (let k = 0; k < 4; k++) cel(x, poly([[lx + 40 + k * 90, 778], [lx + 90 + k * 90, 780], [lx + 86 + k * 90, 850], [lx + 44 + k * 90, 848]]), { f: cols[(i + k) % 6], s: mix(cols[(i + k) % 6], '#4a2a4a', .4), so: [-8, 0], l: '#2a1424', lw: 1.6 }); }
    vgrad(x, 0, 1330, w, h - 1330, [[0, '#a8705a'], [1, '#6a4048']]);
  });
  PLT.near = plate(5400, 520, (x) => A.trash(x, PAL.dusk, 0, 120, 5400, 520, 120, 1.1, 31));
  PLT.stage = plate(W, 2600, (x, w, h) => {
    vgrad(x, 0, 0, w, h, [[0, '#120c24'], [.5, '#2a2040'], [1, '#100a1c']]);
    for (const sd of [0, 1]) for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#5a1424' : '#6e1c2e'; x.fillRect(sd ? w - 40 - i * 34 : i * 34, 0, 36, 1520); }
    x.fillStyle = '#7a5232'; x.fillRect(0, 1450, w, 140); x.fillStyle = '#5a3a24'; x.fillRect(0, 1590, w, 40);
    x.fillStyle = '#0c0814'; x.fillRect(0, 1630, w, h - 1630);
  });
}

// ---------- scenes ----------
const handPose = t => {   // the opening hand: digging, then the grab, then the lift
  const ft = f12(t), dig = ft < T.grab, gr = ss(seg(ft, T.grab, T.grab + .5)), lf = eio(seg(ft, T.lift[0], T.lift[1]));
  const wob = i => .28 + .24 * Math.sin(ft * TAU * 1.4 + i * .7);
  const curl = [0, 1, 2, 3].map(i => dig ? wob(i) : lerp(wob(i), .92, gr));
  return { curl, thumb: dig ? .3 + .2 * Math.sin(ft * 8) : lerp(.3, .85, gr), x: lerp(640, 600, gr) + (dig ? Math.sin(ft * 5.2) * 14 : 0), y: lerp(1380, 1300, gr) - lf * 380 + (dig ? Math.abs(Math.sin(ft * 4.4)) * 18 : 0), ang: lerp(-.18, -.05, gr) + lf * .15, lf };
};
function sHands(t) {
  const P = PAL.smog, z = 1 + .04 * ss(seg(t, 0, 3.8));
  g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z)); g.drawImage(PLT.ground, 0, 0);
  const h = handPose(t), ft = f12(t);
  // the bottle: half buried, then lifted with the hand
  g.save(); if (h.lf > 0 || ft >= T.grab) { g.translate(h.x - 30, h.y - 170); g.rotate(-1.35 + h.ang + h.lf * .4); A.bottle(g, P, { s: 1.15, y: 120 }); } else { g.translate(560, 1170); g.rotate(-1.35); A.bottle(g, P, { s: 1.15, y: 120 }); } g.restore();
  // the left hand pushes a can aside
  const lp = ft * 1.8; A.handTop(g, P, { x: 300 + Math.sin(lp) * 30, y: 1500 + Math.cos(lp) * 16, ang: .32, s: 1.55, curl: [.35, .45, .5, .55].map((c, i) => c + .15 * Math.sin(lp + i)), thumb: .4, dirt: true, armLen: 360 });
  g.save(); g.translate(170 + Math.max(0, Math.sin(lp)) * 50, 1170); g.rotate(.6); A.trash(g, P, -10, -10, 10, 10, 1, 1.2, 77); g.restore();
  A.handTop(g, P, { x: h.x, y: h.y, ang: h.ang, s: 1.6, curl: h.curl, thumb: h.thumb, dirt: true, armLen: 400 });
  reset(g);
}
function sCrane(t) {
  const P = PAL.smog, u = eio(seg(t, T.crane[0], T.crane[1])), k = Math.exp(lerp(Math.log(1.9), Math.log(.48), u));
  const GX = 1200, GY = 1890, cx = lerp(GX + 40, 1200, u), cy = lerp(GY - 240, 2050, u);
  g.setTransform(k, 0, 0, k, W / 2 - cx * k, H / 2 - cy * k); g.drawImage(PLT.mount, 0, 0);
  g.save(); g.translate(GX + 150, GY - 190); g.rotate(-.3 - .05 * Math.sin(f12(t) * 3)); A.bottle(g, P, { s: .55 }); g.restore();
  A.girl(g, P, { x: GX, y: GY, s: .55, pose: 'crouch', look: [.6, .2] });
  // birds over the dump, on ones
  g.strokeStyle = rgba('#3a3430', .8); g.lineWidth = 4 / Math.max(k, .5); g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const a = t * (.4 + hash(i) * .25) + i, x = 1200 + Math.cos(a) * (300 + hash(i + 3) * 500), y = 1500 + Math.sin(a) * 120 - hash(i + 5) * 300, f = Math.sin(t * 9 + i * 2) * 10 + 6; g.beginPath(); g.moveTo(x - 16, y - f); g.quadraticCurveTo(x - 6, y, x, y + 2); g.quadraticCurveTo(x + 6, y, x + 16, y - f); g.stroke(); }
  reset(g);
}
function sWindow(t) {
  const P = PAL.smog, tr = lerp(0, 120, seg(t, 8.4, 15.9)), pz = 1 + .06 * ss(seg(t, 11.6, 15.9));
  g.setTransform(pz, 0, 0, pz, W / 2 * (1 - pz) - tr * pz, H / 2 * (1 - pz)); g.drawImage(PLT.wall, 0, 0);
  e.setTransform(pz, 0, 0, pz, W / 2 * (1 - pz) - tr * pz, H / 2 * (1 - pz));
  // inside: the only light in this world, backlit (the warm glass glows on the emissive layer)
  const gr = g.createLinearGradient(0, 440, 0, 1040); gr.addColorStop(0, '#ffe2a0'); gr.addColorStop(1, '#f0a050'); g.fillStyle = gr; g.fillRect(270, 440, 600, 600);
  e.fillStyle = rgba('#ffb060', .85); e.fillRect(270, 440, 600, 600);
  const ph = (f8(t) - 8.15) / (BEAT / 2), pl = t < 11.6 ? Math.max(0, 1 - (ph % 1) * 3) : 0;
  g.save(); g.translate(600, 1000); A.teacherSil(g, '#3a2420', '#ffd28a', pl); g.restore();
  e.save(); e.translate(600, 1000); A.teacherSil(e, '#000', 'rgba(0,0,0,0)', pl); e.restore();   // stamp the silhouette into the light
  cel(g, poly([[255, 730], [885, 730], [885, 750], [255, 750]]), { f: '#5a4434', l: '#2a1a14', lw: 2 }); cel(g, poly([[560, 440], [580, 440], [580, 1040], [560, 1040]]), { f: '#5a4434', l: '#2a1a14', lw: 2 });
  // the price: the violin's shadow spreads over the whole shack
  const sh = ss(seg(t, T.shadow[0], T.shadow[1]));
  if (sh > 0) { g.save(); g.globalAlpha = .55 * sh; g.translate(600, 760); g.rotate(-.5); const s = lerp(.5, 3.4, sh); g.scale(s, s); g.fillStyle = '#1c1418'; g.beginPath(); g.ellipse(-60, 0, 120, 70, 0, 0, TAU); g.ellipse(70, 0, 95, 58, 0, 0, TAU); g.fill(); g.fillRect(150, -12, 220, 24); g.restore(); }
  // the girl from behind: hair, shoulders; her arm reaches
  reset(g); reset(e);
  const r = ss(seg(f12(t), T.reach[0], T.reach[1])) * (1 - .35 * ss(seg(t, 14.8, 15.7)));
  cel(g, [[-60, H + 20], [-30, 1640], [140, 1560], [520, 1570], [700, 1690], [760, H + 20]], A.st(P.shirt, { so: [-20, -10] }));
  if (r > 0) { cel(g, limb([520, 1640], [lerp(560, 600, r), lerp(1520, 1220, r)], 66, 58), A.st(P.shirt, { so: [-8, 0] })); cel(g, limb([lerp(560, 600, r), lerp(1520, 1220, r)], [lerp(600, 650, r), lerp(1470, 1010, r)], 50, 44), A.st(P.skin, { so: [-6, 0] })); }
  const hr = path([[150, 1600], [130, 1420], [190, 1280], [330, 1230], [470, 1270], [530, 1400], [510, 1600]]);
  cel(g, hr, { f: P.hair.f, s: P.hair.s, so: [-14, -10], h: P.hair.h, l: P.hair.l, lw: 2.4, hi: [[[220, 1300], [330, 1270], [440, 1300], [430, 1320], [330, 1296], [230, 1320]]] });
  for (let i = 0; i < 7; i++) line(g, [[190 + i * 46, 1300], [170 + i * 52, 1590]], rgba(P.hair.l, .5), 1.6);
}
function sBench(t) {
  const P = PAL.stage, ft = f8(t);
  g.drawImage(PLT.bench, 0, 0);
  for (let i = 0; i < 12; i++) lamp(null, e, hash(i + 80) * W, 200 + hash(i + 81) * 600, 20 + hash(i + 82) * 30, '#ffc070', .35);
  let parts = 0; T.parts.forEach(p => { if (ft >= p) parts++; });
  const last = T.parts[Math.max(0, parts - 1)], hit = parts > 0 && t - last < 2 / 24;
  const sk = hit ? 6 : 0;
  g.save(); g.translate(sk * (hash(Math.floor(t * 24)) - .5), 0);
  A.handGrip(g, P, { x: 230, y: 1260, s: 1.2, ang: .1 });
  A.tinViolin(g, P, { x: 150, y: 1150, ang: -1.0, s: 1.15, parts });
  A.handGrip(g, P, { x: 980, y: 760, s: 1.1, ang: 2.4 });
  g.restore();
  // a sliding highlight over the tin (move light, not drawings)
  const sl = ((t - 15.9) * .6) % 1;
  g.save(); g.translate(150, 1150); g.rotate(-1.0); g.scale(1.15, 1.15); g.beginPath(); g.rect(0, -112, 270, 224); g.clip(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba('#ffffff', .22); g.fillRect(-60 + sl * 400, -120, 50, 240); g.restore();
  if (hit) { e.fillStyle = rgba('#ffffff', .5); e.fillRect(0, 0, W, H); }
  // material tags (the 80s boxed caption)
  LABELS.forEach((lb, i) => {
    const t0 = T.parts[i]; if (t < t0) return;
    const y = 360 + i * 120, x = 560, a = ss(seg(t, t0, t0 + .2));
    g.save(); g.globalAlpha = a; g.font = '700 46px "Gothic A1"'; const w = g.measureText(lb).width + 80;
    g.fillStyle = rgba('#140c18', .82); g.beginPath(); g.roundRect(x, y - 36, w, 72, 10); g.fill(); g.strokeStyle = '#ffd28a'; g.lineWidth = 3; g.stroke();
    g.fillStyle = '#e2482a'; g.beginPath(); g.arc(x + 30, y, 10, 0, TAU); g.fill(); g.fillStyle = '#fff0a0'; g.textBaseline = 'middle'; g.fillText(lb, x + 54, y + 2); g.restore();
  });
}
function sReceive(t) {
  const P = PAL.smog; g.drawImage(PLT.ground, 0, 0);
  const tr = Math.sin(t * 40) * 1.5, gv = eio(seg(f12(t), T.give[0], T.give[1]));
  A.handUp(g, P, { x: 300 + tr, y: 1520, ang: .25, s: 1.6, cup: .2 + gv * .4 });
  A.tinViolin(g, P, { x: 80, y: lerp(-300, 1220, gv), ang: -.2 + .1 * (1 - gv), s: 1.35 });
  A.handUp(g, P, { x: 800 - tr, y: 1560, ang: -.25, s: 1.6, side: -1, cup: .2 + gv * .4 });
}
// the close shot of the girl playing: used for the first note (smog → dusk) and for the solo on the stage
const VA = -.38;
function bowU(t) {
  if (t < T.note1) return t < T.scrape2 ? -40 + 220 * seg(t, T.scrape1, T.scrape1 + .3) : -20 + 200 * seg(t, T.scrape2, T.scrape2 + .3);
  const s = (t - T.note1) / (BEAT * 2); return 190 * Math.sin(Math.PI * (s % 2 < 1 ? s % 1 : 1 - s % 1) - Math.PI / 2);
}
function bust(t, P, o = {}) {
  const ft = f12(t), z = o.z ?? 1;
  g.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z)); e.setTransform(z, 0, 0, z, W / 2 * (1 - z), H / 2 * (1 - z));
  const hx = 450, hy = 820, S = 2.4, bu = bowU(ft);
  // shoulders and shirt
  cel(g, [[-60, H + 40], [-40, 1340], [180, 1150], [470, 1120], [760, 1150], [980, 1320], [1060, H + 40]], { ...A.st(P[o.shirt || 'shirt'], { so: [-24, -14], ho: [10, 6] }), rim: o.rim ? { c: o.rim, d: [3, -2] } : null });
  // head
  const scr = t >= T.scrape1 && t < T.note1, after = t >= T.note1;
  const expr = o.expr || (scr ? 'closed' : after ? 'smile' : 'neutral');
  LWK.k = .55;
  g.save(); g.translate(hx, hy); g.scale(S, S); g.rotate(scr ? -.04 : 0);
  head80(g, P, { view: 'q', expr, open: after ? 0 : scr ? 0 : .9, mouth: after ? 'smile' : scr ? 'set' : 'closed', look: [.5, .45], E: scr ? { brow: [7, -2, 1] } : after ? { brow: [-3, -1, 3] } : {}, rim: o.rim ? { c: o.rim, d: [1.4, -.8] } : null, skinRim: o.skinRim, light: o.light });
  g.restore(); LWK.k = 1;
  // the violin under her chin, glowing after the first note
  const tail = [hx + 10, hy + 330], VS = 1.2;
  A.tinViolin(g, P, { x: tail[0], y: tail[1], ang: VA, s: VS, glow: (o.glow ?? 0) * .55 }, e);
  // left hand around the neck
  const nx = tail[0] + Math.cos(VA) * 520 * VS, ny = tail[1] + Math.sin(VA) * 520 * VS;
  cel(g, limb([nx + 140, ny + 520], [nx + 10, ny + 40], 92, 80), A.st(P.skin, { so: [-8, 0] }));
  for (let i = 0; i < 3; i++) cel(g, limb([nx - 20 + i * 18, ny + 30 - i * 6], [nx - 34 + i * 22, ny - 28 - i * 6], 26, 22), A.st(P.skin, { so: [-4, -2] }));
  // the bow across the strings near the bridge, held by the right arm
  const cxp = tail[0] + Math.cos(VA) * 150 * VS, cyp = tail[1] + Math.sin(VA) * 150 * VS, ba = .26;
  const fx = cxp - Math.cos(ba) * (320 + bu), fy = cyp - Math.sin(ba) * (320 + bu);
  A.bow(g, P, { x: fx, y: fy, ang: ba, s: 1.05 });
  const Sh = [60, 1500], E = [Math.min(Sh[0], fx) - 60, (Sh[1] + fy) / 2 + 60];
  cel(g, limb(Sh, E, 120, 104), A.st(P[o.shirt || 'shirt'], { so: [-10, -6] })); cel(g, limb(E, [fx + 6, fy + 16], 84, 70), A.st(P.skin, { so: [-6, -4] }));
  const hd = new Path2D(); hd.ellipse(fx + 10, fy + 14, 52, 42, -.4, 0, TAU); cel(g, hd, A.st(P.skin, { so: [-6, -4] }));
  if (o.glow) flare(e, cxp + 60, cyp - 40, .45 * o.glow, '#ffd8a0', { ghostA: .4, streak: 500 });
  reset(g); reset(e);
}
const BF = Array.from({ length: 16 }, (_, i) => ({ t0: T.note1 + i * .14 + hash(i) * .2, a: -.35 - hash(i + 4) * 1.0, sp: 260 + hash(i + 9) * 320, sz: 30 + hash(i + 2) * 30, ph: hash(i + 7) * 6 }));
function butterflies(t, P, x0, y0) {
  for (const b of BF) {
    const u = f12(t) - b.t0; if (u < 0) continue;
    const x = x0 + Math.cos(b.a) * b.sp * u + Math.sin(u * 2 + b.ph) * 40, y = y0 + Math.sin(b.a) * b.sp * u - 40 * u * u; if (y < -80 || x > W + 80) continue;
    A.butterfly(g, e, x, y, b.sz * (.5 + .5 * clamp(u * 4)), Math.sin(u * 3 + b.ph) * .4, .5 + .5 * Math.sin(u * 22 + b.ph), P);
  }
}
function sBust(t) {
  const after = t >= T.note1, P = after ? PAL.dusk : PAL.smog;
  g.drawImage(after ? PLT.bustD : PLT.bustS, 0, 0);
  if (after) lamp(null, e, 240, 420, 120, '#ffd890', .5);
  const z = 1 + .07 * ss(seg(t, 22.0, 25.9));
  bust(t, P, { z, glow: after ? .6 + .4 * Math.exp(-(t - T.note1) * 1.5) : 0, rim: after ? '#ffd27a' : null });
  if (after) butterflies(t, P, 460 + Math.cos(VA) * 420, 1150 + Math.sin(VA) * 420);
}
// alley: side tracking, three layers; the children join one by one; everyone at dusk
const KIDS = [
  { x0: 300, in: 25.9, instr: 'tin', shirt: 'shirt', main: true },
  { x0: 1050, in: 26.7, instr: 'cello', shirt: 'shirt2' },
  { x0: 1750, in: 27.8, instr: 'sax', shirt: 'shirt3' },
  { x0: 2350, in: 28.7, instr: 'tin', shirt: 'shirt4' },
  { x0: 2900, in: 29.6, instr: 'cello', shirt: 'bag2' },
];
function sAlley(t) {
  const P = PAL.dusk, u = seg(t, 25.9, 31.9), cam = lerp(0, 2500, u);
  g.drawImage(PLT.far, -cam * .25, 0); e.fillStyle = rgba('#ff9a50', .3); e.fillRect(0, 300, W, 600); lamp(null, e, 600 - cam * .25, 820, 120, '#fff0b0', .6);
  g.drawImage(PLT.mid, -cam, 0);
  for (let i = 0; i < 24; i++) { const bx = i * 180 + hash(i) * 30 - cam, bw = 160 + hash(i + 1) * 40, bh = 420 + hash(i + 2) * 200; if (bx < -200 || bx > W + 200) continue; lamp(null, e, bx + bw * .4, 1330 - bh * .5, 22, '#ffc070', .5); }
  const lead = lerp(300, 2950, u), ft = f12(t);
  KIDS.forEach((d, i) => {
    const joined = d.main || t > d.in, x = d.main ? lead : joined ? Math.max(d.x0, lead - 230 * Math.min(i, 3)) : d.x0;
    const vis = d.main ? 1 : ss(seg(t, d.in - 1.0, d.in - .5)); if (vis <= 0 || x - cam < -300 || x - cam > W + 300) return;
    g.globalAlpha = vis; A.kid(g, P, { x: x - cam, y: 1720 + (i % 2) * 80, s: 1.05, instr: d.instr, shirt: d.shirt, walk: joined ? ft * 7.5 + i : null, ph: ft * 4 + i, view: 'q', look: [.6, -.1], rim: '#ffd27a' }); g.globalAlpha = 1;
  });
  g.drawImage(PLT.near, -cam * 1.4, H - 470);
}
// stage: backlit, the audience rises
function stageFrame(t, o = {}) {
  const P = PAL.stage, crane = o.crane ?? 1, cy = lerp(1750, 1300, crane), z = lerp(1.15, 1, crane);
  g.setTransform(z, 0, 0, z, W / 2 - W / 2 * z, H / 2 - cy * z); e.setTransform(z, 0, 0, z, W / 2 - W / 2 * z, H / 2 - cy * z);
  g.drawImage(PLT.stage, 0, 0);
  for (const x of [200, 540, 880]) { const gr = e.createLinearGradient(0, 0, 0, 1450); gr.addColorStop(0, rgba('#ffe6a8', .45)); gr.addColorStop(1, rgba('#ffcf70', .08)); e.fillStyle = gr; e.beginPath(); e.moveTo(x - 30, 0); e.lineTo(x + 30, 0); e.lineTo(x + 230, 1450); e.lineTo(x - 230, 1450); e.closePath(); e.fill(); }
  for (let x = 40; x < W; x += 90) lamp(g, e, x, 1470, 14, '#ffd27a', .9);
  const ft = f12(t), ins = ['cello', 'tin', 'sax', 'tin', 'cello', 'tin', 'sax'], sh = ['shirt2', 'shirt', 'shirt3', 'shirt4', 'bag2', 'shirt', 'shirt2'];
  ins.forEach((it, i) => A.kid(g, P, { x: 110 + i * 143, y: 1450 - (i % 2) * 24, s: .62, instr: it, shirt: sh[i], ph: (t - THEME0) / BEAT * Math.PI + i * .3, view: 'q', look: [.2, .3], rim: '#ffe6a8', skinRim: '#ffe6b8' }));
  if (o.flares) for (let i = 1; i < 7; i += 2) flare(e, 110 + i * 143 + 30, 1450 - 330, .35, '#ffd8a0', { ghosts: false, streak: 300 });
  const rise = ss(seg(t, T.rise[0], T.rise[1])) * (o.allUp ? 1 : 1);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const x = 50 + i * 125 + (row % 2) * 60 + hash(i * 7 + row) * 30, y0 = 1780 + row * 150, up = (o.allUp ? 1 : rise) * (50 + hash(i + row * 9) * 60);
    g.fillStyle = '#0a0612'; g.beginPath(); g.ellipse(x, y0 - up, 52, 60, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(x, y0 + 130 - up, 84, 96, 0, 0, TAU); g.fill();
    g.strokeStyle = rgba('#ffd27a', .6); g.lineWidth = 3; g.beginPath(); g.ellipse(x, y0 - up, 52, 60, 0, -2.6, -.5); g.stroke();
    if ((o.allUp || rise > .5) && hash(i + row * 3) > .5) { g.strokeStyle = '#0a0612'; g.lineWidth = 22; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 50, y0 + 80 - up); g.lineTo(x + 80, y0 - 70 - up - 30 * Math.abs(Math.sin(ft * 9 + i))); g.stroke(); }
  }
  reset(g); reset(e);
}
function sStage(t) { stageFrame(t, { crane: ss(seg(t, 31.9, 35.4)) }); }
function sSection(t) {   // the cello and the sax up close, bows on the beat
  const P = PAL.stage, ft = f12(t), pan = lerp(0, 80, seg(t, 37.9, 40.9));
  vgrad(g, 0, 0, W, H, [[0, '#1a1230'], [1, '#2a1e3e']]);
  for (const x of [260, 820]) { const gr = e.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, rgba('#ffe6a8', .3)); gr.addColorStop(1, rgba('#ffcf70', 0)); e.fillStyle = gr; e.beginPath(); e.moveTo(x - 40, 0); e.lineTo(x + 40, 0); e.lineTo(x + 380, H); e.lineTo(x - 380, H); e.closePath(); e.fill(); }
  const ph = (t - THEME0) / BEAT * Math.PI;
  A.kid(g, P, { x: 300 - pan, y: 1880, s: 1.85, instr: 'cello', shirt: 'shirt2', ph, view: 'q', look: [.5, .5], lid: .4, rim: '#ffe6a8', skinRim: '#ffe6b8' });
  A.kid(g, P, { x: 820 - pan * .6, y: 1820, s: 1.55, instr: 'sax', shirt: 'shirt3', ph: ph + 1, view: 'q', side: -1, look: [.5, .2], lid: .5, rim: '#ffe6a8', skinRim: '#ffe6b8' });
  lamp(g, e, 300 - pan, 980, 30, '#ffe6a8', .6);
}
function sSolo(t) {
  const P = PAL.stage;
  vgrad(g, 0, 0, W, H, [[0, '#120c24'], [1, '#3a2a50']]);
  const gr = e.createRadialGradient(470, 120, 20, 470, 120, 900); gr.addColorStop(0, rgba('#ffe6a8', .35)); gr.addColorStop(1, rgba('#ffcf70', 0)); e.fillStyle = gr; e.fillRect(0, 0, W, H);
  bust(t, P, { z: 1 + .08 * ss(seg(t, 40.9, 43.9)), glow: 1, rim: '#ffe6a8', skinRim: '#ffe6b8', light: [1, -.6] });
  // light bands sweep across the held cel
  const b = ((t - 40.9) * .5) % 1; g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rgba('#ffd8a0', .12); g.translate(b * 1600 - 300, 0); g.rotate(.3); g.fillRect(0, -400, 120, 2800); g.restore();
  flare(e, 640, 240, .6, '#ffe2a8', { rot: (t - 40.9) * .2, ghostA: .5 });
}
function sTutti(t) { stageFrame(t, { crane: 1 - .35 * ss(seg(t, 43.9, 45.7)), allUp: true, flares: true }); }
function sEnd(t) {   // the first composition repainted: the hand, now holding a bow
  const P = PAL.dusk; g.drawImage(PLT.groundDusk, 0, 0); e.fillStyle = rgba('#ff9a50', .2); e.fillRect(0, 0, W, H * .4);
  A.tinViolin(g, P, { x: 40, y: 1480, ang: -.42, s: 1.45, glow: .4 }, e);
  A.bow(g, P, { x: 160, y: 960, ang: .5, s: 1.4 });
  A.handTop(g, P, { x: 470, y: 1440, ang: -.35, s: 1.6, curl: [.7, .75, .75, .8], thumb: .7, armLen: 420 });
  flare(e, 820, 540, .6, '#ffe2a8', { ghostA: .5 });
}

// ---------- subtitles (on the tape) and title ----------
function subtitle(c, t) {
  c.clearRect(0, 0, W, H);
  const s = SUBS.find(s => t >= s.t0 && t < s.t1); if (!s) return;
  c.save(); c.font = '700 54px "Gothic A1"'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
  const L = s.text.split('\n'), y0 = H - 260 - (L.length - 1) * 74;
  L.forEach((ln, i) => { c.shadowColor = 'rgba(0,0,0,.55)'; c.shadowBlur = 10; c.shadowOffsetY = 3; c.strokeStyle = '#140a1e'; c.lineWidth = 10; c.strokeText(ln, W / 2, y0 + i * 74); c.shadowColor = 'transparent'; c.fillStyle = '#fff0a0'; c.fillText(ln, W / 2, y0 + i * 74); });
  c.restore();
}
function title(t) {
  if (t < T.title) return;
  const on = f12(t) - T.title, flick = on < .5 ? (Math.floor(on * 12) % 2 ? .4 : 1) : 1;
  g.save(); g.font = '400 112px "Black Han Sans"'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  const y = 380, gr = g.createLinearGradient(0, y - 56, 0, y + 56);
  gr.addColorStop(0, '#8fd0ff'); gr.addColorStop(.46, '#ffffff'); gr.addColorStop(.5, '#6a3a9a'); gr.addColorStop(.75, '#ff7ab0'); gr.addColorStop(1, '#ffd27a');
  g.globalAlpha = flick; g.strokeStyle = '#ff5ab0'; g.lineWidth = 22; g.strokeText(TITLE.main, W / 2, y); g.strokeStyle = '#1a0a24'; g.lineWidth = 12; g.strokeText(TITLE.main, W / 2, y);
  g.fillStyle = gr; g.fillText(TITLE.main, W / 2, y);
  e.save(); e.font = g.font; e.textAlign = 'center'; e.textBaseline = 'middle'; e.globalAlpha = flick; e.strokeStyle = rgba('#ff5ab0', .9); e.lineWidth = 26; e.strokeText(TITLE.main, W / 2, y); e.restore();
  const q = ss(seg(t, T.title + .3, T.title + .5)); g.globalAlpha = q; g.font = '700 40px "Gothic A1"'; g.lineWidth = 8; g.strokeStyle = '#1a0a24'; g.strokeText(TITLE.sub, W / 2, y + 110); g.fillStyle = '#fff0a0'; g.fillText(TITLE.sub, W / 2, y + 110);
  g.restore();
  const gl = seg(t, T.title + .6, T.title + 1.4); if (gl > 0 && gl < 1) flare(e, W / 2 - 330 + gl * 660, y - 40, .35 * Math.sin(Math.PI * gl), '#ffffff', { ghosts: false, streak: 200 });
}

const SH = { hands: sHands, crane: sCrane, window: sWindow, bench: sBench, receive: sReceive, bust: sBust, alley: sAlley, stage: sStage, section: sSection, solo: sSolo, tutti: sTutti, end: sEnd };
function render(t) {
  for (const x of [g, e]) { reset(x); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); }
  const [, , name] = shotAt(t); SH[name](t);
  reset(g); reset(e); title(t);
  subtitle(ov, t);
  const fr = Math.round(t * 24);
  const flash = t >= T.note1 && t < T.note1 + 2 / 24 ? 1 : 0;   // the white flash of the first note
  const track = t >= 15.9 - 1 / 48 && t < 15.9 + 7 / 24 ? 1 - (t - 15.9) * 24 / 8 : 0;
  post.render(sc, gc, fr, ovc, { power: Math.min(1, t / .5), track, expo: 1.04 + flash * 2.5, sat: t < T.note1 ? .8 : 1.06, bloom: .55, halo: .14 });
}
window.TEXTS = t => t >= T.title + .5 ? [{ id: 'title', text: TITLE.main, x0: 120, y0: 320, x1: 960, y1: 440 }, { id: 'sub', text: TITLE.sub, x0: 200, y0: 470, x1: 880, y1: 510 }] : T.parts.slice(0, 4).flatMap((p, i) => t >= p + .2 && t < 20.5 ? [{ id: 'lab' + i, text: LABELS[i], x0: 560, y0: 324 + i * 120, x1: 900, y1: 396 + i * 120 }] : []);
window.SUBS = SUBS;
window.EV = (() => {
  const ev = [], add = (type, t, o = {}) => ev.push({ type, t: +t.toFixed(3), ...o });
  add('crton', 0.02); add('amb_dump', 0, { d: 8.4 }); add('amb_wind', 8.4, { d: 7.5 }); add('amb_room', 15.9, { d: 4.6 });
  for (let i = 0; i < 8; i++) add('clink', .4 + i * .42 + hash(i) * .15, { v: .4 + hash(i + 1) * .3 });
  add('bag', 1.1); add('grab', T.grab); add('lift', T.lift[0]); add('birds', 4.0, { d: 4 }); add('reach', T.reach[0]); add('shadow', T.shadow[0], { d: 3.2 });
  add('tapenoise', 15.9 - 1 / 48, { d: 8 / 24 });
  T.parts.forEach((p, i) => add(['hammer', 'saw', 'screw', 'fork', 'tune'][i], p));
  add('cloth', T.give[1]); add('scrape', T.scrape1); add('scrape', T.scrape2, { v: .8 }); add('flash', T.note1); add('flutter', T.note1, { d: 2.5 });
  add('amb_village', 25.9, { d: 6 }); for (let x = 25.9; x < 31.9; x += BEAT) add('step', x, { v: .35 });
  add('crowd', 31.6, { d: 14 }); add('applause', T.rise[0], { d: 3.5 }); add('applause', 43.9, { d: 2.6, v: 1.2 });
  add('amb_warm', 45.7, { d: 4.3 }); add('thunk', T.thunk);
  return ev.sort((a, b) => a.t - b.t);
})();
build();
window.render = render; window.DUR = DUR;
render(parseFloat(qs.get('t') ?? '23.5'));
window.READY = true;
