// art.js — cels (characters, hands, instruments, trash) and painted plates for the film. All cels: flat fill, hard shadow,
// hard highlight, coloured line (cel.js). Plates: gradients and airbrush, painted once at load.
import { W, H, TAU, cel, path, poly, line, limb, ribbon, airbrush, vgrad, mix, rgba, rng, hash, canvas, LWK } from './cel.js';
import { head80 } from './head80.js';

export const st = (c, o = {}) => ({ f: c.f, s: c.s, h: c.h, l: c.l, lw: o.lw ?? 2.4, so: o.so ?? [-8, -8], ho: o.ho, ...o.x });
const rot = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

// ---------- hands ----------
// a child's hand seen from above, palm down, wrist at (0,0), fingers toward -y. curl[i] 0 = flat … 1 = closed fist.
// Seen from above a curling finger foreshortens: each phalanx's projected length shrinks by cos(bend) and the knuckles show.
export function handTop(g, P, o = {}) {
  const S = o.skin || P.skin, s = o.s ?? 1, curl = o.curl || [.2, .2, .2, .2], th = o.thumb ?? .2, side = o.side ?? 1;
  g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s * side, s);
  const SS = { f: S.f, s: S.s, h: S.h, l: S.l, lw: 2.6 };
  if (o.arm !== false) cel(g, limb([0, o.armLen ?? 330], [0, 6], 104, 92), { ...SS, so: [-10, 0], ho: [6, 0], ...(o.sleeve ? { clipFn: gg => { gg.fillStyle = o.sleeve.f; gg.fillRect(-80, (o.armLen ?? 330) - 120, 160, 200); } } : {}) });
  // palm (back of the hand)
  cel(g, [[-50, 10], [-60, -40], [-58, -100], [-46, -126], [-14, -134], [18, -132], [46, -122], [58, -96], [56, -40], [46, 10]], { ...SS, so: [-9, -4], ho: [5, 3], sh: [[[30, -20], [56, -40], [56, 10], [40, 12]]] });
  // tendons and knuckle marks
  for (const x of [-30, -8, 14, 36]) line(g, [[x * .6, -30], [x, -112]], rgba(S.l, .35), 1.6);
  const F = [[-40, -118, 58], [-14, -128, 70], [12, -128, 68], [37, -116, 52]];
  F.forEach(([fx, fy, len], i) => {
    const c = curl[i] ?? .2, segL = [len * .46, len * .32, len * .24], bends = [c * .9, c * 1.25, c * .9], w = [26, 23, 20];
    let x = fx, y = fy, a = 0;
    const drift = (i - 1.5) * .05;
    for (let k = 0; k < 3; k++) {
      a += bends[k];
      const L = segL[k] * Math.max(.18, Math.cos(Math.min(a, 1.5))), nx = x + Math.sin(drift) * L, ny = y - Math.cos(drift) * L;
      cel(g, limb([x, y], [nx, ny], w[k], w[k] * .92), { ...SS, so: [-6, -2], ho: [3, 2] });
      if (k > 0) line(g, [[x - w[k] * .35, y + 2], [x + w[k] * .35, y + 2]], rgba(S.l, .5), 1.4);   // joint crease
      x = nx; y = ny;
    }
    if (c < .75) { const nail = new Path2D(); nail.ellipse(x, y + 7, 7.5, 9 * (1 - c * .6), 0, 0, TAU); cel(g, nail, { f: S.h, l: rgba(S.l, .6), lw: 1.2 }); }
    else cel(g, [[x - 11, y - 4], [x + 11, y - 4], [x + 9, y + 8], [x - 9, y + 8]], { f: S.s, l: S.l, lw: 1.6 });   // knuckle ridge of a closed finger
  });
  // thumb, from the side of the palm
  { const a0 = -.75 + th * .9, b = [50, -36], m = [b[0] + Math.sin(-a0) * -40 + 34, b[1] - 34], t2 = [m[0] + 18 - th * 30, m[1] - 34 + th * 10];
    cel(g, limb(b, m, 34, 28), { ...SS, so: [-6, -3] }); cel(g, limb(m, t2, 28, 23), { ...SS, so: [-5, -3] });
    if (th < .7) { const n = new Path2D(); n.ellipse(t2[0], t2[1] + 5, 7, 8, -.4, 0, TAU); cel(g, n, { f: S.h, l: rgba(S.l, .6), lw: 1.2 }); } }
  // dirt on the fingers (the opening only)
  if (o.dirt) { g.fillStyle = rgba('#5a4636', .45); for (let k = 0; k < 9; k++) { g.beginPath(); g.ellipse(-46 + hash(k) * 92, -150 + hash(k + 9) * 130, 4 + hash(k + 3) * 6, 2 + hash(k + 5) * 4, hash(k) * 3, 0, TAU); g.fill(); } }
  g.restore();
}
// palms up, receiving: wrist at (0,0), fingers toward -y, cupped by `cup`
export function handUp(g, P, o = {}) {
  const S = o.skin || P.skin, s = o.s ?? 1, side = o.side ?? 1, cup = o.cup ?? .3;
  g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s * side, s);
  const SS = { f: S.f, s: S.s, h: S.h, l: S.l, lw: 2.6 };
  cel(g, limb([0, 340], [0, 6], 100, 92), { ...SS, so: [-10, 0], ho: [6, 0] });
  cel(g, [[-52, 10], [-62, -40], [-56, -104], [-40, -124], [16, -128], [44, -116], [56, -90], [56, -40], [46, 10]], { f: mix(S.f, S.h, .45), s: S.f, h: S.h, l: S.l, lw: 2.6, so: [-6, -6] });
  line(g, [[-40, -40], [-6, -70], [36, -76]], rgba(S.l, .55), 1.6); line(g, [[-44, -14], [0, -30], [40, -46]], rgba(S.l, .45), 1.4);
  for (const [fx, len] of [[-36, 62], [-12, 74], [12, 72], [34, 56]]) { const tip = [fx * 1.1, -124 - len * (1 - cup * .5)]; cel(g, limb([fx, -118], tip, 25, 21), { ...SS, so: [-5, -3] }); line(g, [[fx - 8, -150], [fx + 8, -150]], rgba(S.l, .4), 1.3); }
  cel(g, limb([-52, -40], [-96, -96], 32, 26), { ...SS, so: [-5, -3] });
  g.restore();
}
// the carpenter's hand from the side holding a part (pinch): wrist at (0,0), fingers toward +x
export function handGrip(g, P, o = {}) {
  const S = P.skinK, s = o.s ?? 1;
  g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s * (o.side ?? 1), s);
  const SS = { f: S.f, s: S.s, h: S.h, l: S.l, lw: 2.8 };
  cel(g, limb([-420, 30], [-10, 0], 130, 112), { ...SS, so: [0, -14], ho: [0, 6] });
  cel(g, [[-30, -56], [70, -66], [120, -40], [126, 20], [80, 56], [-30, 56]], { ...SS, so: [0, -12], ho: [0, 5] });
  for (let i = 0; i < 4; i++) { const y = -40 + i * 26; cel(g, limb([110, y], [176 - i * 8, y + 22], 30, 26), { ...SS, so: [0, -6] }); }
  cel(g, limb([60, -60], [150, -96], 36, 30), { ...SS, so: [-4, -6] });
  line(g, [[0, -20], [90, -24]], rgba(S.l, .4), 1.6);
  g.restore();
}

