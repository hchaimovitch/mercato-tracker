import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SourceProfileScreen } from '../screens/SourceProfileScreen';
import { SuivisScreen } from '../screens/SuivisScreen';
import { TransferDetailScreen } from '../screens/TransferDetailScreen';
import type { SuivisStackParamList } from './types';

const Stack = createNativeStackNavigator<SuivisStackParamList>();

export function SuivisStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SuivisHome" component={SuivisScreen} />
      <Stack.Screen name="TransferDetail" component={TransferDetailScreen} />
      <Stack.Screen name="SourceProfile" component={SourceProfileScreen} />
    </Stack.Navigator>
  );
}
