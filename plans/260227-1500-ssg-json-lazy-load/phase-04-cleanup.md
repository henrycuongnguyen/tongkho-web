# Phase 04: Cleanup & Optimization

```yaml
status: completed
priority: medium
effort: 1h
blockedBy: [phase-03]
```

## Overview

Remove deprecated API endpoints, optimize JSON files, add build validation.

## Files to Delete/Deprecate

| File | Action |
|------|--------|
| `src/pages/api/location/provinces.ts` | Delete or keep for fallback |
| `src/pages/api/location/districts.ts` | Delete or keep for fallback |

## Keep These Files

| File | Reason |
|------|--------|
| `src/services/location/location-service.ts` | Used by generator script |
| `src/pages/api/location/search.ts` | Autocomplete still needs API |
| `src/pages/api/location/top-searched.ts` | Analytics endpoint |

## Optimization Tasks

### 1. JSON Minification

```typescript
// In generate-locations.ts
JSON.stringify(data); // No pretty print = smaller files
```

### 2. Gzip Pre-compression (Optional)

```bash
# Add to build script
gzip -k public/data/**/*.json
```

### 3. Cache Headers

```typescript
// In astro.config.mjs or server middleware
// Add cache headers for /data/*.json
{
  headers: {
    '/data/*': {
      'Cache-Control': 'public, max-age=86400' // 1 day
    }
  }
}
```

### 4. Build Validation Script

```typescript
// scripts/validate-locations.ts
import fs from 'fs';
import path from 'path';

const dataDir = 'public/data';

// Check provinces exist
const provincesNew = JSON.parse(fs.readFileSync(`${dataDir}/provinces-new.json`, 'utf8'));
const provincesOld = JSON.parse(fs.readFileSync(`${dataDir}/provinces-old.json`, 'utf8'));

console.log(`✓ provinces-new.json: ${provincesNew.length} records`);
console.log(`✓ provinces-old.json: ${provincesOld.length} records`);

// Check districts folders
const districtsNew = fs.readdirSync(`${dataDir}/districts/new`).length;
const districtsOld = fs.readdirSync(`${dataDir}/districts/old`).length;

console.log(`✓ districts/new: ${districtsNew} files`);
console.log(`✓ districts/old: ${districtsOld} files`);

// Validate JSON format
function validateJson(filePath: string) {
  try {
    JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return true;
  } catch {
    return false;
  }
}
```

## Package.json Updates

```json
{
  "scripts": {
    "generate:locations": "tsx scripts/generate-locations.ts",
    "validate:locations": "tsx scripts/validate-locations.ts",
    "prebuild": "npm run generate:locations && npm run validate:locations"
  }
}
```

## Testing Checklist

- [ ] Build completes without errors
- [ ] JSON files generated correctly
- [ ] Client fetch works in browser
- [ ] Toggle switches version instantly
- [ ] Cascade loading works (province → district → ward)
- [ ] No console errors
- [ ] Network tab shows JSON requests (not API)
- [ ] Cache hit on second request

## Rollback Plan

If issues occur:
1. Restore API endpoints from git
2. Re-enable HTMX attributes
3. Remove client scripts
4. Keep JSON generation for future use

## TODO

- [x] Decide: delete or deprecate API endpoints
- [x] Add JSON minification
- [x] Add cache headers config
- [x] Create validation script
- [x] Update package.json scripts
- [x] Test full build pipeline
- [x] Document rollback procedure
