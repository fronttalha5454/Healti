import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  componentStack: string;
}

/**
 * Catches render/runtime errors so a crash never leaves a blank (black) screen.
 * Shows a readable Turkish message, a reload button and the technical details.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, componentStack: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Healthi] Yakalanan hata:', error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack || '' });
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null, componentStack: '' });
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-[100dvh] bg-bg text-text px-6 py-12 flex flex-col items-center justify-center text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-lg font-bold mb-2">Bir şeyler yanlış gitti</h2>
        <p className="text-sm text-text-secondary mb-6 max-w-sm">
          Healthi beklenmeyen bir hatayla karşılaştı. Verilerin cihazında duruyor; sayfayı yenileyerek devam edebilirsin.
        </p>
        <button
          onClick={this.handleReload}
          className="px-5 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold"
        >
          Yeniden yükle
        </button>
        <details className="mt-6 w-full max-w-lg text-left">
          <summary className="text-xs text-text-muted cursor-pointer">Teknik ayrıntılar</summary>
          <pre className="mt-2 text-[11px] text-warning whitespace-pre-wrap break-all">{this.state.error?.message}</pre>
          <pre className="mt-2 text-[10px] text-text-muted whitespace-pre-wrap break-all">{this.state.error?.stack}</pre>
          <pre className="mt-2 text-[10px] text-text-muted whitespace-pre-wrap break-all">{this.state.componentStack}</pre>
        </details>
      </div>
    );
  }
}
