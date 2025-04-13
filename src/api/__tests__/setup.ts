// Mock environment variables
process.env.VITE_USE_MOCK_API = "true";

// Mock console.error to keep test output clean
const originalConsoleError = console.error;
console.error = (...args) => {
  if (!args[0].includes("Mock API")) {
    originalConsoleError(...args);
  }
};
