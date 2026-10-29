"""Original score for 「쓰레기로 만든 바이올린」 → out/score.wav (48 kHz stereo)
One theme, built from the open strings a beginner can play (A4, D4), grows from a tin violin alone to a full orchestra and back.
D major, 80 bpm, beat 0 = the first clear note (story.js THEME0 = 22.9 s). Instruments: VSCO 2 CE / VCSL samples (CC0);
the 'tin' instruments are the samples through a resonant tin-body filter, so the recycled instruments sound like cans.
Usage: python music/score.py   (LIB = the Lemo-Opuscar library)"""
import os, sys, json, re
import numpy as np, soundfile as sf
from scipy.signal import lfilter, butter
LIB = os.environ.get('LIB', os.path.expanduser('~/lemo-opuscar')); sys.path.insert(0, LIB)
from core.audio import sampler as S
from core.audio.sfx import SR, add, limit
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
story = open(os.path.join(HERE, 'story.js'), encoding='utf-8').read()
num = lambda k: float(re.search(k + r'\s*=\s*([\d.]+)', story).group(1))
DUR, THEME0, BEAT = num('DUR'), num('THEME0'), 60 / num('BPM')
b = lambda x: THEME0 + x * BEAT                     # beat → seconds
S.seed(7)

def peq(x, f, g, q):
    A = 10 ** (g / 40); w = 2 * np.pi * f / SR; al = np.sin(w) / (2 * q)
    bb = [1 + al * A, -2 * np.cos(w), 1 - al * A]; aa = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return lfilter(np.array(bb) / aa[0], np.array(aa) / aa[0], x)
def tin(x, amt=1.0):
    """a biscuit tin instead of a wooden body: thin lows, ringing metal modes, a little rattle"""
    bh, ah = butter(2, 260 / (SR / 2), 'high'); y = lfilter(bh, ah, x)
    for f, g, q in [(1480, 7, 9), (2350, 6, 10), (3900, 5, 12), (5600, 3, 8)]: y = peq(y, f, g * amt, q)
    y = np.tanh(y * (1 + 1.5 * amt)) / np.tanh(1 + 1.5 * amt)
    return (1 - .5 * amt) * x + .5 * amt * y / (np.abs(y).max() + 1e-9) * np.abs(x).max()

N = int(DUR * SR) + SR
mix = np.zeros((N, 2), np.float32)
def put(x, t, g=1.0, pan=0.0): add(mix, x.astype(np.float32), t, g, pan)
def note(inst, p, t, d, v=.7, g=1., pan=0., fx=None, **kw):
    x = S.note(inst, p, d, vel=v, **kw)
    if fx: x = fx(x)
    put(x, t, g, pan)

# 1. through the window (8.4–11.6): the teacher plucks the theme's first notes on a real violin — clean, distant, then cut dead
win = np.zeros((N, 2), np.float32)
for i, p in enumerate(['A4', 'D5', 'E5', 'F#5', 'A5', 'F#5', 'E5', 'D5', 'A4', 'D5']):
    t = 8.15 + i * BEAT * .5
    if t > 11.5: break
    add(win, S.note('violin_pizz', p, .6, vel=.55), t, .9, .25)
bl, al = butter(2, 2400 / (SR / 2)); win = lfilter(bl, al, win, axis=0).astype(np.float32)
win = S.room(win, size=.35, mix=.25)
cut = int(11.6 * SR); win[cut:] = 0; f = int(.03 * SR); win[cut - f:cut] *= np.linspace(1, 0, f)[:, None]
mix += win * .55

# 2. the workshop (17.7–20.0): junk percussion joins the tool rhythm, then stops for the silence
def can(v=.8):
    n = int(.25 * SR); tt = np.arange(n) / SR; x = np.random.default_rng(int(v * 999)).standard_normal(n) * np.exp(-tt * 28)
    y = sum(peq(x * .3, f, 18, 14) for f in (1210, 2630, 4100)) ; return (y / (np.abs(y).max() + 1e-9) * v).astype(np.float32)
