import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
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
