import React, { Component, ErrorInfo, ReactNode } from "react";

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
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: "2rem", 
          fontFamily: "system-ui, sans-serif",
          maxWidth: "600px",
          margin: "2rem auto"
        }}>
          <h1 style={{ color: "#ef4444", marginBottom: "1rem" }}>Something went wrong</h1>
          <details style={{ 
            background: "#1f2937", 
            padding: "1rem", 
            borderRadius: "0.5rem",
            color: "#f3f4f6",
            marginBottom: "1rem"
          }}>
            <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>Error details</summary>
            <pre style={{ 
              whiteSpace: "pre-wrap", 
              fontSize: "0.875rem",
              overflow: "auto"
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "0.25rem",
              cursor: "pointer"
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;










