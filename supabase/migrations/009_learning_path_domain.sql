-- ============================================================================
-- Migration: Add domain field to learning_paths
-- Enables filtering by domain in Community Paths view
-- ============================================================================

-- Create domain enum type
CREATE TYPE path_domain AS ENUM (
    'frontend',
    'backend',
    'fullstack',
    'data',
    'devops',
    'mobile',
    'design',
    'ai-ml'
);

-- Add domain column to learning_paths
ALTER TABLE learning_paths
ADD COLUMN domain path_domain DEFAULT 'fullstack';

-- Create index for domain filtering
CREATE INDEX idx_learning_paths_domain ON learning_paths(domain);

-- Create index for status + domain compound queries
CREATE INDEX idx_learning_paths_status_domain ON learning_paths(status, domain);

-- Update existing paths based on target_role (best-effort mapping)
UPDATE learning_paths SET domain =
    CASE
        WHEN LOWER(target_role) LIKE '%frontend%' OR LOWER(target_role) LIKE '%react%' OR LOWER(target_role) LIKE '%vue%' THEN 'frontend'::path_domain
        WHEN LOWER(target_role) LIKE '%backend%' OR LOWER(target_role) LIKE '%api%' OR LOWER(target_role) LIKE '%server%' THEN 'backend'::path_domain
        WHEN LOWER(target_role) LIKE '%full stack%' OR LOWER(target_role) LIKE '%fullstack%' THEN 'fullstack'::path_domain
        WHEN LOWER(target_role) LIKE '%data%' OR LOWER(target_role) LIKE '%analytics%' OR LOWER(target_role) LIKE '%scientist%' THEN 'data'::path_domain
        WHEN LOWER(target_role) LIKE '%devops%' OR LOWER(target_role) LIKE '%sre%' OR LOWER(target_role) LIKE '%infrastructure%' THEN 'devops'::path_domain
        WHEN LOWER(target_role) LIKE '%mobile%' OR LOWER(target_role) LIKE '%ios%' OR LOWER(target_role) LIKE '%android%' THEN 'mobile'::path_domain
        WHEN LOWER(target_role) LIKE '%design%' OR LOWER(target_role) LIKE '%ux%' OR LOWER(target_role) LIKE '%ui%' THEN 'design'::path_domain
        WHEN LOWER(target_role) LIKE '%ai%' OR LOWER(target_role) LIKE '%ml%' OR LOWER(target_role) LIKE '%machine learning%' THEN 'ai-ml'::path_domain
        ELSE 'fullstack'::path_domain
    END
WHERE target_role IS NOT NULL;
