import { useEffect, useMemo, useRef, useState } from 'react'
import { TEAM } from './config.js'
import { store } from './store.js'

const TABS = [
  { key: 'open', label: '대기' },
  { key: 'discussed', label: '논의함' },
  { key: 'resolved', label: '결론' },
  { key: 'archived', label: '보관함' },
]

const memberOf = (id) => TEAM.find((m) => m.id === id) || TEAM[0]

function useSpeech(onText) {
  const [listening, setListening] = useState(false)
  const recRef = useRef(null)
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  const supported = !!SR

  const toggle = () => {
    if (!supported) return
    if (listening) {
      recRef.current?.stop()
      return
    }
    const rec = new SR()
    rec.lang = 'ko-KR'
    rec.interimResults = false
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
      onText(text)
    }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec
    rec.start()
    setListening(true)
  }
  return { supported, listening, toggle }
}

function UserPicker({ onPick }) {
  return (
    <div className="picker-overlay">
      <div className="picker-card">
        <h1>회의 보드</h1>
        <p>누구신가요? 이 기기에 기억됩니다.</p>
        <div className="picker-buttons">
          {TEAM.map((m) => (
            <button
              key={m.id}
              className={`picker-btn color-${m.color}`}
              onClick={() => onPick(m.id)}
            >
              <span className={`avatar color-${m.color}`}>{m.name[0]}</span>
              {m.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function TopicCard({ topic, expanded, onToggleExpand, onAction }) {
  const author = memberOf(topic.author)
  const [conclusionDraft, setConclusionDraft] = useState(topic.conclusion || '')

  return (
    <div
      className={`card ${topic.status === 'resolved' ? 'card-resolved' : ''}`}
      onClick={onToggleExpand}
    >
      <div className="card-row">
        <span className={`avatar color-${author.color}`}>{author.name[0]}</span>
        <p className="card-title">{topic.title}</p>
        {topic.pinned && !topic.archived && <span className="pin">📌</span>}
        {topic.status === 'discussed' && (
          <span className="badge badge-discussed">✓ 논의함</span>
        )}
        {topic.status === 'resolved' && (
          <span className="badge badge-resolved">✓ 결론</span>
        )}
      </div>
      {topic.conclusion && topic.status === 'resolved' && (
        <p className="card-conclusion">{topic.conclusion}</p>
      )}
      {expanded && (
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <div className="conclusion-box">
            <input
              type="text"
              placeholder="결론을 입력하면 '결론' 상태가 됩니다"
              value={conclusionDraft}
              onChange={(e) => setConclusionDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && conclusionDraft.trim())
                  onAction('resolve', conclusionDraft.trim())
              }}
            />
            <button
              className="btn-small"
              disabled={!conclusionDraft.trim()}
              onClick={() => onAction('resolve', conclusionDraft.trim())}
            >
              결론 저장
            </button>
          </div>
          <div className="action-row">
            {topic.status === 'open' && (
              <button className="btn-small" onClick={() => onAction('discuss')}>
                ✓ 논의함으로
              </button>
            )}
            {topic.status !== 'open' && (
              <button className="btn-small" onClick={() => onAction('reopen')}>
                ↩ 대기로 되돌리기
              </button>
            )}
            <button className="btn-small" onClick={() => onAction('pin')}>
              {topic.pinned ? '📌 핀 해제' : '📌 핀 고정'}
            </button>
            <button className="btn-small" onClick={() => onAction('archive')}>
              {topic.archived ? '↩ 복원' : '🗂 숨김'}
            </button>
          </div>
          <p className="card-meta">
            {author.name} ·{' '}
            {new Date(topic.created_at).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
            })}{' '}
            등록
          </p>
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => localStorage.getItem('mb_user'))
  const [topics, setTopics] = useState([])
  const [tab, setTab] = useState('open')
  const [input, setInput] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [error, setError] = useState('')

  const refresh = async () => {
    try {
      setTopics(await store.list())
      setError('')
    } catch (e) {
      setError('데이터를 불러오지 못했습니다. 네트워크를 확인해 주세요.')
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const speech = useSpeech((text) =>
    setInput((prev) => (prev ? prev + ' ' : '') + text)
  )

  const counts = useMemo(() => {
    const c = { open: 0, discussed: 0, resolved: 0, archived: 0 }
    for (const t of topics) {
      if (t.archived) c.archived++
      else c[t.status]++
    }
    return c
  }, [topics])

  const visible = useMemo(() => {
    const list = topics.filter((t) =>
      tab === 'archived' ? t.archived : !t.archived && t.status === tab
    )
    return list.sort((a, b) => {
      if (!!b.pinned - !!a.pinned) return !!b.pinned - !!a.pinned
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }, [topics, tab])

  const addTopic = async () => {
    const title = input.trim()
    if (!title) return
    setInput('')
    try {
      await store.add({
        title,
        detail: '',
        author: user,
        status: 'open',
        conclusion: '',
        pinned: false,
        archived: false,
      })
      setTab('open')
      await refresh()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
      setInput(title)
    }
  }

  const onAction = async (topic, action, payload) => {
    const patch =
      action === 'discuss'
        ? { status: 'discussed', discussed_at: new Date().toISOString() }
        : action === 'resolve'
          ? { status: 'resolved', conclusion: payload }
          : action === 'reopen'
            ? { status: 'open', conclusion: '' }
            : action === 'pin'
              ? { pinned: !topic.pinned }
              : { archived: !topic.archived }
    try {
      await store.update(topic.id, patch)
      if (action === 'archive') setExpandedId(null)
      await refresh()
    } catch {
      setError('저장에 실패했습니다. 다시 시도해 주세요.')
    }
  }

  if (!user) {
    return (
      <UserPicker
        onPick={(id) => {
          localStorage.setItem('mb_user', id)
          setUser(id)
        }}
      />
    )
  }

  const me = memberOf(user)
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  })

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <h1>이번 회의에서 말할 것</h1>
          <button
            className="me-chip"
            title="사용자 변경"
            onClick={() => {
              localStorage.removeItem('mb_user')
              setUser(null)
            }}
          >
            <span className={`avatar avatar-sm color-${me.color}`}>
              {me.name[0]}
            </span>
            {today}
          </button>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label} {counts[t.key] > 0 && <b>{counts[t.key]}</b>}
            </button>
          ))}
        </nav>
      </header>

      {store.mode === 'local' && (
        <p className="notice">
          로컬 모드 — 이 기기에만 저장됩니다. Supabase 키를 넣으면 3명이
          공유돼요.
        </p>
      )}
      {error && <p className="notice notice-error">{error}</p>}

      <main className="list">
        {visible.length === 0 ? (
          <p className="empty">
            {tab === 'open'
              ? '말할 내용을 아래에 입력해 보세요'
              : '여기엔 아직 아무것도 없어요'}
          </p>
        ) : (
          visible.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              expanded={expandedId === t.id}
              onToggleExpand={() =>
                setExpandedId(expandedId === t.id ? null : t.id)
              }
              onAction={(action, payload) => onAction(t, action, payload)}
            />
          ))
        )}
      </main>

      <footer className="input-bar">
        <input
          type="text"
          placeholder="말할 내용 입력..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addTopic()
          }}
        />
        {speech.supported && (
          <button
            className={`mic ${speech.listening ? 'mic-on' : ''}`}
            aria-label="음성 입력"
            onClick={speech.toggle}
          >
            {speech.listening ? '■' : '🎤'}
          </button>
        )}
        <button
          className="send"
          aria-label="등록"
          disabled={!input.trim()}
          onClick={addTopic}
        >
          ↑
        </button>
      </footer>
    </div>
  )
}
