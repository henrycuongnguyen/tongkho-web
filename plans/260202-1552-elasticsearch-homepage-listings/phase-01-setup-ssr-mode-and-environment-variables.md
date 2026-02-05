# Phase 1: Setup SSR Mode & Environment Variables

## Context

- **Parent Plan:** [plan.md](./plan.md)
- **Docs:** [system-architecture.md](../../docs/system-architecture.md), [code-standards.md](../../docs/code-standards.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P1 |
| Status | pending |
| Review | pending |

Enable SSR (Server-Side Rendering) in Astro and configure environment variables for Elasticsearch credentials.

## Key Insights

- Current Astro config uses `output: "static"` - all pages pre-rendered at build time
- Need to switch to `output: "hybrid"` to enable SSR for specific pages while keeping others static
- Astro supports `import.meta.env` for environment variables
- API key must NOT be exposed to client-side code

## Requirements

### Functional
- Enable hybrid SSR mode in Astro
- Configure environment variables for ES credentials
- Ensure API key only accessible server-side

### Non-functional
- No breaking changes to existing static pages
- Maintain build performance

## Architecture

```
.env (local) / .env.production (prod)
    ↓
import.meta.env.ES_URL
import.meta.env.ES_API_KEY
    ↓
src/services/elasticsearch.ts (server-only)
    ↓
src/pages/index.astro (SSR)
```

## Related Code Files

**To Modify:**
- `astro.config.mjs` - Add node adapter, change output mode

**To Create:**
- `.env` - Local environment variables
- `.env.example` - Template for env vars

## Implementation Steps

1. Install `@astrojs/node` adapter:
   ```bash
   npm install @astrojs/node
   ```

2. Update `astro.config.mjs`:
   ```javascript
   import node from '@astrojs/node';

   export default defineConfig({
     output: 'hybrid',
     adapter: node({ mode: 'standalone' }),
     // ... existing config
   });
   ```

3. Create `.env` file:
   ```
   ES_URL=https://elastic.tongkhobds.com
   ES_INDEX=real_estate
   ES_API_KEY=OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==
   ```

4. Create `.env.example` (without real key):
   ```
   ES_URL=https://elastic.tongkhobds.com
   ES_INDEX=real_estate
   ES_API_KEY=your_api_key_here
   ```

5. Add `.env` to `.gitignore` (if not already)

6. Define env types in `src/env.d.ts`:
   ```typescript
   interface ImportMetaEnv {
     readonly ES_URL: string;
     readonly ES_INDEX: string;
     readonly ES_API_KEY: string;
   }
   ```

## Todo List

- [ ] Install @astrojs/node adapter
- [ ] Update astro.config.mjs for hybrid mode
- [ ] Create .env file with ES credentials
- [ ] Create .env.example template
- [ ] Verify .env in .gitignore
- [ ] Add env type definitions

## Success Criteria

- [ ] `npm run dev` starts SSR server successfully
- [ ] `import.meta.env.ES_API_KEY` accessible in server code
- [ ] Static pages still work (non-SSR routes)
- [ ] `.env` not committed to git

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| SSR breaks existing pages | High | Use hybrid mode, only SSR index.astro |
| API key exposed | Critical | Server-only env vars, code review |
| Build fails | Medium | Test locally before commit |

## Security Considerations

- API key stored in `.env`, never committed
- Use `import.meta.env` (server-only by default for non-PUBLIC_ vars)
- Validate ES_URL to prevent SSRF

## Next Steps

After completing this phase, proceed to [Phase 2: Create Elasticsearch Service](./phase-02-create-elasticsearch-client-service.md)
