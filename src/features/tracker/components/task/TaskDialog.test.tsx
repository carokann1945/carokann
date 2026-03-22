import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import TaskDialog from './TaskDialog';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs: Array<string | false | null | undefined>) => inputs.filter(Boolean).join(' '),
  getBrowserTimezone: () => 'Asia/Seoul',
}));

vi.mock('radix-ui', () => ({
  Dialog: {
    Root: ({ children }: { children: ReactNode }) => <>{children}</>,
    Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
    Overlay: ({ className }: { className?: string }) => <div className={className} />,
    Content: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div>,
    Description: ({ children, className }: { children: ReactNode; className?: string }) => <p className={className}>{children}</p>,
    Title: ({ children, className }: { children: ReactNode; className?: string }) => <h2 className={className}>{children}</h2>,
    Close: ({ children }: { children: ReactNode }) => <>{children}</>,
  },
}));

describe('TaskDialog', () => {
  it('반복 작업 모드에서는 표준 시간대 도움말 버튼을 보여준다', () => {
    const markup = renderToStaticMarkup(
      <TaskDialog open onOpenChange={() => {}} onSubmit={() => {}} defaultKind="repeat" />,
    );

    expect(markup).toContain('표준 시간대');
    expect(markup).toContain('aria-label="표준 시간대 도움말"');
    expect(markup).toContain('id="task-timezone"');
    expect(markup).not.toContain('Plain (표준 시간대 없음)</p>');
  });

  it('일반 작업 모드에서는 표준 시간대 도움말 버튼을 보여주지 않는다', () => {
    const markup = renderToStaticMarkup(<TaskDialog open onOpenChange={() => {}} onSubmit={() => {}} />);

    expect(markup).not.toContain('aria-label="표준 시간대 도움말"');
    expect(markup).not.toContain('id="task-timezone"');
  });
});
