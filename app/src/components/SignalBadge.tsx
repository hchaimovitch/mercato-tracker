import { StyleSheet, Text, View } from 'react-native';
import type { Tier } from '../api/types';
import { manrope } from '../theme/typography';

interface SignalBadgeProps {
  tier: Tier;
  variant?: 'inline' | 'pill';
  glyphSize?: number;
  labelSize?: number;
  label?: string;
}

/**
 * The 3-level reliability signal — always rendered as glyph (dot count) + text label,
 * never color alone, so it reads correctly for colorblind users.
 */
export function SignalBadge({ tier, variant = 'inline', glyphSize = 12, labelSize = 11, label }: SignalBadgeProps) {
  const content = (
    <>
      <Text style={{ fontFamily: 'monospace', fontSize: glyphSize, letterSpacing: 1, color: tier.color }}>{tier.glyph}</Text>
      <Text style={{ fontFamily: manrope(700), fontSize: labelSize, color: tier.color }}>{label ?? tier.label}</Text>
    </>
  );

  if (variant === 'pill') {
    return (
      <View style={[styles.pill, { borderColor: tier.badgeBorder, backgroundColor: tier.badgeBg }]}>{content}</View>
    );
  }
  return <View style={styles.inline}>{content}</View>;
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 9,
    borderWidth: 1,
  },
});
