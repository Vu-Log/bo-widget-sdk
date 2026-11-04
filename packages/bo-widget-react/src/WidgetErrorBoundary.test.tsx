import { cleanup, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WidgetErrorBoundary } from './WidgetErrorBoundary.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const Broken = ({ message }: { message: string }): never => {
  throw new Error(message);
};

describe('WidgetErrorBoundary', () => {
  it('renders its children when nothing fails', () => {
    render(
      <WidgetErrorBoundary errorFallback={() => 'Failed'}>
        <p>Content</p>
      </WidgetErrorBoundary>,
    );
    expect(screen.getByText('Content')).toBeDefined();
  });

  it('renders errorFallback with the error, and logs it, when a child throws', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WidgetErrorBoundary errorFallback={(error) => `Failed: ${(error as Error).message}`}>
        <Broken message="boom" />
      </WidgetErrorBoundary>,
    );
    expect(screen.getByText('Failed: boom')).toBeDefined();
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('the widget failed to render'),
      expect.objectContaining({ message: 'boom' }),
    );
  });

  it('renders the default message for the original error when errorFallback throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WidgetErrorBoundary
        errorFallback={() => {
          throw new Error('fallback failed');
        }}
      >
        <Broken message="boom" />
      </WidgetErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toBe('The widget cannot be displayed: boom');
  });

  it('renders the default message for the original error when the fallback throws while rendering', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <WidgetErrorBoundary errorFallback={() => <Broken message="fallback render failed" />}>
        <Broken message="boom" />
      </WidgetErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toBe('The widget cannot be displayed: boom');
    expect(log).toHaveBeenCalledWith(
      expect.stringContaining('errorFallback failed to render'),
      expect.objectContaining({ message: 'fallback render failed' }),
    );
  });

  it('stays failed when its children would render again', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let fix: () => void = () => {};
    const Parent = () => {
      const [broken, setBroken] = useState(true);
      fix = () => setBroken(false);
      return (
        <WidgetErrorBoundary errorFallback={() => 'Failed'}>
          {broken ? <Broken message="boom" /> : <p>Content</p>}
        </WidgetErrorBoundary>
      );
    };
    const { rerender } = render(<Parent />);
    fix();
    rerender(<Parent />);
    expect(screen.getByText('Failed')).toBeDefined();
    expect(screen.queryByText('Content')).toBeNull();
  });
});
