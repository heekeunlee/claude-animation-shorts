// art.js — everything painted in this film, as stroke lists in local coordinates (built once under a fixed seed)
// Every builder takes K: a palette function name → hex. Built twice with the same seed, once with the colour palette and
// once with the grey one, the two versions match stroke for stroke: colour can then bloom over grey through a mask.
import { rnd, pick, withSeed, clamp, lerp, mixc, rgba, qcurve, qctrl, polar, mk, drawS, bbox, INK, INK2, PAPER, vnoise } from './engine.js';

export const PAL = {
  sky: '#c9d6df', sky2: '#f0b48a', far: '#a9b4bd', mud: '#8a7462', mud2: '#6e5a4a', ash: '#a7a39b', shade: '#5f5a54',
  bag1: '#5d8fb5', bag2: '#e0b04a', bag3: '#7fae6a', bag4: '#c8667a', can: '#9aa3a8', bottle: '#8fc0b0', card: '#c49a6a', tire: '#3f3a38',
  skin: '#c98d68', skinS: '#a06a4c', hair: '#2e2420', shirt: '#e8c25a', shirt2: '#6fa3c8', shorts: '#4f6e8c',
  wall1: '#5fa8a0', wall2: '#f2cf6b', wall3: '#d98a7a', wall4: '#8fb070', roof: '#8f8a86', rust: '#b8693a', wood: '#a8774e', wood2: '#7a5236',
  lamp: '#f6c46a', lampD: '#d9893c', tin: '#b9c0c4', tinS: '#7d8890', accent: '#d9482b', grass: '#8fb070', plum: '#4a2f3c', wine: '#8a2f3a', gold: '#e8b04a',
};
const GREY = '#9a948a';
export const KC = n => PAL[n] || n;
// grey world: hues drained toward wet ash, values kept; the accent (the tin violin's label, the butterflies) stays
export const KG = n => n === 'accent' ? PAL.accent : n === 'lamp' || n === 'lampD' ? PAL[n] : (n === 'sky' || n === 'sky2' || n === 'far') ? mixc(PAL[n], '#d3cec4', .8) : mixc(PAL[n] || n, GREY, n === 'skin' || n === 'skinS' || n === 'hair' ? .45 : .84);

// ---------- wash items (big translucent areas) live in the same lists as strokes ----------
export function wash(pts, col, a = .5, passes = 3, jit = 6) {
  const polys = [];
  for (let p = 0; p < passes; p++) polys.push(pts.map(([x, y], i) => [x + (i % 2 ? rnd(-jit, jit) : 0), y + (i % 3 === 0 ? rnd(-jit, jit) : 0)]));
  return { wash: true, polys, col, a, pts };
}
export function ell(cx, cy, rx, ry, n = 28, wob = .06, rot = 0) {
  const o = [], s = rnd(0, 99), c = Math.cos(rot), si = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, r = 1 + wob * (vnoise(s + i * .7) * 2 - 1); const x = Math.cos(a) * rx * r, y = Math.sin(a) * ry * r; o.push([cx + x * c - y * si, cy + x * si + y * c]); }
  return o;
}
export function drawItem(c, it, p = 1, col = null, am = 1) {
  if (p <= 0) return;
  if (!it.wash) return drawS(c, it, p, col, am);
  const a = it.a * Math.min(1, p * 1.4) * am;
  for (const P of it.polys) { c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = rgba(col || it.col, a / it.polys.length * 1.6); c.fill(); }
}
export function paint(c, L, p = 1, am = 1) {
  const N = L.length; if (!N) return;
  if (p >= 1) { for (const s of L) drawItem(c, s, 1, null, am); return; }
  const dur = Math.min(.5, Math.max(.12, 4 / N));
  for (let j = 0; j < N; j++) drawItem(c, L[j], (p - j / N * (1 - dur)) / dur, null, am);
}
function box(L, pad = 8) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const s of L) {
    if (s.wash) { for (const [x, y] of s.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } continue; }
    const b = bbox([s], 0); x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]);
  }
  return [Math.floor(x0 - pad), Math.floor(y0 - pad), Math.ceil(x1 + pad), Math.ceil(y1 + pad)];
}
// rasterise a list → {cv, x0, y0}; scale > 1 keeps detail for camera pushes
export function spr(L, scale = 1) {
  const [x0, y0, x1, y1] = box(L), cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.ceil((x1 - x0) * scale)); cv.height = Math.max(1, Math.ceil((y1 - y0) * scale));
  const c = cv.getContext('2d'); c.scale(scale, scale); c.translate(-x0, -y0); for (const s of L) drawItem(c, s);
  return { cv, x0, y0, x1, y1, scale };
}
export const blit = (c, S, x = 0, y = 0, a = 1) => { if (a <= 0) return; c.globalAlpha = a; c.drawImage(S.cv, x + S.x0, y + S.y0, S.cv.width / S.scale, S.cv.height / S.scale); c.globalAlpha = 1; };

