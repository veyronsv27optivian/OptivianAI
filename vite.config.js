import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
  },
  build: {
    // ── Chunk size limit ────────────────────────────────────────
    // three.js alone is ~850 KB minified and pdfjs-dist is ~1.3 MB, so we set a
    // generous limit and further split document-related deps into sub-groups.
    chunkSizeWarningLimit: 1300,

    rollupOptions: {
      output: {
        // ── Strategic manualChunks ──────────────────────────────
        // Splits large dependency groups into cacheable, layer-separated bundles.
        // This improves initial load time (parallel downloads) and cache efficiency
        // (vendor chunks change infrequently).
        manualChunks(id) {
          // Only split node_modules
          if (!id.includes('node_modules')) return;

          // ── 3D engine (large: ~800 KB combined)
          if (id.includes('@react-three') || id.includes('three')) {
            return 'vendor-three';
          }

          // ── Animation engine (framer-motion: ~300 KB)
          if (id.includes('framer-motion')) {
            return 'vendor-framer';
          }

          // ── Charts / data vis (recharts + d3: ~400 KB)
          if (id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('victory')) {
            return 'vendor-charts';
          }

          // ── Backend / realtime
          if (id.includes('@supabase')) {
            return 'vendor-supabase';
          }

          // ── PDF engine (pdfjs-dist alone: ~1.3 MB — largest dep)
          if (id.includes('pdfjs-dist')) {
            return 'vendor-pdf';
          }

          // ── Other document parsing (xlsx, mammoth, papaparse, etc.)
          if (id.includes('mammoth') ||
              id.includes('xlsx') ||
              id.includes('papaparse') ||
              id.includes('pptxjs') ||
              id.includes('jszip')) {
            return 'vendor-docs';
          }

          // ── React core + router (catch-all after @react-three handled above)
          // Uses broad `react/` check because @react-three is already captured
          // in the vendor-three check at the top of this function.
          if (id.includes('react/') ||
              id.includes('react-dom') ||
              id.includes('scheduler') ||
              id.includes('react-router')) {
            return 'vendor-react';
          }

          // ── Everything else (lucide-react, tailwind, etc.)
          return 'vendor-other';
        },
      },
    },
  },
});
