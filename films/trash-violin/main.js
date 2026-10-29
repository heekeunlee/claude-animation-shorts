// 쓰레기로 만든 바이올린 — Watercolor Brush, 1080×1920, no narration: subtitles + original score
import { W, H, withSeed, rnd, clamp, lerp, seg, ss, eio, eo, ei, hash, vnoise, monotone, PAPER, INK, INK2, mixc, rgba, qcurve, qctrl, polar, mk, drawS } from './engine.js';
import * as A from './art.js';
import { DUR, BEAT, SHOP0, THEME0, bar, SC, T, SUBS, TITLE, LABELS } from './story.js';

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const K = { c: A.KC, g: A.KG };
let PAPER_IMG;
const CC = document.createElement('canvas'); CC.width = W; CC.height = H; const cc = CC.getContext('2d');   // colour layer
const MK = document.createElement('canvas'); MK.width = W; MK.height = H; const mk_ = MK.getContext('2d'); // colour mask

// ---------- helpers ----------
const reset = (c = ctx) => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; };
const paper = (c = ctx, a = 1) => { reset(c); c.globalAlpha = a; c.drawImage(PAPER_IMG, 0, 0); c.globalAlpha = 1; };
// a wavy blob (for colour masks and wipes): centre, radius, wobble seed
function blobPath(c, x, y, r, sd, wob = .16, n = 48) {
  c.beginPath();
  for (let i = 0; i <= n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 + wob * (vnoise(sd + Math.cos(a) * 2.1 + 5) * 2 - 1) + wob * .5 * (vnoise(sd * 3 + Math.sin(a) * 4.3) * 2 - 1)); i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath();
}
// soft-edged mask: three nested passes so the bloom edge looks like pigment creeping into wet paper
function maskBlob(x, y, r, sd) { for (const [k, a] of [[1.08, .3], [1.0, .6], [.93, 1]]) { mk_.fillStyle = `rgba(0,0,0,${a})`; blobPath(mk_, x, y, r * k, sd); mk_.fill(); } }
// draw the colour version through the mask over what is already on ctx
function colourThrough(drawColour, drawMask) {
  reset(cc); cc.clearRect(0, 0, W, H); cc.drawImage(PAPER_IMG, 0, 0); drawColour(cc);
  reset(mk_); mk_.clearRect(0, 0, W, H); drawMask();
  reset(cc); cc.globalCompositeOperation = 'destination-in'; cc.drawImage(MK, 0, 0); cc.globalCompositeOperation = 'source-over';
  reset(); ctx.drawImage(CC, 0, 0);
}
// a vertical brush-edge wipe: the next scene is painted on a sheet whose leading edge wobbles like a loaded brush
function wipe(t, t0, t1, drawNext, dir = 1) {
  const p = eio(seg(t, t0, t1)); if (p <= 0) return false;
  reset(cc); cc.clearRect(0, 0, W, H); cc.drawImage(PAPER_IMG, 0, 0); drawNext(cc);
  if (p < 1) {
    reset(mk_); mk_.clearRect(0, 0, W, H); mk_.fillStyle = '#000'; mk_.beginPath();
    const ex = y => (dir > 0 ? W * (1 - p * 1.25) : W * p * 1.25) + (vnoise(y / 140 + 3) - .5) * 120 + (vnoise(y / 37 + 9) - .5) * 30;
    if (dir > 0) { mk_.moveTo(W, 0); for (let y = 0; y <= H; y += 24) mk_.lineTo(ex(y), y); mk_.lineTo(W, H); }
    else { mk_.moveTo(0, 0); for (let y = 0; y <= H; y += 24) mk_.lineTo(ex(y), y); mk_.lineTo(0, H); }
    mk_.closePath(); mk_.fill();
    reset(cc); cc.globalCompositeOperation = 'destination-in'; cc.drawImage(MK, 0, 0);
  }
  reset(); ctx.drawImage(CC, 0, 0); return p >= 1;
}
// mist: paper-coloured layer rising with a wavy edge (erases toward blank paper)
function mist(t, t0, t1) {
  const up = ss(seg(t, t0, (t0 + t1) / 2)), down = ss(seg(t, (t0 + t1) / 2, t1)); const a = up * (1 - down); if (a <= 0) return;
  reset(); ctx.globalAlpha = a; ctx.drawImage(PAPER_IMG, 0, 0); ctx.globalAlpha = 1;
}
const toS = (c, k, cx, cy) => c.setTransform(k, 0, 0, k, W / 2 - cx * k, H / 2 - cy * k);

// ---------- build ----------
const B = {};
function plateCanvas(drawFn, scale = 1, feather = 0) {
  const cvp = document.createElement('canvas'); cvp.width = W * scale; cvp.height = H * scale;
  const c = cvp.getContext('2d'); c.drawImage(PAPER_IMG, 0, 0, W * scale, H * scale); c.scale(scale, scale); drawFn(c);
  if (feather) {   // soft edges so an inner plate melts into the outer one during the zoom
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-in';
    const r = cvp.width / 2; c.setTransform(1, 0, 0, cvp.height / cvp.width, 0, 0);   // an ellipse that fades to nothing before every edge
    const g = c.createRadialGradient(r, r, r * .55, r, r, r * .98); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, cvp.width, cvp.width); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over';
  }
  return cvp;
}
const listOf = (seed, fn) => withSeed(seed, () => { const L = []; fn(L); return L; });

// zoom geometry: B (wide) ⊃ M (girl on the slope) ⊃ A (hands). Each inner plate is 1/5 of the outer.
const G = [548, 812], HM = [600, 1240];
const bOfM = ([x, y]) => [G[0] + (x - W / 2) / 5, G[1] + (y - H / 2) / 5];
const mOfA = ([x, y]) => [HM[0] + (x - W / 2) / 5, HM[1] + (y - H / 2) / 5];

