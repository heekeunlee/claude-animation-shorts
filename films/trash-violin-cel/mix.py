"""Mix: ambience beds + foley from events.json (window.EV) + out/score.wav → out/mix.wav (48 kHz stereo).
No narration, so nothing is ducked; the score is the voice. The two silences (11.6 and 20.0–22.0) stay near-silent.
Usage: python mix.py   (LIB = the Lemo-Opuscar library; run node core/render/events.mjs first)"""
import os, sys, json
import numpy as np, soundfile as sf
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')); sys.path.insert(0, LIB)
from core.audio.sfx import SR, t_, env_exp, bp, lp, hp, noise, norm, brown, click, clack, whoosh, thump, step, ding, add, limit, compress
HERE = os.path.dirname(os.path.abspath(__file__))
E = json.load(open(os.path.join(HERE, 'events.json'))); DUR = E['dur']; N = int(DUR * SR)
amb, fx = np.zeros((N + SR, 2), np.float32), np.zeros((N + SR, 2), np.float32)
rng = np.random.default_rng(11)

def fade(x, a=.4, b=.6):
    n = len(x); e = np.ones(n); fa, fb = int(a * SR), int(b * SR); e[:fa] = np.linspace(0, 1, fa); e[n - fb:] = np.linspace(1, 0, fb); return x * e
def wind(d, bright=1.0):
    x = brown(d); x = bp(x, 120, 900 * bright); m = .6 + .4 * np.interp(t_(d), np.linspace(0, d, 12), rng.uniform(.3, 1, 12)); return norm(x * m, .5)
def flies(d):
    x = np.zeros(int(d * SR))
    for k in range(3):
        tt = t_(d); f = 210 + 30 * k + 12 * np.sin(2 * np.pi * (.7 + k * .3) * tt); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
        x += bp(s, 200, 2500) * (.5 + .5 * np.sin(2 * np.pi * (.21 + k * .13) * tt + k)) ** 2
    return norm(x, .25)
def birds(d):
    x = np.zeros(int(d * SR))
    for k in range(9):
        at = int(rng.uniform(0, d - .4) * SR); n = int(.12 * SR); tt = np.arange(n) / SR; f = 2600 + 900 * np.sin(np.pi * tt / .12) * rng.uniform(.6, 1.2)
        x[at:at + n] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / .12) * rng.uniform(.3, .7)
    return x * .5
def clink(v=1.0):
    n = int(.2 * SR); tt = np.arange(n) / SR; f = rng.uniform(1800, 3600)
    return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.7 * tt)) * np.exp(-tt * 30) * v * .5 + bp(noise(.2), 2000, 7000) * np.exp(-tt * 60) * .2 * v
def rustle(d, v=1.0):   # plastic bag / paper brush
    x = hp(noise(d), 1800) * (.4 + .6 * np.abs(np.sin(2 * np.pi * 7 * t_(d) + rng.uniform(0, 3)))); return fade(norm(x, .35 * v), .05, .15)
def page():
    d = .55; x = bp(noise(d), 600, 6000) * np.exp(-((t_(d) - .2) / .12) ** 2); return norm(x, .5) + norm(lp(noise(d), 300) * env_exp(d, .06), .15)
def hammer():
    a, c = norm(thump(.9, 110), .6), clink(.8); n = min(len(a), len(c)); return a[:n] + c[:n]
def saw():
    d = .55; x = bp(noise(d), 1500, 5000) * (.5 + .5 * np.abs(np.sin(2 * np.pi * 9 * t_(d)))); return fade(norm(x, .35), .02, .1)
def screw():
    x = np.zeros(int(.5 * SR))
    for k in range(6): a = int(k * .07 * SR); c = click(1.6, .5); x[a:a + len(c)] += c[:len(x) - a]
    return x
def fork():
    n = int(1.2 * SR); tt = np.arange(n) / SR; return (np.sin(2 * np.pi * 1320 * tt) + .2 * np.sin(2 * np.pi * 3640 * tt)) * np.exp(-tt * 3.5) * .3
def tune():   # a peg turned: the string slides up to pitch
    n = int(.6 * SR); tt = np.arange(n) / SR; f = 330 + 110 * np.minimum(1, tt / .45)
    x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 3); return bp(x, 300, 3000) * .15 + rustle(.6, .3) * .4
def flutter(d):
    x = np.zeros(int(d * SR))
    for k in range(14):
        at = int(rng.uniform(0, d - .5) * SR); n = int(.4 * SR); tt = np.arange(n) / SR
        x[at:at + n] += hp(noise(.4), 2500)[:n] * (.5 + .5 * np.sin(2 * np.pi * rng.uniform(14, 20) * tt)) * np.sin(np.pi * tt / .4) * .12
    return x
def crowd(d):
    x = sum(bp(noise(d), 250 + 90 * k, 900 + 200 * k) * (.6 + .4 * np.sin(2 * np.pi * (.3 + .17 * k) * t_(d) + k)) for k in range(4)); return fade(norm(x, .25), 1.0, .8)
