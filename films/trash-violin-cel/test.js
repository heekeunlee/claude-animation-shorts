// model sheet: ?test=model (characters, hands, instruments in the three colour models)
import { W, H, vgrad } from './cel.js';
import { PAL } from './pal.js';
import * as A from './art.js';
export function test(g, e, t, which) {
  vgrad(g, 0, 0, W, H, [[0, '#d8d0c4'], [1, '#b8ae9e']]);
  const P = PAL.day;
  A.girl(g, P, { x: 220, y: 860, s: .9, pose: 'stand', expr: 'neutral' });
  A.girl(g, PAL.smog, { x: 640, y: 860, s: .9, pose: 'crouch' });
  A.kid(g, PAL.dusk, { x: 920, y: 860, s: .9, instr: 'tin', shirt: 'shirt3' });
  A.handTop(g, PAL.smog, { x: 160, y: 1420, s: 1.1, curl: [.1, .2, .3, .4], dirt: true });
  A.handTop(g, PAL.smog, { x: 420, y: 1420, s: 1.1, curl: [.9, .95, .9, .85], thumb: .8 });
  A.handUp(g, P, { x: 680, y: 1440, s: 1.0 });
  A.kid(g, PAL.stage, { x: 900, y: 1500, s: .8, instr: 'cello', shirt: 'shirt4' });
  A.tinViolin(g, P, { x: 40, y: 1720, s: .8 }); A.bow(g, P, { x: 560, y: 1660, s: .8 });
  A.pipeSax(g, P, { x: 980, y: 1300, s: .6 }); A.bottle(g, P, { x: 1000, y: 1900, s: .7 });
}
