import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function placesProxy() {
  return {
    name: 'places-proxy',
    configureServer(server) {
      const key = process.env.GOOGLE_PLACES_KEY || '';
      console.log('[places-proxy] key present:', key ? 'yes: …' + key.slice(-4) : 'no');

      // /api/places/find -> Google Places v1 searchText
      server.middlewares.use('/api/places/find', async (req, res) => {
        if (!key) { res.statusCode = 501; res.end('GOOGLE_PLACES_KEY missing'); return; }
        const q = new URL(req.url || '', 'http://local').searchParams.get('q') || '';
        const url = 'https://places.googleapis.com/v1/places:searchText';
        const body = JSON.stringify({ 
          textQuery: q,
          languageCode: 'en',
          regionCode: 'GB'
        });
        
        console.log(`[places-proxy] find: ${url}`, { q, key: '...' + key.slice(-4) });
        
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
          },
          body
        });
        
        const responseText = await r.text();
        console.log(`[places-proxy] find response: ${r.status}`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        res.statusCode = r.status;
        res.setHeader('content-type', 'application/json');
        res.end(responseText);
      });

      // /api/places/details -> Google Places v1 details
      server.middlewares.use('/api/places/details', async (req, res) => {
        if (!key) { res.statusCode = 501; res.end('GOOGLE_PLACES_KEY missing'); return; }
        const id = new URL(req.url || '', 'http://local').searchParams.get('id') || '';
        const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(id)}?languageCode=en&regionCode=GB`;
        
        console.log(`[places-proxy] details: ${url}`, { id, key: '...' + key.slice(-4) });
        
        const r = await fetch(url, {
          headers: {
            'X-Goog-Api-Key': key,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount,nationalPhoneNumber,internationalPhoneNumber,websiteUri,currentOpeningHours.weekdayDescriptions'
          }
        });
        
        const responseText = await r.text();
        console.log(`[places-proxy] details response: ${r.status}`, responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        res.statusCode = r.status;
        res.setHeader('content-type', 'application/json');
        res.end(responseText);
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  // Load .env files (includes .env.local) and copy key into process.env for the plugin
  const env = loadEnv(mode, process.cwd(), '');
  process.env.GOOGLE_PLACES_KEY = env.GOOGLE_PLACES_KEY;

  return {
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
  };
});
