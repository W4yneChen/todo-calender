import { getCalendarDays } from '../lib/date';
import {
  getCalendarMark,
  getCalendarMarkBadgeClassName,
  getCalendarMarkClassName,
} from '../lib/holidays';
import { getLeaveLabel, getLeaveSummary } from '../lib/leave';
import { ensureDay, getCompletedTodoCount, getOpenTodoCount, getVisibleTodos } from '../lib/todos';
import type { DateKey, TodoCalendarData } from '../types/todos';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];

interface CalendarGridProps {
  data: TodoCalendarData;
  year: number;
  monthIndex: number;
  selectedDate: DateKey;
  onSelectDate: (dateKey: DateKey) => void;
}

export function CalendarGrid({
  data,
  year,
  monthIndex,
  selectedDate,
  onSelectDate,
}: CalendarGridProps) {
  const days = getCalendarDays(year, monthIndex);

  return (
    <section className="rounded-[32px] border border-white/70 bg-white/70 p-3 shadow-ios backdrop-blur-2xl sm:p-4">
      <div className="grid grid-cols-7 gap-1 pb-2 text-center text-xs font-semibold text-slate-400">
        {weekdays.map((weekday) => (
          <div key={weekday} className="py-2">
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const dayRecord = ensureDay(data, day.key);
          const calendarMark = day.isBeforeMinimum ? undefined : getCalendarMark(day.key);
          const leave = day.isBeforeMinimum ? undefined : dayRecord.leave;
          const openCount = day.isBeforeMinimum ? 0 : getOpenTodoCount(data, day.key);
          const completedCount = day.isBeforeMinimum ? 0 : getCompletedTodoCount(data, day.key);
          const actualCount = day.isBeforeMinimum ? 0 : dayRecord.actualItems.length;
          const hasActual = actualCount > 0;
          const carriedCount = day.isBeforeMinimum
            ? 0
            : getVisibleTodos(data, day.key).filter((todo) => todo.isCarried).length;
          const isSelected = day.key === selectedDate;
          const metrics = [
            {
              label: '未',
              value: openCount,
              className: 'bg-orange-100 text-orange-700',
            },
            {
              label: '完',
              value: completedCount,
              className: 'bg-emerald-100 text-emerald-700',
            },
            {
              label: '继',
              value: carriedCount,
              className: 'bg-blue-100 text-blue-700',
            },
            {
              label: '记',
              value: actualCount,
              className: 'bg-slate-100 text-slate-600',
            },
          ].filter((metric) => metric.value > 0);

          return (
            <button
              type="button"
              key={day.key}
              disabled={day.isBeforeMinimum}
              onClick={() => onSelectDate(day.key)}
              className={[
                'calendar-cell group',
                calendarMark ? getCalendarMarkClassName(calendarMark.type) : '',
                leave ? getCalendarMarkClassName('workday') : '',
                day.isCurrentMonth ? 'text-slate-950' : 'text-slate-400',
                isSelected ? 'calendar-cell-selected' : '',
                day.isBeforeMinimum ? 'cursor-not-allowed opacity-30' : '',
              ].join(' ')}
            >
              <span className="flex items-center justify-between gap-2">
                <span
                  className={[
                    'grid size-8 place-items-center rounded-full text-sm font-semibold',
                    day.isToday ? 'bg-slate-950 text-white' : '',
                    isSelected ? 'bg-blue-500 text-white shadow-ios-soft' : '',
                  ].join(' ')}
                >
                  {day.day}
                </span>
                <span className="flex flex-wrap items-center justify-end gap-1">
                  {calendarMark ? (
                    <span
                      className={[
                        'rounded-full px-2 py-1 text-[10px] font-semibold',
                        getCalendarMarkBadgeClassName(calendarMark.type),
                      ].join(' ')}
                    >
                      {calendarMark.name}
                    </span>
                  ) : null}
                  {leave ? (
                    <span
                      title={getLeaveSummary(leave)}
                      className={[
                        'rounded-full px-2 py-1 text-[10px] font-semibold',
                        getCalendarMarkBadgeClassName('workday'),
                      ].join(' ')}
                    >
                      {getLeaveLabel(leave)}
                    </span>
                  ) : null}
                  {hasActual ? <span className="size-2 rounded-full bg-emerald-400" /> : null}
                </span>
              </span>

              <span className="mt-auto min-h-12 text-left">
                {metrics.length === 0 ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-400">
                    空
                  </span>
                ) : (
                  <span className="flex flex-col gap-1">
                    {metrics.map((metric) => (
                      <span
                        key={metric.label}
                        className={[
                          'truncate rounded-full px-2 py-1 text-[11px] font-semibold',
                          metric.className,
                        ].join(' ')}
                      >
                        {metric.label} {metric.value}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
