// story.js — the one timeline of 「쓰레기로 만든 바이올린」 80s cel version (picture, subtitles, score and sound all read it)
export const DUR = 50.0;
export const BPM = 80, BEAT = 60 / BPM, BAR = 4 * BEAT;   // 0.75 s beat, 3.0 s bar
export const SHOP0 = 15.9;                                  // workshop grid
export const THEME0 = 22.9;                                 // beat 0 of the theme = the first clear note
export const bar = n => THEME0 + n * BAR;

// shots [t0, t1, name] — cuts land on bars after the first note
export const SHOTS = [
  [0, 3.8, 'hands'], [3.8, 8.4, 'crane'], [8.4, 15.9, 'window'], [15.9, 20.5, 'bench'], [20.5, 22.0, 'receive'],
  [22.0, 25.9, 'bust'], [25.9, 31.9, 'alley'], [31.9, 37.9, 'stage'], [37.9, 40.9, 'section'], [40.9, 43.9, 'solo'],
  [43.9, 45.7, 'tutti'], [45.7, DUR, 'end'],
];
export const shotAt = t => SHOTS.find(s => t >= s[0] && t < s[1]) || SHOTS[SHOTS.length - 1];
export const T = {
  dig: [0, 1.6], grab: 1.6, lift: [2.4, 3.5], crane: [3.8, 8.2], reach: [11.6, 12.6], shadow: [12.0, 15.4],
  parts: [16.275, 16.65, 17.025, 17.4, 17.775], give: [20.5, 21.2], scrape1: 22.0, scrape2: 22.45, note1: 22.9,
  rise: [32.9, 34.4], title: 45.7, thunk: 49.2,
};
export const SUBS = [
  { t0: 0.3, t1: 3.65, text: '이 손은 매일 쓰레기를 주웠다.' },
  { t0: 3.85, t1: 8.3, text: '파라과이, 카테우라.\n도시가 버린 것들이 모이는 곳.' },
  { t0: 8.5, t1: 11.45, text: '어느 날, 음악 선생님이 왔다.' },
  { t0: 11.6, t1: 15.75, text: '하지만 바이올린 한 대는\n집 한 채보다 비쌌다.' },
  { t0: 15.9, t1: 20.3, text: '그러자 한 목수가\n쓰레기를 뒤지기 시작했다.' },
  { t0: 23.2, t1: 27.25, text: '그 소리를 들으면\n배 속에서 나비가 날았다.' },
  { t0: 27.45, t1: 31.85, text: '하나둘, 아이들이 모였다.\n쓰레기는 악기가 되었다.' },
  { t0: 32.0, t1: 36.2, text: '그 악기로, 아이들은\n세계의 무대에 섰다.' },
  { t0: 38.0, t1: 42.4, text: '쓰레기도, 사람도.\n함부로 버려져선 안 된다.' },
];
export const TITLE = { main: '쓰레기로 만든 바이올린', sub: '카테우라 재활용 오케스트라 · 실화' };
export const LABELS = ['과자 깡통', '버려진 나무', '고기 망치', '포크'];
