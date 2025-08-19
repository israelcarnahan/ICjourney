import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-eggplant-900 flex items-center justify-center p-4">
          <div className="bg-eggplant-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <h2 className="text-xl font-semibold text-eggplant-100">
                Something went wrong
              </h2>
            </div>
            <p className="text-eggplant-200 mb-4">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                // Clear any stored data that might be causing the error
                Object.keys(localStorage).forEach((key) => {
                  localStorage.removeItem(key);
                });
                window.location.reload();
              }}
              className="bg-neon-purple text-white px-4 py-2 rounded hover:bg-neon-purple/90 transition-colors"
            >
              Reset and Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
