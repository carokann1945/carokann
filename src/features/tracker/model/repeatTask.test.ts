import { Temporal } from '@js-temporal/polyfill';
import { describe, it, expect } from 'vitest';
import { computeCurrentCycle, syncRepeatTask } from './repeatTask';

const mockTask = {
  id: '1',
  tabId: '1',
  kind: 'repeat' as const,
  title: '테스트',
  timezone: 'plain',
  startAnchor: '2025-03-01T09:00',
  intervalPreset: 'daily' as const,
  targetCount: 3,
  checks: [false, false, false],
  lastCycle: 0,
  position: 0,
  updatedAt: 0,
};

describe('computeCurrentCycle', () => {
  it('시작 전이면 -1 반환', () => {
    const now = Temporal.PlainDateTime.from('2025-02-28T09:00');
    expect(computeCurrentCycle(mockTask, now)).toBe(-1);
  });

  it('1일 후면 1 반환', () => {
    const now = Temporal.PlainDateTime.from('2025-03-02T09:00');
    expect(computeCurrentCycle(mockTask, now)).toBe(1);
  });
});

describe('syncRepeatTask', () => {
  it('주기 바뀌면 checks 리셋', () => {
    const task = { ...mockTask, checks: [true, true, true], lastCycle: 0 };
    const now = Temporal.PlainDateTime.from('2025-03-02T09:00');
    const result = syncRepeatTask(task, now);
    expect(result.checks).toEqual([false, false, false]);
  });

  it('주기 안 바뀌면 원본 반환', () => {
    const now = Temporal.PlainDateTime.from('2025-03-01T09:00');
    const result = syncRepeatTask(mockTask, now);
    expect(result).toBe(mockTask); // 같은 참조
  });
});
