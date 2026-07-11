import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/colors';
import { AlertesScreen } from '../screens/AlertesScreen';
import { FluxStack } from './FluxStack';
import { LiguesStack } from './LiguesStack';
import { SuivisStack } from './SuivisStack';
import { TabBar } from './TabBar';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bgApp, card: colors.bgApp, border: colors.border },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
        <Tab.Screen name="Flux" component={FluxStack} />
        <Tab.Screen name="Ligues" component={LiguesStack} />
        <Tab.Screen name="Suivis" component={SuivisStack} />
        <Tab.Screen name="Alertes" component={AlertesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
