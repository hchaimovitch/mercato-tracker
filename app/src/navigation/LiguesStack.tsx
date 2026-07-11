import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClubScreen } from '../screens/ClubScreen';
import { LeagueClubsScreen } from '../screens/LeagueClubsScreen';
import { LiguesScreen } from '../screens/LiguesScreen';
import { SourceProfileScreen } from '../screens/SourceProfileScreen';
import { TransferDetailScreen } from '../screens/TransferDetailScreen';
import type { LiguesStackParamList } from './types';

const Stack = createNativeStackNavigator<LiguesStackParamList>();

export function LiguesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LiguesHome" component={LiguesScreen} />
      <Stack.Screen name="LeagueClubs" component={LeagueClubsScreen} />
      <Stack.Screen name="ClubDetail" component={ClubScreen} />
      <Stack.Screen name="TransferDetail" component={TransferDetailScreen} />
      <Stack.Screen name="SourceProfile" component={SourceProfileScreen} />
    </Stack.Navigator>
  );
}
