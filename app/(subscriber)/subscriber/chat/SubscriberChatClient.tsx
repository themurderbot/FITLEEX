'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Send, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface ConvoItem {
  id: string
  trainerId: string
  trainerName: string
  trainerAvatar: string | null
  lastMessageAt: string | null
}

interface Props {
  conversations: ConvoItem[]
  activeConversationId: string | null
  messages: Message[]
  userId: string
  locale: string
}

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
]

function initials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function SubscriberChatClient({ conversations, activeConversationId, messages: initMsgs, userId, locale }: Props) {
  const supabase  = createClient()
  const lbl       = (en: string, ar: string) => locale === 'ar' ? ar : en

  const [view,      setView]    = useState<'list' | 'chat'>(activeConversationId ? 'chat' : 'list')
  const [activeId,  setActiveId] = useState<string | null>(activeConversationId)
  const [messages,  setMessages] = useState<Message[]>(initMsgs)
  const [text,      setText]    = useState('')
  const [pending,   startTrans] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConvo = conversations.find(c => c.id === activeId)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!activeId) return
    const ch = supabase
      .channel(`chat-sub:${activeId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `conversation_id=eq.${activeId}`,
      }, payload => setMessages(m => [...m, payload.new as Message]))
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [activeId])

  async function openConvo(id: string) {
    setActiveId(id)
    setView('chat')
    // Load messages for this conversation
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at')
    setMessages(data ?? [])
    // Mark as read
    await (supabase as any).from('messages').update({ read: true })
      .eq('conversation_id', id).neq('sender_id', userId).eq('read', false)
  }

  function handleSend() {
    if (!text.trim() || !activeId) return
    startTrans(async () => {
      await (supabase as any).from('messages').insert({
        conversation_id: activeId,
        sender_id: userId,
        content: text.trim(),
      })
      setText('')
    })
  }

  // ── List view ───────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="flex flex-col gap-5">
        <div>
          <h1 className="text-2xl font-black text-white">{lbl('CHAT', 'المحادثات')}</h1>
          <p className="text-xs mt-0.5" style={{ color: '#555' }}>{lbl('Messages with your trainers', 'رسائلك مع مدربيك')}</p>
        </div>

        {conversations.length === 0 ? (
          <div className="rounded-2xl py-16 text-center"
            style={{ background: '#141414', border: '1px solid #222' }}>
            <p className="text-4xl mb-3">💬</p>
            <p className="text-sm" style={{ color: '#555' }}>
              {lbl('No conversations yet', 'لا توجد محادثات بعد')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map((c, idx) => (
              <button key={c.id} onClick={() => openConvo(c.id)}
                className="flex items-center gap-3 rounded-2xl p-4 w-full text-left transition-opacity hover:opacity-80"
                style={{ background: '#141414', border: '1px solid #222' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                  background: AV_COLORS[idx % AV_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 900, fontSize: 16, color: '#000',
                }}>
                  {initials(c.trainerName)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white text-sm">{c.trainerName}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#555' }}>
                    {lbl('Tap to open chat', 'اضغط لفتح المحادثة')}
                  </p>
                </div>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: '#C8F04B', flexShrink: 0,
                }} />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Chat view ───────────────────────────────────────────────────
  // Guard: if no active convo found, go back to list
  if (view === 'chat' && !activeConvo) {
    return null // will re-render to list after state settles
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <button onClick={() => setView('list')}
          className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/5"
          style={{ width: 36, height: 36, background: '#141414', border: '1px solid #222' }}>
          <ArrowLeft size={16} style={{ color: '#888' }} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: AV_COLORS[conversations.indexOf(activeConvo!) % AV_COLORS.length],
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: 13, color: '#000',
        }}>
          {initials(activeConvo!.trainerName)}
        </div>
        <div>
          <p className="font-bold text-white text-sm">{activeConvo!.trainerName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-3" style={{ scrollbarWidth: 'none' }}>
        {messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm" style={{ color: '#444' }}>
              {lbl('Say hello 👋', 'ابدأ المحادثة 👋')}
            </p>
          </div>
        )}
        {messages.map(m => {
          const isMe = m.sender_id === userId
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div style={{ maxWidth: '75%' }}>
                <div style={{
                  padding: '10px 14px',
                  borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: isMe ? '#C8F04B' : '#1e1e1e',
                  color: isMe ? '#000' : '#fff',
                  fontSize: 14, fontWeight: isMe ? 600 : 400,
                  border: isMe ? 'none' : '1px solid #2a2a2a',
                }}>
                  {m.content}
                </div>
                <p className="text-[10px] mt-1 px-1" style={{ color: '#444', textAlign: isMe ? 'right' : 'left' }}>
                  {fmtTime(m.created_at)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-2 pt-3" style={{ borderTop: '1px solid #1e1e1e' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={lbl('Type a message...', 'اكتب رسالة...')}
          className="flex-1 rounded-xl text-sm text-white"
          style={{
            background: '#141414', border: '1px solid #222',
            padding: '12px 16px', outline: 'none',
          }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || pending}
          className="flex items-center justify-center rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ width: 48, height: 48, background: '#C8F04B', flexShrink: 0 }}>
          <Send size={18} style={{ color: '#000' }} />
        </button>
      </div>
    </div>
  )
}
