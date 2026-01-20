import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Filter out browser extension errors
    if (error?.message?.includes('chrome-extension://') || 
        error?.stack?.includes('chrome-extension://')) {
      // Suppress extension errors
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Filter out browser extension errors
    if (error?.message?.includes('chrome-extension://') || 
        error?.stack?.includes('chrome-extension://') ||
        errorInfo?.componentStack?.includes('chrome-extension://')) {
      // Suppress extension errors - don't log them
      return;
    }
    
    // Log actual app errors
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          marginTop: '50px'
        }}>
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;





