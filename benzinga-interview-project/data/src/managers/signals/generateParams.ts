import {
  FieldId,
  ScreenerFieldType,
  ScreenerFilterOperator,
  ScreenerStringOperator,
  SignalsEndpointParams,
  SignalsScreenerFilter,
  SignalType,
} from './entities';

const isBlank = (value: string | null) => (value ?? '') === '';

const makeFilterString = (fieldId: FieldId) => (
  operator: ScreenerFilterOperator,
  parameter: string | number | null,
): string => {
  return `${fieldId}_${operator}_${parameter}`;
};

export const screenerFiltersToScreenerQuery = (screenerFilters: SignalsScreenerFilter[]): string => {
  let symbols: string[] = [];

  return screenerFilters
    .reduce<string[]>((accumulator, filter) => {
      const filterString = makeFilterString(filter.fieldId);

      switch (filter.type) {
        case ScreenerFieldType.range: {
          const left = filter.parameter[0];
          const right = filter.parameter[1];
          if (left === null && right === null) {
            return accumulator;
          }

          if (!isBlank(left) && isBlank(right)) {
            return [...accumulator, filterString(ScreenerFilterOperator.greaterThan, left)];
          } else if (isBlank(left) && !isBlank(right)) {
            return [...accumulator, filterString(ScreenerFilterOperator.lessThan, right)];
          } else if (!isBlank(left) && !isBlank(right)) {
            return [
              ...accumulator,
              filterString(ScreenerFilterOperator.greaterThan, left),
              filterString(ScreenerFilterOperator.lessThan, right),
            ];
          } else {
            return accumulator;
          }
        }

        case ScreenerFieldType.string: {
          if (filter.parameter === null) {
            return accumulator;
          }

          switch (filter.operator) {
            case ScreenerStringOperator.startsWith:
              return [...accumulator, filterString(ScreenerFilterOperator.regex, `${filter.parameter}.*`)];

            case ScreenerStringOperator.endsWith:
              return [...accumulator, filterString(ScreenerFilterOperator.regex, `.*${filter.parameter}`)];

            case ScreenerStringOperator.equals:
              return [...accumulator, filterString(ScreenerFilterOperator.equals, filter.parameter)];

            case ScreenerStringOperator.contains:
              return [...accumulator, filterString(ScreenerFilterOperator.regex, `.*${filter.parameter}.*`)];

            default:
              return accumulator;
          }
        }

        case ScreenerFieldType.multiselect: {
          if (filter.parameter === null) {
            return accumulator;
          }

          const parameterString = filter.parameter ? filter.parameter.map(item => item.optionId).join(',') : null;
          return [...accumulator, filterString(ScreenerFilterOperator.includes, parameterString)];
        }

        // since the query parameter for both these is `symbol_in_${tickers}`, their combined symbols need to be returned as 1 string
        case ScreenerFieldType.symbol:
        case ScreenerFieldType.watchlist: {
          if ((filter.parameter?.length ?? 0) === 0 || !filter.parameter) {
            return accumulator;
          }

          if (filter.type === ScreenerFieldType.watchlist) {
            const flattenedSymbols = [...new Set(filter.parameter.map(item => item.symbols).flat())];
            symbols = [...new Set(flattenedSymbols.concat(symbols))];
          }

          if (filter.type === ScreenerFieldType.symbol) {
            const flattenedSymbols = filter.parameter.map(item => item.name);
            symbols = [...new Set(flattenedSymbols.concat(symbols))];
          }

          const parameterString = symbols.join(',');

          return [
            ...accumulator.filter(item => !item.startsWith('symbol')),
            makeFilterString('symbol')(ScreenerFilterOperator.includes, parameterString),
          ];
        }

        default:
          return accumulator;
      }
    }, [])
    .join(';');
};

export const generateSignalsParams = (
  selectedSignalTypes: SignalType[],
  screenerFilters: SignalsScreenerFilter[],
): SignalsEndpointParams => {
  const screenerQuery = screenerFiltersToScreenerQuery(screenerFilters);

  const filter = JSON.stringify([
    {
      operator: 'in',
      property: 'type',
      value: selectedSignalTypes,
    },
  ]);

  return {
    filter,
    limit: 100,
    start: 0,
    ...(screenerQuery ? { screenerQuery } : {}),
  };
};
