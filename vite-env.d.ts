// Fix: Manually declare Vite environment types to resolve the "Cannot find type definition file for 'vite/client'" error.
// This provides the global ImportMeta and ImportMetaEnv interfaces that the project expects.

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly [key: string]: any;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}
