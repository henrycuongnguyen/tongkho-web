/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_API_URL: string;
  // Elasticsearch (server-only)
  readonly ES_URL: string;
  readonly ES_INDEX: string;
  readonly ES_API_KEY: string;
  // PostgreSQL (server-only)
  readonly DATABASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
