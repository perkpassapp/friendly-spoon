import * as ExpoLinking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

WebBrowser.maybeCompleteAuthSession()

export const authRedirectUrl = ExpoLinking.createURL('auth/callback')

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured for the mobile app yet.')
  }
  return supabase
}

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0]
  return value
}

export async function getCurrentSession() {
  const client = requireSupabase()
  const { data, error } = await client.auth.getSession()
  if (error) throw error
  return data.session
}

export async function signInWithGoogle() {
  const client = requireSupabase()
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: authRedirectUrl,
      skipBrowserRedirect: true,
      queryParams: { access_type: 'offline', prompt: 'consent' },
    },
  })

  if (error) throw error
  if (!data.url) throw new Error('Unable to start Google sign-in.')

  const result = await WebBrowser.openAuthSessionAsync(data.url, authRedirectUrl)
  if (result.type !== 'success') {
    throw new Error('Google sign-in was closed before PerkPass received a session.')
  }

  const session = await handleAuthCallbackUrl(result.url)
  if (!session) {
    throw new Error(`Google sign-in returned without a session. Add this redirect URL in Supabase: ${authRedirectUrl}`)
  }
  return session
}

export async function sendMagicLink(email: string) {
  const client = requireSupabase()
  const { error } = await client.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: authRedirectUrl,
      shouldCreateUser: false,
    },
  })
  if (error) throw error
}

export async function handleAuthCallbackUrl(url: string): Promise<Session | null> {
  const client = requireSupabase()
  const parsed = ExpoLinking.parse(url)
  const params = parsed.queryParams || {}
  const errorDescription = firstParam(params.error_description)
  const code = firstParam(params.code)
  const accessToken = firstParam(params.access_token)
  const refreshToken = firstParam(params.refresh_token)

  if (errorDescription) {
    throw new Error(errorDescription)
  }

  if (code) {
    const { data, error } = await client.auth.exchangeCodeForSession(code)
    if (error) throw error
    return data.session
  }

  if (accessToken && refreshToken) {
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
    if (error) throw error
    return data.session
  }

  return null
}

export async function signOut() {
  const client = requireSupabase()
  const { error } = await client.auth.signOut()
  if (error) throw error
}
