import { useEffect } from 'react';
import { CalendarGrid } from './components/CalendarGrid';
import { CalendarHeader } from './components/CalendarHeader';
import { DayDetail } from './components/DayDetail';
import { dateKeyFromParts, isBeforeMinimumMonth } from './lib/date';
import { useTodoStore } from './store/todoStore';

export function App() {
  const {
    data,
    selectedDate,
    visibleYear,
    visibleMonthIndex,
    saveStatus,
    errorMessage,
    load,
    setVisibleMonth,
    setSelectedDate,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    inheritTodosToNextDay,
    addActualItem,
    updateActualItem,
    deleteActualItem,
  } = useTodoStore();

  useEffect(() => {
    void load();
  }, [load]);

  const handleChangeMonth = (year: number, monthIndex: number) => {
    if (isBeforeMinimumMonth(year, monthIndex)) return;
    setVisibleMonth(year, monthIndex);
    setSelectedDate(dateKeyFromParts(year, monthIndex, 1));
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7fb] text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(255,255,255,0.95),transparent_26%),radial-gradient(circle_at_85%_0%,rgba(120,178,255,0.22),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.9),rgba(226,232,240,0.78))]" />
      <div className="pointer-events-none fixed inset-0 ios-grid-bg opacity-70" />

      <div className="relative mx-auto flex w-full max-w-[1500px] flex-col gap-5 px-4 py-4 sm:px-6 sm:py-6">
        <CalendarHeader
          year={visibleYear}
          monthIndex={visibleMonthIndex}
          onChangeMonth={handleChangeMonth}
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
          <CalendarGrid
            data={data}
            year={visibleYear}
            monthIndex={visibleMonthIndex}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <DayDetail
            data={data}
            selectedDate={selectedDate}
            saveStatus={saveStatus}
            errorMessage={errorMessage}
            onAddTodo={addTodo}
            onUpdateTodo={updateTodo}
            onDeleteTodo={deleteTodo}
            onToggleTodo={toggleTodo}
            onInheritTodosToNextDay={inheritTodosToNextDay}
            onAddActualItem={addActualItem}
            onUpdateActualItem={updateActualItem}
            onDeleteActualItem={deleteActualItem}
          />
        </div>
      </div>
    </main>
  );
}
