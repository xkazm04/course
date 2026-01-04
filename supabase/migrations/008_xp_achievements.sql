-- ============================================================================
-- XP, Streak & Achievement System Enhancement
-- Migration 008: Exponential XP levels, chapter progress tracking, achievements
-- ============================================================================

-- ============================================================================
-- 1. UPDATE LEVEL CALCULATION FUNCTION (Exponential 0-50)
-- Formula: XP_required(level) = 100 * (level ^ 1.8)
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    level INTEGER := 1;
    cumulative NUMERIC := 0;
BEGIN
    -- Calculate cumulative XP thresholds until we exceed current XP
    WHILE cumulative <= xp AND level <= 50 LOOP
        cumulative := cumulative + (100 * POWER(level, 1.8));
        IF cumulative <= xp THEN
            level := level + 1;
        END IF;
    END LOOP;
    RETURN level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate XP needed to reach next level
CREATE OR REPLACE FUNCTION xp_to_next_level(current_xp INTEGER, current_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    level_start NUMERIC := 0;
    l INTEGER;
BEGIN
    -- Calculate XP at start of current level
    FOR l IN 1..(current_level - 1) LOOP
        level_start := level_start + (100 * POWER(l, 1.8));
    END LOOP;
    -- Return XP needed to complete current level
    RETURN CEIL((level_start + (100 * POWER(current_level, 1.8))) - current_xp);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate total XP required for a given level
CREATE OR REPLACE FUNCTION total_xp_for_level(target_level INTEGER)
RETURNS INTEGER AS $$
DECLARE
    total NUMERIC := 0;
    l INTEGER;
BEGIN
    FOR l IN 1..(target_level - 1) LOOP
        total := total + (100 * POWER(l, 1.8));
    END LOOP;
    RETURN CEIL(total);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 2. ADD CHAPTER PROGRESS TABLE
-- Track per-chapter completion and XP earned
-- ============================================================================

CREATE TABLE IF NOT EXISTS chapter_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    sections_completed INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, chapter_id)
);

-- Indexes for chapter progress
CREATE INDEX IF NOT EXISTS idx_chapter_progress_user ON chapter_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_chapter ON chapter_progress(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chapter_progress_status ON chapter_progress(status) WHERE status = 'completed';

-- RLS for chapter progress
ALTER TABLE chapter_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chapter progress" ON chapter_progress;
CREATE POLICY "Users can view own chapter progress" ON chapter_progress
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own chapter progress" ON chapter_progress;
CREATE POLICY "Users can manage own chapter progress" ON chapter_progress
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 3. UPDATE USER_PROFILES FOR STREAK TRACKING
-- ============================================================================

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ;

-- ============================================================================
-- 4. ENSURE USER_ACHIEVEMENTS HAS PROGRESS TRACKING
-- ============================================================================

-- Check if columns exist and add if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_achievements' AND column_name = 'progress') THEN
        ALTER TABLE user_achievements ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_achievements' AND column_name = 'is_unlocked') THEN
        ALTER TABLE user_achievements ADD COLUMN is_unlocked BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================================================
-- 5. SEED 6 ACHIEVEMENTS
-- ============================================================================

INSERT INTO achievements (slug, title, description, achievement_type, xp_reward, rarity, icon, color, requirement_json)
VALUES
    (
        'first-spark',
        'First Spark',
        'Complete your first chapter and ignite your learning journey',
        'course',
        50,
        'common',
        'Flame',
        '#FF6B35',
        '{"type": "chapters_completed", "count": 1}'::jsonb
    ),
    (
        'knowledge-seeker',
        'Knowledge Seeker',
        'Complete 10 chapters across different courses',
        'milestone',
        150,
        'uncommon',
        'BookOpen',
        '#06B6D4',
        '{"type": "chapters_completed", "count": 10}'::jsonb
    ),
    (
        'flame-keeper',
        'Flame Keeper',
        'Maintain a 5-day learning streak and prove your dedication',
        'streak',
        100,
        'uncommon',
        'Flame',
        '#F59E0B',
        '{"type": "streak_days", "count": 5}'::jsonb
    ),
    (
        'skill-forger',
        'Skill Forger',
        'Reach advanced proficiency in any skill',
        'skill',
        200,
        'rare',
        'Hammer',
        '#14B8A6',
        '{"type": "skill_proficiency", "level": "advanced", "count": 1}'::jsonb
    ),
    (
        'pathfinder',
        'Pathfinder',
        'Complete an entire learning path and master a new domain',
        'path',
        500,
        'epic',
        'Map',
        '#8B5CF6',
        '{"type": "learning_paths_completed", "count": 1}'::jsonb
    ),
    (
        'inferno',
        'Inferno',
        'Achieve a 30-day learning streak - you are unstoppable!',
        'streak',
        500,
        'legendary',
        'Zap',
        '#EF4444',
        '{"type": "streak_days", "count": 30}'::jsonb
    )
ON CONFLICT (slug) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    xp_reward = EXCLUDED.xp_reward,
    rarity = EXCLUDED.rarity,
    icon = EXCLUDED.icon,
    color = EXCLUDED.color,
    requirement_json = EXCLUDED.requirement_json;

-- ============================================================================
-- 6. TRIGGER TO AUTO-UPDATE CHAPTER PROGRESS TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_chapter_progress_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_chapter_progress_updated_at ON chapter_progress;
CREATE TRIGGER update_chapter_progress_updated_at
    BEFORE UPDATE ON chapter_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_chapter_progress_timestamp();

-- ============================================================================
-- 7. VIEW FOR ACHIEVEMENT PROGRESS
-- ============================================================================

CREATE OR REPLACE VIEW user_achievement_summary AS
SELECT
    up.id AS user_id,
    up.display_name,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = up.id AND ua.is_unlocked = true) AS unlocked_count,
    (SELECT COUNT(*) FROM achievements) AS total_count,
    (SELECT SUM(a.xp_reward) FROM user_achievements ua
     JOIN achievements a ON ua.achievement_id = a.id
     WHERE ua.user_id = up.id AND ua.is_unlocked = true) AS achievement_xp_earned
FROM user_profiles up;

-- ============================================================================
-- DONE
-- ============================================================================
