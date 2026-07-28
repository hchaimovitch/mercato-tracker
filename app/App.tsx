import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { FollowsProvider } from './src/storage/FollowsProvider';
import { PushTokenProvider } from './src/storage/PushTokenProvider';
import { WindowProvider } from './src/storage/WindowProvider';
import { colors } from './src/theme/colors';
import { manropeFonts } from './src/theme/typography';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  const [fontsLoaded] = useFonts(manropeFonts);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.amber} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <FollowsProvider>
          <WindowProvider>
            <PushTokenProvider>
              <StatusBar style="light" />
              <RootNavigator />
            </PushTokenProvider>
          </WindowProvider>
        </FollowsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
