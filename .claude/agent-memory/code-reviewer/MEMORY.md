# Code Reviewer Agent Memory

## ElasticSearch Query Patterns

### status_id Filtering
- **v1 uses string type**: `{"term": {"status_id": "3"}}` (lines 442, 490 in real_estate_handle.py)
- **v2 CHANGED to integer**: `{"term": {"status_id": 3}}` per user clarification
- **Critical**: User confirmed ES index stores status_id as INTEGER, not string
- **Pattern**: Use `should` with `minimum_should_match: 1` to include missing status_id fields

### Project vs Real Estate Index
- **transaction_type=3**: Uses `project` index, NOT `real_estate` index
- **Key pattern**: Wrap real_estate-only filters in `if (!isProjectQuery)` guard
- **v1-compatible filters apply ONLY to real_estate**: is_featured, created_time, status_id
- **Project index**: Different field mappings, no source_post field

## tongkho-web Project Context

### File Organization
- **ES Services**: `src/services/elasticsearch/`
- **v1 Reference**: `reference/tongkho_v1/modules/real_estate_handle.py`
- **Test Pattern**: Co-located `.test.ts` files with implementation

### Code Quality Standards
- 100% test pass rate required before review approval
- TypeScript compilation must succeed (build command)
- v1 parity verification mandatory for ES query changes
