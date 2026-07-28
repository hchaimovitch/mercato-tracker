import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteRequest, fetchJson, postJson } from './client';
import type { TransferType } from '../components/TypeFilterRow';
import type {
  Alerte,
  AlerteType,
  ClubListItem,
  ClubView,
  League,
  LeagueId,
  LeaguesOverview,
  LeagueView,
  SourceProfile,
  TransferCard,
  TransferDetail,
  Window,
  WindowId,
} from './types';

export function useWindows() {
  return useQuery({ queryKey: ['windows'], queryFn: () => fetchJson<Window[]>('/windows') });
}

export function useLeagues() {
  return useQuery({ queryKey: ['leagues'], queryFn: () => fetchJson<League[]>('/leagues') });
}

export function useFeed(window: WindowId, league?: LeagueId, type?: TransferType) {
  return useQuery({
    queryKey: ['transfers', window, league ?? 'all', type ?? 'all'],
    queryFn: () => fetchJson<TransferCard[]>('/transfers', { window, league, type }),
  });
}

export function useFeedByIds(ids: number[]) {
  return useQuery({
    queryKey: ['transfers-by-ids', [...ids].sort((a, b) => a - b).join(',')],
    queryFn: () => fetchJson<TransferCard[]>('/transfers', { ids: ids.join(',') }),
    enabled: ids.length > 0,
  });
}

export function useTransferDetail(id: number | null) {
  return useQuery({
    queryKey: ['transfer', id],
    queryFn: () => fetchJson<TransferDetail>(`/transfers/${id}`),
    enabled: id != null,
  });
}

export function useLeaguesOverview(window: WindowId) {
  return useQuery({
    queryKey: ['leagues-overview', window],
    queryFn: () => fetchJson<LeaguesOverview>('/leagues/overview', { window }),
  });
}

export function useLeagueView(leagueId: LeagueId | null, window: WindowId) {
  return useQuery({
    queryKey: ['league', leagueId, window],
    queryFn: () => fetchJson<LeagueView>(`/leagues/${leagueId}`, { window }),
    enabled: leagueId != null,
  });
}

export function useClubView(clubId: number | null, window: WindowId) {
  return useQuery({
    queryKey: ['club', clubId, window],
    queryFn: () => fetchJson<ClubView>(`/clubs/${clubId}`, { window }),
    enabled: clubId != null,
  });
}

export function useSourceProfile(sourceId: number | null) {
  return useQuery({
    queryKey: ['source', sourceId],
    queryFn: () => fetchJson<SourceProfile>(`/sources/${sourceId}`),
    enabled: sourceId != null,
  });
}

export function useClubsList() {
  return useQuery({ queryKey: ['clubs-list'], queryFn: () => fetchJson<ClubListItem[]>('/clubs') });
}

export function useAlertes(pushToken: string | null) {
  return useQuery({
    queryKey: ['alertes', pushToken],
    queryFn: () => fetchJson<Alerte[]>('/alertes', { pushToken: pushToken! }),
    enabled: !!pushToken,
  });
}

export function useCreateAlerte(pushToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: AlerteType; joueurNom?: string; clubId?: number }) =>
      postJson<Alerte>('/alertes', { pushToken, ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertes', pushToken] }),
  });
}

export function useDeleteAlerte(pushToken: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRequest(`/alertes/${id}`, { pushToken: pushToken! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alertes', pushToken] }),
  });
}