def applause(d):
    x = np.zeros(int(d * SR))
    for k in range(int(d * 90)):
        at = int(rng.uniform(0, d - .05) * SR); c = hp(noise(.03), 900) * env_exp(.03, .008); x[at:at + len(c)] += c * rng.uniform(.3, 1)
    env = np.minimum(1, t_(d) / .5) * np.minimum(1, (d - t_(d)) / 1.2); return norm(x * env, .45)

GAIN = {'clink': .5, 'bag': .4, 'mist': .25, 'reach': .2, 'shadow': .2, 'page': .7, 'hammer': .6, 'saw': .5, 'screw': .6, 'fork': .5, 'tune': .5,
        'wipe': .3, 'cloth': .35, 'flutter': .6, 'step': .35, 'thunk': .55}
for e in E['ev']:
    ty, t, v, d = e['type'], e['t'], e.get('v', 1.0), e.get('d', 1.0)
    if ty == 'amb_dump': add(amb, fade(wind(d) + flies(d)), t, .55)
    elif ty == 'amb_wind': add(amb, fade(wind(d, .7)), t, .45)
    elif ty == 'amb_room': add(amb, fade(norm(lp(brown(d), 400), .2), .3, .3), t, .35)
    elif ty == 'amb_village': add(amb, fade(wind(d, .8) * .6 + birds(d) * .5), t, .4)
    elif ty == 'amb_warm': add(amb, fade(wind(d, .6) * .8 + birds(d) * .4, .8, 1.5), t, .4)
    elif ty == 'birds': add(amb, birds(d), t, .5, .2)
    elif ty == 'crowd': add(amb, crowd(d), t, .5)
    elif ty == 'applause': add(amb, applause(d), t, .55)
    elif ty == 'clink': add(fx, clink(v), t, GAIN['clink'], rng.uniform(-.4, .4))
    elif ty == 'bag': add(fx, rustle(.6), t, GAIN['bag'], -.2)
    elif ty in ('mist', 'wipe'): add(fx, whoosh(.6, .5), t, GAIN[ty] * v)
    elif ty == 'reach': add(fx, rustle(.4, .6), t, GAIN['reach'])
    elif ty == 'shadow': add(fx, norm(lp(brown(d), 200), .3) * np.linspace(0, 1, int(d * SR)) ** 2, t, GAIN['shadow'])
    elif ty == 'page': add(fx, page(), t, GAIN['page'])
    elif ty == 'hammer': add(fx, hammer(), t, GAIN['hammer'], -.1)
    elif ty == 'saw': add(fx, saw(), t, GAIN['saw'], .1)
    elif ty == 'screw': add(fx, screw(), t, GAIN['screw'])
    elif ty == 'fork': add(fx, fork(), t, GAIN['fork'], .2)
    elif ty == 'tune': add(fx, tune(), t, GAIN['tune'])
    elif ty == 'cloth': add(fx, rustle(.35, .5), t, GAIN['cloth'])
    elif ty == 'flutter': add(fx, flutter(d), t, GAIN['flutter'], .2)
    elif ty == 'step': add(fx, step(.5), t, GAIN['step'] * v, rng.uniform(-.2, .2))
    elif ty == 'thunk': a, c = norm(thump(.8, 140), .6), clink(.5); n = min(len(a), len(c)); add(fx, a[:n] + c[:n] * .6, t, GAIN['thunk'])
    elif ty == 'scrape': pass   # in the score
    elif ty == 'crton': n = int(.5 * SR); tt = np.arange(n) / SR; add(fx, norm(thump(.8, 60), .5), t, .4); add(fx, np.sin(2 * np.pi * 15734 / 4 * tt) * np.exp(-tt * 3) * .05, t, 1)
    elif ty == 'tapenoise': add(fx, fade(hp(noise(d), 1500) * .25, .01, .05), t, .6)
    elif ty == 'grab': add(fx, clink(.7), t, .6, .1)
    elif ty == 'lift': add(fx, rustle(.5, .6), t, .4)
    elif ty == 'flash': add(fx, norm(bp(noise(.6), 2000, 9000) * env_exp(.6, .25), .3), t, .4)
score, sr = sf.read(os.path.join(HERE, 'out/score.wav'), dtype='float32'); assert sr == SR
out = np.zeros((N + SR, 2), np.float32); out[:len(score)] += score * 1.0
out += amb * 1.4 + fx * 1.2
# the silences: only paper and room (20.0–22.0), wind only after the cut (11.6)
s0, s1 = int(20.05 * SR), int(21.95 * SR); out[s0:s1] *= .25
out = np.stack([compress(out[:N, c] * .6, thr=.18, ratio=3.5) for c in (0, 1)], 1); out = np.stack([limit(out[:, c], .3) for c in (0, 1)], 1)
sf.write(os.path.join(HERE, 'out/mix.wav'), out, SR)
r = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
print('mix', round(N / SR, 2), 's | score', round(r(score), 1), 'amb', round(r(amb), 1), 'fx', round(r(fx), 1), 'dB')
