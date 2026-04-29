export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  webBaseUrl: process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://getperkpass.com',
}

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseAnonKey)
