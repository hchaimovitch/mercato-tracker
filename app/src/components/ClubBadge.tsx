import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface ClubBadgeProps {
  abbr: string;
  color: string;
  size?: number;
  radius?: number;
}

/** Colored initials badge standing in for a club crest (no licensed logos are shipped). */
export function ClubBadge({ abbr, color, size = 36, radius = 9 }: ClubBadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}
    >
      <Text style={[styles.text, { fontSize: size * 0.3 }]} numberOfLines={1}>
        {abbr}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    color: colors.textPrimary,
    fontFamily: manrope(800),
  },
});
