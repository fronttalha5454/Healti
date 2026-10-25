import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>Bir şeyler yanlış gitti.</h2>
          <p>{this.state.error?.message || "Beklenmeyen bir hata oluştu."}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            Sayfayı Yenile
          </button>
        </div>
      );
    }

    return this.children;
  }
}
