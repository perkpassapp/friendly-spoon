import { env } from '../lib/env'

export async function getBillingPortalUrl(email: string) {
  const res = await fetch(`${env.webBaseUrl}/api/cancel-subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })

  const data = await res.json()

  if (!res.ok || !data?.url) {
    throw new Error(data?.error || 'Unable to open billing portal right now.')
  }

  return data.url as string
}
