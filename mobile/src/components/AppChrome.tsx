import { Pressable, Text, View } from 'react-native'
import type { MemberStatus, Screen } from '../types'
import { styles } from '../styles/appStyles'

export function MemberNotice({ mode, member }: { mode: 'guest' | 'demo' | 'active'; member: MemberStatus | null }) {
  if (mode === 'active') {
    return (
      <View style={styles.noticeLive}>
        <Text style={styles.noticeTitle}>Member access active</Text>
        <Text style={styles.noticeText}>Welcome back{member?.name ? `, ${member.name}` : ''}. Your PerkPass deals are ready.</Text>
      </View>
    )
  }

  if (mode === 'demo') {
    return (
      <View style={styles.noticeDemo}>
        <Text style={styles.noticeTitle}>Preview mode</Text>
        <Text style={styles.noticeText}>You are previewing the app experience. Live redemption will require an active PerkPass membership.</Text>
      </View>
    )
  }

  return null
}

export function StatusNotice({
  source,
  error,
  hasSupabaseConfig,
}: {
  source: 'live' | 'demo'
  error: string
  hasSupabaseConfig: boolean
}) {
  if (source === 'live') {
    return (
      <View style={styles.noticeLive}>
        <Text style={styles.noticeTitle}>Live deal mode</Text>
        <Text style={styles.noticeText}>Connected to Supabase and showing active PerkPass deals.</Text>
      </View>
    )
  }

  return (
    <View style={styles.noticeDemo}>
      <Text style={styles.noticeTitle}>Preview data</Text>
      <Text style={styles.noticeText}>
        {hasSupabaseConfig
          ? `Using sample deals while live data is unavailable. ${error}`
          : 'Add Expo Supabase env vars when you are ready to load live deals.'}
      </Text>
    </View>
  )
}

export function Header({ onHome, onAccount }: { onHome: () => void; onAccount: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onHome} hitSlop={12}>
        <Text style={styles.logo}>Perk<Text style={styles.logoAccent}>Pass</Text></Text>
      </Pressable>
      <Pressable onPress={onAccount} hitSlop={12}>
        <Text style={styles.headerMeta}>Account</Text>
      </Pressable>
    </View>
  )
}

export function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

export function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.accountRow}>
      <Text style={styles.accountLabel}>{label}</Text>
      <Text style={styles.accountValue} numberOfLines={2}>{value}</Text>
    </View>
  )
}

export function TabBar({
  screen,
  onChange,
  bottomInset,
}: {
  screen: Screen
  onChange: (screen: Screen) => void
  bottomInset: number
}) {
  const tabs: Array<{ id: Screen; label: string }> = [
    { id: 'deals', label: 'Deals' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'history', label: 'History' },
  ]

  return (
    <View style={[styles.tabBar, { paddingBottom: Math.max(bottomInset, 18) }]}>
      {tabs.map((tab) => (
        <Pressable key={tab.id} style={styles.tab} onPress={() => onChange(tab.id)}>
          <View style={[styles.tabIndicator, screen === tab.id && styles.tabIndicatorActive]} />
          <Text style={[styles.tabText, screen === tab.id && styles.tabTextActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  )
}
