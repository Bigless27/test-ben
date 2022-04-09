import { CalendarType, DateDefinition } from './entities';

export const dateDefinitions: { [calendarType in CalendarType]: DateDefinition } = {
  conference: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Conference Calls',
  },
  dividends: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Dividends',
  },
  earnings: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Earnings',
  },
  economics: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Economics',
  },
  fda: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'FDA',
  },
  guidance: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Guidance',
  },
  ipos: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 14,
        dateStartDaysOffset: -14,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'IPOs',
  },
  ma: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 30,
        dateStartDaysOffset: -30,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Mergers & Acquisitions',
  },
  offerings: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Secondary Offerings',
  },
  optionsActivity: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Unusual Options Activity',
  },
  ratings: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Analyst Ratings',
  },
  retail: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: -30,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Retail Sales',
  },
  sec: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 0,
        dateStartDaysOffset: 0,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'SEC Filings',
  },
  splits: {
    defaultDates: {
      nothingSearched: {
        dateEndDaysOffset: 14,
        dateStartDaysOffset: -14,
      },
      somethingSearched: {
        dateEndDaysOffset: 90,
        dateStartDaysOffset: null,
      },
    },
    name: 'Splits',
  },
};
