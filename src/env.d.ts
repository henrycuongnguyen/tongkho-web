/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import type { Session, User } from '@/lib/auth';

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL: string;
  readonly PUBLIC_API_URL: string;
  // Elasticsearch (server-only)
  readonly ES_URL: string;
  readonly ES_INDEX: string;
  readonly ES_API_KEY: string;
  // PostgreSQL (server-only)
  readonly DATABASE_URL: string;
  // Better Auth
  readonly BETTER_AUTH_SECRET: string;
  readonly BETTER_AUTH_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    session: Session | null;
    user: User | null;
  }
}
