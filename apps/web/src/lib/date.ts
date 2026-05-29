import type { DateKey } from '../types/todos';

export const MIN_YEAR = 2026;
export const MIN_MONTH_INDEX = 4;
export const MIN_MONTH_VALUE = '2026-05';

export interface CalendarDay {
  key: DateKey;
  day: number;
  monthIndex: number;
  year: number;
  isCurrentMonth: boolean;
  isBeforeMinimum: boolean;
  isToday: boolean;
}

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function toDateKey(date: Date): DateKey {
  return keyFormatter.format(date) as DateKey;
}

export function createDate(year: number, monthIndex: number, day = 1) {
  return new Date(year, monthIndex, day);
}

export function dateKeyFromParts(year: number, monthIndex: number, day: number): DateKey {
  return toDateKey(createDate(year, monthIndex, day));
}

export function parseDateKey(key: DateKey) {
  const [year, month, day] = key.split('-').map(Number);
  return {
    year,
    monthIndex: month - 1,
    day,
    date: createDate(year, month - 1, day),
  };
}

export function monthValue(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
}

export function parseMonthValue(value: string) {
  const [year, month] = value.split('-').map(Number);
  return { year, monthIndex: month - 1 };
}

export function isBeforeMinimumMonth(year: number, monthIndex: number) {
  return year < MIN_YEAR || (year === MIN_YEAR && monthIndex < MIN_MONTH_INDEX);
}

export function isBeforeMinimumDate(key: DateKey) {
  const { year, monthIndex } = parseDateKey(key);
  return isBeforeMinimumMonth(year, monthIndex);
}

export function addMonths(year: number, monthIndex: number, amount: number) {
  const next = createDate(year, monthIndex + amount, 1);
  return { year: next.getFullYear(), monthIndex: next.getMonth() };
}

export function addDays(dateKey: DateKey, amount: number): DateKey {
  const { year, monthIndex, day } = parseDateKey(dateKey);
  return toDateKey(createDate(year, monthIndex, day + amount));
}

export function getMonthLabel(year: number, monthIndex: number) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'long',
  }).format(createDate(year, monthIndex, 1));
}

export function getWeekdayLabel(dateKey: DateKey) {
  return new Intl.DateTimeFormat('zh-CN', {
    weekday: 'long',
  }).format(parseDateKey(dateKey).date);
}

export function getCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstDay = createDate(year, monthIndex, 1);
  const firstWeekday = firstDay.getDay();
  const todayKey = toDateKey(new Date());
  const cells: CalendarDay[] = [];

  for (let cellIndex = 0; cellIndex < 42; cellIndex += 1) {
    const date = createDate(year, monthIndex, cellIndex - firstWeekday + 1);
    const key = toDateKey(date);

    cells.push({
      key,
      day: date.getDate(),
      monthIndex: date.getMonth(),
      year: date.getFullYear(),
      isCurrentMonth: date.getMonth() === monthIndex,
      isBeforeMinimum: isBeforeMinimumDate(key),
      isToday: key === todayKey,
    });
  }

  return cells;
}

export function compareDateKeys(a: DateKey, b: DateKey) {
  return a.localeCompare(b);
}
