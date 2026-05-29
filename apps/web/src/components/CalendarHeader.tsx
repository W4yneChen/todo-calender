import { useRef } from 'react';
import { addMonths, getMonthLabel, isBeforeMinimumMonth, MIN_MONTH_VALUE, monthValue } from '../lib/date';

interface CalendarHeaderProps {
  year: number;
  monthIndex: number;
  onChangeMonth: (year: number, monthIndex: number) => void;
}

export function CalendarHeader({ year, monthIndex, onChangeMonth }: CalendarHeaderProps) {
  const monthInputRef = useRef<HTMLInputElement>(null);
  const previousMonth = addMonths(year, monthIndex, -1);
  const nextMonth = addMonths(year, monthIndex, 1);
  const isPreviousDisabled = isBeforeMinimumMonth(previousMonth.year, previousMonth.monthIndex);
  const openMonthPicker = () => {
    const monthInput = monthInputRef.current;
    if (!monthInput) return;

    monthInput.focus();

    try {
      monthInput.showPicker();
    } catch {
      monthInput.click();
    }
  };

  return (
    <header className="flex flex-col gap-4 rounded-[28px] border border-white/70 bg-white/75 p-4 shadow-ios backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <p className="text-sm font-medium text-slate-500">TODO Calendar</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
          {getMonthLabel(year, monthIndex)}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="上个月"
          disabled={isPreviousDisabled}
          onClick={() => onChangeMonth(previousMonth.year, previousMonth.monthIndex)}
          className="ios-icon-button disabled:cursor-not-allowed disabled:opacity-35"
        >
          <span className="chevron-left" aria-hidden="true" />
        </button>
        <div
          role="button"
          tabIndex={0}
          aria-label="选择月份"
          onClick={openMonthPicker}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              openMonthPicker();
            }
          }}
          className="cursor-pointer rounded-full shadow-ios-soft outline-none transition focus:ring-4 focus:ring-blue-100"
        >
          <input
            ref={monthInputRef}
            aria-label="选择月份"
            type="month"
            min={MIN_MONTH_VALUE}
            value={monthValue(year, monthIndex)}
            onChange={(event) => {
              const [nextYear, nextMonth] = event.target.value.split('-').map(Number);
              onChangeMonth(nextYear, nextMonth - 1);
            }}
            className="month-picker h-11 cursor-pointer rounded-full border border-slate-200 bg-white/80 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400"
          />
        </div>
        <button
          type="button"
          aria-label="下个月"
          onClick={() => onChangeMonth(nextMonth.year, nextMonth.monthIndex)}
          className="ios-icon-button"
        >
          <span className="chevron-right" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
