import { FormEvent, KeyboardEvent, useEffect, useState } from 'react';
import { addDays, getMonthLabel, getWeekdayLabel, parseDateKey } from '../lib/date';
import { ensureDay, getVisibleTodos } from '../lib/todos';
import type { ActualItem, DateKey, SaveStatus, TodoCalendarData, VisibleTodo } from '../types/todos';

interface DayDetailProps {
  data: TodoCalendarData;
  selectedDate: DateKey;
  saveStatus: SaveStatus;
  errorMessage: string;
  onAddTodo: (dateKey: DateKey, text: string) => void;
  onUpdateTodo: (todoId: string, text: string) => void;
  onDeleteTodo: (todoId: string) => void;
  onToggleTodo: (dateKey: DateKey, todoId: string) => void;
  onInheritTodosToNextDay: (dateKey: DateKey, todoIds: string[]) => void;
  onAddActualItem: (dateKey: DateKey, text: string) => void;
  onUpdateActualItem: (itemId: string, text: string) => void;
  onDeleteActualItem: (itemId: string) => void;
}

const saveStatusText: Record<SaveStatus, string> = {
  idle: '未加载',
  loading: '读取中',
  saving: '保存中',
  saved: '已保存',
  error: '保存失败',
};

interface TextEditorProps {
  text: string;
  onCommit: (text: string) => void;
  className?: string;
}

function TextEditor({ text, onCommit, className = '' }: TextEditorProps) {
  const [draft, setDraft] = useState(text);

  useEffect(() => {
    setDraft(text);
  }, [text]);

  const commitDraft = () => {
    if (draft !== text) {
      onCommit(draft);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitDraft();
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Escape') {
      setDraft(text);
      event.currentTarget.blur();
    }
  };

  return (
    <input
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commitDraft}
      onKeyDown={handleKeyDown}
      className={[
        'min-w-0 flex-1 rounded-2xl bg-transparent px-1 py-0.5 text-sm font-semibold text-slate-900 outline-none transition hover:bg-slate-50 focus:bg-blue-50/60 focus:ring-4 focus:ring-blue-100',
        className,
      ].join(' ')}
    />
  );
}

