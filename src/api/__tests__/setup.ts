import "./mockApi.config";

// Mock environment variables
process.env.VITE_USE_MOCK_API = "true";

// Mock console methods
global.console = {
  ...console,
  // Override console methods to prevent test output noise
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Math.random for consistent test results
jest.spyOn(Math, "random").mockReturnValue(0.5);