def bucket(v=.8):
    n = int(.35 * SR); tt = np.arange(n) / SR; fr = 95 * np.exp(-tt * 6) + 55
    x = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 11) + .25 * np.random.default_rng(3).standard_normal(n) * np.exp(-tt * 40)
    return (x / np.abs(x).max() * v).astype(np.float32)
def bottle(p=2100, v=.6):
    n = int(.45 * SR); tt = np.arange(n) / SR; x = (np.sin(2 * np.pi * p * tt) + .3 * np.sin(2 * np.pi * p * 2.76 * tt)) * np.exp(-tt * 9) * (1 - np.exp(-tt * 900))
    return (x * v).astype(np.float32)
SHOP0 = num('SHOP0')
for k in range(int((20.0 - SHOP0) / (BEAT / 2))):
    t = SHOP0 + k * BEAT / 2
    if t < 17.7 or t > 19.9: continue
    if k % 4 == 0: put(bucket(.5), t, .5, -.1)
    if k % 4 == 2: put(can(.4), t, .35, .2)

# 3. the first note: two scrapes, then A4 on the tin violin
def scrape(dur=.32, seed=1):
    n = int(dur * SR); tt = np.arange(n) / SR; rng = np.random.default_rng(seed)
    x = rng.standard_normal(n); x = peq(peq(x, 1800, 14, 3), 3200, 10, 4) * .06
    saw = np.sin(2 * np.pi * np.cumsum(440 * (1 + .06 * np.sin(2 * np.pi * 9 * tt) + .04 * rng.standard_normal(n).cumsum() / 300)) / SR)
    x = (x + .5 * np.sign(saw) * np.abs(saw) ** .3) * np.minimum(1, tt / .02) * np.exp(-tt * 4)
    return (tin(x, .8) / (np.abs(x).max() + 1e-9) * .6).astype(np.float32)
put(scrape(.34, 1), 22.0, .5, .1); put(scrape(.3, 2), 22.45, .42, .1)

VT = lambda x: tin(x, .9)
CT = lambda x: tin(x, .6)
# solo: the open strings, then the pickup
for p, at, d in [('A4', 0, 1.75), ('D4', 2, 1.5), ('A4', 3.5, .5)]: note('violin', p, b(at), d * BEAT, .7, 1.0, .05, VT, attack=.04)
# the theme (beats), played by the tin violin; doubled by the section on the stage bars
THEME = [('D5', 4, 1), ('E5', 5, .5), ('F#5', 5.5, .5), ('A5', 6, 2), ('G5', 8, 1), ('F#5', 9, 1), ('E5', 10, 1), ('A4', 11, 1),
         ('D5', 12, 1), ('E5', 13, .5), ('F#5', 13.5, .5), ('A5', 14, 2), ('B5', 16, 1), ('A5', 17, 1), ('G5', 18, .5), ('F#5', 18.5, .5), ('E5', 19, 1)]
for p, at, d in THEME: note('violin', p, b(at), d * BEAT * 1.02, .72 if at < 12 else .8, 1.0, .05, VT, attack=.03)
for p, at, d in THEME[8:]: note('violins', p, b(at), d * BEAT * 1.02, .75, .75, -.25, attack=.05); note('violins', S.midi(p) - 12, b(at), d * BEAT * 1.02, .65, .5, .3, attack=.05)
# harmony: bar by bar (beat, chord root for the bass, chord tones for the pads/pizz)
CH = [(4, 'D2', ['D3', 'A3', 'F#4']), (8, 'G2', ['G3', 'B3', 'D4']), (10, 'A2', ['A3', 'C#4', 'E4']),
      (12, 'D2', ['D3', 'A3', 'F#4']), (16, 'G2', ['G3', 'B3', 'D4']), (17, 'F#2', ['F#3', 'A3', 'D4']), (18, 'E2', ['E3', 'G3', 'B3']), (19, 'A2', ['A3', 'C#4', 'E4'])]
