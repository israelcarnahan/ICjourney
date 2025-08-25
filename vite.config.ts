import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

const placesProxy = (): Plugin => ({
  name: 'places-proxy',
  configureServer(server) {
    const key = process.env.GOOGLE_PLACES_KEY || '';
    console.log('[places-proxy] key present:', key ? 'yes: …' + key.slice(-4) : 'no');

    // POST /api/places/find?q=<textQuery>
    server.middlewares.use('/api/places/find', async (req, res) => {
      if (!key) { res.statusCode = 501; res.end('GOOGLE_PLACES_KEY missing'); return; }
      const url = new URL(req.url || '', 'http://local');
      const q = url.searchParams.get('q') || '';
      const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
        },
        body: JSON.stringify({ textQuery: q })
      });
      const body = await r.text();
      res.setHeader('content-type', 'application/json');
      res.end(body);
    });

    // GET /api/places/details?id=<placeId>
    server.middlewares.use('/api/places/details', async (req, res) => {
      if (!key) { res.statusCode = 501; res.end('GOOGLE_PLACES_KEY missing'); return; }
      const url = new URL(req.url || '', 'http://local');
      const id = url.searchParams.get('id') || '';
      const r = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en`, {
        headers: {
          'X-Goog-Api-Key': key,
          'X-Goog-FieldMask': [
            'id',
            'displayName',
            'formattedAddress',
            'location',
            'formattedPhoneNumber',
            'websiteUri',
            'currentOpeningHours',
            'rating',
            'userRatingCount'
          ].join(',')
        }
      });
      const body = await r.text();
      res.setHeader('content-type', 'application/json');
      res.end(body);
    });
  }
});

export default defineConfig({
  plugins: [react(), placesProxy()],
  envDir: ".",
  base: "/",
  preview: {
    allowedHosts: [
      "israelsjourneyplanner.onrender.com",
      "icjourney.onrender.com",
    ],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": "/src",
    },
  },
  esbuild: {
    keepNames: true,
    treeShaking: true,
    minifyIdentifiers: false,
  },
  server: {
    port: 5173,
    host: true,
    fs: {
      strict: true,
    },
    headers: {
      Link: "</fetch.worker.js>; rel=preload; as=worker",
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: true,
        propertyReadSideEffects: false,
        preset: "recommended",
      },
      input: {
        main: "./index.html",
      },
      output: {
        format: "es",
        inlineDynamicImports: false,
        entryFileNames: "assets/[name].[hash].js",
        chunkFileNames: "assets/[name].[hash].js",
        assetFileNames: "assets/[name].[hash].[ext]",
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "ui-vendor": [
            "lucide-react",
            "@radix-ui/react-dialog",
            "@radix-ui/react-label",
          ],
          "utils-vendor": [
            "date-fns",
            "class-variance-authority",
            "clsx",
            "tailwind-merge",
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "date-fns",
      "react-virtualized",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tooltip",
      "lucide-react",
    ],
    exclude: [],
    esbuildOptions: {
      keepNames: true,
      minifyIdentifiers: false,
    },
  },
});
