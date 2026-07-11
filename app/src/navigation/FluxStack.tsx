import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { FluxScreen } from '../screens/FluxScreen';
import { SourceProfileScreen } from '../screens/SourceProfileScreen';
import { TransferDetailScreen } from '../screens/TransferDetailScreen';
import type { FluxStackParamList } from './types';

const Stack = createNativeStackNavigator<FluxStackParamList>();

export function FluxStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FluxHome" component={FluxScreen} />
      <Stack.Screen name="TransferDetail" component={TransferDetailScreen} />
      <Stack.Screen name="SourceProfile" component={SourceProfileScreen} />
    </Stack.Navigator>
  );
}
