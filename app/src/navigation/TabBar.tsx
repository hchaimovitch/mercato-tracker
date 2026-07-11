import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

const TAB_ICONS: Record<string, { active: keyof typeof MaterialCommunityIcons.glyphMap; inactive: keyof typeof MaterialCommunityIcons.glyphMap; label: string }> = {
  Flux: { active: 'lightning-bolt', inactive: 'lightning-bolt-outline', label: 'Flux' },
  Ligues: { active: 'trophy', inactive: 'trophy-outline', label: 'Ligues' },
  Suivis: { active: 'star', inactive: 'star-outline', label: 'Suivis' },
  Alertes: { active: 'bell', inactive: 'bell-outline', label: 'Alertes' },
};

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[colors.bgHeaderTop, colors.bgApp]}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 14) }]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_ICONS[route.name] ?? TAB_ICONS.Flux;
        const options = descriptors[route.key].options;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: isFocused }}
            accessibilityLabel={options.title ?? meta.label}
          >
            {isFocused && <View style={styles.glow} />}
            <MaterialCommunityIcons
              name={isFocused ? meta.active : meta.inactive}
              size={23}
              color={isFocused ? colors.amberLight : colors.textDisabled}
              style={styles.icon}
            />
            <Text style={[styles.label, { color: isFocused ? colors.amberLight : colors.textDisabled }]}>{meta.label}</Text>
          </Pressable>
        );
      })}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingTop: 9,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    minWidth: 44,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  glow: {
    position: 'absolute',
    top: -2,
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: 'rgba(245,179,1,0.22)',
    shadowColor: colors.amber,
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  icon: { zIndex: 1 },
  label: { fontFamily: manrope(700), fontSize: 10, letterSpacing: 0.2, zIndex: 1 },
});
