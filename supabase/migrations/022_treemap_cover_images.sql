-- ============================================================================
-- Migration: Add cover_image_url to map_nodes
-- Purpose: Enable visual illustrations for domain and topic level territories
-- Date: 2026-01-27
-- ============================================================================

-- Add cover_image_url column for hero illustrations
ALTER TABLE map_nodes
ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(500) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN map_nodes.cover_image_url IS 'URL to cover illustration image for domain/topic cards in treemap navigator';

-- Create index for potential filtering by nodes with images
CREATE INDEX IF NOT EXISTS idx_map_nodes_has_cover_image
ON map_nodes ((cover_image_url IS NOT NULL))
WHERE cover_image_url IS NOT NULL;

-- ============================================================================
-- Example data updates (commented out - for reference)
-- ============================================================================

-- UPDATE map_nodes SET cover_image_url = 'https://example.com/frontend-cover.jpg' WHERE slug = 'frontend';
-- UPDATE map_nodes SET cover_image_url = 'https://example.com/backend-cover.jpg' WHERE slug = 'backend';

-- ============================================================================
-- Rollback (if needed)
-- ============================================================================
-- DROP INDEX IF EXISTS idx_map_nodes_has_cover_image;
-- ALTER TABLE map_nodes DROP COLUMN IF EXISTS cover_image_url;
