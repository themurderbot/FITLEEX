import { createClient } from '@/lib/supabase/server'
import { redirect }     from 'next/navigation'
import { getLocale }    from 'next-intl/server'
import { SubscriberChatClient } from './SubscriberChatClient'

export const metadata = { title: 'Chat — FITLEEX' }

interface PageProps { searchParams: Promise<{ trainer?: string }> }

export default async function SubscriberChatPage({ searchParams }: PageProps) {
  const { trainer: trainerId } = await searchParams
  const supabase = await createClient()
  const locale   = await getLocale()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: convosRaw } = await (supabase as any)
    .from('conversations')
    .select(`
      id, last_message_at,
      trainers!trainer_id(
        id,
        profiles!profile_id(full_name, avatar_url)
      )
    `)
    .eq('subscriber_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  const convos = (convosRaw ?? []) as any[]

  const conversations = convos.map((c: any) => ({
    id:           c.id,
    trainerId:    c.trainers?.id ?? '',
    trainerName:  c.trainers?.profiles?.full_name ?? '',
    trainerAvatar: c.trainers?.profiles?.avatar_url ?? null,
    lastMessageAt: c.last_message_at,
  }))

  // Pick active conversation — auto-create if trainer param given but no convo exists yet
  let activeConvo = trainerId
    ? convos.find((c: any) => c.trainers?.id === trainerId)
    : conversations.length === 1 ? convos[0] : null

  if (trainerId && !activeConvo) {
    const { data: newConvo } = await (supabase as any)
      .from('conversations')
      .upsert({ subscriber_id: user.id, trainer_id: trainerId }, { onConflict: 'subscriber_id,trainer_id', ignoreDuplicates: false })
      .select(`id, last_message_at, trainers!trainer_id(id, profiles!profile_id(full_name, avatar_url))`)
      .single()
    if (newConvo) {
      activeConvo = newConvo
      conversations.unshift({
        id: newConvo.id,
        trainerId:    newConvo.trainers?.id ?? trainerId,
        trainerName:  newConvo.trainers?.profiles?.full_name ?? '',
        trainerAvatar: newConvo.trainers?.profiles?.avatar_url ?? null,
        lastMessageAt: null,
      })
    }
  }

  const { data: messages } = activeConvo
    ? await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConvo.id)
        .order('created_at')
    : { data: [] }

  // Mark as read
  if (activeConvo && messages?.length) {
    await (supabase as any)
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', activeConvo.id)
      .neq('sender_id', user.id)
      .eq('read', false)
  }

  return (
    <SubscriberChatClient
      conversations={conversations}
      activeConversationId={activeConvo?.id ?? null}
      messages={messages ?? []}
      userId={user.id}
      locale={locale}
    />
  )
}
