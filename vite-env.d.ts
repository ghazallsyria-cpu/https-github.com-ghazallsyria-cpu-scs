// @ts-ignore: Reference to Vite client types to provide environment and module definitions
/// <reference types="vite/client" />

/**
 * Fix: Removed redundant 'declare module' blocks for SVG, PNG, and CSS 
 * as they are already provided by 'vite/client' and were causing 
 * "Duplicate identifier 'src'" errors when overlapping with Vite's internal types.
 */

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
