// Configuration module
let config = {
  useMockApi: false,
};

try {
  config.useMockApi = import.meta.env.VITE_USE_MOCK_API === "true";
} catch {
  // In test environment, import.meta is not available
  config.useMockApi = true;
}

export const getConfig = () => config;

export const setConfig = (newConfig: Partial<typeof config>) => {
  config = { ...config, ...newConfig };
};
