import type { ViewStyle } from 'react-native'

export const colors = {
  bg: '#f3efe6',
  bg2: '#fbf9f5',
  bg3: '#e6dfd2',
  ink: '#1c1c1a',
  inkSoft: '#3a3830',
  inkMuted: '#5a5850',
  inkFaint: '#9a9890',
  border: 'rgba(0,0,0,0.08)',
  borderStrong: 'rgba(0,0,0,0.16)',
  green: '#5fa061',
  greenDark: '#3d7a3f',
  greenLight: 'rgba(95,160,97,0.15)',
  forest: '#1a2e1a',
  red: '#c0382b',
  redLight: 'rgba(192,56,43,0.10)',
}

export const fonts = {
  bodyRegular: 'Barlow_400Regular',
  body: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
  display: 'BarlowCondensed_900Black',
  displayBold: 'BarlowCondensed_800ExtraBold',
  label: 'BarlowCondensed_700Bold',
}

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 34,
}

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
}

export const shadow: Record<string, ViewStyle> = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
}
