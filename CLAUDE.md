# 회의 보드 (meeting-board)

3인 운영팀(카일·헨리·다나)이 회의 때 이야기할 안건을 평소에 기록해두고, 회의 날 한 화면으로 보며 진행하는 대시보드. 카일(사용자)이 개발을 지시하고 Claude가 구현한다.

## 링크

- 배포: https://danarobe.github.io/meeting-board/ (팀 3명이 실제 사용 중)
- 저장소: https://github.com/danarobe/meeting-board (공개, GitHub 계정 danarobe)
- DB: Supabase 프로젝트 `Meeting_Prapare` (ID: eeffmbusaqaadeojjlnc, 리전 ap-northeast-2, 계정 happydanarobe@gmail.com)

## 스택과 구조

React 18 + Vite. 별도 백엔드 없이 Supabase REST를 `@supabase/supabase-js`로 호출.

- `src/config.js` — 팀원 정의(TEAM: kyle=카일/보라, friend=헨리/청록, wife=다나/핑크)와 Supabase URL/anon 키. **id는 DB의 author 값과 연결되므로 절대 바꾸지 말 것. 이름(name)만 변경 가능.**
- `src/store.js` — 데이터 어댑터. config에 Supabase 키가 있으면 Supabase, 없으면 localStorage 로컬 모드. list/add/update/remove 인터페이스.
- `src/App.jsx` — 전체 UI 단일 파일. 사용자 선택(localStorage `mb_user`), 작성자별 그룹 뷰, 탭 필터, 카드 액션, 음성 입력(Web Speech API, ko-KR).
- `src/styles.css` — 라이트/다크 모드 지원 (`prefers-color-scheme`).
- `supabase/schema.sql` — topics 테이블 정의. RLS는 anon 전체 허용(비공개 URL 전제).

## 데이터 모델 (topics 테이블)

`id, title, detail, author, status, conclusion, pinned, archived, created_at, discussed_at`

- status 흐름: `open`(대기) → `discussed`(논의함) → `resolved`(결론). `archived`는 별도 boolean(보관함 = 숨김, 삭제 아님).
- `detail` = 코멘트(회색 표시, 미해결 상태에서 카드에 노출). `conclusion` = 결론(초록 표시, resolved일 때 노출). 카드 확장 시 입력란 하나가 두 용도를 겸함: "논의함으로" 버튼은 detail로, "결론 저장"은 conclusion으로 저장.
- author 값은 `kyle` / `friend` / `wife` (TEAM의 id).

## UI 원칙 (사용자가 정한 것)

1. 3초 안에 입력 끝나야 함 — 하단 고정 입력바 + 마이크 버튼, 제목 한 줄이면 등록.
2. 대시보드는 작성자별 그룹으로 표시(본인이 맨 위, "(나)" 표시). 누가 올린 안건인지 항상 보여야 함.
3. 목록이 길어지면 안 됨 — 끝난 주제는 숨김(보관함)으로. 삭제는 확인 창 필수.

## 개발/배포 워크플로

- 로컬 실행: `npm run dev` (base가 `/meeting-board/`라 http://localhost:5173/meeting-board/ 로 접속)
- 배포: main에 push하면 GitHub Actions(`.github/workflows/deploy.yml`)가 자동 빌드·배포. 별도 명령 불필요.
- 배포 확인: `curl -s https://danarobe.github.io/meeting-board/ | grep -o 'index-[^"]*\.js'` 결과가 로컬 `dist/assets`의 해시와 같으면 반영 완료.

## 주의사항 (과거에 겪은 문제들)

- **공유 DB에 실사용 데이터가 있다.** 테스트 안건을 만들었으면 반드시 삭제할 것. 기존 안건은 절대 임의로 지우지 말 것.
- **한글 IME 엔터 버그**: 입력 onKeyDown에서 `e.nativeEvent.isComposing`이 true면 무시해야 함. 안 그러면 조합 중이던 마지막 글자가 중복 등록됨. 새 입력란을 추가할 때도 이 가드를 넣을 것.
- anon 키는 공개용이라 코드에 포함되어 있어도 됨. 단 이 앱은 로그인이 없어서 URL을 아는 사람은 누구나 읽고 쓸 수 있음 — 사이트 주소는 팀 3명끼리만 공유.
- 브라우저 미리보기 패널에서 좌표 클릭/타이핑이 안 먹을 때가 있음 — JS로 네이티브 이벤트를 디스패치해서 테스트하면 됨.

## 로드맵 (다음 단계 후보, 사용자와 합의된 순서 없음)

- 실시간 동기화 (Supabase Realtime — 회의 중 서로 화면 자동 반영, 체감 가장 클 것으로 예상)
- 결론 난 안건의 자동 보관 처리
- 보관함 검색
- PWA 서비스워커(오프라인)
