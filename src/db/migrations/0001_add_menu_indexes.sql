-- Migration: Add indexes for menu query optimization
-- Created: 2026-02-06
-- Purpose: Optimize property_type and folder table queries for menu generation
--
-- Indexes added:
-- 1. idx_property_type_transaction_active - Composite index for transaction_type + aactive + parent_id
-- 2. idx_folder_parent_publish - Composite index for parent + publish
--
-- Expected performance improvement:
-- - Property type queries: ~50-80% faster (from full table scan to index scan)
-- - News folder queries: ~60-90% faster (from full table scan to index scan)

-- ============================================================================
-- Property Type Indexes
-- ============================================================================

-- Composite index for transaction type queries (used by fetchPropertyTypesByTransaction)
-- Covers: transaction_type = X AND aactive = true AND parent_id IS NULL
-- Query pattern: WHERE transaction_type = 1 AND aactive = true AND parent_id IS NULL
CREATE INDEX IF NOT EXISTS idx_property_type_transaction_active
ON property_type (transaction_type, aactive, parent_id)
WHERE aactive = true AND parent_id IS NULL;

-- Note: This is a partial index (filtered by WHERE clause) which makes it smaller and faster
-- It only indexes rows that match the WHERE condition (active and root types only)

-- ============================================================================
-- Folder Indexes
-- ============================================================================

-- Composite index for news folder queries (used by fetchNewsFolders)
-- Covers: parent = X AND publish = 'T'
-- Query pattern: WHERE parent = 11 AND publish = 'T' ORDER BY display_order
CREATE INDEX IF NOT EXISTS idx_folder_parent_publish
ON folder (parent, publish, display_order)
WHERE publish = 'T';

-- Note: This is also a partial index (filtered by publish = 'T')
-- Includes display_order for efficient sorting without additional lookup

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify indexes were created successfully:
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('property_type', 'folder') AND indexname LIKE 'idx_%menu%';

-- Check index usage stats (after running queries):
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE indexname IN ('idx_property_type_transaction_active', 'idx_folder_parent_publish');

-- Analyze query performance (before/after index):
-- EXPLAIN ANALYZE SELECT * FROM property_type WHERE transaction_type = 1 AND aactive = true AND parent_id IS NULL;
-- EXPLAIN ANALYZE SELECT * FROM folder WHERE parent = 11 AND publish = 'T' ORDER BY display_order;
