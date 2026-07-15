import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught:', error, errorInfo);
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.props.onRetry();
    } else {
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage || 'Something went wrong';

      return (
        <div className="min-h-[400px] flex items-center justify-center bg-slate-50 dark:bg-slate-950 rounded-xl">
          <div className="relative z-10 flex flex-col items-center gap-4 p-8 text-center">
            <div className="p-3 rounded-full bg-red-50 dark:bg-red-900/20">
              <AlertCircle size={28} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {message}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
                {this.props.fallbackDescription ||
                  'An unexpected error occurred. Please try again.'}
              </p>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-3 text-left">
                  <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600">
                    Error details
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs text-red-600 dark:text-red-400 overflow-auto max-w-full">
                    {this.state.error.message}
                    {this.state.error.stack && `\n\n${this.state.error.stack}`}
                  </pre>
                </details>
              )}
            </div>              {this.props.onRetry ? (
                <button
                  onClick={this.props.onRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  <RefreshCw size={16} />
                  Reload App
                </button>
              ) : (
                <button
                  onClick={this.handleRetry}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-all"
                >
                  <RefreshCw size={16} />
                  Retry
                </button>
              )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
