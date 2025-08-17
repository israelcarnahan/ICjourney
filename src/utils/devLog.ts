// src/utils/devLog.ts
export const devLog = (...args: any[]) => {
  if (import.meta.env?.DEV) console.log(...args);
};
