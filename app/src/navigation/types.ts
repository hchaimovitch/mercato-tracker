import type { NavigatorScreenParams } from '@react-navigation/native';
import type { LeagueId } from '../api/types';

export type DetailStackParamList = {
  TransferDetail: { id: number; backLabel?: string };
  SourceProfile: { sourceId: number };
};

export type FluxStackParamList = { FluxHome: undefined } & DetailStackParamList;

export type LiguesStackParamList = {
  LiguesHome: undefined;
  LeagueClubs: { leagueId: LeagueId };
  ClubDetail: { clubId: number };
} & DetailStackParamList;

export type SuivisStackParamList = { SuivisHome: undefined } & DetailStackParamList;

export type AlertesStackParamList = { AlertesHome: undefined };

export type TabParamList = {
  Flux: NavigatorScreenParams<FluxStackParamList>;
  Ligues: NavigatorScreenParams<LiguesStackParamList>;
  Suivis: NavigatorScreenParams<SuivisStackParamList>;
  Alertes: NavigatorScreenParams<AlertesStackParamList>;
};