const st = (pts, w, col, o) => mk(pts, w, col, o);
// a filled shape painted as overlapping parallel strokes (watercolour "blocking in")
export function block(L, poly, col, w = 22, ang = -.35, a = .75, o = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), rot = poly.map(([x, y]) => [x * c + y * s, -x * s + y * c]);
  const v0 = Math.min(...rot.map(p => p[1])), v1 = Math.max(...rot.map(p => p[1]));
  for (let v = v0 + w * .35; v < v1; v += w * (o.gap ?? .62)) {
    const xs = [];
    for (let i = 0; i < rot.length; i++) { const A = rot[i], B = rot[(i + 1) % rot.length]; if ((A[1] - v) * (B[1] - v) < 0) xs.push(A[0] + (v - A[1]) / (B[1] - A[1]) * (B[0] - A[0])); }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const u0 = xs[k] + rnd(-2, 4), u1 = xs[k + 1] - rnd(-2, 4); if (u1 - u0 < 4) continue;
      const P = qcurve(u0, v + rnd(-2, 2), u1, v + rnd(-2, 2), rnd(-3, 3), Math.max(4, Math.round((u1 - u0) / 30))).map(([u, vv]) => [u * c - vv * s, u * s + vv * c]);
      L.push(st(P, w * rnd(.85, 1.15), col, { prof: 'even', a: a * rnd(.8, 1), nb: o.nb ?? undefined, rough: .3 }));
    }
  }
}

// ---------- trash ----------
export function trashBits(L, K, x0, y0, x1, y1, n, sz = 1) {
  const kinds = ['bag1', 'bag2', 'bag3', 'bag4', 'can', 'can', 'bottle', 'bottle', 'card', 'card', 'card', 'ash', 'ash', 'mud2', 'mud2'];
  for (let i = 0; i < n; i++) {
    const x = rnd(x0, x1), y = rnd(y0, y1), k = pick(kinds), a = rnd(0, Math.PI), s = sz * rnd(.6, 1.4);
    if (k === 'bottle') { L.push(st(polar(x, y, a, 46 * s, 2, 6), 15 * s, K('bottle'), { prof: 'even', a: .7, nb: 2 })); L.push(st(polar(x + Math.cos(a) * 46 * s, y + Math.sin(a) * 46 * s, a, 12 * s, 0, 3), 6 * s, K('bottle'), { prof: 'even', a: .8, nb: 0 })); }
    else if (k === 'can') { L.push(st(polar(x, y, a, 26 * s, 0, 4), 20 * s, K('can'), { prof: 'even', a: .8, nb: 3 })); L.push(st(polar(x, y, a + 1.57, 9 * s, 0, 3), 3 * s, K('tinS'), { prof: 'even', a: .7, nb: 0 })); }
    else if (k === 'tire') { const P = ell(x, y, 24 * s, 12 * s, 18, .05, a * .3); P.push(P[0]); L.push(st(P, 9 * s, K('tire'), { prof: 'even', a: .75, nb: 3 })); }
    else if (k === 'card') { L.push(st(polar(x, y, a, 60 * s, rnd(-6, 6), 6), 24 * s, K('card'), { prof: 'even', a: .6, nb: 4 })); }
    else L.push(st(polar(x, y, a, rnd(20, 44) * s, rnd(-8, 8), 6), rnd(16, 30) * s, K(k), { prof: 'leaf', a: rnd(.5, .78), nb: 3 }));
  }
}
// a heap: a wash body + a jagged crest + bits
export function heap(L, K, pts, n, sz = 1, col = 'mud') {
  L.push(wash(pts, K(col), .55, 3, 7));
  let xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  trashBits(L, K, Math.min(...xs) + 20, Math.min(...ys) + 10, Math.max(...xs) - 20, Math.max(...ys), n, sz);
}

