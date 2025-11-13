import { colors } from '@/constants/colors';

type ColorKey = 'primary' | 'secondary' | 'text' | 'white' | 'gray' | 'green' | 'orange' | 'red';

export function useColor(colorKey: ColorKey): string {
  const colorMap: Record<ColorKey, string> = {
    primary: colors.primary,
    secondary: '#6C63FF',
    text: colors.text,
    white: colors.white,
    gray: colors.gray,
    green: '#6BCB77',
    orange: '#FFD93D',
    red: '#FF6B6B',
  };

  return colorMap[colorKey] || colors.primary;
}
