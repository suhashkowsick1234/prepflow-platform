import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  moduleName?: string;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary] ${this.props.moduleName ?? "Component"} crashed:`, error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center p-10 text-center gap-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 min-h-[200px]">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {this.props.moduleName ?? "Module"} failed to load
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Something went wrong while rendering this section. The rest of the app is unaffected.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Wrap any component with an isolated error boundary */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  moduleName: string
) {
  return function WrappedWithBoundary(props: P) {
    return (
      <ErrorBoundary moduleName={moduleName}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
