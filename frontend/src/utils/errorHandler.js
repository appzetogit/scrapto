// Global error handler to suppress browser extension errors
export const setupGlobalErrorHandlers = () => {
  // Suppress extension errors in window error handler
  const originalErrorHandler = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    // Check if error is from a browser extension
    if (
      source?.includes('chrome-extension://') ||
      source?.includes('moz-extension://') ||
      source?.includes('safari-extension://') ||
      message?.includes('chrome-extension://') ||
      error?.stack?.includes('chrome-extension://')
    ) {
      // Suppress extension errors
      return true; // Prevents default error handling
    }
    
    // Call original handler for actual app errors
    if (originalErrorHandler) {
      return originalErrorHandler(message, source, lineno, colno, error);
    }
    return false;
  };

  // Suppress extension errors in unhandled promise rejection handler
  const originalUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = (event) => {
    const error = event.reason;
    
    // Check if error is from a browser extension
    if (
      error?.message?.includes('chrome-extension://') ||
      error?.stack?.includes('chrome-extension://') ||
      error?.source?.includes('chrome-extension://')
    ) {
      // Suppress extension errors
      event.preventDefault();
      return;
    }
    
    // Call original handler for actual app errors
    if (originalUnhandledRejection) {
      return originalUnhandledRejection(event);
    }
  };

  // Suppress extension errors in console.error (optional, for cleaner console)
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const errorString = args.join(' ');
    
    // Check if error is from a browser extension
    if (
      errorString.includes('chrome-extension://') ||
      errorString.includes('Cannot set properties of undefined') ||
      errorString.includes('_$initialUrl') ||
      errorString.includes('_$onReInit') ||
      errorString.includes('_$bindListeners')
    ) {
      // Suppress extension errors - don't log them
      return;
    }
    
    // Log actual app errors
    originalConsoleError.apply(console, args);
  };
};





