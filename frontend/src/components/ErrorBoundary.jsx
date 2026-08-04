import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div 
          data-testid="error-boundary-fallback"
          className="min-h-screen w-full flex items-center justify-center p-6 mesh-bg"
        >
          <div className="glass-card p-8 text-center max-w-md w-full animate-fade-scale shadow-2xl">
            <div 
              className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
              style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e' }}
            >
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold mb-2 gradient-text">Something went wrong</h2>
            <p className="text-xs mb-6" style={{ color: '#64748b' }}>
              An unhandled rendering error occurred in the application view.
            </p>
            <button
              onClick={this.handleReload}
              className="btn-primary inline-flex items-center gap-2 text-xs"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
