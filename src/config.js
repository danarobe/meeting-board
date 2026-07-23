// ── 팀 설정 ─────────────────────────────────────────
// 이름은 자유롭게 수정하세요. id는 저장된 데이터와 연결되므로 한번 정하면 유지.
export const TEAM = [
  { id: 'kyle', name: '카일', color: 'purple' },
  { id: 'friend', name: '헨리', color: 'teal' },
  { id: 'wife', name: '다나', color: 'pink' },
]

// ── Supabase 연동 ───────────────────────────────────
// 비워두면 이 기기에만 저장되는 로컬 모드로 동작합니다.
// Supabase 프로젝트 생성 후 URL과 anon key를 넣으면 3명이 공유됩니다.
export const SUPABASE_URL = 'https://eeffmbusaqaadeojjlnc.supabase.co'
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlZmZtYnVzYXFhYWRlb2pqbG5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDExOTIsImV4cCI6MjEwMDMxNzE5Mn0.P5Zxh1qrxpNU-SM_dpNz58xT6OWVk5Fq8l0c4WuuF2w'
