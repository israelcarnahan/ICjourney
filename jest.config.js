/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFiles: ["<rootDir>/src/api/__tests__/setup.ts"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
      useESM: true,
    },
  },
  testEnvironmentOptions: {
    customExportConditions: ["node", "node-addons"],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
};
