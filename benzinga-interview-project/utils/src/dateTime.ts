/* eslint-disable sort-keys */
type TimeKey = 'seconds' & 'minutes' & 'hours' & 'days';
type Duration = {
  [key in TimeKey]: number;
};

const DEFAULT_TIME = '00:00:00';
const msMultiplier: Record<TimeKey, number> = {
  second: 1000,
  seconds: 1000,
  minute: 60000,
  minutes: 60000,
  hour: 3600000,
  hours: 3600000,
  day: 86400000,
  days: 86400000,
};

/**
 * This class provides methods for date and time management:
 * formatting, comparing and adding dates
 *
 * @remarks
 * Class extends Date object
 */
export class DateTime extends Date {
  private dateTime: Date | undefined;

  constructor(dateTime: Date | undefined) {
    super();
    this.dateTime = dateTime;
  }

  /**
   * @returns current date
   */
  static dateNow = (): DateTime => new DateTime(new Date());

  /**
   * Creates DateTime object from Date
   *
   * @remarks
   * it actually extends Date object with DateTime methods
   */
  static fromDate = (dateTime: Date): DateTime => new DateTime(dateTime);

  /**
   * @param dateString - it accepts ISO string formats e.g. YYYY-MM-DD or YYYYMMDD
   * @param time - it accepts time formats e.g. HH:mm:ss or HH:mm
   * @param timezone - it accepts time zone e.g. -HH:mm
   */
  static fromISO = (dateString: string | undefined | null, time: string = DEFAULT_TIME, timezone = ''): DateTime => {
    const dateTime = dateString ? new Date(`${dateString}T${time}${timezone}`) : undefined;
    return new DateTime(dateTime);
  };

  /**
   *
   * @param duration - should be an object with 'seconds' and/or 'minutes' and/or 'hours' and/or 'days'.
   *  To obtain "minus" functionality should use negative values
   *
   * @remarks
   * method doesn't mutate DateTime object
   *
   * @returns new DateTime object
   */
  public plus = (duration: Duration): DateTime => {
    const date = this.valueOf();
    if (!date) {
      return new DateTime(this.dateTime);
    }
    const msToAdd = (Object.keys(duration) as TimeKey[]).reduce((ms, key) => {
      return ms + msMultiplier[key] * duration[key];
    }, 0);
    const newDate = new Date(date + msToAdd);
    return new DateTime(newDate);
  };

  /**
   * @returns date string in YYYY-MM-DD format
   */
  public toISODateString = (): string => (this.valueOf() ? (this.dateTime as Date).toISOString().slice(0, 10) : '');

  /**
   * @remarks
   * method is needed since DateTime objects cannot be compare with ===
   */
  public equals = (comparedDateTime: DateTime): boolean => this.valueOf() === comparedDateTime.valueOf();

  /**
   * @remarks
   * method is needed since DateTime objects cannot be compare with \<=
   */
  public equalsOrBefore = (comparedDateTime: DateTime): boolean => this.valueOf() <= comparedDateTime.valueOf();

  /**
   * @remarks
   * method is needed since DateTime objects cannot be compare with \>=
   */
  public equalsOrAfter = (comparedDateTime: DateTime): boolean => this.valueOf() >= comparedDateTime.valueOf();

  /**
   * @remarks
   * isBefore and isAfter are not actually needed, DateTime objects can compare with \<
   */
  public isBefore = (comparedDateTime: DateTime): boolean => this.valueOf() < comparedDateTime.valueOf();

  /**
   * @remarks
   * isAfter are not actually needed, DateTime objects can be compared with \>
  public isAfter = (comparedDateTime: DateTime): boolean =\> this.valueOf() \> comparedDateTime.valueOf();

  /**
   * @returns
   * NaN when undefined since it will always return false when comparing to other DateTime objects
   */
  public valueOf = (): number => this.dateTime?.valueOf() ?? NaN;
}
