import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// topic: { id, title, detail, author, status: 'open'|'discussed'|'resolved',
//          conclusion, pinned, archived, created_at, discussed_at }

const LOCAL_KEY = 'mb_topics_v1'

const localStore = {
  mode: 'local',
  subscribe() {
    return () => {}
  },
  async list() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY)) || []
    } catch {
      return []
    }
  },
  async add(topic) {
    const all = await this.list()
    const row = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...topic,
    }
    all.push(row)
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all))
    return row
  },
  async update(id, patch) {
    const all = await this.list()
    const next = all.map((t) => (t.id === id ? { ...t, ...patch } : t))
    localStorage.setItem(LOCAL_KEY, JSON.stringify(next))
  },
  async remove(id) {
    const all = await this.list()
    localStorage.setItem(
      LOCAL_KEY,
      JSON.stringify(all.filter((t) => t.id !== id))
    )
  },
}

function makeSupabaseStore() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  return {
    mode: 'supabase',
    subscribe(onChange) {
      const channel = supabase
        .channel('topics-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'topics' },
          onChange
        )
        .subscribe()
      return () => supabase.removeChannel(channel)
    },
    async list() {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    async add(topic) {
      const { data, error } = await supabase
        .from('topics')
        .insert(topic)
        .select()
        .single()
      if (error) throw error
      return data
    },
    async update(id, patch) {
      const { error } = await supabase.from('topics').update(patch).eq('id', id)
      if (error) throw error
    },
    async remove(id) {
      const { error } = await supabase.from('topics').delete().eq('id', id)
      if (error) throw error
    },
  }
}

export const store =
  SUPABASE_URL && SUPABASE_ANON_KEY ? makeSupabaseStore() : localStore