// ---------- instruments and props ----------
// the tin violin lying along +x from its tail (fork) at (0,0); len ≈ 640 * s. glow: true also paints its light into e
export function tinViolin(g, P, o = {}, e = null) {
  const s = o.s ?? 1, parts = o.parts ?? 5;
  g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s, s);
  const T = st(P.tin, { so: [0, -10], ho: [0, 6] });
  if (parts > 1) { cel(g, poly([[250, -16], [560, -12], [560, 12], [250, 16]]), st(P.wood, { so: [0, -6] })); cel(g, poly([[150, -11], [420, -9], [420, 9], [150, 11]]), st(P.wood, { so: [0, -4], x: { f: P.wood.s } })); }
  if (parts > 0) {
    const body = path([[20, -110, 1], [250, -110, 1], [270, -90], [270, 90], [250, 110, 1], [20, 110, 1], [0, 90], [0, -90]]);
    cel(g, body, { ...T, hi: [[[40, -100], [240, -100], [240, -84], [40, -84]]] });
    cel(g, poly([[92, -109], [150, -109], [150, 109], [92, 109]]), st(P.accent, { so: [0, -8] }));
    for (let i = 0; i < 4; i++) line(g, [[100, -60 + i * 34], [142, -56 + i * 34]], rgba('#fff4e0', .8), 3);
    const hole = new Path2D(); hole.ellipse(200, 0, 22, 30, 0, 0, TAU); cel(g, hole, { f: '#1a1418', l: P.tin.l, lw: 2 });
    for (const y of [-110, 110]) for (let x = 24; x < 250; x += 16) line(g, [[x, y - 3], [x + 8, y + 3]], rgba(P.tin.l, .45), 1.2);   // crimped rim
  }
  if (parts > 2) {   // the peg box: a meat-tenderiser head with studs, pegs from a gnocchi board's handle
    cel(g, poly([[556, -36], [644, -36], [644, 36], [556, 36]]), st(P.pipe, { so: [0, -6] }));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const d = new Path2D(); d.arc(570 + i * 22, -20 + j * 20, 4, 0, TAU); g.fillStyle = P.pipe.s; g.fill(d); }
    for (const [u, sd] of [[576, -1], [598, 1], [618, -1], [638, 1]]) cel(g, limb([u, sd * 34], [u + 4, sd * 70], 13, 10), st(P.wood, { so: [-2, 0] }));
  }
  if (parts > 3) {   // tailpiece: a bent fork
    cel(g, limb([-64, 0], [30, 0], 14, 12), st(P.pipe, { so: [0, -3] }));
    for (const v of [-14, -5, 5, 14]) line(g, [[28, v * .6], [64, v]], P.pipe.l, 3);
    cel(g, poly([[146, -42], [156, -42], [156, 42], [146, 42]]), st(P.wood, { so: [0, -2] }));
  }
  if (parts > 4) for (const v of [-13, -4.5, 4.5, 13]) line(g, [[62, v], [150, v * 1.05], [572, v * .7]], rgba('#f4f0e6', .95), 1.6);
  g.restore();
  if (e && o.glow) {   // backlit: the violin shines through the frame
    e.save(); e.translate(o.x || 0, o.y || 0); e.rotate(o.ang || 0); e.scale(s, s);
    const gr = e.createRadialGradient(140, 0, 10, 140, 0, 420); gr.addColorStop(0, rgba('#ffe2a0', o.glow)); gr.addColorStop(.4, rgba('#ff9a50', o.glow * .5)); gr.addColorStop(1, rgba('#ff6a30', 0));
    e.fillStyle = gr; e.fillRect(-300, -420, 1000, 840);
    e.strokeStyle = rgba('#fff2c8', o.glow); e.lineWidth = 3; for (const v of [-13, -4.5, 4.5, 13]) { e.beginPath(); e.moveTo(62, v); e.lineTo(572, v * .7); e.stroke(); }
    e.restore();
  }
}
export function bow(g, P, o = {}) {
  const s = o.s ?? 1; g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s, s);
  cel(g, poly([[0, -5], [620, -3], [620, 3], [0, 5]]), st(P.wood, { so: [0, -2], lw: 1.6 }));
  line(g, [[16, 14], [612, 6]], rgba('#f6f0e0', .95), 2.4);
  cel(g, poly([[-4, -10], [46, -10], [46, 16], [-4, 16]]), st(P.phone, { so: [0, -3], lw: 1.6 }));
  g.restore();
}
// an oil-drum cello standing on its spike, origin at the floor
export function oilCello(g, P, o = {}) {
  const s = o.s ?? 1; g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s, s);
  line(g, [[0, 0], [0, -60]], P.pipe.l, 5);
  cel(g, path([[-120, -60, 1], [120, -60, 1], [124, -420], [120, -440, 1], [-120, -440, 1], [-124, -420]]), { ...st(P.rust, { so: [-14, 0], ho: [8, 0] }), hi: [[[-70, -430], [-50, -430], [-50, -70], [-70, -70]]] });
  for (const y of [-160, -340]) line(g, [[-122, y], [122, y]], P.rust.l, 3);
  cel(g, poly([[-16, -440], [16, -440], [12, -820], [-12, -820]]), st(P.wood, { so: [-4, 0] }));
  cel(g, poly([[-30, -820], [30, -820], [26, -880], [-26, -880]]), st(P.pipe, { so: [-3, 0] }));
  for (const x of [-9, -3, 3, 9]) line(g, [[x * 1.4, -120], [x, -800]], rgba('#f4f0e6', .9), 1.6);
  g.restore();
}
// a drain-pipe saxophone with spoon keys, origin at the mouthpiece, length ≈ 520 * s down and curling up at the bell
export function pipeSax(g, P, o = {}) {
  const s = o.s ?? 1; g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s, s);
  const sp = [[0, 0], [10, 120], [16, 260], [14, 400], [40, 470], [100, 470], [130, 420]];
  cel(g, ribbon(sp, u => 26 + u * 26), st(P.pipe, { so: [-6, -2], ho: [4, 0] }));
  const bell = new Path2D(); bell.ellipse(140, 400, 46, 22, -.6, 0, TAU); cel(g, bell, st(P.pipe, { x: { f: P.pipe.s } }));
  for (let i = 0; i < 4; i++) { const sp2 = new Path2D(); sp2.ellipse(30, 110 + i * 70, 13, 9, 0, 0, TAU); cel(g, sp2, st(P.can, { so: [-2, -2], lw: 1.4 })); }
  g.restore();
}
export function bottle(g, P, o = {}) {
  const s = o.s ?? 1; g.save(); g.translate(o.x || 0, o.y || 0); g.rotate(o.ang || 0); g.scale(s, s);
  cel(g, path([[-30, 0], [-30, -150], [-24, -170], [-10, -186], [-10, -230, 1], [10, -230, 1], [10, -186], [24, -170], [30, -150], [30, 0, 1], [-30, 0, 1]]), { ...st(P.bottle, { so: [-8, 0] }), hi: [[[-20, -150], [-12, -150], [-12, -20], [-20, -20]]] });
  cel(g, poly([[-12, -230], [12, -230], [12, -246], [-12, -246]]), st(P.bag3, { so: [0, -2], lw: 1.6 }));
  g.restore();
}
// scattered trash cels (the foreground of the opening), seeded
export function trash(g, P, x0, y0, x1, y1, n, sc, seed) {
  const R = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0), a = R() * TAU, k = Math.floor(R() * 6), s = sc * (.6 + R() * .8);
    g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
    if (k === 0) cel(g, path([[-60, -30, 1], [60, -30, 1], [64, 0], [60, 30, 1], [-60, 30, 1], [-64, 0]]), st(P.can, { so: [0, -6], ho: [0, 4] }));
    else if (k === 1) cel(g, path([[-70, -10], [-40, -50], [10, -44], [60, -60], [74, -10], [50, 40], [-20, 50], [-66, 30]]), st([P.bag1, P.bag2, P.bag3][i % 3], { so: [-8, -6] }));
    else if (k === 2) cel(g, poly([[-80, -46], [70, -54], [84, 40], [-70, 50]]), { ...st(P.card, { so: [-6, -6] }), sh: [[[-80, 20], [84, 10], [84, 40], [-70, 50]]] });
    else if (k === 3) { g.rotate(1.57); bottle(g, P, { s: .55, y: 60 }); }
    else if (k === 4) cel(g, path([[-50, -40], [40, -50], [60, 10], [10, 50], [-50, 30]]), st(P.mud, { so: [-6, -6] }));
    else cel(g, path([[-40, -20, 1], [40, -20, 1], [40, 20, 1], [-40, 20, 1]]), st(P.bag2, { so: [0, -4] }));
    g.restore();
  }
}

