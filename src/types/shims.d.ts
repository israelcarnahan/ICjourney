/* Global, lightweight type shims for not-yet-wired APIs */
/* Google Maps (namespace) + Loader module */
declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: any,
        callback: (results: any[], status: string) => void
      ): void;
    }
    namespace places {
      class PlacesService {
        constructor(el: Element);
        getDetails(
          request: any,
          callback: (result: any, status: string) => void
        ): void;
      }
    }
  }
}
declare const google: any;

declare module '@googlemaps/js-api-loader' {
  export class Loader {
    constructor(options: Record<string, any>);
    load(): Promise<typeof google>;
  }
}

/* Radix Progress (placeholder) */
declare module '@radix-ui/react-progress' {
  const Progress: any;
  export = Progress;
}

/* Path alias util */
declare module '@/lib/utils' {
  export const cn: (...classes: any[]) => string;
}

/* Allow augmentation later without failing builds */
export {};
