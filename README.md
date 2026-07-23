# 회의 보드

3인 운영팀의 회의 안건을 기록하고 한눈에 보는 대시보드.

## 로컬 실행

```bash
npm install
npm run dev
```

## Supabase 연동 (3명 공유)

1. https://supabase.com 에서 무료 프로젝트 생성
2. SQL Editor에 `supabase/schema.sql` 내용을 붙여넣고 Run
3. Project Settings → API 에서 `Project URL`과 `anon public` 키 복사
4. `src/config.js`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에 붙여넣기

키를 넣지 않으면 로컬 모드(이 기기에만 저장)로 동작합니다.

## 팀원 이름 바꾸기

`src/config.js`의 `TEAM` 배열에서 `name`만 수정하세요. `id`는 유지.

## 배포 (GitHub Pages)

```bash
npm run build
```

`dist/`를 gh-pages 브랜치로 푸시하거나 GitHub Actions로 배포.
