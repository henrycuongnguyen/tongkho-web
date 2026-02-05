---
title: "Elasticsearch Homepage Listings Integration"
description: "Replace mock data with real Elasticsearch data for homepage property listings"
status: completed
priority: P1
effort: 2h
branch: main
tags: [elasticsearch, ssr, homepage, api]
created: 2026-02-02
---

# Elasticsearch Homepage Listings Integration

## Overview

Replace mock property data on homepage with real data from Elasticsearch production server.

**ELK Config:**
- URL: `https://elastic.tongkhobds.com/real_estate`
- API Key: `OTFsazRaa0JXOHN1MG5HMGxGbU06Z2xBVDFnLWlSZC1VY2NNSVItcGtZQQ==`
- Mode: Server-Side Rendering (SSR)

## Current State

- Homepage uses `mockPropertiesForSale` and `mockPropertiesForRent` from `src/data/mock-properties.ts`
- Astro config: `output: "static"` (need to change to `hybrid` or `server`)
- No API/data fetching layer exists

## Phases

| Phase | Description | Status | Effort |
|-------|-------------|--------|--------|
| [Phase 1](./phase-01-setup-ssr-mode-and-environment-variables.md) | Setup SSR mode & environment | ✅ done | 30m |
| [Phase 2](./phase-02-create-elasticsearch-client-service.md) | Create Elasticsearch service | ✅ done | 45m |
| [Phase 3](./phase-03-integrate-elasticsearch-with-homepage.md) | Integrate with homepage | ✅ done | 30m |
| [Phase 4](./phase-04-testing-and-validation.md) | Testing & validation | ✅ done | 15m |

## Key Files

**To Create:**
- `src/services/elasticsearch.ts` - ES client service
- `.env` - API key storage

**To Modify:**
- `astro.config.mjs` - Enable hybrid/SSR mode
- `src/pages/index.astro` - Fetch real data
- `src/types/property.ts` - Add ES response types (if needed)

## Dependencies

- `@astrojs/node` adapter for SSR
- Environment variables support

## Success Criteria

- [x] Homepage loads property listings from Elasticsearch
- [x] SSR mode works correctly
- [x] API key secured in env vars
- [x] Fallback to mock data on error
- [x] No breaking changes to UI