function buildWide(L, K, warm) {
  L.push(A.wash([[0, 0], [W, 0], [W, 1500], [0, 1500]], K(warm ? 'sky2' : 'sky'), warm ? .55 : .35, 3, 10));
  if (warm) L.push(A.wash([[0, 0], [W, 0], [W, 420], [0, 520]], K('sky'), .35, 3, 12));
  for (let x = -20; x < W; x += rnd(40, 90)) { const h = rnd(40, 150); L.push(mk([[x, 900], [x, 900 - h]], rnd(26, 50), K('far'), { prof: 'even', a: .28, nb: 2 })); }
  const mount = [[-60, 1920], [-60, 1180], [80, 1120], [190, 1010], [300, 990], [380, 900], [470, 850], [520, 818], [548, 806], [590, 822], [660, 870], [720, 860], [800, 930], [900, 1010], [990, 1050], [1140, 1130], [1140, 1920]];
  L.push(A.wash(mount.map(([x, y]) => [x, y + 120]).concat([[1140, 1920], [-60, 1920]]), K('mud2'), .4, 3, 10));
  A.heap(L, K, mount, 520, .55, 'mud');
  A.trashBits(L, K, 380, 830, 720, 1000, 90, .35);
  L.push(A.wash([[-60, 1920], [-60, 1600], [300, 1560], [700, 1580], [1140, 1520], [1140, 1920]], K('mud2'), .5, 3, 8));
  for (let i = 0; i < 9; i++) A.shack(L, K, -40 + i * 130 + rnd(-20, 20), 1760 + rnd(-30, 30), rnd(90, 130), rnd(70, 110), ['wall1', 'wall2', 'wall3', 'wall4'][i % 4], { door: i % 2 === 0 });
  for (let i = 0; i < 5; i++) { const x = rnd(150, 950), y = rnd(950, 1300); L.push(mk(qcurve(x, y, x + rnd(-40, 40), y - rnd(140, 260), rnd(-40, 40), 8), rnd(30, 60), K('ash'), { prof: 'leaf', a: .18, nb: 0 })); }
}
function buildM(L, K) {   // the slope around the girl, a crouching girl painted large
  L.push(A.wash([[0, 0], [W, 0], [W, 760], [0, 900]], K('sky'), .3, 3, 10));
  A.heap(L, K, [[-40, 1960], [-40, 760], [300, 700], [700, 640], [1120, 720], [1120, 1960]], 420, 1.6, 'mud');
  A.girlSmall(L, K, 560, 1290, 4.2, 'crouch');
}
function buildABack(L, K) {   // the ground under the hands: dense trash
  L.push(A.wash([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], K('mud'), .55, 3, 10));
  A.trashBits(L, K, -60, -60, W + 60, H + 60, 200, 3.0);
  A.trashBits(L, K, -60, -60, W + 60, H + 60, 110, 1.8);
}

