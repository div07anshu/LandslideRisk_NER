import { Component } from "react";
import { AlertTriangle } from "lucide-react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ hasError: true, error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-xl border border-red-200 shadow-lg p-8">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 mb-4">
                <AlertTriangle
                  size={32}
                  className="text-red-600"
                  strokeWidth={2}
                />
              </div>

              <h1 className="text-2xl font-bold text-slate-800 mb-2">
                Something went wrong
              </h1>

              <p className="text-sm text-slate-600 mb-6">
                The application encountered an unexpected error. Please try
                refreshing the page.
              </p>

              {import.meta.env.DEV && this.state.error && (
                <details className="w-full text-left mb-6">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 mb-2">
                    Error details (dev only)
                  </summary>
                  <pre className="text-xs bg-slate-100 rounded-lg p-3 overflow-auto max-h-48 text-red-600">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-[#3F72AF] text-white text-sm font-semibold rounded-lg hover:bg-[#315f96] transition"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
