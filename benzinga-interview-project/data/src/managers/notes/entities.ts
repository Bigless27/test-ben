export type UUID = string | '';

export interface IngressNote {
  benzinga_watchlist_id: null | string | number;
  date_created: string;
  date_updated: string | null;
  deleted: boolean;
  settings: Record<string, unknown>;
  symbol: string;
  text: string;
  uuid: UUID;
  watchlist: string | null;
}
