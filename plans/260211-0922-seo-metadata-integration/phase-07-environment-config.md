# Phase 7: Environment Configuration

**Priority:** Low
**Status:** Pending
**Dependencies:** Phase 1

---

## Overview

Configure environment variables for SEO metadata service. Since v2 reuses existing ElasticSearch configuration, minimal new configuration needed.

---

## Current Configuration

### Existing Variables (`.env.example`)
```env
# Elasticsearch configuration (server-only)
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=your_api_key_here

# PostgreSQL configuration (server-only)
DATABASE_URL=postgres://username:password@host:5432/database
```

### Status
- ✅ ES_URL - Already configured
- ✅ ES_API_KEY - Already configured
- ✅ DATABASE_URL - Already configured
- ❓ SEO_ES_INDEX - Optional (hardcoded to `seo_meta_data`)

---

## New Configuration (Optional)

### Option 1: Use Existing Config (Recommended)

**No changes needed.** SEO service uses same ES credentials:
- `ES_URL` → ElasticSearch cluster URL
- `ES_API_KEY` → API key (same for all indexes)
- Index name hardcoded: `seo_meta_data`

**Pros:**
- Simple setup
- No additional env vars
- Consistent with existing services

**Cons:**
- Index name not configurable
- Requires code change to use different index

---

### Option 2: Add SEO-Specific Config (Optional)

If flexibility needed for different environments:

#### `.env.example` (Add)
```env
# SEO Metadata Configuration (optional - uses ES_URL/ES_API_KEY if not set)
SEO_ES_INDEX=seo_meta_data
```

#### Service Update
```typescript
// src/services/elasticsearch/seo-metadata-search-service.ts
const SEO_INDEX = import.meta.env.SEO_ES_INDEX || 'seo_meta_data';
```

**Pros:**
- Configurable index name per environment
- Useful for testing (staging vs production indexes)

**Cons:**
- Additional complexity
- More configuration to manage

---

## Recommendation

**Use Option 1 (Existing Config)** for initial implementation.

**Reasons:**
1. Simplicity - no new env vars
2. Consistency - matches location-search-service pattern
3. Sufficient - index name unlikely to change
4. Maintainable - fewer configuration points

**Add Option 2 only if:**
- Multiple environments need different indexes
- Testing requires separate SEO index
- Admin requests configurable index names

---

## Environment Setup

### Development (`.env`)
```env
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==
DATABASE_URL=postgres://user:pass@localhost:5432/tongkho_dev
```

### Staging (`.env.staging`)
```env
ES_URL=https://elastic-staging.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=staging_api_key_here
DATABASE_URL=postgres://user:pass@staging-db:5432/tongkho_staging
```

### Production (`.env.production`)
```env
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=production_api_key_here
DATABASE_URL=postgres://user:pass@prod-db:5432/tongkho
```

---

## Service Configuration

### ElasticSearch Service
```typescript
// src/services/elasticsearch/seo-metadata-search-service.ts

// Use existing environment variables
const ES_URL = import.meta.env.ES_URL || process.env.ES_URL || '';
const ES_API_KEY = import.meta.env.ES_API_KEY || process.env.ES_API_KEY || '';

// Hardcode index name (no env var needed)
const SEO_INDEX = 'seo_meta_data';
```

### Database Service
```typescript
// src/services/seo/seo-metadata-db-service.ts

// Uses Drizzle connection from @/db/db
// DATABASE_URL automatically loaded by Drizzle
import { db } from '@/db/db';
```

---

## Validation

### Startup Checks (Optional)

Add to `src/middleware.ts` or startup script:

```typescript
function validateSeoConfig() {
  const ES_URL = import.meta.env.ES_URL;
  const ES_API_KEY = import.meta.env.ES_API_KEY;
  const DATABASE_URL = import.meta.env.DATABASE_URL;

  const missing: string[] = [];

  if (!ES_URL) missing.push('ES_URL');
  if (!ES_API_KEY) missing.push('ES_API_KEY');
  if (!DATABASE_URL) missing.push('DATABASE_URL');

  if (missing.length > 0) {
    console.warn('[SeoConfig] Missing environment variables:', missing.join(', '));
    console.warn('[SeoConfig] SEO metadata service may fail');
  }
}

// Run on startup
validateSeoConfig();
```

---

## Testing Configuration

### Unit Tests (Vitest)
```typescript
// vitest.config.ts
export default {
  test: {
    env: {
      ES_URL: 'http://localhost:9200',
      ES_API_KEY: 'test_key',
      DATABASE_URL: 'postgres://test:test@localhost:5432/test_db'
    }
  }
}
```

### Integration Tests
```env
# .env.test
ES_URL=http://localhost:9200
ES_INDEX=real_estate_test
ES_API_KEY=test_api_key
DATABASE_URL=postgres://test:test@localhost:5432/tongkho_test
```

---

## Documentation

### README.md Update
```markdown
## Environment Variables

### Required
- `ES_URL` - ElasticSearch cluster URL
- `ES_API_KEY` - ElasticSearch API key
- `DATABASE_URL` - PostgreSQL connection string

### Optional
- `SEO_ES_INDEX` - SEO metadata index name (default: `seo_meta_data`)
```

### .env.example Update
```env
# Elasticsearch configuration (server-only)
ES_URL=https://elastic.tongkhobds.com
ES_INDEX=real_estate
ES_API_KEY=your_api_key_here

# PostgreSQL configuration (server-only)
DATABASE_URL=postgres://username:password@host:5432/database

# SEO Metadata (optional - uses ES_URL/ES_API_KEY)
# SEO_ES_INDEX=seo_meta_data
```

---

## Security Notes

### API Key Protection
- ✅ ES_API_KEY stored in `.env` (not committed)
- ✅ Never expose in client-side code
- ✅ Server-only access via `import.meta.env`

### Connection Strings
- ✅ DATABASE_URL contains credentials (never commit)
- ✅ Use environment-specific `.env` files
- ✅ Rotate credentials regularly

---

## Deployment Checklist

### Before Deploy
- ☐ Verify ES_URL points to correct cluster
- ☐ Verify ES_API_KEY has read access to `seo_meta_data` index
- ☐ Verify DATABASE_URL connection works
- ☐ Test SEO metadata queries in staging
- ☐ Confirm environment variables loaded correctly

### Vercel/Netlify
```bash
# Set environment variables via dashboard
ES_URL=https://elastic.tongkhobds.com
ES_API_KEY=your_production_key
DATABASE_URL=postgres://user:pass@host:5432/db
```

### Docker
```dockerfile
# Dockerfile
ENV ES_URL=${ES_URL}
ENV ES_API_KEY=${ES_API_KEY}
ENV DATABASE_URL=${DATABASE_URL}
```

---

## Troubleshooting

### ES Connection Failed
```
[SeoMetadataSearch] Missing ES_URL or ES_API_KEY
```
**Fix:** Set environment variables in `.env`

### Database Connection Failed
```
[SeoMetadataDB] Query failed: connection refused
```
**Fix:** Verify `DATABASE_URL` and database server status

### Wrong Index
```
[SeoMetadataSearch] No results found
```
**Fix:** Verify index name is `seo_meta_data` (or set `SEO_ES_INDEX`)

---

## Success Criteria

1. ✅ No new environment variables required (Option 1)
2. ✅ Existing ES credentials work for SEO index
3. ✅ Database connection uses existing config
4. ✅ Documentation updated in `.env.example`
5. ✅ Deployment checklist complete

---

## Next Steps

After Phase 7 completion:
→ Phase 8: Testing with correct environment configuration
→ Deploy to staging for QA
