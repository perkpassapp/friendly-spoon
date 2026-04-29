import { Image, Pressable, Text, View } from 'react-native'
import { CATEGORY_META, formatRemaining, getAvailabilityLabel, isDealOnCooldown, isScheduleActive, normalizeCategory, scheduleLabel, type BusinessGroup } from '../lib/deals-ui'
import { styles } from '../styles/appStyles'
import type { Deal } from '../types'

export function DealCard({
  deal,
  favorite,
  onFavorite,
  onPress,
}: {
  deal: Deal
  favorite: boolean
  onFavorite: () => void
  onPress: () => void
}) {
  const photoUrl = deal.photoUrl || CATEGORY_META[normalizeCategory(deal.category)]?.photo

  return (
    <Pressable style={styles.dealCard} onPress={onPress}>
      {photoUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.dealImage} resizeMode="cover" />
      ) : (
        <View style={styles.dealImageFallback}>
          <Text style={styles.dealImageText}>{deal.category}</Text>
        </View>
      )}
      <View style={styles.dealTopRow}>
        <Text style={styles.categoryPill} numberOfLines={1}>{deal.category}</Text>
        <Pressable
          onPress={onFavorite}
          hitSlop={12}
          style={[styles.inlineFavoritePill, favorite && styles.inlineFavoritePillActive]}
        >
          <Text style={styles.inlineFavoriteText}>{favorite ? '♥ Saved' : '♡ Save'}</Text>
        </Pressable>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{deal.businessName}</Text>
      <Text style={styles.dealText}>{deal.offer}</Text>
      <Text style={styles.muted}>{deal.neighborhood} · {deal.availability}</Text>
    </Pressable>
  )
}

export function BusinessGroupCard({
  group,
  favorite,
  onFavorite,
  onPressDeal,
  cooldowns,
  now,
}: {
  group: BusinessGroup
  favorite: boolean
  onFavorite: () => void
  onPressDeal: (deal: Deal) => void
  cooldowns: Record<string, number>
  now: number
}) {
  const firstDeal = group.deals[0]
  const hasMultiple = group.deals.length > 1
  const photoUrl = group.photoUrl || firstDeal.photoUrl || CATEGORY_META[normalizeCategory(group.category)]?.photo

  return (
    <View style={styles.businessCard}>
      <Pressable onPress={() => !hasMultiple && onPressDeal(firstDeal)} style={styles.businessPhotoWrap}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.businessPhoto} resizeMode="cover" />
        ) : (
          <View style={styles.businessPhotoFallback}>
            <Text style={styles.dealImageText}>{group.category}</Text>
          </View>
        )}
        <Text style={styles.photoCategoryPill}>{group.category}</Text>
        <Pressable onPress={onFavorite} hitSlop={12} style={[styles.photoFavoritePill, favorite && styles.photoFavoritePillActive]}>
          <Text style={styles.photoFavoriteText}>{favorite ? '♥ Saved' : '♡ Save'}</Text>
        </Pressable>
        {hasMultiple ? (
          <Text style={styles.photoMultiPill}>{group.deals.length} deals</Text>
        ) : null}
        <View style={styles.photoFooter}>
          <Text style={styles.photoBusinessName} numberOfLines={2}>{group.businessName}</Text>
          <Text style={styles.photoAddress} numberOfLines={1}>{firstDeal.address ? `📍 ${firstDeal.address}` : group.neighborhood}</Text>
        </View>
      </Pressable>

      <View style={styles.businessDealList}>
        {group.deals.map((deal, index) => {
          const active = isScheduleActive(deal)
          const onCooldown = isDealOnCooldown(deal, cooldowns, now)
          return (
            <Pressable
              key={deal.id}
              style={[
                styles.businessDealRow,
                index < group.deals.length - 1 && styles.businessDealRowBorder,
                onCooldown && styles.businessDealRowDisabled,
              ]}
              onPress={() => !onCooldown && onPressDeal(deal)}
            >
              <View style={styles.businessDealCopy}>
                <Text style={styles.dealText}>{deal.offer}</Text>
                <Text style={[styles.availabilityPill, onCooldown ? styles.availabilityCooldown : active ? styles.availabilityActive : styles.availabilityLater]}>
                  {onCooldown ? `Back in ${formatRemaining(cooldowns[deal.id] - now)}` : getAvailabilityLabel(deal)}
                </Text>
                {!onCooldown && deal.schedule ? (
                  <Text style={styles.muted}>When: {scheduleLabel(deal)}</Text>
                ) : null}
              </View>
              <Text style={onCooldown ? styles.rowAction : active ? styles.rowActionButton : styles.rowAction}>
                {onCooldown ? 'Wait' : active ? 'Redeem' : 'View'}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
