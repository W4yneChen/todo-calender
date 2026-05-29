import { create } from 'zustand';
import { addDays, compareDateKeys, dateKeyFromParts, MIN_MONTH_INDEX, MIN_YEAR } from '../lib/date';
import { ensureDay, isTodoCompletedAtDate, makeActualItem, makeTodo } from '../lib/todos';
import type { DateKey, SaveStatus, TodoCalendarData } from '../types/todos';

interface TodoStore {
  data: TodoCalendarData;
  selectedDate: DateKey;
  visibleYear: number;
  visibleMonthIndex: number;
  saveStatus: SaveStatus;
  errorMessage: string;
  load: () => Promise<void>;
  setVisibleMonth: (year: number, monthIndex: number) => void;
  setSelectedDate: (dateKey: DateKey) => void;
  addTodo: (dateKey: DateKey, text: string) => void;
  updateTodo: (todoId: string, text: string) => void;
  deleteTodo: (todoId: string) => void;
  toggleTodo: (dateKey: DateKey, todoId: string) => void;
  inheritTodosToNextDay: (dateKey: DateKey, todoIds: string[]) => void;
  addActualItem: (dateKey: DateKey, text: string) => void;
  updateActualItem: (itemId: string, text: string) => void;
  deleteActualItem: (itemId: string) => void;
}

const initialSelectedDate = dateKeyFromParts(MIN_YEAR, MIN_MONTH_INDEX, 1);
const initialData: TodoCalendarData = {
  version: 2,
  days: {},
};

interface LegacyDayRecord {
  todos?: TodoCalendarData['days'][DateKey]['todos'];
  inheritedTodoIds?: string[];
  completedTodoIds?: string[];
  actual?: string;
  actualItems?: TodoCalendarData['days'][DateKey]['actualItems'];
}

interface LegacyCalendarData {
  version?: number;
  days?: Record<string, LegacyDayRecord>;
}

function migrateData(rawData: unknown): { data: TodoCalendarData; didMigrate: boolean } {
  if (!rawData || typeof rawData !== 'object') {
    return { data: initialData, didMigrate: true };
  }

  const legacyData = rawData as LegacyCalendarData;
  const migratedDays = Object.fromEntries(
    Object.entries(legacyData.days ?? {}).map(([dateKey, day]) => {
      const actualItems =
        day.actualItems ??
        (day.actual ?? '')
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .map((text, index) => ({
            id: crypto.randomUUID(),
            text,
            createdAt: new Date(`${dateKey}T12:${String(index).padStart(2, '0')}:00`).toISOString(),
          }));

      return [
        dateKey,
        {
          todos: day.todos ?? [],
          inheritedTodoIds: day.inheritedTodoIds ?? [],
          completedTodoIds: day.completedTodoIds ?? [],
          actualItems,
        },
      ];
    }),
  ) as TodoCalendarData['days'];

  return {
    data: {
      version: 2,
      days: migratedDays,
    },
    didMigrate: legacyData.version !== 2,
  };
}

async function fetchData(): Promise<TodoCalendarData> {
  const response = await fetch('/api/todos');
  if (!response.ok) {
    throw new Error('读取 JSON 数据失败');
  }
  const { data, didMigrate } = migrateData(await response.json());
  if (didMigrate) {
    await writeData(data);
  }
  return data;
}

async function writeData(data: TodoCalendarData) {
  const response = await fetch('/api/todos', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('保存 JSON 数据失败');
  }
}