// ---------- hands ----------
// a capsule polygon between two points with end radii (fingers, forearms)
export function capsule(x0, y0, x1, y1, r0, r1, n = 8) {
  const a = Math.atan2(y1 - y0, x1 - x0), o = [];
  for (let i = 0; i <= n; i++) { const q = a + Math.PI / 2 + Math.PI * i / n; o.push([x1 + Math.cos(q - Math.PI) * r1, y1 + Math.sin(q - Math.PI) * r1]); }
  for (let i = 0; i <= n; i++) { const q = a + Math.PI / 2 + Math.PI * i / n; o.push([x0 + Math.cos(q) * r0, y0 + Math.sin(q) * r0]); }
  return o;
}
function limb(L, K, P, r0, r1, col = 'skin', a = .8) {   // a painted finger/forearm: wash + a shadow edge stroke
  const [[x0, y0], [x1, y1]] = P;
  L.push(wash(capsule(x0, y0, x1, y1, r0, r1), K(col), a, 2, 1.5));
  const nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny) || 1;
  L.push(mk([[x0 + nx / l * r0 * .6, y0 + ny / l * r0 * .6], [x1 + nx / l * r1 * .5, y1 + ny / l * r1 * .5]], Math.max(3, r1 * .5), K('skinS'), { prof: 'even', a: .35, nb: 0, rough: .3 }));
}
// a child's hand, palm down, fingers toward -y in local coords, wrist at the origin; curl bends the fingers in
export function hand(L, K, x, y, ang = 0, s = 1, curl = .2, o = {}) {
  const c = Math.cos(ang), si = Math.sin(ang), T = ([u, v]) => [x + (u * c - v * si) * s, y + (u * si + v * c) * s];
  limb(L, K, [T([0, o.arm ?? 300]), T([0, 0])], 44 * s, 40 * s);
  L.push(wash(ell(...T([0, -62]), 58 * s, 70 * s, 20, .05, ang), K('skin'), .82, 2, 1.5));
  for (const [fx, len, r] of [[-40, 66, 13], [-14, 80, 14], [12, 78, 14], [36, 60, 12]]) {
    const b0 = T([fx, -112]), mid = T([fx * 1.05, -112 - len * (1 - curl * .5) * .55]), tip = T([fx * 1.1, -112 - len * (1 - curl)]);
    limb(L, K, [b0, mid], r * s, r * .95 * s); limb(L, K, [mid, tip], r * .95 * s, r * .85 * s);
    L.push(mk(ell(...mid, r * .35 * s, r * .2 * s, 8), 2.5 * s, K('skinS'), { prof: 'even', a: .45, nb: 0 }));
  }
  limb(L, K, [T([46, -30]), T([78, -74])], 17 * s, 15 * s); limb(L, K, [T([78, -74]), T([86, -108])], 15 * s, 13 * s);
  if (o.dirt !== false) for (let i = 0; i < 7; i++) { const u = rnd(-45, 45), v = rnd(-170, -30); L.push(mk(polar(...T([u, v]), rnd(0, 3), rnd(6, 16) * s, 2, 3), rnd(5, 9) * s, K('mud2'), { prof: 'leaf', a: .5, nb: 0 })); }
}
// palm up (receiving), wrist at the origin, fingers toward -y; side mirrors left/right
export function palmUp(L, K, x, y, ang, s = 1, side = 1) {
  const c = Math.cos(ang), si = Math.sin(ang), T = ([u, v]) => [x + (u * side * c - v * si) * s, y + (u * side * si + v * c) * s];
  limb(L, K, [T([0, 320]), T([0, 0])], 46 * s, 42 * s);
  L.push(wash(ell(...T([0, -60]), 60 * s, 72 * s, 20, .05, ang), K('skin'), .85, 2, 1.5));
  L.push(mk(qctrl(...T([-30, -30]), ...T([0, -60]), ...T([28, -96]), 5), 5 * s, K('skinS'), { prof: 'tip', a: .5, nb: 0 }));
  for (const [fx, len, r] of [[-38, 60, 12], [-13, 74, 13], [12, 72, 13], [35, 56, 11]]) limb(L, K, [T([fx, -116]), T([fx * 1.15, -116 - len])], r * s, r * .85 * s);
  limb(L, K, [T([-50, -40]), T([-92, -100])], 17 * s, 14 * s);
}

