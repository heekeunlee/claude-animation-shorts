// pal.js — colour models (色指定) for 「쓰레기로 만든 바이올린」: one daylight model, derived per lighting.
// smog = the grey noon before the first note (multiplied AND drained toward grey); dusk = after it; stage = under the lights;
// backlit = silhouettes with a warm rim. The accent (the tin's vermilion band) keeps its saturation in every set.
import { hex } from './cel.js';

export const BASE = {
  skin: { f: '#ffd2b8', s: '#e09c86', h: '#fff0e4', l: '#6a3a30' },
  skinK: { f: '#d9a07e', s: '#a86c56', h: '#f0c4a4', l: '#4a2418' },   // the carpenter's weathered hands
  blush: '#ff9a8a',
  hair: { f: '#4a3038', s: '#2c1c26', h: '#8a6470', l: '#2a1424' },
  lash: '#1c0f16',
  shirt: { f: '#f4cf55', s: '#cf9a32', h: '#fff0a8', l: '#6a4a10' },
  shirt2: { f: '#5f9ad8', s: '#3d6aa8', h: '#a8ccf4', l: '#1c2f5a' },
  shirt3: { f: '#e8786a', s: '#b04a44', h: '#ffb0a0', l: '#5a1c18' },
  shirt4: { f: '#7ab86a', s: '#4e8a46', h: '#b8e4a4', l: '#1e3c18' },
  shorts: { f: '#4f5f7c', s: '#323e56', h: '#7f90b0', l: '#141a28' },
  tin: { f: '#cdd5dc', s: '#7f8c98', h: '#ffffff', l: '#2e3640' },
  accent: { f: '#e2482a', s: '#a82c1c', h: '#ff9a7a', l: '#5a160c' },
  wood: { f: '#b67c48', s: '#7c4e2a', h: '#e6b47c', l: '#3a2210' },
  rust: { f: '#c4682e', s: '#86401a', h: '#f2a26a', l: '#40200c' },
  pipe: { f: '#a8b0b4', s: '#687076', h: '#eef2f4', l: '#262c30' },
  bottle: { f: '#7ec4a8', s: '#4a8a74', h: '#d8fff0', l: '#1c3c30' },
  bag1: { f: '#5d8fc5', s: '#3c6494', h: '#a6c8ee', l: '#1a2c48' },
  bag2: { f: '#e8b84a', s: '#b0842a', h: '#fff0a0', l: '#4a3410' },
  bag3: { f: '#e06a8a', s: '#a8445e', h: '#ffb0c4', l: '#4a1424' },
  card: { f: '#c8a072', s: '#94704a', h: '#ecd0a8', l: '#4a3420' },
  can: { f: '#b8c0c6', s: '#7a848c', h: '#f4f8fa', l: '#2a3036' },
  mud: { f: '#8a7462', s: '#625040', h: '#b09a84', l: '#2e2218' },
  eye: { f: '#6a3e22', s: '#341a0a', h: '#c08a5a', l: '#1a0a04' },
  white_eye: '#fbf6f0',
  mouth: '#9a3b4a',
  phone: { f: '#2a2a34', s: '#16161d', h: '#5c5c70', l: '#08080c' },
};

const mul = (c, m, desat = 0) => {
  const v = hex(c), Y = v[0] * .3 + v[1] * .59 + v[2] * .11;
  return '#' + v.map((x, i) => Math.max(0, Math.min(255, Math.round((x + (Y - x) * desat) * m[i]))).toString(16).padStart(2, '0')).join('');
};
export const LIGHTS = {
  day: { lit: [1, 1, 1], shade: [1, 1, 1], line: [1, 1, 1], desat: 0 },
  smog: { lit: [.9, .88, .82], shade: [.74, .7, .68], line: [.85, .85, .85], desat: .62 },
  dusk: { lit: [1.04, .88, .8], shade: [.84, .62, .78], line: [1, .8, .9], desat: 0 },
  stage: { lit: [1.02, .92, .8], shade: [.56, .46, .72], line: [.8, .7, 1], desat: 0 },
  backlit: { lit: [.42, .3, .5], shade: [.26, .17, .34], line: [.4, .25, .5], desat: .2 },
};
export function palette(name) {
  const L = LIGHTS[name], out = {};
  for (const [k, v] of Object.entries(BASE)) {
    const d = k === 'accent' ? 0 : L.desat;
    if (typeof v === 'string') { out[k] = mul(v, L.lit, d); continue; }
    out[k] = {};
    for (const [kk, c] of Object.entries(v)) out[k][kk] = mul(c, kk === 's' ? L.shade : kk === 'l' ? L.line : L.lit, d);
  }
  return out;
}
export const PAL = Object.fromEntries(Object.keys(LIGHTS).map(k => [k, palette(k)]));
// skin is set by hand per lighting (multiplying turns faces grey-green under smog, pink under the stage lights)
Object.assign(PAL.smog.skin, { f: '#e6c4ae', s: '#bf9484', h: '#f6e2d4' });
Object.assign(PAL.stage.skin, { f: '#f4c8ae', s: '#a87894', h: '#fff0e0' });
Object.assign(PAL.dusk.skin, { f: '#ffc8a8', s: '#d48a84', h: '#fff0dc' });