function build() {
  for (const v of ['g', 'c']) {
    const k = K[v];
    B['wide' + v] = plateCanvas(c => A.paint(c, listOf(11, L => buildWide(L, k, false))), 2);
    B['m' + v] = plateCanvas(c => A.paint(c, listOf(12, L => buildM(L, k))), 2, 1);
    B['aback' + v] = plateCanvas(c => A.paint(c, listOf(13, L => buildABack(L, k))), 1, 0);
  }
  B.widewarm = plateCanvas(c => A.paint(c, listOf(11, L => buildWide(L, A.KC, true))), 2);
  B.abackList = listOf(13, L => buildABack(L, A.KG));
  // window wall
  for (const v of ['g', 'c']) B['wall' + v] = plateCanvas(c => A.paint(c, listOf(21, L => {
    const k = K[v];
    L.push(A.wash([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], k('roof'), .45, 3, 10));
    for (let x = -30; x < W + 30; x += 34) L.push(mk([[x + rnd(-3, 3), -40], [x + rnd(-6, 6), H + 40]], 16, k('shade'), { prof: 'even', a: .16, nb: 2 }));
    for (let i = 0; i < 6; i++) { const x = rnd(0, W), y = rnd(0, H); L.push(mk(polar(x, y, rnd(1.3, 1.8), rnd(120, 300), 0, 6), rnd(30, 60), k('rust'), { prof: 'leaf', a: .25, nb: 3 })); }
    L.push(A.wash([[290, 470], [910, 450], [920, 1050], [280, 1060]], k('wood2'), .7, 3, 4));           // frame
    L.push(A.wash([[330, 510], [870, 495], [878, 1010], [322, 1018]], k('lamp'), .82, 3, 4));           // the warm inside
    L.push(A.wash([[330, 760], [870, 740], [878, 1010], [322, 1018]], k('lampD'), .45, 3, 4));
    L.push(mk([[600, 500], [600, 1016]], 16, k('wood2'), { prof: 'even', a: .85, nb: 3 }));
    L.push(mk([[326, 760], [874, 752]], 14, k('wood2'), { prof: 'even', a: .85, nb: 3 }));
  })), 1);
  B.teacherBody = withSeed(22, () => { const L = []; L.push(A.wash(A.ell(690, 640, 48, 58, 18), '#5a3426', .8, 3, 2)); L.push(A.wash([[650, 690], [730, 690], [800, 740], [840, 1016], [540, 1016], [580, 740]], '#5a3426', .75, 3, 3)); return A.spr(L); });
  B.teacherViolin = withSeed(23, () => A.spr(A.realViolin(A.KC, .42)));
  B.violinShadow = withSeed(24, () => A.spr(A.realViolin(() => INK2, 1.6), 1));
  B.girlBack = withSeed(25, () => {   // over-the-shoulder: the back of her head and shoulders
    const L = [];
    L.push(A.wash([[-40, 1960], [-20, 1640], [160, 1540], [520, 1560], [700, 1700], [760, 1960]], A.KG('shirt'), .7, 3, 6));
    A.block(L, [[-20, 1960], [0, 1650], [160, 1560], [520, 1580], [690, 1710], [740, 1960]], A.KG('shirt'), 44, -.4, .4);
    L.push(A.wash(A.ell(330, 1380, 190, 220, 30, .05), A.KG('hair'), .88, 3, 5));
    for (let i = 0; i < 22; i++) { const a = lerp(-2.6, -.5, i / 21); L.push(mk(qcurve(330 + Math.cos(a) * 60, 1300 + Math.sin(a) * 60, 330 + Math.cos(a) * 200, 1440 + Math.sin(a) * 120 + 140, rnd(-16, 16), 8), rnd(10, 20), A.KG('hair'), { prof: 'tip', a: rnd(.5, .85), nb: 3 })); }
    return A.spr(L);
  });
  // tin violin: parts for the plate (grey world + the accent) and a finished sprite
  B.tinParts = withSeed(31, () => A.tinViolin(A.KG, 1));
  B.tin = A.spr(B.tinParts.flat(), 1);
  B.tinC = withSeed(31, () => A.spr(A.tinViolin(A.KC, 1).flat(), 1));
  B.bowL = withSeed(32, () => A.bow(A.KC, 1)); B.bow = A.spr(B.bowL);
  // the bust (grey and colour), the hair layer separate so the bow arm passes between
  for (const v of ['g', 'c']) {
    const b = withSeed(41, () => A.girlBust(K[v], { shirt: 'shirt2' }));
    B['bust' + v] = A.spr(b.L); B['hair' + v] = A.spr(b.hair);
  }
  // alley strip (world x 0..3400)
  for (const v of ['g', 'c']) B['alley' + v] = (() => {
    const cvp = document.createElement('canvas'); cvp.width = 3400; cvp.height = H; const c = cvp.getContext('2d');
    for (let x = 0; x < 3400; x += W) c.drawImage(PAPER_IMG, x, 0);
    A.paint(c, listOf(51, L => {
      const k = K[v];
      L.push(A.wash([[0, 0], [3400, 0], [3400, 900], [0, 900]], k('sky'), .35, 3, 10));
      for (let x = 0; x < 3400; x += rnd(160, 240)) A.shack(L, k, x, 1380 + rnd(-10, 10), rnd(170, 240), rnd(380, 520), ['wall1', 'wall2', 'wall3', 'wall4'][Math.floor(rnd(0, 4))], { door: true, win: 'lamp' });
      for (let x = 100; x < 3400; x += 520) { L.push(mk(qcurve(x, 900, x + 360, 910, 40, 10), 3, INK2, { prof: 'even', a: .6, nb: 0 })); for (let j = 0; j < 4; j++) L.push(mk([[x + 50 + j * 80, 930 + j * 2], [x + 80 + j * 80, 930 + j * 2]], 46, k(['bag1', 'bag2', 'bag4', 'shirt2'][j]), { prof: 'even', a: .7, nb: 3 })); }
      L.push(A.wash([[0, 1370], [3400, 1370], [3400, H + 20], [0, H + 20]], k('mud'), .45, 3, 8));
      A.trashBits(L, k, 0, 1700, 3400, 1960, 160, 1.4);
    }));
    return cvp;
  })();
  // stage
  B.stage = plateCanvas(c => A.paint(c, listOf(61, L => {
    const k = A.KC;
    L.push(A.wash([[-40, -40], [W + 40, -40], [W + 40, 1200], [-40, 1200]], k('plum'), .85, 3, 8));
    for (const sd of [-1, 1]) for (let i = 0; i < 6; i++) { const x = sd < 0 ? 30 + i * 26 : W - 30 - i * 26; L.push(mk([[x, -40], [x + sd * 10, 1180]], 44, k('wine'), { prof: 'even', a: .55, nb: 4 })); }
    for (const x of [220, 540, 860]) L.push(A.wash([[x - 40, -40], [x + 40, -40], [x + 260, 1180], [x - 260, 1180]], k('lamp'), .16, 3, 6));
    L.push(A.wash([[-40, 1160], [W + 40, 1160], [W + 40, 1320], [-40, 1320]], k('wood'), .8, 3, 4));
    for (let x = 30; x < W; x += 90) L.push(A.wash(A.ell(x, 1180, 46, 16, 12), k('lamp'), .7, 2, 2));
    L.push(A.wash([[-40, 1320], [W + 40, 1320], [W + 40, H + 40], [-40, H + 40]], k('plum'), .9, 3, 6));
  })), 1);
  B.kidsStage = withSeed(62, () => {
    const L = [], ins = ['cello', 'tin', 'sax', 'tin', 'cello', 'tin', 'sax'];
    ins.forEach((it, i) => L.push(...A.kid(A.KC, 120 + i * 140, 1180 - (i % 2) * 30, 1.35, 0, it, ['shirt', 'shirt2', 'wall4', 'wall3', 'bag2', 'shirt', 'wall1'][i], 0)));
    return A.spr(L);
  });
  // finale plates: the girl playing on the summit (M2), hands with the bow (A2)
  B.m2 = plateCanvas(c => A.paint(c, listOf(71, L => { const k = A.KC; L.push(A.wash([[0, 0], [W, 0], [W, 760], [0, 900]], k('sky2'), .5, 3, 10)); A.heap(L, k, [[-40, 1960], [-40, 1300], [300, 1250], [700, 1240], [1120, 1300], [1120, 1960]], 380, 1.6, 'mud'); A.girlSmall(L, k, 560, 1290, 3.6, 'play'); })), 2, 1);
  B.a2 = plateCanvas(c => {
    A.paint(c, listOf(73, L => { const k = A.KC; L.push(A.wash([[-40, -40], [W + 40, -40], [W + 40, H + 40], [-40, H + 40]], k('sky2'), .5, 3, 10)); L.push(A.wash([[-40, 900], [W + 40, 820], [W + 40, H + 40], [-40, H + 40]], k('mud'), .45, 3, 10)); A.trashBits(L, k, -40, 900, W + 40, H + 40, 70, 1.6); }));
    c.save(); c.translate(120, 1500); c.rotate(-.5); c.scale(1.35, 1.35); A.blit(c, B.tinC, 0, 0); c.restore();
    c.save(); c.translate(160, 1080); c.rotate(.42); A.paint(c, B.bowL); c.restore();
    A.paint(c, listOf(72, L => A.hand(L, A.KC, 300, 1420, .9, 1.15, .7, { dirt: false })));
  }, 1, 0);
  B.handsDig = listOf(14, L => { A.hand(L, A.KG, 360, 1380, .12, 1.6, .45, { arm: 240 }); A.hand(L, A.KG, 760, 1460, -.2, 1.5, .6, { arm: 240 }); });
}

