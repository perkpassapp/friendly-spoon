import { env } from '../lib/env'
import { getCurrentSession } from './auth'

export async function deleteAccount(email: string) {
  const session = await getCurrentSession()
  const accessToken = session?.access_token

  if (!accessToken) {
    throw new Error('Please sign in again before deleting your account.')
  }

  const res = await fetch(`${env.webBaseUrl}/api/delete-account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })

  const data = await res.json()

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || 'Unable to delete your account right now.')
  }
}
