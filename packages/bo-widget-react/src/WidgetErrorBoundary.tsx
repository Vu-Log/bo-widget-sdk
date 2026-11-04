import { Component, type ReactNode } from 'react';
import { defaultErrorFallback, logError, renderErrorFallback } from './WidgetProvider.js';

interface WidgetErrorBoundaryProps {
  errorFallback: (error: unknown) => ReactNode;
  children?: ReactNode;
}

interface WidgetErrorBoundaryState {
  failed: boolean;
  error: unknown;
}

/**
 * Shows `errorFallback` instead of an empty widget when rendering fails: an exception of the
 * widget's components or of its `customizeTheme` option. The error is logged. The failure is final
 * until the widget is mounted again. @internal
 */
export class WidgetErrorBoundary extends Component<
  WidgetErrorBoundaryProps,
  WidgetErrorBoundaryState
> {
  override state: WidgetErrorBoundaryState = { failed: false, error: undefined };

  static getDerivedStateFromError(error: unknown): WidgetErrorBoundaryState {
    return { failed: true, error };
  }

  override componentDidCatch(error: unknown): void {
    logError('the widget failed to render', error);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <FallbackGuard error={this.state.error}>
        {renderErrorFallback(this.props.errorFallback, this.state.error)}
      </FallbackGuard>
    );
  }
}

interface FallbackGuardProps {
  /** The error the fallback shows. */
  error: unknown;
  children?: ReactNode;
}

/**
 * Last resort: shows the default message for `error` when what `errorFallback` returned throws
 * while rendering. A boundary does not catch the errors of its own fallback.
 */
class FallbackGuard extends Component<FallbackGuardProps, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  override componentDidCatch(error: unknown): void {
    logError('errorFallback failed to render', error);
  }

  override render(): ReactNode {
    return this.state.failed ? defaultErrorFallback(this.props.error) : this.props.children;
  }
}