// ---------- scenes ----------
// the zoom between wide, slope and hands (0–8.4 out; 38.6–42.6 back in, in colour)
function zoomFrame(t, k, cx, cy, v, final) {
  const wide = final ? B.widewarm : B['wide' + v], m = final ? B.m2 : B['m' + v], a = final ? B.a2 : B['aback' + v];
  reset(); ctx.setTransform(k / 2, 0, 0, k / 2, W / 2 - cx * k, H / 2 - cy * k); ctx.drawImage(wide, 0, 0);
  // the tiny girl on the summit in the wide
  if (k < 8) { reset(); toS(ctx, k, cx, cy); const g = withSeed(15, () => { const L = []; A.girlSmall(L, final ? A.KC : A.KG, G[0] + (final ? 2 : 0), G[1] + 6, .3, final ? 'play' : 'crouch'); return L; }); A.paint(ctx, g); }
  const km = k / 5, am = clamp((km - .35) / .5);
  if (am > 0) { const o = bOfM([0, 0]); reset(); ctx.globalAlpha = am; ctx.setTransform(km / 2, 0, 0, km / 2, W / 2 + (o[0] - cx) * k, H / 2 + (o[1] - cy) * k); ctx.drawImage(m, 0, 0); ctx.globalAlpha = 1; }
  const ka = k / 25, aa = clamp((ka - .3) / .45);
  if (aa > 0) {
    const o = bOfM(mOfA([0, 0]));
    reset(); ctx.globalAlpha = aa; ctx.setTransform(ka, 0, 0, ka, W / 2 + (o[0] - cx) * k, H / 2 + (o[1] - cy) * k); ctx.drawImage(a, 0, 0);
    if (!final) { const dy = -18 * ss(seg(t, 1.2, 3.2)) + 6 * Math.sin(t * 2.3); ctx.translate(0, dy); A.paint(ctx, B.handsDig, t < 1.6 ? seg(t, .2, 1.6) : 1, aa); }
    ctx.globalAlpha = 1;
  }
}
const ZK = t => Math.exp(lerp(Math.log(25), 0, eio(seg(t, T.zoom[0], T.zoom[1]))));
function sceneMount(t) {
  const k = ZK(t), u = eio(seg(t, T.zoom[0], T.zoom[1])), hb = bOfM(HM);
  const cx = lerp(hb[0], W / 2, ss(seg(u, .2, 1))), cy = lerp(hb[1], H / 2 + 40, ss(seg(u, .2, 1)));
  if (t < 1.6) {   // the opening: the trash under the hands paints itself in
    paper(); reset(); A.paint(ctx, B.abackList, seg(t, 0, 1.3));
    reset(); ctx.translate(0, -18 * ss(seg(t, 1.2, 3.2)) + 6 * Math.sin(t * 2.3)); A.paint(ctx, B.handsDig, seg(t, .2, 1.6));
    return;
  }
  const push = 1 + .04 * ss(seg(t, 0, 3.8));
  zoomFrame(t, k * push, cx, cy, 'g', false);
  birds(t, k, cx, cy, false);
}
function birds(t, k, cx, cy, warm) {
  if (k > 6) return;
  reset(); toS(ctx, k, cx, cy); ctx.strokeStyle = rgba(INK2, .7 * clamp(1.6 - k / 4)); ctx.lineWidth = 2.2 / k * 1.3; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = t * (.35 + hash(i) * .2) + i * .9, x = 548 + Math.cos(a) * (120 + hash(i + 3) * 160), y = 640 + Math.sin(a) * 40 - hash(i + 5) * 120, f = Math.sin(t * 7 + i * 2) * 6 + 4;
    ctx.beginPath(); ctx.moveTo(x - 9, y - f); ctx.quadraticCurveTo(x - 4, y - 1, x, y); ctx.quadraticCurveTo(x + 4, y - 1, x + 9, y - f); ctx.stroke();
  }
}
function sceneWindow(t) {
  const tr = lerp(30, -30, seg(t, 8.4, 15.9)), pz = 1 + .07 * ss(seg(t, 11.6, 15.9));
  reset(); toS(ctx, pz, W / 2 - tr, H / 2 + 60 * ss(seg(t, 11.6, 15.9)));
  ctx.drawImage(B.wallg, 0, 0);
  // the teacher plucking inside the warm window
  const ph = (t - 8.4) / BEAT, pl = Math.max(0, 1 - (ph % 1) * 3);
  A.blit(ctx, B.teacherBody, 0, 0, .85);
  ctx.save(); ctx.translate(650, 700); ctx.rotate(2.75); A.blit(ctx, B.teacherViolin, 0, 0, .95); ctx.restore();
  drawS(ctx, withSeed(26, () => mk([[760, 780], [640, 760 - pl * 8], [600, 720 - pl * 14]], 22, '#5a3426', { prof: 'tip', a: .8, nb: 0 })));
  // the violin's shadow grows over the shack (the price)
  const sh = ss(seg(t, T.shadow[0], T.shadow[1]));
  if (sh > 0) { ctx.save(); ctx.translate(600, 740); ctx.rotate(-.35); const s = lerp(.35, 1.9, sh); ctx.scale(s, s); ctx.translate(-260, 0); A.blit(ctx, B.violinShadow, 0, 0, .42 * sh); ctx.restore(); }
  // the girl, seen from behind; her arm reaches for the window
  const r = eo(seg(t, T.reach[0], T.reach[1])), back = ss(seg(t, 14.6, 15.6));
  A.blit(ctx, B.girlBack, 0, 0, 1);
  if (r > 0) {
    const reach = r * (1 - back * .4), hx = lerp(480, 560, reach), hy = lerp(1480, 1120, reach);
    drawS(ctx, withSeed(27, () => mk([[470, 1560], [lerp(480, 520, reach), lerp(1520, 1300, reach)], [hx, hy]], 46, A.KG('skin'), { prof: 'tip', a: .8, nb: 4 })), clamp(r * 1.5));
  }
  mist(t, T.mist1[0], T.mist1[1]);
}
function plate(c, t, local = false) {
  // the specimen: the tin violin, assembled part by part on the workshop beats
  c.save(); c.translate(250, 1360); c.rotate(-1.1); c.scale(1.25, 1.25);
  B.tinParts.forEach((P, i) => A.paint(c, P, seg(t, T.parts[i], T.parts[i] + .55)));
  c.restore();
  if (c !== ctx) return;
}
const LP = d => [250 + d * 1.25 * Math.cos(-1.1), 1360 + d * 1.25 * Math.sin(-1.1)];
const LAB = [[LP(170), [520, 1300]], [LP(420), [600, 820]], [LP(600), [620, 470]], [LP(-20), [400, 1600]]];
function labels(c, t) {
  LAB.forEach(([[ax, ay], [lx, ly]], i) => {
    const t0 = T.parts[i] + .15; if (t < t0) return;
    const p = seg(t, t0, t0 + .35);
    c.strokeStyle = rgba(INK, .7); c.lineWidth = 1.8; c.beginPath(); const pts = qcurve(lx - 8, ly + 6, ax, ay, 24, 16), m = Math.max(1, Math.round(16 * p));
    for (let j = 0; j <= m; j++) j ? c.lineTo(...pts[j]) : c.moveTo(...pts[j]); c.stroke();
    const q = seg(t, t0 + .15, t0 + .7); if (q <= 0) return;
    c.save(); c.font = '400 58px "Nanum Pen Script"'; c.textBaseline = 'middle'; c.textAlign = 'left'; const w = c.measureText(LABELS[i]).width;
    c.beginPath(); c.rect(lx - 4, ly - 50, (w + 10) * eo(q), 100); c.clip();
    c.shadowColor = rgba(PAPER, .95); c.shadowBlur = 10; c.fillStyle = rgba(INK, .88); c.fillText(LABELS[i], lx, ly); c.fillText(LABELS[i], lx, ly); c.restore();
  });
  c.save(); c.font = '400 44px "Nanum Pen Script"'; c.textAlign = 'left'; c.fillStyle = rgba('#7a5a44', .8 * ss(seg(t, 16.3, 16.9))); c.fillText('카테우라, 재활용 바이올린 No.1', 80, 200); c.restore();
}
function scenePlate(t) {
  // the page turn: a new sheet slides in from the right over the window scene
  const p = eio(seg(t, T.turn[0], T.turn[1])), x0 = W * (1 - p);
  if (p < 1) { sceneWindow(Math.min(t, 15.9)); reset(); const g = ctx.createLinearGradient(x0 - 50, 0, x0, 0); g.addColorStop(0, 'rgba(60,45,35,0)'); g.addColorStop(1, 'rgba(60,45,35,.28)'); ctx.fillStyle = g; ctx.fillRect(x0 - 50, 0, 50, H); }
  reset(); ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, W, H); ctx.clip(); ctx.translate(x0, 0);
  ctx.drawImage(PAPER_IMG, 0, 0); plate(ctx, t); labels(ctx, t); ctx.restore();
}
function handsScene(c, t) {
  reset(c); c.drawImage(B.abackg, 0, 0);
  A.paint(c, withSeed(81, () => { const L = []; A.palmUp(L, A.KG, 330, 1560, .18, 1.25, 1); A.palmUp(L, A.KG, 750, 1560, -.18, 1.25, -1); return L; }));
  const g = eo(seg(t, T.give[0], T.give[1])), y = lerp(-500, 1180, g);
  c.save(); c.translate(140, y); c.rotate(-.12 + .1 * (1 - g)); A.blit(c, B.tin, 0, 0); c.restore();
  // the hands close a little once it lands
  if (g >= 1) A.paint(c, withSeed(82, () => [mk(qctrl(260, 1300, 240, 1240, 270, 1190, 5), 26, A.KG('skin'), { prof: 'tip', a: .85, nb: 3 }), mk(qctrl(820, 1300, 845, 1240, 815, 1190, 5), 26, A.KG('skin'), { prof: 'tip', a: .85, nb: 3 })]), seg(t, 21.4, 21.8));
}
// the close shot: the girl plays; colour and butterflies burst from the violin on the first clear note
const VA = -.42, VT = [400, 1080], VS = 1.05;   // violin angle and tail (chin side) in frame coords
function bowU(t) {   // bow position along its stroke
  if (t < T.note1) return t < T.scrape2 ? -60 + 260 * seg(t, T.scrape1, T.scrape1 + .3) : -40 + 240 * seg(t, T.scrape2, T.scrape2 + .3);
  const s = (t - T.note1) / (BEAT * 2); return 200 * Math.sin(Math.PI * (s % 2 < 1 ? s % 1 : 1 - s % 1) - Math.PI / 2);
}
function bust(c, t, v) {
  const zoom = 1 + .06 * ss(seg(t, 22.0, 25.9)), flinch = t >= T.scrape1 && t < T.note1 ? Math.exp(-((t - T.scrape1) % .45) * 8) * .05 : 0, k = v === 'c' ? A.KC : A.KG;
  c.setTransform(zoom, 0, 0, zoom, W / 2 * (1 - zoom), H / 2 * (1 - zoom));
  c.save(); c.translate(430, 940); c.rotate(-flinch); A.blit(c, B['bust' + v], 0, 0); c.restore();
  const sv = v === 'c' ? B.tinC : B.tin;   // the violin under the chin
  c.save(); c.translate(VT[0], VT[1]); c.rotate(VA); c.scale(VS, VS); A.blit(c, sv, -10, 0); c.restore();
  const nx = VT[0] + Math.cos(VA) * 540 * VS, ny = VT[1] + Math.sin(VA) * 540 * VS;   // left hand around the neck
  A.paint(c, withSeed(91, () => { const L = []; A.paint; L.push(A.wash(A.capsule(nx + 170, ny + 420, nx + 20, ny + 60, 46, 40), k('skin'), .8, 2, 2)); L.push(A.wash(A.ell(nx + 6, ny + 20, 46, 40, 14), k('skin'), .85, 2, 2)); for (let i = 0; i < 3; i++) L.push(A.wash(A.capsule(nx - 30 + i * 22, ny - 4 - i * 10, nx - 10 + i * 24, ny - 56 - i * 8, 11, 10), k('skin'), .85, 2, 1)); return L; }));
  // bow across the strings near the bridge, held by the right arm
  const cxp = VT[0] + Math.cos(VA) * 150 * VS, cyp = VT[1] + Math.sin(VA) * 150 * VS, ba = .22, u = bowU(t);
  const fx = cxp - Math.cos(ba) * (330 + u), fy = cyp - Math.sin(ba) * (330 + u);
  c.save(); c.translate(fx, fy); c.rotate(ba); A.blit(c, B.bow, 0, 0); c.restore();
  const S = [40, 1420], E = [Math.min(S[0], fx) - 70, (S[1] + fy) / 2 + 40];
  A.paint(c, withSeed(92, () => { const L = []; L.push(A.wash(A.capsule(S[0], S[1], lerp(S[0], E[0], .5), lerp(S[1], E[1], .5), 70, 60), k('shirt2'), .85, 2, 2)); L.push(A.wash(A.capsule(lerp(S[0], E[0], .45), lerp(S[1], E[1], .45), E[0], E[1], 44, 40), k('skin'), .82, 2, 2)); L.push(A.wash(A.capsule(E[0], E[1], fx, fy + 20, 40, 34), k('skin'), .82, 2, 2)); L.push(A.wash(A.ell(fx + 8, fy + 14, 44, 36, 14), k('skin'), .88, 2, 2)); return L; }));
  c.save(); c.translate(430, 940); c.rotate(-flinch); A.blit(c, B['hair' + v], 0, 0); c.restore();
  c.setTransform(1, 0, 0, 1, 0, 0);
}
const BF = Array.from({ length: 16 }, (_, i) => ({ t0: T.note1 + i * .14 + hash(i) * .2, a: -.35 - hash(i + 4) * 1.0, sp: 260 + hash(i + 9) * 320, sz: 30 + hash(i + 2) * 34, ph: hash(i + 7) * 6 }));
function butterflies(c, t, x0, y0, untilT = 99) {
  for (const b of BF) {
    const u = t - b.t0; if (u < 0 || t > untilT) continue;
    const x = x0 + Math.cos(b.a) * b.sp * u + Math.sin(u * 2 + b.ph) * 40, y = y0 + Math.sin(b.a) * b.sp * u - 40 * u * u;
    if (y < -80 || x < -80 || x > W + 80) continue;
    A.butterfly(c, x, y, b.sz * (.5 + .5 * clamp(u * 4)), Math.sin(u * 3 + b.ph) * .4, .5 + .5 * Math.sin(u * 22 + b.ph), A.PAL.accent, .88);
  }
}
function sceneFirst(t) {
  if (t < 22.0) return;
  paper(); bust(ctx, t, 'g');
  const r = 1800 * ei(seg(t, T.bloom[0], T.bloom[1]));
  const bx = VT[0] + Math.cos(VA) * 130, by = VT[1] + Math.sin(VA) * 130;
  if (r > 0) colourThrough(c => bust(c, t, 'c'), () => maskBlob(bx, by, r, 7));
  reset(); butterflies(ctx, t, VT[0] + Math.cos(VA) * 330, VT[1] + Math.sin(VA) * 330 + 40);   // born over the violin's neck, flying up and away from her face
}
function sceneHands(t) {
  sceneHandsBase(t);
  // rising brush wipe into the close shot just before the scrape
  wipe(t, 21.55, 22.0, c => bust(c, t, 'g'), -1);
}
function sceneHandsBase(t) { reset(); handsScene(ctx, t); }

