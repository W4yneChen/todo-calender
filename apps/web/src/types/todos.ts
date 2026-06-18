export type DateKey = `${number}-${number}-${number}`;

export interface TodoItem {
  id: string;
  text: string;
  createdAt: string;
}

export interface ActualItem {
  id: string;
  text: string;
  createdAt: string;
}

export type LeavePeriod = 'full' | 'morning' | 'afternoon';

export interface LeaveConfig {
  period: LeavePeriod;
  note?: string;
}

export interface DayRecord {
  todos: TodoItem[];
  inheritedTodoIds: string[];
  completedTodoIds: string[];
  actualItems: ActualItem[];
  leave?: LeaveConfig;
}

export interface TodoCalendarData {
  version: 2;
  days: Record<DateKey, DayRecord>;
}

export interface VisibleTodo extends TodoItem {
  originDate: DateKey;
  isCarried: boolean;
  isCompletedAtDate: boolean;
  isInheritedToNextDay: boolean;
}

export type SaveStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error';
