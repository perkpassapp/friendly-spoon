import { useEffect, useMemo, useRef, useState } from 'react'
import { useFonts } from 'expo-font'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow'
import {
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed'
import {
  Alert,
  ActivityIndicator,
  Animated,
  LayoutChangeEvent,
  Linking,
  Modal,
  PanResponder,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import { AccountRow, EmptyState, TabBar } from './src/components/AppChrome'
import { BusinessGroupCard } from './src/components/DealCards'
import { env, hasSupabaseConfig } from './src/lib/env'
import {
  CATEGORY_META,
  formatHistoryDate,
  formatPhone,
  formatRemaining,
  generateRedemptionCode,
  getAvailabilityLabel,
  groupDeals,
  isDealAvailableOnDay,
  isDealOnCooldown,
  normalizeCategory,
} from './src/lib/deals-ui'
import { getBillingPortalUrl } from './src/services/billing'
import {
  getCurrentSession,
  handleAuthCallbackUrl,
  sendMagicLink,
  signOut as signOutOfSupabase,
} from './src/services/auth'
import { deleteAccount as deleteMemberAccount } from './src/services/account'
import { loadDeals } from './src/services/deals'
import { loadMemberStatus } from './src/services/member'
import { loadFavoriteBusinesses, saveFavoriteBusinesses } from './src/services/preferences'
import { createRedemption, getRedemptionById, loadRedemptions, mapRedemptionHistory, type RedemptionRow } from './src/services/redemptions'
import type { ActiveRedemption, Deal, MemberStatus, RedemptionHistoryItem, Screen } from './src/types'
import { colors } from './src/theme'
import { styles } from './src/styles/appStyles'

const REDEMPTION_CODE_TTL_SECONDS = 2 * 60
const REDEMPTION_COOLDOWN_SECONDS = 15 * 60

export default function App() {
  return (
    <SafeAreaProvider>
      <PerkPassApp />
    </SafeAreaProvider>
  )
}

function PerkPassApp() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_700Bold,
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_900Black,
  })
  const compact = width < 380
  const [screen, setScreen] = useState<Screen>('login')
  const [email, setEmail] = useState('')
  const [member, setMember] = useState<MemberStatus | null>(null)
  const [memberMode, setMemberMode] = useState<'guest' | 'active'>('guest')
  const [memberLoading, setMemberLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [memberError, setMemberError] = useState('')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [deals, setDeals] = useState<Deal[]>([])
  const [dealsLoading, setDealsLoading] = useState(true)
  const [dealSource, setDealSource] = useState<'live'>('live')
  const [favoriteBusinesses, setFavoriteBusinesses] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedWeekday, setSelectedWeekday] = useState(new Date().getDay())
  const [search, setSearch] = useState('')
  const [showLiveOnly, setShowLiveOnly] = useState(true)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [activeRedemption, setActiveRedemption] = useState<ActiveRedemption | null>(null)
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({})
  const [redemptionHistory, setRedemptionHistory] = useState<RedemptionHistoryItem[]>([])
  const [clock, setClock] = useState(Date.now())
  const redemptionSheetY = useState(() => new Animated.Value(0))[0]
  const holdCloseProgress = useState(() => new Animated.Value(0))[0]
  const [holdButtonWidth, setHoldButtonWidth] = useState(0)
  const [dayTabsWidth, setDayTabsWidth] = useState(0)
  const favoritesHydratedRef = useRef(false)
  const redemptionPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dayTabsScrollRef = useRef<ScrollView | null>(null)
  const dayTabLayoutsRef = useRef<Record<number, { x: number; width: number }>>({})

  const now = useMemo(() => new Date(), [clock])
  const currentDay = now.getDay()
  const currentDayLabel = useMemo(() => now.toLocaleDateString('en-US', { weekday: 'long' }), [now])
  const dayTabs = useMemo(() => Array.from({ length: 7 }, (_, day) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + (day - currentDay))
    const offset = day - currentDay
    return {
      day,
      label: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long' }),
    }
  }), [currentDay, now])
  const selectedWeekdayLabel = useMemo(
    () => dayTabs.find((tab) => tab.day === selectedWeekday)?.fullLabel || currentDayLabel,
    [currentDayLabel, dayTabs, selectedWeekday],
  )
  const favoriteScope = memberMode === 'active' && email ? email.trim().toLowerCase() : 'guest'
  const categories = useMemo(() => [
    'All',
    ...Object.keys(CATEGORY_META).filter((category) => deals.some((deal) => normalizeCategory(deal.category) === category)),
  ], [deals])
  const categoryFilteredDeals = useMemo(() => (
    selectedCategory === 'All'
      ? deals
      : deals.filter((deal) => normalizeCategory(deal.category) === selectedCategory)
  ), [deals, selectedCategory])
  const normalizedSearch = search.trim().toLowerCase()
  const searchFilteredDeals = useMemo(() => (
    normalizedSearch
      ? categoryFilteredDeals.filter((deal) => {
          const fields = [deal.businessName, deal.offer, deal.address || '']
          return fields.some((field) => field.toLowerCase().includes(normalizedSearch))
        })
      : categoryFilteredDeals
  ), [categoryFilteredDeals, normalizedSearch])
  const scheduledDeals = useMemo(() => {
    const weekdayDeals = searchFilteredDeals.filter((deal) => isDealAvailableOnDay(deal, selectedWeekday))
    return showLiveOnly ? weekdayDeals.filter((deal) => getAvailabilityLabel(deal) === 'Available now' || deal.schedule === null) : weekdayDeals
  }, [searchFilteredDeals, selectedWeekday, showLiveOnly])
  const favoriteDeals = useMemo(
    () => deals.filter((deal) => favoriteBusinesses.includes(deal.businessName)),
    [deals, favoriteBusinesses],
  )
  const favoriteGroups = useMemo(() => groupDeals(favoriteDeals), [favoriteDeals])
  const filteredGroups = useMemo(() => groupDeals(scheduledDeals), [scheduledDeals])
  const confirmedHistoryCount = useMemo(
    () => redemptionHistory.filter((item) => item.status === 'Confirmed').length,
    [redemptionHistory],
  )
  const pendingHistoryCount = useMemo(
    () => redemptionHistory.filter((item) => item.status === 'Code generated').length,
    [redemptionHistory],
  )
  const userFirstName = member?.name ? member.name.split(' ')[0] : ''

  useEffect(() => {
    refreshDeals()
    bootAuth()

    const subscription = Linking.addEventListener('url', ({ url }) => {
      completeAuthUrl(url)
    })

    return () => subscription.remove()
  }, [])

  useEffect(() => {
    if (memberMode !== 'active' || !email) return
    hydrateRedemptions(email)
  }, [memberMode, email])

  useEffect(() => {
    favoritesHydratedRef.current = false

    async function hydrateFavorites() {
      try {
        const saved = await loadFavoriteBusinesses(favoriteScope)
        setFavoriteBusinesses(saved)
      } finally {
        favoritesHydratedRef.current = true
      }
    }

    void hydrateFavorites()
  }, [favoriteScope])

  useEffect(() => {
    if (!favoritesHydratedRef.current) return
    void saveFavoriteBusinesses(favoriteScope, favoriteBusinesses)
  }, [favoriteBusinesses, favoriteScope])

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!activeRedemption) {
      redemptionSheetY.setValue(0)
      holdCloseProgress.setValue(0)
    }
  }, [activeRedemption, holdCloseProgress, redemptionSheetY])

  useEffect(() => {
    if (!activeRedemption || activeRedemption.status !== 'live') return
    if (clock < activeRedemption.expiresAt) return

    setActiveRedemption((current) => current ? { ...current, status: 'expired' } : null)
  }, [activeRedemption, clock])

  useEffect(() => {
    if (!activeRedemption?.id || activeRedemption.status !== 'live' || memberMode !== 'active') {
      if (redemptionPollRef.current) {
        clearInterval(redemptionPollRef.current)
        redemptionPollRef.current = null
      }
      return
    }

    const redemptionId = activeRedemption.id

    async function pollValidation() {
      try {
        const row = await getRedemptionById(redemptionId)
        if (!row?.validated_at) return

        setActiveRedemption((current) => {
          if (!current || current.id !== row.id) return current
          return { ...current, status: 'confirmed' }
        })
        setRedemptionHistory((current) => [mapRedemptionHistory(row), ...current.filter((item) => item.id !== row.id)])
      } catch {
        // Keep the current code visible even if polling briefly fails.
      }
    }

    void pollValidation()
    redemptionPollRef.current = setInterval(() => {
      void pollValidation()
    }, 2000)

    return () => {
      if (redemptionPollRef.current) {
        clearInterval(redemptionPollRef.current)
        redemptionPollRef.current = null
      }
    }
  }, [activeRedemption?.id, activeRedemption?.status, memberMode])

  useEffect(() => {
    setCooldowns((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([, endsAt]) => endsAt > clock))
      return Object.keys(next).length === Object.keys(current).length ? current : next
    })
  }, [clock])

  useEffect(() => {
    const layout = dayTabLayoutsRef.current[selectedWeekday]
    if (!layout || !dayTabsWidth || !dayTabsScrollRef.current) return
    const targetX = Math.max(0, layout.x - (dayTabsWidth - layout.width) / 2)
    dayTabsScrollRef.current.scrollTo({ x: targetX, animated: true })
  }, [dayTabsWidth, selectedWeekday])

  function handleDayTabsLayout(event: LayoutChangeEvent) {
    setDayTabsWidth(event.nativeEvent.layout.width)
  }

  function handleDayTabLayout(day: number, event: LayoutChangeEvent) {
    const { x, width: tabWidth } = event.nativeEvent.layout
    dayTabLayoutsRef.current[day] = { x, width: tabWidth }
  }

  async function bootAuth() {
    if (!hasSupabaseConfig) return

    try {
      const initialUrl = await Linking.getInitialURL()
      if (initialUrl?.includes('auth/callback')) {
        await completeAuthUrl(initialUrl)
        return
      }

      const session = await getCurrentSession()
      const sessionEmail = session?.user.email
      if (sessionEmail) {
        setEmail(sessionEmail)
        await completeMemberAccess(sessionEmail)
      }
    } catch {
      // Do not block guest browsing if local auth env vars are missing or stale.
    }
  }

  async function completeAuthUrl(url: string) {
    setMemberLoading(true)
    setMemberError('')

    try {
      const session = await handleAuthCallbackUrl(url)
      const sessionEmail = session?.user.email
      if (sessionEmail) {
        setEmail(sessionEmail)
        await completeMemberAccess(sessionEmail)
      }
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Unable to complete sign-in.')
    } finally {
      setMemberLoading(false)
    }
  }

  async function refreshDeals() {
    setDealsLoading(true)
    const result = await loadDeals()
    setDeals(result.deals)
    setDealSource(result.source)
    setDealsLoading(false)
  }

  function toggleFavoriteBusiness(businessName: string) {
    setFavoriteBusinesses((current) =>
      current.includes(businessName)
        ? current.filter((name) => name !== businessName)
        : [...current, businessName],
    )
  }

  function handleLogin() {
    requestMagicLink()
  }

  async function requestMagicLink() {
    if (!hasSupabaseConfig) {
      setMemberError('Mobile sign-in is not configured on this build yet.')
      return
    }

    if (!email.includes('@')) {
      Alert.alert('Add your email', 'Enter the email tied to your PerkPass account.')
      return
    }

    setMemberLoading(true)
    setMemberError('')
    setMagicLinkSent(false)

    try {
      await sendMagicLink(email)
      setMagicLinkSent(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send login link right now.'
      const normalized = message.toLowerCase()
      if (normalized.includes('social') || normalized.includes('identity') || normalized.includes('oauth')) {
        setMemberError('We could not send a sign-in link for this account yet. If you normally use Google on the website, contact support and we will help you unlock mobile access.')
      } else {
        setMemberError(message)
      }
    } finally {
      setMemberLoading(false)
    }
  }

  async function completeMemberAccess(memberEmail: string) {
    setMemberLoading(true)
    setMemberError('')

    try {
      const status = await loadMemberStatus(memberEmail)
      setMember(status)

      if (status.active && status.hasPhone) {
        setMemberMode('active')
        goToDealsToday()
        await hydrateRedemptions(memberEmail)
        return
      }

      if (status.active && !status.hasPhone) {
        setMemberError('Your membership is active, but phone verification needs to be completed on the web first.')
        return
      }

      setMemberError(status.exists
        ? 'PerkPass mobile currently supports existing active members only.'
        : 'We could not find an active PerkPass account for that email.')
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : 'Unable to check membership right now.')
    } finally {
      setMemberLoading(false)
    }
  }

  function goToDealsToday() {
    setSelectedWeekday(new Date().getDay())
    setShowLiveOnly(true)
    setScreen('deals')
  }

  function continueAsGuest() {
    setMemberMode('guest')
    setMember(null)
    setMagicLinkSent(false)
    setMemberError('')
    goToDealsToday()
  }

  function toggleLiveOnly() {
    setShowLiveOnly((current) => {
      const next = !current
      if (next) {
        setSelectedWeekday(new Date().getDay())
      }
      return next
    })
  }

  async function signOut() {
    if (hasSupabaseConfig) {
      try {
        await signOutOfSupabase()
      } catch {
        // Local state still clears so the user is not stuck in the app.
      }
    }
    setMemberMode('guest')
    setMember(null)
    setEmail('')
    setFavoriteBusinesses([])
    setCooldowns({})
    setActiveRedemption(null)
    setSelectedDeal(null)
    setRedemptionHistory([])
    setMagicLinkSent(false)
    setScreen('login')
  }

  async function openBillingPortal() {
    if (memberMode !== 'active' || !email) {
      Alert.alert('Sign in required', 'Sign in with your PerkPass email to manage billing.')
      return
    }

    setBillingLoading(true)
    try {
      const url = await getBillingPortalUrl(email)
      await Linking.openURL(url)
    } catch (err) {
      Alert.alert('Unable to open billing', err instanceof Error ? err.message : 'Please try again in a moment.')
    } finally {
      setBillingLoading(false)
    }
  }

  function confirmDeleteAccount() {
    if (memberMode !== 'active' || !email) {
      Alert.alert('Unavailable', 'Account deletion is only available while signed in.')
      return
    }

    Alert.alert(
      'Delete account?',
      'This deletes your PerkPass account and recent app data. If an active membership exists, it will be cancelled.',
      [
        { text: 'Keep account', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount()
          },
        },
      ],
    )
  }

  async function handleDeleteAccount() {
    if (memberMode !== 'active' || !email) return

    setDeleteLoading(true)
    try {
      await deleteMemberAccount(email)
      Alert.alert('Account deleted', 'Your PerkPass account has been deleted.')
      await signOut()
    } catch (err) {
      Alert.alert(
        'Unable to delete account',
        err instanceof Error ? err.message : 'Please try again in a moment.',
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  function startRedemption(deal: Deal) {
    void beginRedemption(deal)
  }

  function resetRedemptionSheet() {
    Animated.spring(redemptionSheetY, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.9,
    }).start()
  }

  function promptCloseRedemption() {
    resetRedemptionSheet()
    stopHoldCloseFeedback()
    Alert.alert(
      'Close this code?',
      'If staff still needs to view your code, keep this screen open.',
      [
        { text: 'Keep open', style: 'cancel' },
        { text: 'Close code', style: 'destructive', onPress: () => setActiveRedemption(null) },
      ],
    )
  }

  function startHoldCloseFeedback() {
    holdCloseProgress.setValue(0)
    Animated.timing(holdCloseProgress, {
      toValue: 1,
      duration: 550,
      useNativeDriver: false,
    }).start()
  }

  function stopHoldCloseFeedback() {
    holdCloseProgress.stopAnimation()
    Animated.timing(holdCloseProgress, {
      toValue: 0,
      duration: 140,
      useNativeDriver: false,
    }).start()
  }

  async function beginRedemption(deal: Deal) {
    if (cooldowns[deal.id] && cooldowns[deal.id] > Date.now()) return

    setSelectedDeal(null)

    const code = generateRedemptionCode(deal)
    const expiresAt = Date.now() + REDEMPTION_CODE_TTL_SECONDS * 1000

    if (memberMode !== 'active' || !email || !hasSupabaseConfig) {
      Alert.alert('Sign in required', 'Sign in with your PerkPass email to redeem member offers.')
      return
    }

    try {
      const row = await createRedemption(email, deal, code)
      setActiveRedemption({ id: row.id, deal, code: row.code || code, expiresAt, persisted: true, status: 'live' })
      applyCooldowns([row])
      setRedemptionHistory((current) => [mapRedemptionHistory(row), ...current.filter((item) => item.id !== row.id)])
    } catch (err) {
      Alert.alert('Unable to redeem right now', err instanceof Error ? err.message : 'Please try again in a moment.')
    }
  }

  async function hydrateRedemptions(memberEmail: string) {
    try {
      const rows = await loadRedemptions(memberEmail)
      setRedemptionHistory(rows.map(mapRedemptionHistory))
      applyCooldowns(rows)
    } catch {
      // Keep the app usable even if redemption sync fails briefly.
    }
  }

  function applyCooldowns(rows: RedemptionRow[]) {
    const next: Record<string, number> = {}
    rows.forEach((row) => {
      if (!row.deal_id) return
      const endsAt = new Date(row.redeemed_at).getTime() + REDEMPTION_COOLDOWN_SECONDS * 1000
      if (endsAt > Date.now()) {
        next[row.deal_id] = Math.max(next[row.deal_id] || 0, endsAt)
      }
    })
    setCooldowns(next)
  }

  const redemptionPanResponder = useState(() =>
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 10 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderMove: (_, gesture) => {
        const dragDistance = Math.max(0, gesture.dy)
        const resistedDistance =
          dragDistance <= 120
            ? dragDistance
            : 120 + (dragDistance - 120) * 0.35
        redemptionSheetY.setValue(resistedDistance)
      },
      onPanResponderRelease: (_, gesture) => {
        const shouldClose = gesture.dy > 170 || gesture.vy > 1.6

        if (shouldClose) {
          promptCloseRedemption()
          return
        }

        resetRedemptionSheet()
      },
      onPanResponderTerminate: () => {
        resetRedemptionSheet()
      },
    }),
  )[0]

  if (!fontsLoaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingShell}>
          <ActivityIndicator color={colors.greenDark} />
        </View>
      </SafeAreaView>
    )
  }

  const showBottomTabs = screen !== 'login'

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.shell}>
        {screen === 'login' && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={[styles.hero, compact && styles.heroCompact]}>Welcome back.</Text>
            <Text style={styles.body}>Use your PerkPass email to access member deals.</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
            {magicLinkSent ? (
              <View style={styles.noticeLive}>
                <Text style={styles.noticeTitle}>Check your email</Text>
                <Text style={styles.noticeText}>We sent a login link to {email}. Open it on this device to land back in PerkPass.</Text>
              </View>
            ) : null}
            <View style={styles.noticeLive}>
              <Text style={styles.noticeTitle}>Use the same email as your website account</Text>
              <Text style={styles.noticeText}>If you normally use Google on the website, enter that same email here and we will send a sign-in link.</Text>
            </View>
            {memberError ? (
              <View style={styles.noticeDemo}>
                <Text style={styles.noticeTitle}>Membership check</Text>
                <Text style={styles.noticeText}>{memberError}</Text>
              </View>
            ) : null}
            <Pressable style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>{memberLoading ? 'Checking...' : 'Continue with email'}</Text>
            </Pressable>
            <View style={styles.buttonGap} />
            <Pressable style={styles.secondaryButton} onPress={continueAsGuest}>
              <Text style={styles.secondaryButtonText}>Browse current deals</Text>
            </Pressable>
          </ScrollView>
        )}

        {screen === 'deals' && (
          <ScrollView
            contentContainerStyle={styles.page}
            refreshControl={<RefreshControl refreshing={dealsLoading} onRefresh={refreshDeals} tintColor={colors.greenDark} />}
          >
            <Text style={[styles.hero, compact && styles.heroCompact]}>{userFirstName ? `Hey ${userFirstName}.` : 'Your deals.'}</Text>

            <View style={styles.summaryBlock}>
              <Pressable onPress={toggleLiveOnly} style={[styles.liveModeCard, showLiveOnly && styles.liveModeCardActive]}>
                <Text style={[styles.liveModeTitle, showLiveOnly && styles.liveModeTitleActive]}>Live deals now</Text>
                <View style={styles.liveModeControl}>
                  <View style={[styles.liveModeSwitchTrack, showLiveOnly && styles.liveModeSwitchTrackActive]}>
                    <View style={[styles.liveModeSwitchThumb, showLiveOnly && styles.liveModeSwitchThumbActive]} />
                  </View>
                </View>
              </Pressable>
              <View style={styles.summaryPills}>
                {selectedCategory !== 'All' ? (
                  <View style={styles.summaryPill}>
                    <Text style={styles.summaryPillText}>{selectedCategory}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.searchRow}>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search businesses, deals, or addresses"
                placeholderTextColor={colors.inkFaint}
                style={styles.searchInput}
              />
              {search ? (
                <Pressable style={styles.searchClearButton} onPress={() => setSearch('')}>
                  <Text style={styles.searchClearButtonText}>Clear</Text>
                </Pressable>
              ) : null}
            </View>

            <ScrollView
              ref={dayTabsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dayTabs}
              onLayout={handleDayTabsLayout}
            >
              {dayTabs.map((tab) => {
                const selected = selectedWeekday === tab.day
                return (
                  <Pressable
                    key={tab.day}
                    style={[styles.dayTab, selected && styles.dayTabActive]}
                    onLayout={(event) => handleDayTabLayout(tab.day, event)}
                    onPress={() => {
                      setSelectedWeekday(tab.day)
                      setShowLiveOnly(false)
                    }}
                  >
                    <Text style={[styles.dayTabText, selected && styles.dayTabTextActive]}>{tab.label}</Text>
                    <Text style={[styles.dayTabSubtext, selected && styles.dayTabSubtextActive]}>{tab.dateLabel}</Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Text style={styles.filterHint}>
              {showLiveOnly
                ? 'Showing deals customers can redeem right now.'
                : `Showing deals scheduled for ${selectedWeekdayLabel}.`}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryTabs}>
              {categories.map((category) => {
                const selected = selectedCategory === category
                return (
                  <Pressable key={category} style={[styles.categoryTab, selected && styles.categoryTabActive]} onPress={() => setSelectedCategory(category)}>
                    <Text style={[styles.categoryTabText, selected && styles.categoryTabTextActive]}>
                      {category !== 'All' ? `${CATEGORY_META[category]?.emoji || '🎟️'} ` : ''}
                      {category}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            {dealsLoading && deals.length === 0 ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color={colors.greenDark} />
                <Text style={styles.muted}>Loading PerkPass deals...</Text>
              </View>
            ) : filteredGroups.length > 0 ? (
              <View style={styles.dealGroupList}>
                {filteredGroups.map((group) => (
                  <BusinessGroupCard
                    key={group.businessName}
                    group={group}
                    favorite={favoriteBusinesses.includes(group.businessName)}
                    onFavorite={() => toggleFavoriteBusiness(group.businessName)}
                    onPressDeal={setSelectedDeal}
                    cooldowns={cooldowns}
                    now={clock}
                  />
                ))}
              </View>
            ) : (
              <EmptyState
                title={search ? 'Nothing matches that search yet.' : 'Nothing in this window yet.'}
                text={search ? 'Try a different business, deal, or address search.' : 'Try another day or category to see more active deals.'}
              />
            )}
          </ScrollView>
        )}

        {screen === 'favorites' && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.kicker}>Favorites</Text>
            <Text style={[styles.hero, compact && styles.heroCompact]}>Favorites for later.</Text>
            <View style={styles.accountHeroCard}>
              <Text style={styles.accountHeroEyebrow}>Local shortlist</Text>
              <Text style={styles.accountHeroTitle}>{favoriteGroups.length} saved</Text>
              <Text style={styles.accountHeroText}>
                {favoriteGroups.length === 0
                  ? 'Start saving spots from the deals page so your next few Philly picks are always easy to find.'
                  : 'Keep your best local picks in one place and jump back in when you are ready to redeem.'}
              </Text>
              <View style={styles.accountStatsRow}>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>{favoriteGroups.length}</Text>
                  <Text style={styles.accountStatLabel}>Businesses</Text>
                </View>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>{favoriteDeals.length}</Text>
                  <Text style={styles.accountStatLabel}>Deals</Text>
                </View>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>Live</Text>
                  <Text style={styles.accountStatLabel}>Mode</Text>
                </View>
              </View>
            </View>
            {favoriteGroups.length === 0 ? (
              <EmptyState title="No favorites yet." text="Tap Save on any deal to build your local hit list." />
            ) : (
              <View style={styles.dealGroupList}>
                {favoriteGroups.map((group) => (
                  <BusinessGroupCard
                    key={group.businessName}
                    group={group}
                    favorite
                    onFavorite={() => toggleFavoriteBusiness(group.businessName)}
                    onPressDeal={setSelectedDeal}
                    cooldowns={cooldowns}
                    now={clock}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {screen === 'history' && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.kicker}>Redemption history</Text>
            <Text style={[styles.hero, compact && styles.heroCompact]}>
              {memberMode === 'active' ? 'Your recent PerkPass activity.' : 'History unlocks after sign in.'}
            </Text>
            {memberMode !== 'active' ? (
              <EmptyState
                title="Sign in to view history."
                text="Use your PerkPass email to view redemption history and manage member activity."
              />
            ) : (
              <>
                <View style={styles.accountHeroCard}>
                  <Text style={styles.accountHeroEyebrow}>Activity snapshot</Text>
                  <Text style={styles.accountHeroTitle}>{redemptionHistory.length} total</Text>
                  <Text style={styles.accountHeroText}>
                    Keep track of what you redeemed, what got confirmed, and what is still cooling down.
                  </Text>
                  <View style={styles.accountStatsRow}>
                    <View style={styles.accountStatCard}>
                      <Text style={styles.accountStatValue}>{confirmedHistoryCount}</Text>
                      <Text style={styles.accountStatLabel}>Confirmed</Text>
                    </View>
                    <View style={styles.accountStatCard}>
                      <Text style={styles.accountStatValue}>{pendingHistoryCount}</Text>
                      <Text style={styles.accountStatLabel}>Pending</Text>
                    </View>
                    <View style={styles.accountStatCard}>
                      <Text style={styles.accountStatValue}>{favoriteGroups.length}</Text>
                      <Text style={styles.accountStatLabel}>Favorites</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.accountSubCard}>
                  <Text style={styles.subCardEyebrow}>Recent redemptions</Text>
                  <Text style={styles.subCardText}>
                    Every code you open shows up here, so you can keep track of what was confirmed and what is still recent.
                  </Text>
                </View>
                {redemptionHistory.length === 0 ? (
                  <EmptyState title="No redemptions yet." text="Once you use a PerkPass deal, your recent activity will show up here." />
                ) : (
                  <View style={styles.historyList}>
                    {redemptionHistory.map((item) => (
                      <View key={item.id} style={styles.historyCard}>
                        <View style={styles.historyBody}>
                          <Text style={styles.cardTitle}>{item.businessName}</Text>
                          <Text style={styles.dealText}>{item.deal}</Text>
                          <Text style={styles.muted}>{item.date}</Text>
                        </View>
                        <Text style={styles.statusPill}>{item.status}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        )}

        {screen === 'account' && (
          <ScrollView contentContainerStyle={styles.page}>
            <Text style={styles.kicker}>Account</Text>
            <Text style={[styles.hero, compact && styles.heroCompact]}>
              {memberMode === 'active' ? 'PerkPass All Access.' : 'Browse first. Sign in when ready.'}
            </Text>
            <View style={styles.accountHeroCard}>
              <Text style={styles.accountHeroEyebrow}>Account</Text>
              <Text style={styles.accountHeroTitle}>{member?.name || email || 'PerkPass guest'}</Text>
              <Text style={styles.accountHeroText}>
                {memberMode === 'active'
                  ? 'Your membership details, favorites, and recent activity all live here.'
                  : 'You can browse live deals as a guest. Sign in with your PerkPass email to redeem offers, manage billing, and view account activity.'}
              </Text>
              <View style={styles.accountStatsRow}>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>{favoriteBusinesses.length}</Text>
                  <Text style={styles.accountStatLabel}>Favorites</Text>
                </View>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>{redemptionHistory.length}</Text>
                  <Text style={styles.accountStatLabel}>History</Text>
                </View>
                <View style={styles.accountStatCard}>
                  <Text style={styles.accountStatValue}>{deals.length}</Text>
                  <Text style={styles.accountStatLabel}>Deals</Text>
                </View>
              </View>
            </View>
            <View style={styles.accountCard}>
              <Text style={styles.subCardEyebrow}>Membership details</Text>
              <AccountRow label="Status" value={memberMode === 'active' ? 'Active member' : 'Guest browsing'} />
              <AccountRow label="Email" value={email || 'Not signed in'} />
              <AccountRow label="Plan" value={memberMode === 'active' ? 'PerkPass All Access' : 'Sign in for member access'} />
              <AccountRow label="Phone" value={member?.phone ? formatPhone(member.phone) : 'Managed on web'} />
              <AccountRow label="Billing" value={memberMode === 'active' ? 'Stripe billing portal' : 'Sign in to manage billing'} />
              <AccountRow label="Data" value="PerkPass deals" />
            </View>
            <View style={styles.accountSubCard}>
              <Text style={styles.subCardEyebrow}>Recent activity</Text>
              {memberMode !== 'active' ? (
                <Text style={styles.subCardText}>
                  Sign in with your PerkPass email when you want to unlock redemption history and account activity.
                </Text>
              ) : redemptionHistory.length === 0 ? (
                <Text style={styles.subCardText}>Once you redeem a deal, your recent PerkPass activity will show up here.</Text>
              ) : (
                redemptionHistory.slice(0, 3).map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.accountHistoryRow,
                      index < Math.min(redemptionHistory.length, 3) - 1 && styles.accountHistoryRowBorder,
                    ]}
                  >
                    <View style={styles.accountHistoryCopy}>
                      <Text style={styles.accountHistoryTitle}>{item.businessName}</Text>
                      <Text style={styles.accountHistoryDeal}>{item.deal}</Text>
                      <Text style={styles.accountHistoryDate}>{item.date}</Text>
                    </View>
                    <Text style={styles.statusPill}>{item.status}</Text>
                  </View>
                ))
              )}
            </View>

            <View style={styles.creatorCard}>
              <Text style={styles.creatorPill}>Instagram creator offer</Text>
              <Text style={styles.creatorTitle}>Tag us. We&apos;ll DM your 3-month code.</Text>
              <Text style={styles.creatorText}>
                Have 2,000+ Instagram followers? Share PerkPass in a post or story, tag @GetPerkPass, and if it qualifies we&apos;ll DM you a 3-month code.
              </Text>
              <View style={styles.creatorSteps}>
                {[
                  'Post or story about PerkPass',
                  'Tag @GetPerkPass so we can find it',
                  'Eligible creators get a 3-month code by DM',
                ].map((step, index) => (
                  <View key={step} style={styles.creatorStepRow}>
                    <View style={styles.creatorStepDot}>
                      <Text style={styles.creatorStepDotText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.creatorStepText}>{step}</Text>
                  </View>
                ))}
              </View>
              <Pressable style={styles.primaryButton} onPress={() => Linking.openURL('https://www.instagram.com/getperkpass/')}>
                <Text style={styles.primaryButtonText}>Open Instagram</Text>
              </Pressable>
            </View>

            {memberMode === 'active' ? (
              <>
                <Pressable
                  style={styles.primaryButton}
                  onPress={openBillingPortal}
                >
                  <Text style={styles.primaryButtonText}>
                    {billingLoading ? 'Opening billing...' : 'Manage billing'}
                  </Text>
                </Pressable>
                <View style={styles.buttonGap} />
              </>
            ) : (
              <>
                <Pressable style={styles.primaryButton} onPress={signOut}>
                  <Text style={styles.primaryButtonText}>Sign in with email</Text>
                </Pressable>
                <View style={styles.buttonGap} />
              </>
            )}
            <Pressable style={styles.secondaryButton} onPress={() => Linking.openURL('https://getperkpass.com/support')}>
              <Text style={styles.secondaryButtonText}>Open support</Text>
            </Pressable>
            <View style={styles.buttonGap} />
            <View style={styles.accountSubCard}>
              <Text style={styles.subCardEyebrow}>Legal</Text>
              <Text style={styles.subCardText}>
                Need the details? You can open PerkPass terms and privacy from here anytime.
              </Text>
            </View>
            <View style={styles.accountLinksRow}>
              <Pressable onPress={() => Linking.openURL(`${env.webBaseUrl}/terms`)}>
                <Text style={styles.accountLinkText}>Terms</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`${env.webBaseUrl}/privacy`)}>
                <Text style={styles.accountLinkText}>Privacy</Text>
              </Pressable>
            </View>
            <View style={styles.buttonGap} />
            {memberMode === 'active' ? (
              <>
                <Pressable style={styles.secondaryButton} onPress={confirmDeleteAccount}>
                  <Text style={styles.secondaryButtonText}>
                    {deleteLoading ? 'Deleting account...' : 'Delete account'}
                  </Text>
                </Pressable>
                <View style={styles.buttonGap} />
              </>
            ) : null}
            {memberMode === 'active' ? (
              <Pressable style={styles.secondaryButton} onPress={signOut}>
                <Text style={styles.secondaryButtonText}>Sign out</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        )}

        {showBottomTabs ? <TabBar screen={screen} onChange={setScreen} bottomInset={insets.bottom} /> : null}
      </View>

      <Modal animationType="slide" transparent visible={Boolean(selectedDeal)} onRequestClose={() => setSelectedDeal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedDeal && (
              <>
                <Text style={styles.kicker}>{selectedDeal.category}</Text>
                <Text style={styles.modalTitle}>{selectedDeal.businessName}</Text>
                <Text style={styles.dealText}>{selectedDeal.offer}</Text>
                <Text style={styles.body}>
                  Only tap Redeem when you are at checkout. Your code is visible for 2 minutes, then this deal cools down for 15 minutes.
                </Text>
                <Pressable
                  style={[styles.primaryButton, isDealOnCooldown(selectedDeal, cooldowns, clock) && styles.buttonDisabled]}
                  onPress={() => startRedemption(selectedDeal)}
                  disabled={isDealOnCooldown(selectedDeal, cooldowns, clock)}
                >
                  <Text style={styles.primaryButtonText}>
                    {isDealOnCooldown(selectedDeal, cooldowns, clock) ? `Back in ${formatRemaining(cooldowns[selectedDeal.id] - clock)}` : 'Yes — show my code'}
                  </Text>
                </Pressable>
                <Pressable style={styles.textButton} onPress={() => setSelectedDeal(null)}>
                  <Text style={styles.textButtonText}>Not yet</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal animationType="slide" transparent visible={Boolean(activeRedemption)} onRequestClose={promptCloseRedemption}>
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.redemptionCard, { transform: [{ translateY: redemptionSheetY }] }]}>
            {activeRedemption && (
              <>
                <View style={styles.swipeHandleWrap} {...redemptionPanResponder.panHandlers}>
                  <View style={styles.swipeHandle} />
                </View>
                {activeRedemption.status === 'confirmed' ? (
                  <>
                    <Text style={styles.kicker}>Code confirmed</Text>
                    <Text style={styles.modalTitle}>All set.</Text>
                    <Text style={styles.dealText}>{activeRedemption.deal.offer}</Text>
                    <View style={styles.successCircle}>
                      <Text style={styles.successCheck}>✓</Text>
                    </View>
                    <Text style={styles.redemptionHelp}>
                      Staff has confirmed this redemption. Enjoy your visit at {activeRedemption.deal.businessName}.
                    </Text>
                    <Pressable style={styles.primaryButton} onPress={() => {
                      setActiveRedemption(null)
                      setScreen('history')
                      if (memberMode === 'active' && email) {
                        void hydrateRedemptions(email)
                      }
                    }}>
                      <Text style={styles.primaryButtonText}>Back to history</Text>
                    </Pressable>
                  </>
                ) : activeRedemption.status === 'expired' ? (
                  <>
                    <Text style={styles.kicker}>Code expired</Text>
                    <Text style={styles.modalTitle}>Window ended.</Text>
                    <Text style={styles.dealText}>{activeRedemption.deal.offer}</Text>
                    <Text style={styles.redemptionHelp}>
                      Your 2-minute code window passed. The 15-minute cooldown is still active for this deal.
                    </Text>
                    <Pressable style={styles.primaryButton} onPress={() => {
                      setActiveRedemption(null)
                      setScreen('deals')
                    }}>
                      <Text style={styles.primaryButtonText}>Back to deals</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.kicker}>Show at checkout</Text>
                    <Text style={styles.modalTitle}>{activeRedemption.deal.businessName}</Text>
                    <Text style={styles.dealText}>{activeRedemption.deal.offer}</Text>
                    <View style={styles.codeBox}>
                      <Text style={styles.codeLabel}>PerkPass code</Text>
                      <Text style={styles.codeText}>{activeRedemption.code}</Text>
                      <Text style={styles.codeTimer}>
                        {Math.max(0, Math.ceil((activeRedemption.expiresAt - clock) / 1000)) > 0
                          ? `${formatRemaining(activeRedemption.expiresAt - clock)} left`
                          : 'Code window ended'}
                      </Text>
                      <View style={styles.codeProgressTrack}>
                        <View
                          style={[
                            styles.codeProgressFill,
                            {
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  ((activeRedemption.expiresAt - clock) / (REDEMPTION_CODE_TTL_SECONDS * 1000)) * 100,
                                ),
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.codeRulesRow}>
                        <View style={styles.codeRuleChip}>
                          <Text style={styles.codeRuleValue}>2 min</Text>
                          <Text style={styles.codeRuleLabel}>Window</Text>
                        </View>
                        <View style={styles.codeRuleChip}>
                          <Text style={styles.codeRuleValue}>15 min</Text>
                          <Text style={styles.codeRuleLabel}>Cooldown</Text>
                        </View>
                        <View style={styles.codeRuleChip}>
                          <Text style={styles.codeRuleValue}>1x</Text>
                          <Text style={styles.codeRuleLabel}>Per use</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.redemptionHelp}>
                      Keep this screen open while staff checks your code. PerkPass will confirm automatically once the code is validated.
                    </Text>
                    <View style={styles.redemptionActions}>
                      <Text style={styles.actionCaption}>Long press if you need to close this code.</Text>
                      <Pressable
                        style={styles.holdCloseButton}
                        onLayout={(event) => setHoldButtonWidth(event.nativeEvent.layout.width)}
                        onPressIn={startHoldCloseFeedback}
                        onPressOut={stopHoldCloseFeedback}
                        onLongPress={promptCloseRedemption}
                        delayLongPress={550}
                      >
                        <Animated.View
                          pointerEvents="none"
                          style={[
                            styles.holdCloseProgress,
                            {
                              width: holdCloseProgress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, holdButtonWidth],
                              }),
                            },
                          ]}
                        />
                        <Text style={styles.holdCloseText}>Long press to close code</Text>
                      </Pressable>
                    </View>
                  </>
                )}
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}
