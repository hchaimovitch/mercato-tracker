import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFeedByIds } from '../api/hooks';
import { EmptyState } from '../components/EmptyState';
import { HeaderGradient } from '../components/HeaderGradient';
import { ErrorView, LoadingView } from '../components/ScreenState';
import { TransferCard } from '../components/TransferCard';
import type { SuivisStackParamList } from '../navigation/types';
import { useFollows } from '../storage/FollowsProvider';
import { colors } from '../theme/colors';
import { manrope } from '../theme/typography';

type Props = NativeStackScreenProps<SuivisStackParamList, 'SuivisHome'>;

export function SuivisScreen({ navigation }: Props) {
  const { followedIds, ready } = useFollows();
  const feedQuery = useFeedByIds(followedIds);

  return (
    <View style={styles.screen}>
      <HeaderGradient strong style={styles.header}>
        <Text style={styles.kicker}>Mercato Tracker</Text>
        <Text style={styles.title}>Suivis</Text>
      </HeaderGradient>

      {!ready ? (
        <LoadingView />
      ) : followedIds.length === 0 ? (
        <EmptyState
          glyph="★"
          title="Aucun transfert suivi"
          description="Touche « Suivre ce transfert » sur une fiche pour le retrouver ici et recevoir ses mises à jour."
        />
      ) : feedQuery.isLoading ? (
        <LoadingView />
      ) : feedQuery.isError ? (
        <ErrorView message={(feedQuery.error as Error).message} onRetry={() => feedQuery.refetch()} />
      ) : (
        <FlatList
          data={feedQuery.data}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TransferCard transfer={item} onPress={() => navigation.navigate('TransferDetail', { id: item.id, backLabel: 'Suivis' })} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bgApp },
  header: { paddingTop: 54, paddingHorizontal: 16, paddingBottom: 14 },
  kicker: { fontFamily: manrope(700), fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.textFaint },
  title: { fontFamily: manrope(800), fontSize: 26, letterSpacing: -0.5, color: colors.textPrimary, lineHeight: 29 },
  list: { padding: 16, gap: 13 },
});
