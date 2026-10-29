# Claude로 만드는 애니메이션 숏츠

Claude Code 하나로 **그림, 애니메이션, 음악, 효과음, 자막까지 전부 코드로** 만든 세로 숏츠 영상과, 그 방법을 정리한 저장소입니다.
촬영도, 그림 파일도, 음악 파일도 없습니다. 모든 장면은 브라우저 캔버스에 코드로 그려지고, 음악은 무료(CC0) 악기 샘플로 직접 작곡됩니다.

▶ **화풍 갤러리와 완성 영상 보기: https://heekeunlee.github.io/claude-animation-shorts/**

| 수채화 버전 (45초) | 80년대 셀 애니 버전 (50초) |
|---|---|
| <a href="docs/media/watercolor.mp4"><img src="docs/media/watercolor-poster.jpg" width="260" alt="쓰레기로 만든 바이올린 수채화 버전"></a> | <a href="docs/media/cel.mp4"><img src="docs/media/cel-poster.jpg" width="260" alt="쓰레기로 만든 바이올린 80년대 셀 애니 버전"></a> |
| 회색 세상에 첫 음과 함께 색이 번진다 | 빛이 없던 세상에 첫 음과 함께 빛이 켜진다 |

## 첫 작품: 「쓰레기로 만든 바이올린」

파라과이 카테우라의 쓰레기 매립지 마을에서, 쓰레기로 악기를 만들어 세계 무대에 선 **재활용 오케스트라** 실화를 바탕으로 했습니다.
내레이션 없이 **자막과 창작 음악만으로** 이야기를 전합니다.

- 쓰레기를 줍던 손 → 집보다 비싼 바이올린 → 목수가 과자 깡통·버려진 나무·고기 망치·포크로 만든 바이올린 → 첫 음 → 골목의 아이들 → 세계의 무대 → 다시 처음의 손.
- 마지막 자막 "쓰레기도, 사람도. 함부로 버려져선 안 된다."는 지휘자 파비오 차베스가 다큐 예고편에서 한 말을 우리말로 다시 쓴 것입니다.
- 영상 속 아이들은 단원들을 대표하는 **가상 인물**입니다. 다큐 영상·사진·음악·인터뷰 음성은 쓰지 않았습니다.

## 어떻게 만드나 (요약)

1. **Claude Code**에 [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar) 플러그인을 설치합니다. 66가지 화풍의 "스타일 규칙 + 그리기 엔진 + 렌더 도구"가 들어 있는 라이브러리입니다.
2. Claude에게 이야기와 화풍을 말합니다. 예: *"이 실화를 수채화로, 내레이션 없이 자막과 음악만으로 40초 숏츠로 만들어줘"*
3. Claude가 순서대로 진행합니다.
   - 구성안(TREATMENT.md): 구조 후보 3개, 샷 리스트, 초 단위 비트 시트, 음악 큐 맵
   - 스타일 프레임 확인 → 그림 코드 작성 → 작곡 → 효과음·믹스 → 프레임 렌더 → 음량 마스터링(−14 LUFS)
   - 자기 검사: 자막 읽기 시간, 검은 화면, 1.5초 간격 콘택트 시트
4. 결과물: `영상.mp4`, `자막.srt`, `poster.jpg`, `CREDITS`(사용한 샘플·폰트 라이선스), `build.sh`(한 줄로 처음부터 다시 만들기)

자세한 단계와 실제로 쓴 요청 문장은 **[docs/WORKFLOW.md](docs/WORKFLOW.md)**, 66개 화풍 정리는 **[docs/STYLES.md](docs/STYLES.md)** 에 있습니다.

## 이 저장소의 구성

```
films/
  trash-violin/        수채화 버전 소스 (story.js 타임라인, art.js 그림, main.js 장면, music/score.py 작곡, mix.py 믹스, build.sh)
  trash-violin-cel/    80년대 셀 애니 버전 소스 (cel 셰이딩, 80년대 얼굴, 비디오테이프+CRT 후처리)
docs/
  index.html           GitHub Pages: 66개 화풍 갤러리 + 완성 영상
  WORKFLOW.md          Claude로 만드는 전체 과정, 요청 예시, 시행착오
  STYLES.md            66개 화풍 한국어 정리와 이야기 종류별 추천
```

## 다시 빌드하기

```sh
# 1) Claude Code에서 플러그인 설치 (한 번만)
claude plugin marketplace add lemomo-ai/lemo-opuscar
claude plugin install lemo-opuscar@lemolab
# 2) 라이브러리와 음악 도구, 샘플 받기 (Claude가 처음 실행할 때 자동으로 해 줍니다)
#    ~/lemo-opuscar 에 라이브러리, sh tools/fetch.sh instruments vsco2ce / vcsl / karoryfer
# 3) 빌드
LIB=~/lemo-opuscar sh films/trash-violin/build.sh
LIB=~/lemo-opuscar sh films/trash-violin-cel/build.sh
```

Node.js, ffmpeg, Python 3가 필요합니다.

## 라이선스와 출처

- 이 저장소의 코드: MIT (`LICENSE`). 일부 엔진 파일은 LemoLab의 Lemo-Opuscar(MIT)에서 가져와 고쳤습니다(`NOTICE`).
- 화풍 갤러리 썸네일: LemoLab Lemo-Opuscar 데모 영상 장면, **CC BY 4.0**, 크기만 줄였습니다. https://github.com/lemomo-ai/lemo-opuscar
- 음악 샘플: VSCO 2 Community Edition, Versilian Community Sample Library (CC0). 폰트: Google Fonts (SIL OFL 1.1).
- 영상의 소재가 된 실화 자료(사실 확인용): 「Landfill Harmonic」 예고편(2013), 세계일보(2017), MBC 「신비한TV 서프라이즈」(2020). 이 자료의 영상·이미지·음악은 쓰지 않았습니다.
