import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

interface EmptyStateProps {
  glyph: string;
  title: string;
  description: string;
}

export function EmptyState({ glyph, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={styles.glyph}>{glyph}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 13,
    paddingHorizontal: 34,
    paddingBottom: 40,
  },
  iconWrap: {
    width: 58, height: 58, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)',
    backgroundColor: 'rgba(245,179,1,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  glyph: { fontSize: 24, color: colors.amber },
  title: { fontFamily: manrope(800), fontSize: 17, color: colors.textPrimary },
  description: {
    fontFamily: manrope(500), fontSize: 12.5, color: colors.textFaint,
    textAlign: 'center', lineHeight: 19, maxWidth: 230,
  },
});
