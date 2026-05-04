'use server'
import { revalidatePath } from 'next/cache'

export async function revalidateSubscriberProfile(subscriberId: string) {
  revalidatePath(`/trainer/subscribers/${subscriberId}`)
}
