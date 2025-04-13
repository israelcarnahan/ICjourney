// Mock import.meta.env for tests
const mockImportMeta = {
  env: {
    VITE_USE_MOCK_API: "true",
  },
};

// @ts-ignore
global.import = { meta: mockImportMeta };

export const resetMockImportMeta = () => {
  mockImportMeta.env.VITE_USE_MOCK_API = "true";
};

export const setMockImportMeta = (value: string) => {
  mockImportMeta.env.VITE_USE_MOCK_API = value;
};
