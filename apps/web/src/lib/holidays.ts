import type { DateKey } from '../types/todos';

interface CalendarMark {
  name: string;
  type: 'holiday' | 'workday';
}

const calendarMarks: Partial<Record<DateKey, CalendarMark>> = {
  '2026-01-01': { name: '元旦', type: 'holiday' },
  '2026-01-02': { name: '元旦', type: 'holiday' },
  '2026-01-03': { name: '元旦', type: 'holiday' },
  '2026-01-04': { name: '调休', type: 'workday' },
  '2026-02-14': { name: '调休', type: 'workday' },
  '2026-02-15': { name: '春节', type: 'holiday' },
  '2026-02-16': { name: '春节', type: 'holiday' },
  '2026-02-17': { name: '春节', type: 'holiday' },
  '2026-02-18': { name: '春节', type: 'holiday' },
  '2026-02-19': { name: '春节', type: 'holiday' },
  '2026-02-20': { name: '春节', type: 'holiday' },
  '2026-02-21': { name: '春节', type: 'holiday' },
  '2026-02-22': { name: '春节', type: 'holiday' },
  '2026-02-23': { name: '春节', type: 'holiday' },
  '2026-02-28': { name: '调休', type: 'workday' },
  '2026-04-04': { name: '清明', type: 'holiday' },
  '2026-04-05': { name: '清明', type: 'holiday' },
  '2026-04-06': { name: '清明', type: 'holiday' },
  '2026-05-01': { name: '劳动节', type: 'holiday' },
  '2026-05-02': { name: '劳动节', type: 'holiday' },
  '2026-05-03': { name: '劳动节', type: 'holiday' },
  '2026-05-04': { name: '劳动节', type: 'holiday' },
  '2026-05-05': { name: '劳动节', type: 'holiday' },
  '2026-05-09': { name: '调休', type: 'workday' },
  '2026-06-19': { name: '端午', type: 'holiday' },
  '2026-06-20': { name: '端午', type: 'holiday' },
  '2026-06-21': { name: '端午', type: 'holiday' },
  '2026-09-20': { name: '调休', type: 'workday' },
  '2026-09-25': { name: '中秋', type: 'holiday' },
  '2026-09-26': { name: '中秋', type: 'holiday' },
  '2026-09-27': { name: '中秋', type: 'holiday' },
  '2026-10-01': { name: '国庆', type: 'holiday' },
  '2026-10-02': { name: '国庆', type: 'holiday' },
  '2026-10-03': { name: '国庆', type: 'holiday' },
  '2026-10-04': { name: '国庆', type: 'holiday' },
  '2026-10-05': { name: '国庆', type: 'holiday' },
  '2026-10-06': { name: '国庆', type: 'holiday' },
  '2026-10-07': { name: '国庆', type: 'holiday' },
  '2026-10-10': { name: '调休', type: 'workday' },
};

export function getCalendarMark(dateKey: DateKey) {
  return calendarMarks[dateKey];
}

export function getCalendarMarkClassName(type: CalendarMark['type']) {
  return type === 'holiday'
    ? 'border-emerald-200 bg-emerald-50/90 hover:bg-emerald-50'
    : 'border-red-200 bg-red-50/90 hover:bg-red-50';
}

export function getCalendarMarkBadgeClassName(type: CalendarMark['type']) {
  return type === 'holiday' ? 'bg-emerald-500 text-white' : 'bg-red-400 text-white';
}