// ---------- the girl ----------
// standing / crouching / playing silhouette, painted small (wide shots), local origin at the feet, height ~ 200 * s
export function girlSmall(L, K, x, y, s = 1, pose = 'stand', o = {}) {
  const T = ([u, v]) => [x + u * s, y + v * s];
  if (pose === 'crouch') {
    L.push(st([[-14, 0], [-10, -40], [10, -46]].map(T), 16 * s, K('skinS'), { prof: 'even', a: .8, nb: 2 }));
    L.push(st([[10, 0], [16, -38], [10, -46]].map(T), 16 * s, K('skin'), { prof: 'even', a: .8, nb: 2 }));
    L.push(st([[0, -46], [16, -84], [30, -104]].map(T), 50 * s, K('shirt'), { prof: 'leaf', a: .8, nb: 4 }));
    L.push(st([[30, -98], [52, -72], [62, -40]].map(T), 13 * s, K('skin'), { prof: 'tip', a: .85, nb: 2 }));
    L.push(st(ell(...T([40, -122]), 19 * s, 21 * s, 14), 14 * s, K('skin'), { prof: 'even', a: .7, nb: 0 }));
    L.push(st(qctrl(22, -140, 40, -150, 60, -128, 6).map(T), 22 * s, K('hair'), { prof: 'leaf', a: .9, nb: 3 }));
    L.push(st([[-30, -10], [-44, -60], [-26, -88]].map(T), 40 * s, K('card'), { prof: 'leaf', a: .7, nb: 3 }));
    return;
  }
  const shirt = o.shirt || 'shirt';
  L.push(st([[-8, 0], [-8, -70]].map(T), 14 * s, K('skinS'), { prof: 'even', a: .85, nb: 2 }));
  L.push(st([[8, 0], [8, -70]].map(T), 14 * s, K('skin'), { prof: 'even', a: .85, nb: 2 }));
  L.push(st([[0, -62], [0, -140]].map(T), 56 * s, K(shirt), { prof: 'leaf', a: .82, nb: 4 }));
  L.push(st(ell(...T([2, -162]), 18 * s, 20 * s, 14), 15 * s, K('skin'), { prof: 'even', a: .75, nb: 0 }));
  L.push(st(qctrl(-20, -166, 0, -196, 22, -164, 6).map(T), 24 * s, K('hair'), { prof: 'leaf', a: .9, nb: 3 }));
  if (pose === 'play') {   // violin on the left shoulder, bow arm
    L.push(st([[-6, -140], [-40, -146], [-62, -150]].map(T), 10 * s, K('skin'), { prof: 'even', a: .85, nb: 0 }));
    L.push(st([[8, -150], [40, -158], [74, -168]].map(T), 14 * s, K('tin'), { prof: 'even', a: .9, nb: 2 }));
    L.push(st([[12, -152], [30, -156]].map(T), 9 * s, K('accent'), { prof: 'even', a: .9, nb: 0 }));
    L.push(st([[-40, -120], [10, -158], [60, -196]].map(T), 3 * s, K('wood2'), { prof: 'even', a: .9, nb: 0 }));
  } else {
    L.push(st([[-22, -132], [-26, -96], [-24, -70]].map(T), 11 * s, K('skin'), { prof: 'tip', a: .85, nb: 0 }));
    L.push(st([[22, -132], [26, -96], [24, -70]].map(T), 11 * s, K('skin'), { prof: 'tip', a: .85, nb: 0 }));
  }
}

