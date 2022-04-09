export enum DelayOfTableLifecycle {
  set = 500,
  update = 1800,
}

export interface SortState {
  [index: number]: {
    colId: string;
    sort: 'desc' | 'asc';
  };
}

export interface ColumnState {
  aggFunc: string;
  colId: string;
  hide: boolean;
  pinned: string;
  rowGroupIndex: number;
  width: number;
}

export interface FilterState {
  [filterName: string]: {
    filter?: number;
    filterTo?: number;
    filterType: string;
    type: string;
    values?: (string | number)[];
  };
}

export interface TableParameters {
  columns: ColumnState[];
  filter: FilterState;
  sort: SortState[];
}

export const DefaultTableParameters = {
  columns: [],
  filter: {},
  sort: [],
};