// ---------- people ----------
// the girl, full figure. pose: 'crouch' | 'stand' | 'play'. Origin at the feet; height ≈ 820 * s standing. light: [lx, ly]
export function girl(g, P, o = {}) {
  const s = o.s ?? 1, pose = o.pose || 'stand', side = o.side ?? 1;
  g.save(); g.translate(o.x || 0, o.y || 0); g.scale(s * side, s);
  const SK = st(P.skin, { so: [-6, -4] }), SH = st(P[o.shirt || 'shirt'], { so: [-16, -10], ho: [6, 4] });
  const head = (x, y) => { g.save(); g.translate(x, y); g.scale(1.25, 1.25); head80(g, P, { view: o.view || 'q', expr: o.expr || 'neutral', look: o.look, lid: o.lid, open: o.open, mouth: o.mouth, light: o.light, rim: o.rim, skinRim: o.skinRim }); g.restore(); };
  if (pose === 'crouch') {
    cel(g, limb([-60, 0], [-40, -190], 64, 70), st(P.shorts, { so: [-8, -4] })); cel(g, limb([60, 0], [40, -210], 64, 70), st(P.shorts, { so: [-8, -4] }));
    head(40, -600);
    cel(g, [[-110, -190], [-140, -400], [-96, -470], [90, -480], [140, -410], [124, -190]], SH);
    cel(g, limb([90, -450], [140, -380], 60, 52), SH); cel(g, limb([140, -380], [220, -170], 44, 38), SK);
    cel(g, limb([-80, -450], [-30, -380], 60, 52), SH); cel(g, limb([-30, -380], [110, -190], 44, 38), SK);
  } else {
    const legSw = o.walk ? Math.sin(o.walk) * 40 : 0;
    cel(g, limb([-36, -330], [-40 - legSw, 0], 50, 44), SK); cel(g, limb([36, -330], [40 + legSw, 0], 50, 44), SK);
    cel(g, poly([[-104, -270], [104, -270], [94, -380], [-94, -380]]), st(P.shorts, { so: [-8, -6] }));
    head(0, -790);
    cel(g, [[-116, -290], [-126, -540], [-90, -620], [90, -624], [126, -545], [120, -290]], SH);
    if (pose !== 'play') { cel(g, limb([-100, -590], [-136, -490], 56, 50), SH); cel(g, limb([-136, -490], [-128, -290], 40, 34), SK); cel(g, limb([100, -590], [136, -490], 56, 50), SH); cel(g, limb([136, -490], [128, -290], 40, 34), SK); }
  }
  g.restore();
}
// a child musician (alley and stage), origin at the feet, height ≈ 620 * s. instr: 'tin' | 'cello' | 'sax'. ph: bow/breath phase
export function kid(g, P, o = {}) {
  const s = o.s ?? 1, ph = o.ph ?? 0, wk = o.walk ?? null;
  g.save(); g.translate(o.x || 0, o.y || 0); g.scale(s * (o.side ?? 1), s);
  const SK = st(P.skin, { so: [-6, -4] }), SH = st(P[o.shirt || 'shirt2'], { so: [-12, -8], ho: [5, 3] });
  const sw = wk != null ? Math.sin(wk) * 34 : 0;
  if (o.instr === 'cello' && wk == null) oilCello(g, P, { x: 70, y: 0, s: .62, ang: -.18 });
  cel(g, limb([-26, -300], [-30 - sw, 0], 42, 38), SK); cel(g, limb([26, -300], [30 + sw, 0], 42, 38), SK);
  cel(g, poly([[-84, -240], [84, -240], [74, -330], [-74, -330]]), st(P.shorts, { so: [-6, -4] }));
  g.save(); g.translate(4, -590); g.scale(1.05, 1.05); head80(g, P, { view: o.view || 'q', expr: o.expr || 'neutral', look: o.look || [.5, 0], lid: o.lid ?? .2, open: o.open, rim: o.rim ? { c: o.rim, d: [1.4, -.8] } : null, skinRim: o.skinRim, light: o.light }); g.restore();
  cel(g, [[-90, -240], [-100, -420], [-64, -470], [64, -474], [100, -424], [92, -240]], SH);
  const bowx = Math.sin(ph) * 60;
  if (o.instr === 'tin') {
    tinViolin(g, P, { x: 30, y: -500, ang: -.35, s: .5 });
    cel(g, limb([-80, -500], [-40, -400], 40, 34), SH); cel(g, limb([-40, -400], [80 + bowx * .4, -470 + bowx * .2], 34, 30), SK);
    bow(g, P, { x: 20 + bowx, y: -380 + bowx * .3, ang: -1.9, s: .5 });
    cel(g, limb([80, -520], [210, -560], 40, 34), SH); cel(g, limb([210, -560], [270, -630], 34, 30), SK);
  } else if (o.instr === 'cello') {
    if (wk != null) oilCello(g, P, { x: -60, y: -120, s: .5, ang: .25 });   // carried on the back
    else { cel(g, limb([-70, -500], [-110, -380], 40, 34), SH); cel(g, limb([-110, -380], [40 + bowx, -300], 34, 30), SK); bow(g, P, { x: -120 + bowx, y: -290, ang: -.08, s: .55 }); cel(g, limb([80, -500], [120, -600], 40, 34), SH); }
  } else if (o.instr === 'sax') {
    pipeSax(g, P, { x: 40, y: -600, s: .7, ang: -.1 });
    cel(g, limb([-80, -500], [10, -430], 40, 34), SH); cel(g, limb([80, -500], [60, -380], 40, 34), SH);
  }
  g.restore();
}
// the teacher as a backlit silhouette (the window), origin at the waist; plucking: pl 0..1
export function teacherSil(g, col, rim, pl) {
  g.fillStyle = col;
  g.beginPath(); g.ellipse(0, -330, 64, 78, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-60, -250); g.lineTo(60, -250); g.lineTo(150, -180); g.lineTo(190, 60); g.lineTo(-190, 60); g.lineTo(-150, -180); g.closePath(); g.fill();
  // violin on the shoulder + plucking hand
  g.save(); g.translate(-30, -220); g.rotate(-2.75); g.fillStyle = col; g.beginPath(); g.ellipse(80, 0, 90, 46, 0, 0, TAU); g.fill(); g.fillRect(150, -9, 170, 18); g.restore();
  g.beginPath(); g.ellipse(60 - pl * 10, -170 - pl * 14, 26, 20, 0, 0, TAU); g.fill();
  g.strokeStyle = rim; g.lineWidth = 4; g.beginPath(); g.ellipse(0, -330, 64, 78, 0, -2.4, -.6); g.stroke();
  g.beginPath(); g.moveTo(-150, -180); g.lineTo(-60, -250); g.stroke(); g.beginPath(); g.moveTo(60, -250); g.lineTo(150, -180); g.stroke();
}
export function butterfly(g, e, x, y, sz, ang, f, P) {
  for (const [c, isE] of [[g, false], [e, true]]) {
    if (!c) continue;
    c.save(); c.translate(x, y); c.rotate(ang);
    for (const sd of [-1, 1]) {
      c.save(); c.scale(sd * (.25 + .75 * f), 1);
      const w1 = new Path2D(); w1.moveTo(0, 0); w1.bezierCurveTo(sz * .9, -sz * 1.2, sz * 1.5, -sz * .2, 0, 0);
      const w2 = new Path2D(); w2.moveTo(0, 0); w2.bezierCurveTo(sz * .8, sz * .2, sz * 1.0, sz * .9, 0, sz * .25);
      if (isE) { c.fillStyle = rgba('#ff8a50', .55); c.fill(w1); c.fill(w2); }
      else { cel(c, w1, { f: P.accent.f, s: P.accent.s, so: [-sz * .15, 0], l: P.accent.l, lw: 1.4 }); cel(c, w2, { f: P.accent.h, l: P.accent.l, lw: 1.2 }); }
      c.restore();
    }
    if (!isE) line(c, [[0, -sz * .3], [0, sz * .4]], P.accent.l, 2);
    c.restore();
  }
}