// the alley: a long dolly; children join; colour follows them
const KIDS = [
  { x0: 380, in: 25.9, instr: 'tin', shirt: 'shirt', s: 2.1, main: true },
  { x0: 980, in: 26.6, instr: 'cello', shirt: 'shirt2', s: 2.0, door: true },
  { x0: 1560, in: 27.7, instr: 'sax', shirt: 'wall3', s: 1.95, door: true },
  { x0: 2050, in: 28.6, instr: 'tin', shirt: 'wall4', s: 1.9, door: true },
  { x0: 2500, in: 29.4, instr: 'cello', shirt: 'bag2', s: 2.0, door: true },
  { x0: 2900, in: 30.2, instr: 'tin', shirt: 'wall1', s: 1.85, door: true },
];
const camA = t => lerp(0, 2320, eio(seg(t, 25.9, 31.9)));
const walkX = t => lerp(380, 2900, seg(t, 25.9, 31.9));
function alleyKids(c, t, k) {
  const lead = walkX(t);
  const order = KIDS.map((d, i) => { const joined = d.main || t > d.in; const x = d.main ? lead : joined ? Math.max(d.x0, lead - 190 * Math.min(i, 3)) : d.x0; return { d, i, x, joined }; });
  for (const o of order) {
    const { d, x } = o, vis = d.main ? 1 : ss(seg(t, d.in - 1.2, d.in - .4)); if (vis <= 0) continue;
    const y = 1700 + (o.i % 2) * 90 - (o.joined || d.main ? 0 : 60), ph = t * 7.5 + o.i;
    c.globalAlpha = vis; A.paint(c, withSeed(100 + o.i, () => A.kid(k, x, y, d.s, ph, d.instr, d.shirt, o.joined || d.main ? 1 : 0))); c.globalAlpha = 1;
  }
}
function sceneAlley(t) {
  const cx = camA(t);
  reset(); ctx.drawImage(B.alleyg, -cx, 0); ctx.translate(-cx, 0); alleyKids(ctx, t, A.KG);
  const lead = walkX(t);
  colourThrough(c => { c.drawImage(B.alleyc, -cx, 0); c.translate(-cx, 0); alleyKids(c, t, A.KC); }, () => {
    mk_.translate(-cx, 0); mk_.fillStyle = '#000'; mk_.beginPath(); mk_.moveTo(-200, 0);
    for (let y = 0; y <= H; y += 24) mk_.lineTo(lead + 160 + (vnoise(y / 160 + t * .3) - .5) * 140, y);
    mk_.lineTo(-200, H); mk_.closePath(); mk_.fill();
    for (let i = 0; i < 4; i++) maskBlob(lead + 220 + i * 30, 1650 - i * 160, 150 + 40 * Math.sin(t * 2 + i), 30 + i);
  });
  reset(); ctx.translate(-cx, 0);
  const bx = walkX(t) + 90, by = 1340; ctx.setTransform(1, 0, 0, 1, -cx, 0);
  for (let i = 0; i < 5; i++) { const u = (t * .7 + i * .21) % 1; A.butterfly(ctx, bx + 160 * u + 60 * Math.sin(t * 3 + i), by - 600 * u, 16, Math.sin(t * 4 + i) * .4, .5 + .5 * Math.sin(t * 20 + i * 3), A.PAL.accent, .8 * (1 - u)); }
}
function stageScene(c, t) {
  const crane = ss(seg(t, 31.9, 35.4)), z = lerp(1.22, 1.0, crane), cy = lerp(1300, H / 2, crane);
  c.setTransform(z, 0, 0, z, W / 2 - W / 2 * z, H / 2 - cy * z); c.drawImage(B.stage, 0, 0);
  const bob = Math.sin((t - THEME0) / BEAT * Math.PI) * 4;
  A.blit(c, B.kidsStage, 0, bob);
  // the audience rises
  const rise = ss(seg(t, T.rise[0], T.rise[1]));
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) {
    const x = 60 + i * 120 + (row % 2) * 60 + hash(i * 7 + row) * 30, y0 = 1460 + row * 130, up = rise * (40 + hash(i + row * 9) * 50) * clamp(1.2 - row * .1);
    c.fillStyle = rgba('#2a1a22', .85); c.beginPath(); c.ellipse(x, y0 - up, 46, 54, 0, 0, 7); c.fill();
    c.beginPath(); c.ellipse(x, y0 + 110 - up, 74, 80, 0, 0, 7); c.fill();
    if (rise > .5 && hash(i + row * 3) > .55) { c.strokeStyle = rgba('#2a1a22', .8); c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 40, y0 + 70 - up); c.lineTo(x + 70, y0 - 60 - up - 30 * Math.abs(Math.sin(t * 9 + i))); c.stroke(); }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
}
function sceneStage(t) { reset(); stageScene(ctx, t); }

