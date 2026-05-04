'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Message { id: string; content: string; sender_id: string; created_at: string; read: boolean }
interface Conversation {
  id: string
  subscriber_id: string
  last_message_at?: string
  profiles?: { id: string; full_name: string; avatar_url?: string }
  lastMessage?: string
  unreadCount?: number
}

interface Props {
  conversations: Conversation[]
  initialMessages: Message[]
  activeConversationId?: string | null
  currentUserId: string
}

function timeAgo(dateStr: string, locale: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (locale === 'ar') {
    if (mins < 1)   return 'الآن'
    if (mins < 60)  return `${mins}د`
    if (hours < 24) return `${hours}س`
    return `${days}ي`
  }
  if (mins < 1)   return 'now'
  if (mins < 60)  return `${mins}m`
  if (hours < 24) return `${hours}h`
  return `${days}d`
}

const AV_COLORS = [
  'linear-gradient(135deg,#C8F04B,#7ab82e)',
  'linear-gradient(135deg,#60a5fa,#3b82f6)',
  'linear-gradient(135deg,#FF5A36,#cc3d20)',
  'linear-gradient(135deg,#a78bfa,#7c3aed)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
]

export function ChatClient({ conversations: initialConvos, initialMessages, activeConversationId, currentUserId }: Props) {
  const locale = useLocale()
  const supabase = createClient()
  const [conversations, setConversations] = useState(initialConvos)
  const [messages, setMessages]     = useState(initialMessages)
  const [activeId, setActiveId]     = useState(activeConversationId ?? initialConvos[0]?.id ?? null)
  const [text, setText]             = useState('')
  const [pending, startTransition]  = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (!activeId) return
    const channel = supabase
      .channel(`chat:${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${activeId}` },
        payload => {
          const msg = payload.new as Message
          setMessages(m => [...m, msg])
          setConversations(cs => cs.map(c =>
            c.id === activeId ? { ...c, last_message_at: msg.created_at, lastMessage: msg.content } : c
          ))
        }
      ).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [activeId])

  async function switchConversation(convId: string) {
    setActiveId(convId)
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true })
    setMessages(data ?? [])
    await (supabase.from('messages') as any).update({ read: true })
      .eq('conversation_id', convId).neq('sender_id', currentUserId).eq('read', false)
    setConversations(cs => cs.map(c => c.id === convId ? { ...c, unreadCount: 0 } : c))
  }

  function handleSend() {
    if (!text.trim() || !activeId) return
    startTransition(async () => {
      const content = text
      setText('')
      await (supabase.from('messages') as any).insert({ conversation_id: activeId, sender_id: currentUserId, content })
    })
  }

  const activeConvo   = conversations.find(c => c.id === activeId)
  const activeProfile = (activeConvo?.profiles as any) ?? {}

  return (
    <div className="flex gap-0 overflow-hidden rounded-xl" style={{ height: 'calc(100vh - 120px)', border: '1px solid #222' }}>
      {/* Conversation list */}
      <div className="flex flex-col shrink-0" style={{ width: 280, borderRight: '1px solid #222', background: '#111' }}>
        <div className="px-4 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
          <h1 className="font-bold text-white text-sm">
            {locale === 'ar' ? 'المحادثات' : 'Messages'}
          </h1>
          <p className="text-[11px] font-mono mt-0.5" style={{ color: '#555' }}>
            {conversations.length} {locale === 'ar' ? 'محادثة' : 'conversations'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((c, idx) => {
            const prof    = (c.profiles as any) ?? {}
            const name    = prof.full_name ?? '—'
            const initial = name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
            const isActive = c.id === activeId
            const unread   = (c as any).unreadCount ?? 0
            return (
              <div
                key={c.id}
                onClick={() => switchConversation(c.id)}
                className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{
                  borderBottom: '1px solid #1a1a1a',
                  background: isActive ? 'rgba(200,240,75,0.05)' : 'transparent',
                  borderLeft: isActive ? '3px solid #C8F04B' : '3px solid transparent',
                }}
              >
                {/* Avatar — click opens subscriber profile */}
                <Link
                  href={`/trainer/subscribers/${c.subscriber_id}`}
                  onClick={e => e.stopPropagation()}
                  style={{
                    width: 38, height: 38, borderRadius: 11, flexShrink: 0,
                    background: AV_COLORS[idx % AV_COLORS.length],
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: 13, color: '#000', textDecoration: 'none',
                  }}
                >
                  {initial}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-sm font-semibold text-white truncate">{name}</p>
                    {c.last_message_at && (
                      <span className="text-[10px] shrink-0 font-mono" style={{ color: '#555' }}>
                        {timeAgo(c.last_message_at, locale)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-[11px] truncate" style={{ color: isActive ? '#999' : '#555' }}>
                      {(c as any).lastMessage ?? (locale === 'ar' ? 'ابدأ المحادثة...' : 'Start chatting...')}
                    </p>
                    {unread > 0 && (
                      <span className="shrink-0 flex items-center justify-center font-bold font-mono rounded-full"
                        style={{ minWidth: 16, height: 16, background: '#C8F04B', color: '#000', fontSize: 9 }}>
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
          {!conversations.length && (
            <p className="p-6 text-sm text-center" style={{ color: '#555' }}>
              {locale === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
            </p>
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col" style={{ background: '#0e0e0e' }}>
        {activeConvo ? (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 flex items-center gap-3 shrink-0" style={{ borderBottom: '1px solid #222', background: '#111' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: AV_COLORS[conversations.findIndex(c => c.id === activeId) % AV_COLORS.length],
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: '#000',
              }}>
                {activeProfile.full_name
                  ? activeProfile.full_name.trim().split(/\s+/).map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
                  : '?'}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/trainer/subscribers/${activeConvo.subscriber_id}`}
                  className="font-semibold text-white hover:text-brand transition-colors text-sm"
                >
                  {activeProfile.full_name ?? '—'}
                </Link>
                <p className="text-[11px] font-mono" style={{ color: '#555' }}>
                  {locale === 'ar' ? 'انقر للملف الشخصي' : 'Click name to view profile'}
                </p>
              </div>
              <Link
                href={`/trainer/subscribers/${activeConvo.subscriber_id}`}
                className="text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/10 shrink-0"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}
              >
                {locale === 'ar' ? 'الملف' : 'Profile'}
              </Link>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-3">
              {messages.map(m => {
                const isMe = m.sender_id === currentUserId
                const time = new Date(m.created_at).toLocaleTimeString(
                  locale === 'ar' ? 'ar-SA' : 'en-US',
                  { hour: '2-digit', minute: '2-digit', hour12: true }
                )
                return (
                  <div key={m.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                    <div
                      className="max-w-xs px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                      style={isMe
                        ? { background: '#C8F04B', color: '#000', borderBottomRightRadius: 4 }
                        : { background: '#1a1a1a', color: '#fff', borderBottomLeftRadius: 4, border: '1px solid #272727' }}
                    >
                      {m.content}
                    </div>
                    <span className="text-[10px] font-mono px-1" style={{ color: '#444' }}>{time}</span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 flex items-center gap-2 shrink-0" style={{ borderTop: '1px solid #222', background: '#111' }}>
              <input
                className="input flex-1 text-sm"
                placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type a message...'}
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || pending}
                className="flex items-center justify-center rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40 shrink-0"
                style={{ width: 40, height: 40, background: '#C8F04B', color: '#000' }}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-2" style={{ color: '#333' }}>
            <p className="text-3xl">💬</p>
            <p className="text-sm">{locale === 'ar' ? 'اختر محادثة للبدء' : 'Select a conversation to start'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
