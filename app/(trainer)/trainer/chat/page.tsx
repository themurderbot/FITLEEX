import { redirect }     from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatClient }   from './ChatClient'

export const metadata = { title: 'Messages' }

interface PageProps { searchParams: Promise<{ sub?: string }> }

export default async function ChatPage({ searchParams }: PageProps) {
  const { sub: activeSubscriberId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: trainer } = await (supabase as any)
    .from('trainers').select('id').eq('profile_id', user.id).single()
  if (!trainer) redirect('/')

  const { data: conversations } = await (supabase as any)
    .from('conversations')
    .select('*, profiles!subscriber_id(id, full_name, avatar_url)')
    .eq('trainer_id', (trainer as any).id)
    .order('last_message_at', { ascending: false })

  const convIds = ((conversations ?? []) as any[]).map((c: any) => c.id)

  // Fetch last message + unread count per conversation
  const [lastMessages, unreadMessages] = await Promise.all([
    convIds.length > 0
      ? (supabase as any).from('messages').select('conversation_id, content, created_at')
          .in('conversation_id', convIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),
    convIds.length > 0
      ? (supabase as any).from('messages').select('conversation_id')
          .in('conversation_id', convIds)
          .neq('sender_id', user.id)
          .eq('read', false)
      : Promise.resolve({ data: [] as any[] }),
  ])

  // Build lookup maps
  const lastMsgMap: Record<string, string> = {}
  ;(lastMessages.data ?? []).forEach((m: any) => {
    if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m.content
  })
  const unreadMap: Record<string, number> = {}
  ;(unreadMessages.data ?? []).forEach((m: any) => {
    unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1
  })

  const enrichedConversations = (conversations ?? []).map(c => ({
    ...c,
    lastMessage: lastMsgMap[c.id],
    unreadCount: unreadMap[c.id] ?? 0,
  }))

  let activeConvId = activeSubscriberId
    ? enrichedConversations.find(c => (c.profiles as any)?.id === activeSubscriberId)?.id
    : enrichedConversations[0]?.id

  // Auto-create conversation if subscriber param given but no convo exists yet
  if (activeSubscriberId && !activeConvId) {
    const { data: newConvo } = await (supabase as any)
      .from('conversations')
      .upsert(
        { subscriber_id: activeSubscriberId, trainer_id: (trainer as any).id },
        { onConflict: 'subscriber_id,trainer_id', ignoreDuplicates: false }
      )
      .select('id')
      .single()
    if (newConvo?.id) {
      activeConvId = newConvo.id
      enrichedConversations.unshift({
        id: newConvo.id, subscriber_id: activeSubscriberId,
        profiles: null, last_message_at: null, lastMessage: undefined, unreadCount: 0,
      })
    }
  }

  const { data: messages } = activeConvId ? await (supabase as any)
    .from('messages')
    .select('*')
    .eq('conversation_id', activeConvId)
    .order('created_at', { ascending: true }) : { data: [] }

  if (activeConvId) {
    await (supabase as any).from('messages').update({ read: true })
      .eq('conversation_id', activeConvId)
      .neq('sender_id', user.id)
      .eq('read', false)
  }

  return (
    <ChatClient
      conversations={enrichedConversations}
      activeConversationId={activeConvId ?? null}
      initialMessages={messages ?? []}
      currentUserId={user.id}
    />
  )
}
