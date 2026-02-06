// Fix: Removed the 'vite/client' reference which was causing a "Cannot find type definition" error in environments where the vite types are not explicitly available.
// Manual declarations for ImportMetaEnv and ImportMeta provide the necessary type safety for Vite-based projects.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
