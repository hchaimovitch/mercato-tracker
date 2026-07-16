import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface ClubBadgeProps {
  abbr: string;
  color: string;
  logoUrl?: string | null;
  size?: number;
  radius?: number;
}

/**
 * Renders the official crest when a logo URL is available (usage strictement
 * personnel, jamais publié — voir README), sinon retombe sur un badge à
 * initiales colorées. Le repli s'applique aussi si l'image échoue à charger.
 */
export function ClubBadge({ abbr, color, logoUrl, size = 36, radius = 9 }: ClubBadgeProps) {
  const [failed, setFailed] = useState(false);

  if (logoUrl && !failed) {
    return (
      <Image
        source={{ uri: logoUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="contain"
        onError={() => setFailed(true)}
      />
    );
  }

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
