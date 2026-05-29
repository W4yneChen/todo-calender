import { addDays, compareDateKeys } from './date';
import type {
  ActualItem,
  DateKey,
  DayRecord,
  TodoCalendarData,
  TodoItem,
  VisibleTodo,
} from '../types/todos';

export function createEmptyDay(): DayRecord {
  return {
    todos: [],
    inheritedTodoIds: [],
    completedTodoIds: [],
    actualItems: [],
  };
}

export function ensureDay(data: TodoCalendarData, dateKey: DateKey): DayRecord {
  return data.days[dateKey] ?? createEmptyDay();
}

export function getAllTodos(data: TodoCalendarData) {
  return Object.entries(data.days)
    .flatMap(([dateKey, day]) =>
      day.todos.map((todo) => ({
        ...todo,
        originDate: dateKey as DateKey,
      })),
    )
    .sort((a, b) => {
      const dateSort = compareDateKeys(a.originDate, b.originDate);
      return dateSort === 0 ? a.createdAt.localeCompare(b.createdAt) : dateSort;
    });
}

export function getTodoById(data: TodoCalendarData, todoId: string) {
  return getAllTodos(data).find((todo) => todo.id === todoId);
}

export function getCompletionDate(data: TodoCalendarData, todoId: string) {
  return Object.entries(data.days)
    .filter(([, day]) => day.completedTodoIds.includes(todoId))
    .map(([dateKey]) => dateKey as DateKey)
    .sort(compareDateKeys)[0];
}

export function isTodoCompletedAtDate(data: TodoCalendarData, todoId: string, dateKey: DateKey) {
  const completionDate = getCompletionDate(data, todoId);
  return !!completionDate && compareDateKeys(completionDate, dateKey) <= 0;
}

export function getVisibleTodos(data: TodoCalendarData, selectedDate: DateKey): VisibleTodo[] {
  const selectedDay = ensureDay(data, selectedDate);
  const nextDay = ensureDay(data, addDays(selectedDate, 1));
  const allTodos = getAllTodos(data);
  const ownTodos = allTodos.filter((todo) => todo.originDate === selectedDate);
  const inheritedTodos = selectedDay.inheritedTodoIds
    .map((todoId) => allTodos.find((todo) => todo.id === todoId))
    .filter((todo): todo is TodoItem & { originDate: DateKey } => Boolean(todo));
  const visibleTodos = [...ownTodos, ...inheritedTodos].filter(
    (todo, index, todos) => todos.findIndex((item) => item.id === todo.id) === index,
  );

  return visibleTodos
    .sort((a, b) => {
      const dateSort = compareDateKeys(a.originDate, b.originDate);
      return dateSort === 0 ? a.createdAt.localeCompare(b.createdAt) : dateSort;
    })
    .map((todo) => ({
      ...todo,
      isCarried: todo.originDate !== selectedDate,
      isCompletedAtDate: isTodoCompletedAtDate(data, todo.id, selectedDate),
      isInheritedToNextDay: nextDay.inheritedTodoIds.includes(todo.id),
    }));
}

export function getOpenTodoCount(data: TodoCalendarData, dateKey: DateKey) {
  return getVisibleTodos(data, dateKey).filter((todo) => !todo.isCompletedAtDate).length;
}

export function getCompletedTodoCount(data: TodoCalendarData, dateKey: DateKey) {
  return getVisibleTodos(data, dateKey).filter((todo) => todo.isCompletedAtDate).length;
}

export function makeTodo(text: string, dateKey: DateKey): TodoItem {
  return {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date(`${dateKey}T12:00:00`).toISOString(),
  };
}

export function makeActualItem(text: string, dateKey: DateKey): ActualItem {
  return {
    id: crypto.randomUUID(),
    text,
    createdAt: new Date(`${dateKey}T12:00:00`).toISOString(),
  };
}