export function DayDetail({
  data,
  selectedDate,
  saveStatus,
  errorMessage,
  onAddTodo,
  onUpdateTodo,
  onDeleteTodo,
  onToggleTodo,
  onInheritTodosToNextDay,
  onAddActualItem,
  onUpdateActualItem,
  onDeleteActualItem,
}: DayDetailProps) {
  const [draftTodo, setDraftTodo] = useState('');
  const [draftActual, setDraftActual] = useState('');
  const [isInheritMode, setIsInheritMode] = useState(false);
  const [selectedTodoIds, setSelectedTodoIds] = useState<string[]>([]);

  const selectedDay = ensureDay(data, selectedDate);
  const visibleTodos = getVisibleTodos(data, selectedDate);
  const openTodos = visibleTodos.filter((todo) => !todo.isCompletedAtDate);
  const inheritableTodos = openTodos.filter((todo) => !todo.isInheritedToNextDay);
  const nextDate = addDays(selectedDate, 1);
  const { year, monthIndex, day } = parseDateKey(selectedDate);

  const resetInheritance = () => {
    setIsInheritMode(false);
    setSelectedTodoIds([]);
  };

  const handleTodoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddTodo(selectedDate, draftTodo);
    setDraftTodo('');
  };

  const handleActualSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onAddActualItem(selectedDate, draftActual);
    setDraftActual('');
  };

  const toggleSelection = (todoId: string) => {
    setSelectedTodoIds((current) =>
      current.includes(todoId) ? current.filter((id) => id !== todoId) : [...current, todoId],
    );
  };

  const confirmInheritance = () => {
    onInheritTodosToNextDay(selectedDate, selectedTodoIds);
    resetInheritance();
  };

  const renderTextEditor = (kind: 'todo' | 'actual', id: string, text: string) => {
    return (
      <TextEditor
        text={text}
        onCommit={(nextText) => {
          if (kind === 'todo') {
            onUpdateTodo(id, nextText);
            return;
          }

          onUpdateActualItem(id, nextText);
        }}
      />
    );
  };

  const renderTodo = (todo: VisibleTodo) => {
    const isSelected = selectedTodoIds.includes(todo.id);
    const canSelect = isInheritMode && !todo.isCompletedAtDate && !todo.isInheritedToNextDay;

    return (
      <div
        key={todo.id}
        className="group rounded-3xl border border-slate-100 bg-white p-3 shadow-ios-soft transition hover:-translate-y-0.5"
      >
        <div className="flex items-start gap-3">
          {isInheritMode ? (
            <button
              type="button"
              disabled={!canSelect}
              aria-label={isSelected ? '取消选择继承' : '选择继承'}
              onClick={() => toggleSelection(todo.id)}
              className={[
                'mt-1 grid size-6 shrink-0 place-items-center rounded-full border text-xs transition',
                isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 bg-white text-transparent',
                canSelect ? 'hover:border-blue-400' : 'cursor-not-allowed opacity-30',
              ].join(' ')}
            >
              ✓
            </button>
          ) : (
            <button
              type="button"
              aria-label={todo.isCompletedAtDate ? '标记为未完成' : '标记为完成'}
              onClick={() => onToggleTodo(selectedDate, todo.id)}
              className={[
                'mt-1 grid size-6 shrink-0 place-items-center rounded-full border transition',
                todo.isCompletedAtDate
                  ? 'border-emerald-400 bg-emerald-400 text-white'
                  : 'border-slate-300 bg-white text-transparent hover:border-blue-400',
              ].join(' ')}
            >
              ✓
            </button>
          )}

          <div className="min-w-0 flex-1">
            <div className={todo.isCompletedAtDate ? 'text-slate-400 line-through' : ''}>
              {renderTextEditor('todo', todo.id, todo.text)}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {todo.isCarried ? (
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600">
                  继承自 {todo.originDate}
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                  当日新增
                </span>
              )}
              {todo.isInheritedToNextDay ? (
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-600">
                  已继承到明天
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            aria-label="删除 TODO"
            onClick={() => onDeleteTodo(todo.id)}
            className="grid size-8 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  const renderActualItem = (item: ActualItem) => (
    <div key={item.id} className="rounded-3xl border border-slate-100 bg-white p-3 shadow-ios-soft">
      <div className="flex items-start gap-3">
        <span className="mt-2 size-2 shrink-0 rounded-full bg-emerald-400" />
        {renderTextEditor('actual', item.id, item.text)}
        <button
          type="button"
          aria-label="删除实际记录"
          onClick={() => onDeleteActualItem(item.id)}
          className="grid size-8 shrink-0 place-items-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
        >
          ×
        </button>
      </div>
    </div>
  );

  return (
    <aside className="rounded-[32px] border border-white/70 bg-white/80 p-4 shadow-ios backdrop-blur-2xl lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{getMonthLabel(year, monthIndex)}</p>
          <h2 className="mt-1 text-4xl font-semibold tracking-tight text-slate-950">{day}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{getWeekdayLabel(selectedDate)}</p>
        </div>
        <div
          className={[
            'rounded-full px-3 py-1 text-xs font-semibold',
            saveStatus === 'error'
              ? 'bg-red-100 text-red-600'
              : saveStatus === 'saving'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-emerald-100 text-emerald-700',
          ].join(' ')}
        >
          {saveStatusText[saveStatus]}
        </div>
      </div>

      {errorMessage ? (
        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorMessage}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-3xl bg-slate-100/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">待处理</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{openTodos.length}</p>
        </div>
        <div className="rounded-3xl bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-400">实际记录</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600">{selectedDay.actualItems.length}</p>
        </div>
      </div>

      <form onSubmit={handleTodoSubmit} className="mt-6 flex gap-2">
        <input
          value={draftTodo}
          onChange={(event) => setDraftTodo(event.target.value)}
          placeholder="添加新的 TODO"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        />
        <button type="submit" className="rounded-full bg-blue-500 px-5 text-sm font-semibold text-white shadow-ios-soft transition hover:bg-blue-600">
          添加
        </button>
      </form>

      <div className="mt-4 rounded-3xl bg-slate-100/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">继承到明天</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{nextDate}</p>
          </div>
          {isInheritMode ? (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={selectedTodoIds.length === 0}
                onClick={confirmInheritance}
                className="rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                继承 {selectedTodoIds.length}
              </button>
              <button
                type="button"
                onClick={resetInheritance}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-slate-500"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={inheritableTodos.length === 0}
              onClick={() => setIsInheritMode(true)}
              className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-blue-600 shadow-ios-soft transition disabled:cursor-not-allowed disabled:text-slate-300 disabled:shadow-none"
            >
              批量选择
            </button>
          )}
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {visibleTodos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm font-medium text-slate-400">
            今天还没有 TODO
          </div>
        ) : (
          visibleTodos.map(renderTodo)
        )}
      </div>

      <form onSubmit={handleActualSubmit} className="mt-7 flex gap-2">
        <input
          value={draftActual}
          onChange={(event) => setDraftActual(event.target.value)}
          placeholder="添加实际完成记录"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
        <button type="submit" className="rounded-full bg-emerald-500 px-5 text-sm font-semibold text-white shadow-ios-soft transition hover:bg-emerald-600">
          添加
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {selectedDay.actualItems.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white/70 p-5 text-center text-sm font-medium text-slate-400">
            还没有实际记录
          </div>
        ) : (
          selectedDay.actualItems.map(renderActualItem)
        )}
      </div>
    </aside>
  );
}