function sceneFinale(t) {
  const k = Math.exp(lerp(0, Math.log(25), eio(seg(t, T.push[0], T.push[1])))), u = eio(seg(t, T.push[0], T.push[1])), hb = bOfM(HM);
  const cx = lerp(W / 2, hb[0], ss(seg(u, 0, .8))), cy = lerp(H / 2 + 40, hb[1], ss(seg(u, 0, .8)));
  zoomFrame(t, k, cx, cy, 'c', true);
  birds(t, k, cx, cy, true);
}

// ---------- subtitles and title ----------
function subtitle(t) {
  const s = SUBS.find(s => t >= s.t0 && t < s.t1); if (!s) return;
  const a = ss(seg(t, s.t0, s.t0 + .35)) * (1 - ss(seg(t, s.t1 - .35, s.t1)));
  reset(); ctx.font = '400 56px "Gowun Batang"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const lines = s.text.split('\n'), y0 = 1640 - (lines.length - 1) * 38;
  lines.forEach((ln, i) => {
    ctx.shadowColor = rgba(PAPER, .95 * a); ctx.shadowBlur = 26; ctx.lineJoin = 'round'; ctx.strokeStyle = rgba(PAPER, .82 * a); ctx.lineWidth = 14;
    ctx.strokeText(ln, W / 2, y0 + i * 76); ctx.shadowBlur = 0; ctx.fillStyle = rgba(INK, .86 * a); ctx.fillText(ln, W / 2, y0 + i * 76);
  });
}
function title(t) {
  if (t < TITLE.t0) return;
  const p = seg(t, TITLE.t0, TITLE.t0 + 1.4), q = ss(seg(t, TITLE.t0 + .9, TITLE.t0 + 1.5));
  reset(); ctx.save();
  // a paper halo behind the title so it reads over the colour
  const g = ctx.createRadialGradient(W / 2, 300, 40, W / 2, 300, 520); g.addColorStop(0, rgba(PAPER, .85 * ss(p * 2))); g.addColorStop(1, rgba(PAPER, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 700);
  ctx.font = '700 84px "Gowun Batang"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(TITLE.main).width; ctx.beginPath(); ctx.rect(W / 2 - w / 2 - 10, 200, (w + 20) * eo(p), 200); ctx.clip();
  ctx.fillStyle = rgba(INK, .9); ctx.fillText(TITLE.main, W / 2, 300); ctx.restore();
  reset(); ctx.font = '400 40px "Gowun Batang"'; ctx.textAlign = 'center'; ctx.fillStyle = rgba('#7a5a44', .9 * q); ctx.fillText(TITLE.sub, W / 2, 400);
  // the accent: a small vermilion stroke under the title, like the tin's printed band
  withSeed(5, () => drawS(ctx, mk(qcurve(W / 2 - 160, 450, W / 2 + 160, 446, -4, 12), 10, A.PAL.accent, { prof: 'even', nb: 3, a: .85 }), seg(t, TITLE.t0 + 1.3, TITLE.t0 + 2.0)));
}

function render(t) {
  reset(); ctx.drawImage(PAPER_IMG, 0, 0);
  if (t < SC.window[0]) { sceneMount(t); mist(t, T.mist1[0], T.mist1[1]); }
  else if (t < T.turn[0]) sceneWindow(t);
  else if (t < SC.hands[0]) { scenePlate(t); wipe(t, T.wipe1[0], T.wipe1[1], c => handsScene(c, t), 1); }
  else if (t < SC.first[0]) sceneHands(t);
  else if (t < SC.alley[0]) { sceneFirst(t); }
  else if (t < SC.stage[0]) { sceneAlley(t); wipe(t, T.wipe2[0], T.wipe2[1], c => stageScene(c, t), 1); }
  else if (t < T.mist2[0] + .5) { sceneStage(t); mist(t, T.mist2[0], T.mist2[1]); }
  else { sceneFinale(t); mist(t, T.mist2[0], T.mist2[1]); }
  subtitle(t); title(t);
}

// ---------- page contract ----------
window.DUR = DUR; window.render = render; window.SUBS = SUBS;
window.TEXTS = t => {
  const o = []; if (t >= TITLE.t0 + 1.4) o.push({ id: 'title', text: TITLE.main, x0: 200, y0: 240, x1: 880, y1: 360 });
  if (t >= TITLE.t0 + 1.5) o.push({ id: 'sub', text: TITLE.sub, x0: 200, y0: 380, x1: 880, y1: 420 });
  T.parts.slice(0, 4).forEach((p, i) => { if (t >= p + .85 && t < T.wipe1[0] + .2) o.push({ id: 'lab' + i, text: LABELS[i], x0: 300, y0: 400, x1: 900, y1: 1600 }); });
  return o;
};
window.EV = (() => {
  const e = [], add = (type, t, o = {}) => e.push({ type, t: +t.toFixed(3), ...o });
  add('amb_dump', 0, { d: 8.4 }); add('amb_wind', 8.4, { d: 7.5 }); add('amb_room', 15.9, { d: 6.1 });
  for (let i = 0; i < 8; i++) add('clink', .5 + i * .45 + hash(i) * .2, { v: .4 + hash(i + 1) * .3 });
  add('bag', 1.4); add('birds', 4.0, { d: 4 }); add('mist', T.mist1[0]); add('reach', T.reach[0]); add('shadow', T.shadow[0], { d: 3 });
  add('page', T.turn[0]);
  T.parts.forEach((p, i) => add(['hammer', 'saw', 'screw', 'fork', 'tune'][i], p));
  add('wipe', T.wipe1[0]); add('cloth', T.give[1] - .05); add('wipe', 21.55, { v: .4 });
  add('scrape', T.scrape1); add('scrape', T.scrape2, { v: .8 }); add('flutter', T.note1, { d: 2.5 });
  add('amb_village', 25.9, { d: 6 }); for (let x = 25.9; x < 31.9; x += BEAT) add('step', x, { v: .35 });
  add('wipe', T.wipe2[0]); add('crowd', 31.5, { d: 6.4 }); add('applause', T.rise[0], { d: 3.5 });
  add('mist', T.mist2[0]); add('amb_warm', 38.0, { d: 6.3 }); add('thunk', T.thunk);
  return e.sort((a, b) => a.t - b.t);
})();

(async () => {
  PAPER_IMG = new Image(); PAPER_IMG.src = 'paper.jpg'; await PAPER_IMG.decode();
  for (const f of ['400 56px "Gowun Batang"', '700 84px "Gowun Batang"', '400 58px "Nanum Pen Script"']) await document.fonts.load(f);
  build();
  const q = new URLSearchParams(location.search).get('t'); render(q ? +q : 0);
  window.READY = true;
})();