ends = [c[0] for c in CH[1:]] + [20]
for (at, root, tones), e in zip(CH, ends):
    d = (e - at) * BEAT
    note('cellos', S.midi(root) + 12, b(at), d * 1.02, .62 if at < 12 else .75, .9, -.15, CT, attack=.06)          # the oil-drum cello
    if at >= 12:
        note('contrabass', root, b(at), d * 1.02, .7, .8, 0, attack=.05)
        for tn in tones: note('violas', tn, b(at), d * 1.02, .55, .45, .2, attack=.12)
        note('horn', tones[1], b(at), d * 1.02, .5, .45, -.3, attack=.1)
    for k in range(int((e - at) * 2)):   # pizzicato eighths through the ensemble bars
        if at < 12 or k % 2 == 0: note('violins_pizz', tones[k % 3] if at >= 12 else S.midi(tones[k % 3]) + 12, b(at + k * .5), .4, .5, .55, .35)
# junk percussion: bucket on 1 and 3, can on 2 and 4, a bottle on the offbeats on the stage
for k in range(16):
    t = b(4 + k)
    put(bucket(.7), t, .55 if k % 2 == 0 else 0, -.1) if k % 2 == 0 else put(can(.6), t, .4, .2)
    if k >= 8: put(bottle(2100 if k % 2 else 2480, .5), t + BEAT / 2, .3, .35)
# the drain-pipe sax: a counter-line from bar 2
for p, at, d in [('F#4', 8, 2), ('E4', 10, 2), ('A4', 12, 2), ('F#4', 14, 2), ('G4', 16, 2), ('A4', 18, 2)]: note('tenor_sax', p, b(at), d * BEAT, .55, .55, -.35, lambda x: tin(x, .3), attack=.05)
# the stage: timpani swell into it, glockenspiel on the tune, bass drum on the downbeats
put(S.hit('timpani', 0, .6), b(11.5), .5, 0)
for at in (12, 16): put(S.hit('bass_drum', None, .7), b(at), .55, 0)
for p, at, d in THEME[8:]: note('glockenspiel', S.midi(p) + 12, b(at), .6, .45, .25, .4)
# coda: the orchestra lands on D and lets go; the tin violin alone plays its first two notes again; a harp
for tn in ['D3', 'A3', 'D4', 'F#4', 'A4']: note('violins' if S.midi(tn) >= 55 else 'cellos', tn, b(20), 3 * BEAT, .5, .45, 0, attack=.15, release=2.5)
note('contrabass', 'D2', b(20), 3 * BEAT, .55, .6, 0, release=2.5)
note('violin', 'A4', b(20.5), 2.2 * BEAT, .58, .95, .05, VT, attack=.08)
note('violin', 'D4', b(23), 3.2 * BEAT, .55, .95, .05, VT, attack=.08, release=1.8)
x = S.chord('harp', ['D3', 'A3', 'D4', 'F#4', 'A4', 'D5'], 4.0, .5, strum=.09); put(x, b(23), .55, -.2)

mix = S.room(mix, size=.5, mix=.2)
mix[int(20.0 * SR):int(21.98 * SR)] *= 0.0    # the silence before the first sound is real
mix = mix[:int(DUR * SR)]; mix = np.stack([limit(mix[:, c], .95) for c in (0, 1)], 1)   # the limiter is 1-D: one channel at a time
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
sf.write(os.path.join(HERE, 'out/score.wav'), mix, SR)
json.dump(S.credits(['violin', 'violin_pizz', 'violins', 'violins_pizz', 'violas', 'cellos', 'contrabass', 'horn', 'tenor_sax', 'glockenspiel', 'harp', 'timpani', 'bass_drum']), open(os.path.join(HERE, 'out/score_credits.json'), 'w'), ensure_ascii=False, indent=1)
print('score.wav', round(len(mix) / SR, 2), 's  peak', round(float(np.abs(mix).max()), 3))
