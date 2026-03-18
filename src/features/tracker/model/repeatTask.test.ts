import { Temporal } from '@js-temporal/polyfill';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  computeCurrentCycle,
  computeNextResetAt,
  isAllCompleted,
  syncRepeatTask,
} from './repeatTask';
import type { RepeatTask } from './types';

const dt = (value: string) => Temporal.PlainDateTime.from(value);

function makeRepeatTask(overrides: Partial<RepeatTask> = {}): RepeatTask {
  const targetCount = overrides.targetCount ?? 3;

  return {
    id: 'task-1',
    tabId: 'tab-1',
    kind: 'repeat',
    title: '반복 작업',
    timezone: 'plain',
    startAnchor: '2025-03-01T09:00',
    intervalPreset: 'daily',
    targetCount,
    checks: overrides.checks ?? Array(targetCount).fill(false),
    lastCycle: 0,
    position: 0,
    updatedAt: 0,
    ...overrides,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('computeCurrentCycle', () => {
  describe('daily', () => {
    const task = makeRepeatTask();

    it.each([
      ['시작 전이면 -1 반환', '2025-03-01T08:59', -1],
      ['시작 시각이면 0 반환', '2025-03-01T09:00', 0],
      ['다음 경계 직전이면 아직 0 반환', '2025-03-02T08:59', 0],
      ['다음 경계 정각이면 1 반환', '2025-03-02T09:00', 1],
      ['여러 일 뒤면 누적 일수 반환', '2025-03-05T12:00', 4],
    ])('%s', (_label, now, expected) => {
      expect(computeCurrentCycle(task, dt(now))).toBe(expected);
    });
  });

  describe('weekly', () => {
    const task = makeRepeatTask({ intervalPreset: 'weekly' });

    it.each([
      ['7일 경계 직전이면 0 반환', '2025-03-08T08:59', 0],
      ['7일 경계 정각이면 1 반환', '2025-03-08T09:00', 1],
      ['14일 경계 직전이면 1 반환', '2025-03-15T08:59', 1],
      ['14일 경계 정각이면 2 반환', '2025-03-15T09:00', 2],
    ])('%s', (_label, now, expected) => {
      expect(computeCurrentCycle(task, dt(now))).toBe(expected);
    });
  });

  describe('custom', () => {
    it.each([
      ['2일 간격 첫 경계 직전', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-03T08:59', 0],
      ['2일 간격 첫 경계 정각', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-03T09:00', 1],
      ['3일 간격 첫 경계 직전', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 3 }), '2025-03-04T08:59', 0],
      ['3일 간격 첫 경계 정각', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 3 }), '2025-03-04T09:00', 1],
    ])('%s', (_label, task, now, expected) => {
      expect(computeCurrentCycle(task, dt(now))).toBe(expected);
    });
  });

  describe('monthly', () => {
    it('일반 월간 시작일은 매달 같은 시각에 사이클이 증가한다', () => {
      const task = makeRepeatTask({
        startAnchor: '2025-01-15T09:00',
        intervalPreset: 'monthly',
      });

      expect(computeCurrentCycle(task, dt('2025-02-15T08:59'))).toBe(0);
      expect(computeCurrentCycle(task, dt('2025-02-15T09:00'))).toBe(1);
      expect(computeCurrentCycle(task, dt('2025-03-15T09:00'))).toBe(2);
    });

    it('월말 시작일도 실제 리셋 경계에 맞춰 계산한다', () => {
      const task = makeRepeatTask({
        startAnchor: '2025-01-31T09:00',
        intervalPreset: 'monthly',
      });

      expect(computeCurrentCycle(task, dt('2025-02-28T08:59'))).toBe(0);
      expect(computeCurrentCycle(task, dt('2025-02-28T09:00'))).toBe(1);
      expect(computeCurrentCycle(task, dt('2025-03-30T09:00'))).toBe(1);
      expect(computeCurrentCycle(task, dt('2025-03-31T09:00'))).toBe(2);
      expect(computeCurrentCycle(task, dt('2025-04-30T09:00'))).toBe(3);
    });
  });

  describe('yearly', () => {
    it('일반 연간 시작일은 매년 같은 시각에 사이클이 증가한다', () => {
      const task = makeRepeatTask({
        startAnchor: '2023-06-10T09:00',
        intervalPreset: 'yearly',
      });

      expect(computeCurrentCycle(task, dt('2024-06-10T08:59'))).toBe(0);
      expect(computeCurrentCycle(task, dt('2024-06-10T09:00'))).toBe(1);
      expect(computeCurrentCycle(task, dt('2026-06-10T09:00'))).toBe(3);
    });

    it('윤년 시작일도 실제 리셋 경계에 맞춰 계산한다', () => {
      const task = makeRepeatTask({
        startAnchor: '2024-02-29T09:00',
        intervalPreset: 'yearly',
      });

      expect(computeCurrentCycle(task, dt('2025-02-28T08:59'))).toBe(0);
      expect(computeCurrentCycle(task, dt('2025-02-28T09:00'))).toBe(1);
      expect(computeCurrentCycle(task, dt('2026-02-28T09:00'))).toBe(2);
      expect(computeCurrentCycle(task, dt('2028-02-29T09:00'))).toBe(4);
    });
  });
});

