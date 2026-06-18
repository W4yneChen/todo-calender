import type { LeaveConfig, LeavePeriod } from '../types/todos';

export const leavePeriodLabels: Record<LeavePeriod, string> = {
  full: '全天请假',
  morning: '上午请假',
  afternoon: '下午请假',
};

export function getLeaveLabel(leave: LeaveConfig) {
  return leavePeriodLabels[leave.period];
}

export function getLeaveSummary(leave: LeaveConfig) {
  return [getLeaveLabel(leave), leave.note?.trim()].filter(Boolean).join(' · ');
}

export function isLeavePeriod(value: unknown): value is LeavePeriod {
  return value === 'full' || value === 'morning' || value === 'afternoon';
}
