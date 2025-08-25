import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";

function googlePlacesProxy(): Plugin {
  return {
    name: "google-places-proxy",
    configureServer(server) {
      server.middlewares.use("/api/places", async (req, res) => {
        try {
          const key = process.env.GOOGLE_PLACES_KEY;
          if (!key) {
            res.statusCode = 501;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ ok:false, error:"GOOGLE_PLACES_KEY not set" }));
            return;
          }

          const url = new URL(req.url!, "http://local");
          const path = url.pathname.replace(/^\/api\/places/, "");

          // Routes:
          //  /find?q=Text    -> Places Find Place from Text
          //  /details?place_id=... -> Places Details
          const base = "https://maps.googleapis.com/maps/api/place";
          let target = "";
          if (path === "/find") {
            const q = url.searchParams.get("q") || "";
            target = `${base}/findplacefromtext/json?inputtype=textquery&input=${encodeURIComponent(q)}&fields=${encodeURIComponent(process.env.GP_FIELDS_FIND || "place_id")}&key=${key}`;
          } else if (path === "/details") {
            const pid = url.searchParams.get("place_id") || "";
            const fields = process.env.GP_FIELDS_DETAILS || "formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry";
            target = `${base}/details/json?place_id=${encodeURIComponent(pid)}&fields=${encodeURIComponent(fields)}&key=${key}`;
          } else {
            res.statusCode = 404; res.end("Not found"); return;
          }

          const r = await fetch(target);
          const text = await r.text();
          res.statusCode = r.status;
          res.setHeader("Content-Type", "application/json");
          res.end(text);
        } catch (e:any) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ ok:false, error:String(e?.message || e) }));
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), googlePlacesProxy()],
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