// the girl's head and shoulders for the close shots, local origin at the chin. Returns {L, hair}: the fringe is
// drawn last so the bow arm and the violin pass under it
export function girlBust(K, o = {}) {
  const L = [], sh = K(o.shirt || 'shirt');
  // background: a shack wall and a strip of sky (they bloom too)
  L.push(wash([[-700, -1100], [700, -1100], [700, 1100], [-700, 1100]], K(o.wall || 'wall1'), .45, 3, 10));
  for (let x = -680; x < 700; x += 40) L.push(mk([[x, -1100], [x + rnd(-4, 4), 1100]], 14, K('shade'), { prof: 'even', a: .1, nb: 0 }));
  L.push(wash([[-700, -1100], [-260, -1100], [-300, -420], [-700, -380]], K('sky'), .5, 3, 8));
  const body = [...qctrl(-90, 120, -260, 160, -420, 330, 8), ...qctrl(-420, 330, -520, 420, -560, 1100, 6), [560, 1100], ...qctrl(540, 420, 470, 300, 320, 250, 6).reverse().reverse(), ...qctrl(320, 250, 160, 160, 40, 120, 8)];
  L.push(wash(body, sh, .72, 3, 5));
  block(L, body, sh, 48, -.5, .32);
  L.push(mk(qctrl(-60, 150, -10, 190, 50, 150, 6), 14, K('shade'), { prof: 'leaf', a: .35, nb: 0 }));       // collar
  L.push(wash(capsule(-30, 150, -20, -40, 62, 58), K('skin'), .8, 2, 2));                                     // neck
  L.push(mk([[-70, 120], [-60, -20]], 26, K('skinS'), { prof: 'even', a: .35, nb: 0 }));
  L.push(wash([[-205, -40], [-215, -220], [-150, -350], [-20, -392], [120, -350], [185, -220], [175, -40], [100, -60], [-130, -60]], K('hair'), .88, 3, 4));   // the bob, behind the face
  const face = ell(-20, -165, 148, 182, 30, .035, .04);
  L.push(wash(face, K('skin'), .82, 3, 3));
  block(L, face, K('skin'), 40, .2, .28);
  L.push(mk(qctrl(-165, -110, -150, -10, -40, 14, 8), 26, K('skinS'), { prof: 'leaf', a: .3, nb: 0 }));
  L.push(wash(ell(-110, -105, 34, 20, 12), K('bag4'), .22, 2, 2)); L.push(wash(ell(70, -100, 30, 18, 12), K('bag4'), .18, 2, 2));
  L.push(mk(qctrl(-110, -172, -82, -156, -54, -172, 6), 4.5, INK2, { prof: 'even', a: .85, nb: 0 }));
  L.push(mk(qctrl(14, -168, 42, -152, 70, -166, 6), 4.5, INK2, { prof: 'even', a: .85, nb: 0 }));
  for (const [x, d] of [[-62, 1], [64, 1]]) L.push(mk(qctrl(x, -170, x + 6 * d, -164, x + 10 * d, -160, 3), 2.5, INK2, { prof: 'tip', a: .7, nb: 0 }));
  L.push(mk(qctrl(-118, -222, -84, -236, -50, -226, 6), 5.5, INK2, { prof: 'brush', a: .55, nb: 0 }));
  L.push(mk(qctrl(10, -222, 42, -236, 76, -222, 6), 5.5, INK2, { prof: 'brush', a: .55, nb: 0 }));
  L.push(mk(qctrl(-22, -150, -36, -100, -16, -92, 5), 4, K('skinS'), { prof: 'even', a: .7, nb: 0 }));
  L.push(mk(qctrl(-52, -42, -26, -32, 0, -44, 5), 6, '#a54a3c', { prof: 'leaf', a: .65, nb: 0 }));
  const hair = [];
  for (let i = 0; i < 18; i++) { const x = lerp(-150, 130, i / 17); hair.push(mk(qcurve(x * .6 - 10, -385, x + rnd(-8, 8), -250 + Math.abs(x) * .25, rnd(-14, 14), 7), rnd(16, 26), K('hair'), { prof: 'tip', a: rnd(.6, .9), nb: 3 })); }
  for (const sd of [-1, 1]) for (let i = 0; i < 7; i++) { const x = sd * (150 + i * 8) - 20; hair.push(mk(qcurve(x - sd * 30, -320, x + sd * 10, -50 - rnd(0, 30), sd * rnd(6, 20), 8), rnd(12, 22), K('hair'), { prof: 'tip', a: rnd(.55, .85), nb: 3 })); }
  return { L, hair };
}

