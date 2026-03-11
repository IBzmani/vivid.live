'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred in the neural link.";
      
      try {
        // Check if it's our custom Firestore error
        const parsed = JSON.parse(this.state.error?.message || "");
        if (parsed.error && parsed.operationType) {
          errorMessage = `Neural Access Denied: Insufficient permissions for ${parsed.operationType} on ${parsed.path || 'unknown path'}.`;
        }
      } catch (e) {
        // Not a JSON error, use default
      }

      return (
        <div className="min-h-screen bg-obsidian flex flex-col items-center justify-center p-6 text-center">
          <div className="size-20 bg-red-500/20 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-500/30">
            <AlertTriangle className="size-10" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">System Malfunction</h2>
          <p className="text-slate-400 text-sm max-w-md mb-8 leading-relaxed">
            {errorMessage}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl transition-all font-bold uppercase tracking-widest text-xs"
          >
            <RotateCcw className="size-4" />
            Reboot Interface
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
