import { env } from '../lib/env'
import type { MemberStatus } from '../types'

export async function loadMemberStatus(email: string): Promise<MemberStatus> {
  const normalizedEmail = email.trim().toLowerCase()
  const res = await fetch(`${env.webBaseUrl}/api/member-status?email=${encodeURIComponent(normalizedEmail)}`)

  if (!res.ok) {
    throw new Error('Unable to check membership right now.')
  }

  return res.json()
}
