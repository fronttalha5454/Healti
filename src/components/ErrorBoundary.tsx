import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ERROR BOUNDARY CAUGHT:', error, errorInfo);
    this.setState({ errorInfo: errorInfo.componentStack || '' });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: '#fff', background: '#1a1a2e', minHeight: '100dvh', fontFamily: 'monospace', fontSize: 12, overflow: 'auto' }}>
          <h2 style={{ color: '#ef4444', fontSize: 18 }}>⚠️ HATA YAKALANDI</h2>
          <pre style={{ color: '#f59e0b', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ color: '#94a3b8', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 10 }}>
            {this.state.error?.stack}
          </pre>
          <pre style={{ color: '#64748b', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 10 }}>
            {this.state.errorInfo}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
