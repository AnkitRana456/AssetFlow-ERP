import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="mx-auto h-16 w-16 bg-rose-100 dark:bg-rose-950/30 rounded-full flex items-center justify-center text-rose-600 dark:text-rose-450 animate-pulse">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                System Interface Recovery
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                An unexpected error occurred while rendering this interface. Our system state remains safe.
              </p>
              {this.state.error && (
                <div className="text-left bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-xs font-mono text-rose-500 dark:text-rose-400 overflow-x-auto max-h-24">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-all cursor-pointer"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Application
              </button>
              <a
                href="/dashboard"
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all"
              >
                <Home className="h-4 w-4" />
                Go to Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