describe('computeNextResetAt', () => {
  it('시작 전이면 시작 시각을 다음 리셋으로 반환한다', () => {
    const task = makeRepeatTask();
    const result = computeNextResetAt(task, dt('2025-03-01T08:59'));

    expect(result.equals(dt('2025-03-01T09:00'))).toBe(true);
  });

  it.each([
    ['daily 경계 직전', makeRepeatTask(), '2025-03-02T08:59', '2025-03-02T09:00'],
    ['weekly 1주차 이후', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-09T10:00', '2025-03-15T09:00'],
    ['custom 3일 간격', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 3 }), '2025-03-04T10:00', '2025-03-07T09:00'],
    ['monthly 월말', makeRepeatTask({ startAnchor: '2025-01-31T09:00', intervalPreset: 'monthly' }), '2025-02-28T09:00', '2025-03-31T09:00'],
    ['yearly 윤년', makeRepeatTask({ startAnchor: '2024-02-29T09:00', intervalPreset: 'yearly' }), '2025-02-28T09:00', '2026-02-28T09:00'],
  ])('%s', (_label, task, now, expected) => {
    const result = computeNextResetAt(task, dt(now));

    expect(result.equals(dt(expected))).toBe(true);
  });

  it.each([
    ['daily', makeRepeatTask(), '2025-03-03T10:00', '2025-03-04T09:00'],
    ['weekly', makeRepeatTask({ intervalPreset: 'weekly' }), '2025-03-10T09:00', '2025-03-15T09:00'],
    ['custom 2일', makeRepeatTask({ intervalPreset: 'custom', customIntervalDays: 2 }), '2025-03-04T10:00', '2025-03-05T09:00'],
    ['monthly 월말', makeRepeatTask({ startAnchor: '2025-01-31T09:00', intervalPreset: 'monthly' }), '2025-03-30T09:00', '2025-03-31T09:00'],
    ['yearly 윤년', makeRepeatTask({ startAnchor: '2024-02-29T09:00', intervalPreset: 'yearly' }), '2026-05-01T09:00', '2027-02-28T09:00'],
  ])('%s 케이스에서 현재 주기와 다음 리셋 시각이 일관된다', (_label, task, now, expectedNextReset) => {
    const currentCycle = computeCurrentCycle(task, dt(now));
    const nextResetAt = computeNextResetAt(task, dt(now));

    expect(nextResetAt.equals(dt(expectedNextReset))).toBe(true);
    expect(computeCurrentCycle(task, nextResetAt.subtract({ minutes: 1 }))).toBe(currentCycle);
    expect(computeCurrentCycle(task, nextResetAt)).toBe(currentCycle + 1);
  });
});

