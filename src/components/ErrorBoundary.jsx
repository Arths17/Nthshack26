import { Component } from "react";

/**
 * Error Boundary Component - catches rendering errors in child components
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            padding: "20px",
            textAlign: "center",
            color: "#ff6b6b",
          }}
        >
          <h2>Oops! Something went wrong</h2>
          <p style={{ fontSize: "14px", marginTop: "10px", color: "#999" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              borderRadius: "6px",
              border: "1px solid #ff6b6b",
              background: "transparent",
              color: "#ff6b6b",
              cursor: "pointer",
              fontSize: "14px",
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
