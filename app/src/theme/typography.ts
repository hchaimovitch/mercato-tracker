import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';

export const manropeFonts = {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
};

export type FontWeightKey = 400 | 500 | 600 | 700 | 800;

const weightToFamily: Record<FontWeightKey, string> = {
  400: 'Manrope_400Regular',
  500: 'Manrope_500Medium',
  600: 'Manrope_600SemiBold',
  700: 'Manrope_700Bold',
  800: 'Manrope_800ExtraBold',
};

/** RN doesn't apply numeric fontWeight to static Google-Fonts files — pick the family instead. */
export function manrope(weight: FontWeightKey = 400) {
  return weightToFamily[weight];
}