export const useTodoStore = create<TodoStore>((set, get) => {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;

  const scheduleSave = () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
    }

    saveTimer = setTimeout(() => {
      saveTimer = undefined;
      const dataToSave = get().data;

      void writeData(dataToSave).then(
        () => {
          if (get().data === dataToSave) {
            set({ saveStatus: 'saved' });
          }
        },
        (error: unknown) => {
          const message = error instanceof Error ? error.message : '保存失败';
          set({ saveStatus: 'error', errorMessage: message });
        },
      );
    }, 400);
  };

  const commit = (producer: (data: TodoCalendarData) => TodoCalendarData) => {
    const nextData = producer(get().data);
    set({ data: nextData, saveStatus: 'saving', errorMessage: '' });
    scheduleSave();
  };

  return {
    data: initialData,
    selectedDate: initialSelectedDate,
    visibleYear: MIN_YEAR,
    visibleMonthIndex: MIN_MONTH_INDEX,
    saveStatus: 'idle',
    errorMessage: '',
    load: async () => {
      set({ saveStatus: 'loading', errorMessage: '' });
      try {
        const data = await fetchData();
        set({ data, saveStatus: 'saved' });
      } catch (error) {
        const message = error instanceof Error ? error.message : '读取失败';
        set({ saveStatus: 'error', errorMessage: message });
      }
    },
    setVisibleMonth: (year, monthIndex) => {
      set({ visibleYear: year, visibleMonthIndex: monthIndex });
    },
    setSelectedDate: (dateKey) => {
      set({ selectedDate: dateKey });
    },
    addTodo: (dateKey, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      commit((data) => {
        const day = ensureDay(data, dateKey);
        return {
          ...data,
          days: {
            ...data.days,
            [dateKey]: {
              ...day,
              todos: [...day.todos, makeTodo(trimmed, dateKey)],
            },
          },
        };
      });
    },
    updateTodo: (todoId, text) => {
      commit((data) => ({
        ...data,
        days: Object.fromEntries(
          Object.entries(data.days).map(([dateKey, day]) => [
            dateKey,
            {
              ...day,
              todos: day.todos.map((todo) =>
                todo.id === todoId ? { ...todo, text } : todo,
              ),
            },
          ]),
        ) as TodoCalendarData['days'],
      }));
    },
    deleteTodo: (todoId) => {
      commit((data) => ({
        ...data,
        days: Object.fromEntries(
          Object.entries(data.days).map(([dateKey, day]) => [
            dateKey,
            {
              ...day,
              todos: day.todos.filter((todo) => todo.id !== todoId),
              inheritedTodoIds: day.inheritedTodoIds.filter((id) => id !== todoId),
              completedTodoIds: day.completedTodoIds.filter((id) => id !== todoId),
            },
          ]),
        ) as TodoCalendarData['days'],
      }));
    },
    toggleTodo: (dateKey, todoId) => {
      commit((data) => {
        const day = ensureDay(data, dateKey);
        const isCompleted = isTodoCompletedAtDate(data, todoId, dateKey);
        const days = isCompleted
          ? (Object.fromEntries(
              Object.entries(data.days).map(([recordDate, record]) => [
                recordDate,
                compareDateKeys(recordDate as DateKey, dateKey) <= 0
                  ? {
                      ...record,
                      completedTodoIds: record.completedTodoIds.filter((id) => id !== todoId),
                    }
                  : record,
              ]),
            ) as TodoCalendarData['days'])
          : {
              ...data.days,
              [dateKey]: {
                ...day,
                completedTodoIds: day.completedTodoIds.includes(todoId)
                  ? day.completedTodoIds
                  : [...day.completedTodoIds, todoId],
              },
            };

        return {
          ...data,
          days,
        };
      });
    },
    inheritTodosToNextDay: (dateKey, todoIds) => {
      const uniqueTodoIds = Array.from(new Set(todoIds));
      if (uniqueTodoIds.length === 0) return;

      commit((data) => {
        const nextDate = addDays(dateKey, 1);
        const nextDay = ensureDay(data, nextDate);
        const inheritedTodoIds = Array.from(
          new Set([...nextDay.inheritedTodoIds, ...uniqueTodoIds]),
        );

        return {
          ...data,
          days: {
            ...data.days,
            [nextDate]: {
              ...nextDay,
              inheritedTodoIds,
            },
          },
        };
      });
    },
    addActualItem: (dateKey, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      commit((data) => {
        const day = ensureDay(data, dateKey);
        return {
          ...data,
          days: {
            ...data.days,
            [dateKey]: {
              ...day,
              actualItems: [...day.actualItems, makeActualItem(trimmed, dateKey)],
            },
          },
        };
      });
    },
    updateActualItem: (itemId, text) => {
      commit((data) => ({
        ...data,
        days: Object.fromEntries(
          Object.entries(data.days).map(([dateKey, day]) => [
            dateKey,
            {
              ...day,
              actualItems: day.actualItems.map((item) =>
                item.id === itemId ? { ...item, text } : item,
              ),
            },
          ]),
        ) as TodoCalendarData['days'],
      }));
    },
    deleteActualItem: (itemId) => {
      commit((data) => ({
        ...data,
        days: Object.fromEntries(
          Object.entries(data.days).map(([dateKey, day]) => [
            dateKey,
            {
              ...day,
              actualItems: day.actualItems.filter((item) => item.id !== itemId),
            },
          ]),
        ) as TodoCalendarData['days'],
      }));
    },
  };
});