// ---------- violins ----------
// the tin violin, length ~ 640 * s, lying along +x from the tail (fork) at the origin; built in parts for the specimen plate
export function tinViolin(K, s = 1) {
  const T = ([u, v]) => [u * s, v * s], parts = [[], [], [], [], []];
  // 0 body: a biscuit tin, crimped edges, the vermilion printed band
  const body = [[20, -110], [250, -110], [270, -90], [270, 90], [250, 110], [20, 110], [0, 90], [0, -90]].map(T);
  parts[0].push(wash(body, K('tin'), .7, 3, 3));
  block(parts[0], body, K('tin'), 34 * s, 1.2, .45);
  parts[0].push(st([[10, 112], [140, 116], [262, 112]].map(T), 10 * s, K('tinS'), { prof: 'even', a: .7, nb: 3 }));
  parts[0].push(st([[10, -112], [140, -116], [262, -112]].map(T), 7 * s, K('tinS'), { prof: 'even', a: .55, nb: 2 }));
  parts[0].push(st([[118, -108], [120, 0], [118, 108]].map(T), 70 * s, K('accent'), { prof: 'even', a: .8, nb: 6 }));
  for (let i = 0; i < 4; i++) parts[0].push(st(qcurve(...T([96, -60 + i * 34]), ...T([142, -56 + i * 34]), 3, 5), 6 * s, '#f6e7c8', { prof: 'even', a: .7, nb: 0 }));
  parts[0].push(st(ell(...T([190, 0]), 22 * s, 30 * s, 12), 6 * s, INK2, { prof: 'even', a: .7, nb: 0 }));    // sound hole punched in the lid
  // 1 neck + fingerboard: a plank
  parts[1].push(st([[250, 0], [440, 0], [560, 0]].map(T), 34 * s, K('wood'), { prof: 'even', a: .85, nb: 5 }));
  parts[1].push(st([[150, 0], [420, 0]].map(T), 22 * s, K('wood2'), { prof: 'even', a: .7, nb: 3 }));
  // 2 peg box: the meat-tenderiser head with its studs, pegs from a gnocchi board's handle
  const hb = [[560, -34], [640, -34], [640, 34], [560, 34]].map(T);
  parts[2].push(wash(hb, K('tinS'), .75, 3, 2));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) parts[2].push(st(ell(...T([574 + i * 20, -20 + j * 20]), 3.5 * s, 3.5 * s, 6), 4 * s, INK2, { prof: 'even', a: .6, nb: 0 }));
  for (const [u, sd] of [[578, -1], [600, 1], [618, -1], [636, 1]]) parts[2].push(st([[u, sd * 30], [u + 4, sd * 66]].map(T), 12 * s, K('wood'), { prof: 'tip', a: .85, nb: 0 }));
  // 3 tailpiece: a bent fork, tines toward the bridge
  parts[3].push(st([[-60, 0], [0, 0], [30, 0]].map(T), 12 * s, K('tinS'), { prof: 'even', a: .85, nb: 2 }));
  for (const v of [-15, -5, 5, 15]) parts[3].push(st([[30, v * .6], [62, v]].map(T), 4 * s, K('tinS'), { prof: 'tip', a: .9, nb: 0 }));
  parts[3].push(st([[150, -40], [150, 40]].map(T), 9 * s, K('wood2'), { prof: 'even', a: .9, nb: 0 }));          // bridge
  // 4 strings
  for (const v of [-13, -4.5, 4.5, 13]) parts[4].push(st([[62, v], [150, v * 1.05], [570, v * .7]].map(T), 1.8 * s, INK, { prof: 'even', a: .8, nb: 0, rough: .05 }));
  return parts;
}
export function bow(K, s = 1) {
  return [st([[0, 0], [620 * s, 0]], 6 * s, K('wood2'), { prof: 'even', a: .9, nb: 0 }),
    st([[18 * s, 14 * s], [610 * s, 6 * s]], 2.4 * s, '#e9e1cf', { prof: 'even', a: .9, nb: 0 }),
    st([[0, -4 * s], [40 * s, -4 * s]], 16 * s, INK2, { prof: 'even', a: .85, nb: 0 })];
}
// a proper violin (the teacher's): warm varnish, f-holes
export function realViolin(K, s = 1) {
  const L = [], T = ([u, v]) => [u * s, v * s];
  const out = [[0, 0], [8, -60], [50, -84], [100, -72], [124, -44], [150, -46], [176, -76], [240, -84], [284, -56], [292, 0], [284, 56], [240, 84], [176, 76], [150, 46], [124, 44], [100, 72], [50, 84], [8, 60]].map(T);
  L.push(wash(out, K('lampD'), .85, 3, 1.5));
  block(L, out, K('rust'), 26 * s, 1.3, .45);
  L.push(mk([[292, 0], [500, 0]].map(T), 20 * s, INK2, { prof: 'even', a: .85, nb: 0 }));
  L.push(wash(ell(...T([520, 0]), 26 * s, 18 * s, 12), INK2, .85, 2, 1));
  return L;
}
// ---------- buildings ----------
export function shack(L, K, x, y, w, h, wallK, o = {}) {
  const wall = [[x, y], [x, y - h], [x + w, y - h - 6], [x + w, y]];
  L.push(wash(wall, K(wallK), .62, 3, 4));
  for (let u = x + 10; u < x + w - 6; u += rnd(16, 30)) L.push(st([[u, y], [u + rnd(-2, 2), y - h]], rnd(5, 9), K(o.rib || 'shade'), { prof: 'even', a: rnd(.12, .25), nb: 0 }));
  L.push(st([[x - 16, y - h + 4], [x + w * .5, y - h - 12], [x + w + 18, y - h - 4]], 22, K('roof'), { prof: 'even', a: .82, nb: 5 }));
  if (o.door) L.push(st([[x + w * .3, y], [x + w * .3, y - h * .62]], w * .2, K('shade'), { prof: 'even', a: .55, nb: 3 }));
  if (o.win) L.push(st([[x + w * .62, y - h * .62], [x + w * .82, y - h * .62]], h * .22, K(o.win), { prof: 'even', a: .7, nb: 2 }));
}
// a kid (alley / stage), local origin at the feet, height ~ 260 * s; walk phase ph (radians); instr 'tin'|'cello'|'sax'|null
export function kid(K, x, y, s, ph, instr, shirt, walk = 1) {
  const L = [], T = ([u, v]) => [x + u * s, y + v * s], sw = Math.sin(ph) * walk, lift = Math.max(0, Math.cos(ph)) * walk;
  L.push(st([[0, -96], [-sw * 18, -50], [-sw * 26, -4 + Math.max(0, -Math.cos(ph)) * walk * -10]].map(T), 17 * s, K('skinS'), { prof: 'even', a: .85, nb: 2 }));
  L.push(st([[0, -96], [sw * 18, -50], [sw * 26, -4 - lift * 10]].map(T), 17 * s, K('skin'), { prof: 'even', a: .85, nb: 2 }));
  L.push(st([[0, -86], [0, -180]].map(T), 66 * s, K(shirt), { prof: 'leaf', a: .82, nb: 4 }));
  L.push(st(ell(...T([2, -208]), 22 * s, 25 * s, 14), 18 * s, K('skin'), { prof: 'even', a: .78, nb: 0 }));
  L.push(st(qctrl(-24, -212, 0, -248, 26, -210, 6).map(T), 26 * s, K('hair'), { prof: 'leaf', a: .9, nb: 3 }));
  if (instr === 'cello') {   // an oil drum on a stick, carried on the back like a cello
    L.push(st([[-30, -40], [-30, -150]].map(T), 70 * s, K('rust'), { prof: 'even', a: .9, nb: 5 }));
    L.push(st([[-30, -150], [-30, -260]].map(T), 10 * s, K('wood2'), { prof: 'even', a: .9, nb: 0 }));
    L.push(st([[-62, -96], [2, -96]].map(T), 5 * s, K('tinS'), { prof: 'even', a: .6, nb: 0 }));
  } else if (instr === 'sax') {  // a drain pipe with spoon keys
    L.push(st(qctrl(20, -170, 34, -110, 26, -70, 6).map(T), 13 * s, K('tinS'), { prof: 'even', a: .9, nb: 2 }));
    L.push(st(qctrl(26, -70, 26, -50, 50, -60, 4).map(T), 22 * s, K('tinS'), { prof: 'tip', a: .9, nb: 2 }));
    for (let i = 0; i < 3; i++) L.push(st(ell(...T([30, -150 + i * 22]), 5 * s, 3 * s, 6), 4 * s, K('can'), { prof: 'even', a: .8, nb: 0 }));
  } else if (instr === 'tin') {
    L.push(st([[8, -176], [52, -186], [96, -196]].map(T), 15 * s, K('tin'), { prof: 'even', a: .9, nb: 2 }));
    L.push(st([[14, -178], [32, -182]].map(T), 10 * s, K('accent'), { prof: 'even', a: .9, nb: 0 }));
  }
  L.push(st([[-20, -170], [-28, -130], [-24, -100]].map(T), 12 * s, K('skin'), { prof: 'tip', a: .85, nb: 0 }));
  L.push(st([[22, -170], [28, -130], [24, -100]].map(T), 12 * s, K('skin'), { prof: 'tip', a: .85, nb: 0 }));
  return L;
}
// a butterfly: two wing pairs as leaf dabs, open fraction f (flap)
export function butterfly(c, x, y, sz, ang, f, col, a = .9) {
  c.save(); c.translate(x, y); c.rotate(ang);
  for (const sd of [-1, 1]) {
    c.save(); c.scale(sd * (.25 + .75 * f), 1);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(sz * .9, -sz * 1.2, sz * 1.5, -sz * .2, 0, 0); c.fillStyle = rgba(col, a * .75); c.fill();
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(sz * .8, sz * .2, sz * 1.0, sz * .9, 0, sz * .25); c.fillStyle = rgba(col, a * .6); c.fill();
    c.restore();
  }
  c.strokeStyle = rgba(INK, .7); c.lineWidth = Math.max(1, sz * .08); c.beginPath(); c.moveTo(0, -sz * .3); c.lineTo(0, sz * .4); c.stroke();
  c.restore();
}
