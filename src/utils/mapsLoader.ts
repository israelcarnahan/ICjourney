// Mock data and utilities for postcode-based calculations
export const MAPS_CONFIG = {
  version: "postcode",
  language: "en-GB",
  region: "GB"
} as const;

export class MapsLoader {
  private static instance: MapsLoader | null = null;

  private constructor() {}

  public static getInstance(): MapsLoader {
    if (!MapsLoader.instance) {
      MapsLoader.instance = new MapsLoader();
    }
    return MapsLoader.instance;
  }

  public load(): Promise<void> {
    return Promise.resolve();
  }
}