describe('isAllCompleted', () => {
  it('checks가 비어 있으면 false 반환', () => {
    const task = makeRepeatTask({ targetCount: 0, checks: [] });

    expect(isAllCompleted(task)).toBe(false);
  });

  it('일부만 완료되면 false 반환', () => {
    const task = makeRepeatTask({ checks: [true, false, true] });

    expect(isAllCompleted(task)).toBe(false);
  });

  it('모든 체크가 true면 true 반환', () => {
    const task = makeRepeatTask({ checks: [true, true, true] });

    expect(isAllCompleted(task)).toBe(true);
  });
});

describe('syncRepeatTask', () => {
  it('같은 주기면 원본 참조를 그대로 반환한다', () => {
    const task = makeRepeatTask({
      checks: [true, false, true],
      completedAt: '2025-03-01T10:00',
    });
    const result = syncRepeatTask(task, dt('2025-03-01T20:00'));

    expect(result).toBe(task);
  });

  it('주기가 바뀌면 checks, completedAt, lastCycle, updatedAt을 갱신한다', () => {
    vi.spyOn(Date, 'now').mockReturnValue(123456789);
    const task = makeRepeatTask({
      checks: [true, true, true],
      completedAt: '2025-03-01T10:00',
      lastCycle: 0,
    });

    const result = syncRepeatTask(task, dt('2025-03-02T09:00'));

    expect(result).not.toBe(task);
    expect(result.checks).toEqual([false, false, false]);
    expect(result.completedAt).toBeUndefined();
    expect(result.lastCycle).toBe(1);
    expect(result.updatedAt).toBe(123456789);
    expect(result.title).toBe(task.title);
  });

  it('시작 전 시각이면 lastCycle을 -1로 맞춘다', () => {
    vi.spyOn(Date, 'now').mockReturnValue(99);
    const task = makeRepeatTask({
      checks: [true, true, false],
      lastCycle: 0,
    });

    const result = syncRepeatTask(task, dt('2025-03-01T08:59'));

    expect(result.lastCycle).toBe(-1);
    expect(result.checks).toEqual([false, false, false]);
    expect(result.updatedAt).toBe(99);
  });
});

describe('default now / timezone path', () => {
  it('timezone이 plain이면 Temporal.Now.plainDateTimeISO를 사용한다', () => {
    const plainSpy = vi.spyOn(Temporal.Now, 'plainDateTimeISO').mockReturnValue(dt('2025-03-03T09:00'));
    const zonedSpy = vi
      .spyOn(Temporal.Now, 'zonedDateTimeISO')
      .mockImplementation(() => {
        throw new Error('zonedDateTimeISO should not be called');
      });

    const task = makeRepeatTask({ timezone: 'plain' });

    expect(computeCurrentCycle(task)).toBe(2);
    expect(plainSpy).toHaveBeenCalledTimes(1);
    expect(zonedSpy).not.toHaveBeenCalled();
  });

  it('timezone 문자열이면 Temporal.Now.zonedDateTimeISO를 사용한다', () => {
    const plainSpy = vi
      .spyOn(Temporal.Now, 'plainDateTimeISO')
      .mockImplementation(() => {
        throw new Error('plainDateTimeISO should not be called');
      });
    const zonedSpy = vi.spyOn(Temporal.Now, 'zonedDateTimeISO').mockReturnValue(
      Temporal.ZonedDateTime.from('2025-03-03T09:00:00+09:00[Asia/Seoul]'),
    );

    const task = makeRepeatTask({ timezone: 'Asia/Seoul' });
    const result = computeNextResetAt(task);

    expect(result.equals(dt('2025-03-04T09:00'))).toBe(true);
    expect(zonedSpy).toHaveBeenCalledWith('Asia/Seoul');
    expect(plainSpy).not.toHaveBeenCalled();
  });
});
