import "./mockApi.config";

// Mock import.meta.env
global.import = {
  meta: {
    env: {
      VITE_USE_MOCK_API: "true",
    },
  },
};

// Mock console methods
const mockConsole = {
  ...console,
  // Override console methods to prevent test output noise
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// @ts-ignore
global.console = mockConsole;
