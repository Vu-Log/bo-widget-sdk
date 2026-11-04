import { Component, type ReactNode } from 'react';
import { logError, renderErrorFallback } from './WidgetProvider.js';

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
    return renderErrorFallback(this.props.errorFallback, this.state.error);
  }
}
