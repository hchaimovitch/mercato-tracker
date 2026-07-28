import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface PlayerAvatarProps {
  nom: string;
  photoUrl?: string | null;
  size?: number;
  radius?: number;
}

/**
 * Affiche la photo du joueur quand disponible (transferts confirmés via
 * API-Football uniquement — les rumeurs RSS/SportMonks n'ont pas d'id joueur,
 * voir domain/views.ts), sinon repli sur des initiales. Le repli s'applique
 * aussi si l'image échoue à charger.
 */
export function PlayerAvatar({ nom, photoUrl, size = 40, radius = 12 }: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (photoUrl && !failed) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
        onError={() => setFailed(true)}
      />
    );
  }

  const initials = nom.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: radius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.32 }]} numberOfLines={1}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    borderWidth: 1,
    borderColor: colors.borderInput,
    backgroundColor: '#1a150e',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: { fontFamily: manrope(800), color: colors.textFaint },
});
