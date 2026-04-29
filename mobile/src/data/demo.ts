import type { Deal, RedemptionHistoryItem } from '../types'

export const DEALS: Deal[] = [
  {
    id: 'coffee-fishtown',
    businessName: 'La Colombe',
    offer: '$2 off any espresso drink before 11am',
    category: 'Cafe',
    neighborhood: 'Fishtown',
    availability: 'Available now',
    schedule: { days: [0, 1, 2, 3, 4, 5, 6], start: '08:00', end: '14:00' },
  },
  {
    id: 'dessert-chinatown',
    businessName: 'Mango Mango Dessert',
    offer: 'Free topping on any dessert order',
    category: 'Dessert',
    neighborhood: 'Chinatown',
    availability: 'Today',
    schedule: { days: [4, 5, 6], start: '15:00', end: '21:00' },
  },
  {
    id: 'fitness-center-city',
    businessName: 'Earn Everything Gym',
    offer: '15% off your first class pack',
    category: 'Fitness',
    neighborhood: 'Center City',
    availability: 'This week',
    featured: true,
    schedule: { days: [1, 2, 3, 4, 5], start: '06:00', end: '18:00' },
  },
  {
    id: 'nails-old-city',
    businessName: 'Top Design Nails And Jewelry',
    offer: '$10 off any service over $50',
    category: 'Self-care',
    neighborhood: 'Old City',
    availability: 'Weekdays',
    schedule: { days: [1, 2, 3, 4, 5], start: '10:00', end: '17:00' },
  },
]

export const REDEMPTION_HISTORY: RedemptionHistoryItem[] = [
  {
    id: 'history-1',
    businessName: 'La Colombe',
    deal: '$2 off any espresso drink before 11am',
    date: 'Apr 20, 9:42 AM',
    status: 'Confirmed',
  },
  {
    id: 'history-2',
    businessName: 'Mango Mango Dessert',
    deal: 'Free topping on any dessert order',
    date: 'Apr 18, 7:16 PM',
    status: 'Code generated',
  },
]
