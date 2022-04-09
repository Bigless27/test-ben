import { DateTime } from '../../utils';
import {
  CalendarType,
  DateDaysOffset,
  DateRange,
  DayOffset,
  DefaultCalendarDate,
  CalendarParameters,
  CalendarEvents,
} from './entities';

import { dateDefinitions } from './definitions';

//capitalize the first character of the string
export const capitalize = (name: string): string => name.charAt(0).toUpperCase() + name.slice(1);

export const titleCase = (title: string): string =>
  title
    .split(' ')
    .map(name => capitalize(name))
    .join(' ');

const calendarGetDefaultDates = (calendarType: CalendarType, hasSomethingSearched: boolean): DateRange => {
  const definition = dateDefinitions[calendarType];
  if (definition && definition.defaultDates) {
    if (hasSomethingSearched) {
      return transformOffsetsToDates(definition.defaultDates.somethingSearched);
    }
    return transformOffsetsToDates(definition.defaultDates.nothingSearched);
  }
  return {
    dateEnd: null,
    dateStart: null,
  };
};

const convertToDate = (daysOffset: DayOffset): DefaultCalendarDate => {
  if (daysOffset === undefined || daysOffset === null) {
    return null;
  }
  return DateTime.dateNow().plus({ days: daysOffset }).toISODateString();
};

const transformOffsetsToDates = ({ dateEndDaysOffset, dateStartDaysOffset }: DateDaysOffset): DateRange => ({
  dateEnd: convertToDate(dateEndDaysOffset),
  dateStart: convertToDate(dateStartDaysOffset),
});

const defaultDates = (parameters: CalendarParameters) => {
  const hasSomethingSearched = !!(parameters.watchlistIds?.length || parameters.symbols?.length);
  const calendarDefaultDates = calendarGetDefaultDates(parameters.calendarType, hasSomethingSearched);

  parameters.dateStart = calendarDefaultDates.dateStart;
  parameters.dateEnd = calendarDefaultDates.dateEnd;

  return parameters;
};

export const standardDates = (inputParameters: CalendarParameters): CalendarParameters => {
  const parameters = { ...inputParameters };
  const defaultDatesForParameters = defaultDates(parameters);
  const customDatesAreSelected =
    defaultDatesForParameters.dateStart !== parameters.dateStart ||
    defaultDatesForParameters.dateEnd !== parameters.dateEnd;

  if (customDatesAreSelected) {
    const { dateEnd, dateStart } = defaultDatesForParameters;
    return { ...parameters, dateEnd, dateStart };
  }
  return parameters;
};

export const recalculateParameters = (events: CalendarEvents[], parameters: CalendarParameters): CalendarParameters => {
  const updated = Math.max(0, ...events.map(item => item.updated));
  return {
    ...parameters,
    updated,
  };
};

export const isEqualArrShallow = (arr1: unknown[], arr2: unknown[]): boolean =>
  Array.isArray(arr1) &&
  Array.isArray(arr2) &&
  arr1.length === arr2.length &&
  arr1.every((el, index) => el === arr2[index]);

// eslint-disable-next-line @typescript-eslint/ban-types
export const omit = <T extends object>(obj: T, ...args: (keyof T)[]): T =>
  (Object.keys(obj) as (keyof T)[]).reduce((omitted, key) => {
    if (!args.includes(key)) {
      omitted[key] = obj[key];
    }
    return omitted;
  }, {} as T);

export const uniqBy = <T extends unknown>(arr: T[], predicate: (elem: T) => boolean | string): T[] => {
  const extract = typeof predicate === 'function' ? predicate : (elem: T) => elem[predicate];
  return [
    ...arr
      .reduce((map, elem) => {
        const key = elem === null || elem === undefined ? elem : extract(elem);
        if (!map.has(key)) {
          map.set(key, elem);
        }
        return map;
      }, new Map())
      .values(),
  ];
};
