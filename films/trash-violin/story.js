// story.js — the one timeline of 「쓰레기로 만든 바이올린」 (picture, subtitles, music and sound all read it)
export const DUR = 45.6;
export const BPM = 80, BEAT = 60 / BPM, BAR = 4 * BEAT;      // 0.75 s beat, 3.0 s bar
export const SHOP0 = 15.9;                                     // workshop rhythm: beat grid from the page turn
export const THEME0 = 22.9;                                    // theme grid: the first clear note
export const bar = n => THEME0 + n * BAR;                      // bar(0)=22.9 solo, bar(1)=25.9 ensemble, bar(3)=31.9 stage, bar(5)=37.9 coda

// Scenes [t0, t1, name]: transitions happen inside the medium (continuous zoom, mist, page turn, brush wipe)
export const SC = {
  mount: [0, 8.4], window: [8.4, 15.9], plate: [15.9, 20.5], hands: [20.5, 22.0],
  first: [22.0, 25.9], alley: [25.9, 31.9], stage: [31.9, 37.9], finale: [37.9, DUR],
};
export const T = {
  zoom: [3.8, 8.0], mist1: [8.0, 8.8], reach: [11.6, 12.6], shadow: [12.0, 15.2],
  turn: [15.6, 16.2], parts: [16.275, 16.65, 17.025, 17.4, 17.775], wipe1: [20.0, 20.5],
  give: [20.5, 21.3], scrape1: 22.0, scrape2: 22.45, note1: 22.9, bloom: [22.9, 25.4],
  wipe2: [31.55, 32.15], rise: [32.9, 34.4], peak: 34.9, mist2: [37.6, 38.6], push: [38.6, 42.6], title: 40.0, thunk: 43.0,
};
// subtitles (no narration: these carry the story)
export const SUBS = [
  { t0: 0.3, t1: 3.65, text: '이 손은 매일 쓰레기를 주웠다.' },
  { t0: 3.85, t1: 8.3, text: '파라과이, 카테우라.\n도시가 버린 것들이 모이는 곳.' },
  { t0: 8.5, t1: 11.45, text: '어느 날, 음악 선생님이 왔다.' },
  { t0: 11.6, t1: 15.75, text: '하지만 바이올린 한 대는\n집 한 채보다 비쌌다.' },
  { t0: 15.9, t1: 20.0, text: '그러자 한 목수가\n쓰레기를 뒤지기 시작했다.' },
  { t0: 23.2, t1: 27.25, text: '그 소리를 들으면\n배 속에서 나비가 날았다.' },
  { t0: 27.45, t1: 31.85, text: '하나둘, 아이들이 모였다.\n쓰레기는 악기가 되었다.' },
  { t0: 32.0, t1: 35.75, text: '그 악기로, 아이들은\n세계의 무대에 섰다.' },
  { t0: 35.9, t1: 39.9, text: '쓰레기도, 사람도.\n함부로 버려져선 안 된다.' },
];
export const TITLE = { t0: 39.9, main: '쓰레기로 만든 바이올린', sub: '카테우라 재활용 오케스트라 · 실화' };
// hand-written labels on the specimen plate: what each part used to be (one per part, on the workshop half-beats)
export const LABELS = ['과자 깡통', '버려진 나무', '고기 망치', '포크'];
