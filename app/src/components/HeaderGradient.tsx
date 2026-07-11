import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { colors } from '../theme/colors';

interface HeaderGradientProps extends ViewProps {
  strong?: boolean;
}

/** Shared top-of-screen gradient + bottom hairline used by every screen header. */
export function HeaderGradient({ strong, style, children, ...rest }: HeaderGradientProps) {
  return (
    <LinearGradient
      colors={strong ? [colors.bgHeaderTopStrong, colors.bgApp] : [colors.bgHeaderTop, colors.bgApp]}
      style={[styles.header, style]}
      {...rest}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
    gap: 11,
  },
});

export const HEADER_TOP_PADDING = 16;
