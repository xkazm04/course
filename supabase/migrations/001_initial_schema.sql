-- ============================================================================
-- Course Learning Platform - Initial Database Schema
-- Supabase (PostgreSQL) Migration
--
-- This schema supports:
-- 1. Hierarchical course categorization (Udemy-quality)
-- 2. Career Oracle AI-powered course discovery
-- 3. Knowledge Map visualization
-- 4. User progress tracking & gamification
-- 5. User/AI-generated course extension
--
-- NOTE: Job market tables removed - Career Oracle fetches externally
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ============================================================================
-- SECTION 1: TAXONOMY & CATEGORIZATION
-- Udemy-style hierarchical categorization
-- ============================================================================

-- Top-level categories (e.g., "Development", "Business", "Design")
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50), -- Lucide icon name
    color VARCHAR(7), -- Hex color code
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subcategories (e.g., "Web Development", "Mobile Development")
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

-- Topics (e.g., "React", "Node.js", "PostgreSQL")
CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subcategory_id UUID NOT NULL REFERENCES subcategories(id) ON DELETE CASCADE,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_trending BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(subcategory_id, slug)
);

-- ============================================================================
-- SECTION 2: SKILLS TAXONOMY
-- Comprehensive skill system for career matching (simplified for MVP)
-- ============================================================================

-- Skill categories for grouping
CREATE TYPE skill_category AS ENUM (
    'programming_language',
    'framework',
    'library',
    'tool',
    'platform',
    'database',
    'methodology',
    'soft_skill',
    'domain_knowledge'
);

CREATE TYPE skill_level AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
);

-- Master skills table (simplified - no market data)
CREATE TABLE skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category skill_category NOT NULL,
    icon VARCHAR(50),
    -- Learning metadata
    estimated_hours_to_learn INTEGER,
    difficulty skill_level DEFAULT 'intermediate',
    -- Search optimization
    aliases TEXT[], -- Alternative names (e.g., ["JS", "ECMAScript"] for JavaScript)
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill prerequisites (skill A requires skill B)
CREATE TABLE skill_prerequisites (
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE, -- Required vs recommended
    PRIMARY KEY (skill_id, prerequisite_skill_id),
    CHECK (skill_id != prerequisite_skill_id)
);

-- Related skills (complementary skills)
CREATE TABLE skill_relations (
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    related_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) DEFAULT 'complementary', -- complementary, alternative, specialization
    strength INTEGER CHECK (strength >= 1 AND strength <= 10), -- How related they are
    PRIMARY KEY (skill_id, related_skill_id),
    CHECK (skill_id != related_skill_id)
);

-- ============================================================================
-- SECTION 3: COURSES
-- Core course content structure with user/AI extension support
-- ============================================================================

CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
CREATE TYPE course_status AS ENUM ('draft', 'review', 'published', 'archived');
CREATE TYPE content_type AS ENUM ('video', 'lesson', 'interactive', 'exercise', 'quiz', 'project', 'article');

-- Main courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    -- Rich content
    long_description TEXT, -- Markdown supported
    what_you_will_learn TEXT[], -- Array of learning outcomes
    requirements TEXT[], -- Prerequisites text
    target_audience TEXT[], -- Who is this course for
    -- Categorization
    topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
    primary_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL,
    difficulty difficulty_level DEFAULT 'intermediate',
    -- Metadata
    language VARCHAR(10) DEFAULT 'en',
    status course_status DEFAULT 'draft',
    -- Metrics
    estimated_hours DECIMAL(5, 1),
    total_lessons INTEGER DEFAULT 0,
    total_quizzes INTEGER DEFAULT 0,
    total_projects INTEGER DEFAULT 0,
    -- Pricing (for future monetization)
    is_free BOOLEAN DEFAULT TRUE,
    price_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    -- Ratings
    avg_rating DECIMAL(2, 1) CHECK (avg_rating >= 0 AND avg_rating <= 5),
    rating_count INTEGER DEFAULT 0,
    enrollment_count INTEGER DEFAULT 0,
    -- Media
    thumbnail_url TEXT,
    preview_video_url TEXT,
    -- XP and gamification
    xp_reward INTEGER DEFAULT 100,
    -- User/AI extension fields
    is_user_created BOOLEAN DEFAULT FALSE,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    created_by_user_id UUID, -- References user_profiles(id), added after that table exists
    ai_generation_prompt TEXT,
    ai_confidence_score DECIMAL(3,2) CHECK (ai_confidence_score >= 0 AND ai_confidence_score <= 1),
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Search
    search_vector TSVECTOR
);

-- Skills taught by a course
CREATE TABLE course_skills (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_gained skill_level, -- Level you'll reach after completing
    is_primary BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (course_id, skill_id)
);

-- Course prerequisites (course A requires course B)
CREATE TABLE course_prerequisites (
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    prerequisite_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    is_required BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (course_id, prerequisite_course_id),
    CHECK (course_id != prerequisite_course_id)
);

-- ============================================================================
-- SECTION 4: CHAPTERS & SECTIONS
-- Course content hierarchy
-- ============================================================================

-- Chapters within a course
CREATE TABLE chapters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL,
    -- Metrics
    estimated_minutes INTEGER,
    xp_reward INTEGER DEFAULT 50,
    -- AI extension
    is_ai_generated BOOLEAN DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, slug),
    UNIQUE(course_id, sort_order)
);

-- Sections within a chapter
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    content_type content_type NOT NULL,
    sort_order INTEGER NOT NULL,
    -- Content
    content_json JSONB, -- Flexible content storage
    video_url TEXT,
    video_duration_seconds INTEGER,
    -- Metrics
    estimated_minutes INTEGER,
    xp_reward INTEGER DEFAULT 10,
    -- Free preview
    is_preview BOOLEAN DEFAULT FALSE,
    -- AI extension
    is_ai_generated BOOLEAN DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chapter_id, slug),
    UNIQUE(chapter_id, sort_order)
);

-- Concepts within a section (atomic learning units)
CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    slug VARCHAR(200) NOT NULL,
    title VARCHAR(500) NOT NULL,
    concept_type VARCHAR(50) NOT NULL, -- definition, example, practice, quiz-question
    content TEXT,
    content_json JSONB, -- Rich content
    sort_order INTEGER NOT NULL,
    -- Related concepts for knowledge graph
    related_concept_ids UUID[],
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section_id, slug)
);

-- ============================================================================
-- SECTION 5: LEARNING PATHS & CAREER GOALS
-- Career Oracle AI-powered learning paths
-- ============================================================================

CREATE TYPE path_type AS ENUM ('career', 'skill', 'certification', 'custom', 'ai_generated');
CREATE TYPE path_status AS ENUM ('draft', 'published', 'archived');

-- Learning paths (curated or AI-generated)
CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    description TEXT,
    -- Type and categorization
    path_type path_type NOT NULL,
    status path_status DEFAULT 'draft',
    -- Target outcomes
    target_role VARCHAR(255), -- e.g., "Full Stack Developer"
    target_industry VARCHAR(100),
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    -- Metrics
    estimated_weeks INTEGER,
    estimated_hours INTEGER,
    course_count INTEGER DEFAULT 0,
    skill_count INTEGER DEFAULT 0,
    -- AI metadata (for ai_generated paths)
    ai_confidence_score DECIMAL(3, 2), -- 0.00 to 1.00
    ai_reasoning TEXT,
    -- Media
    thumbnail_url TEXT,
    icon VARCHAR(50),
    color VARCHAR(7),
    -- Popularity
    enrollment_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5, 2),
    -- User extension
    created_by_user_id UUID, -- References user_profiles(id), added after that table exists
    -- Timestamps
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Courses within a learning path
CREATE TABLE learning_path_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT TRUE, -- Required vs elective
    -- Milestone info
    milestone_title VARCHAR(255), -- e.g., "Junior Developer Ready"
    milestone_description TEXT,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(learning_path_id, course_id),
    UNIQUE(learning_path_id, sort_order)
);

-- Skills gained from a learning path
CREATE TABLE learning_path_skills (
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_level skill_level,
    PRIMARY KEY (learning_path_id, skill_id)
);

-- Career goals (targets for path recommendation)
CREATE TABLE career_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL, -- e.g., "Become a Full Stack Developer"
    description TEXT,
    -- Market data
    avg_salary_min INTEGER,
    avg_salary_max INTEGER,
    avg_salary_median INTEGER,
    demand_level VARCHAR(20) CHECK (demand_level IN ('Low', 'Medium', 'High', 'Very High')),
    job_growth_rate DECIMAL(5, 2), -- Percentage
    -- Recommendations
    typical_duration_months INTEGER,
    typical_courses INTEGER,
    -- Related paths
    recommended_path_id UUID REFERENCES learning_paths(id) ON DELETE SET NULL,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skills required for career goals
CREATE TABLE career_goal_skills (
    career_goal_id UUID NOT NULL REFERENCES career_goals(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency_required skill_level NOT NULL,
    is_required BOOLEAN DEFAULT TRUE, -- Must have vs nice to have
    PRIMARY KEY (career_goal_id, skill_id)
);

-- ============================================================================
-- SECTION 6: USER PROFILES & PROGRESS
-- User data and learning progress
-- ============================================================================

-- Remote preference type (includes 'any' for user preferences)
CREATE TYPE remote_type AS ENUM ('no', 'hybrid', 'full', 'any');

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(100) UNIQUE,
    display_name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    -- Location
    city VARCHAR(100),
    country VARCHAR(100),
    timezone VARCHAR(50),
    -- Career info (renamed from current_role to avoid reserved keyword)
    job_title VARCHAR(255),
    target_role VARCHAR(255),
    experience_years INTEGER,
    -- Preferences
    weekly_hours INTEGER DEFAULT 10,
    learning_style VARCHAR(20) CHECK (learning_style IN ('video', 'text', 'project', 'interactive', 'mixed')),
    risk_tolerance VARCHAR(20) CHECK (risk_tolerance IN ('conservative', 'moderate', 'aggressive')),
    remote_preference remote_type DEFAULT 'any',
    -- Gamification
    total_xp INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    -- Timestamps
    last_activity_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraints now that user_profiles exists
ALTER TABLE courses ADD CONSTRAINT fk_courses_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

ALTER TABLE learning_paths ADD CONSTRAINT fk_learning_paths_created_by
    FOREIGN KEY (created_by_user_id) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- User skills (what the user knows)
CREATE TABLE user_skills (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 5),
    years_of_experience DECIMAL(4, 1),
    last_used_at DATE,
    -- How it was assessed
    assessment_type VARCHAR(50) DEFAULT 'self_reported', -- self_reported, quiz, project, verified
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, skill_id)
);

-- User course enrollments
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    -- Progress
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_sections INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 0,
    -- Status
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
    -- Timestamps
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ,
    -- Rating
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    UNIQUE(user_id, course_id)
);

-- User learning path enrollments
CREATE TABLE learning_path_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    learning_path_id UUID NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
    -- Progress
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    completed_courses INTEGER DEFAULT 0,
    -- Status
    status VARCHAR(20) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped')),
    -- Timestamps
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(user_id, learning_path_id)
);

-- Section progress (granular tracking)
CREATE TABLE section_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
    -- Progress
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    -- Video progress
    video_position_seconds INTEGER DEFAULT 0,
    -- Quiz data
    quiz_score INTEGER CHECK (quiz_score >= 0 AND quiz_score <= 100),
    quiz_attempts INTEGER DEFAULT 0,
    -- XP earned
    xp_earned INTEGER DEFAULT 0,
    -- Timestamps
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, section_id)
);

-- ============================================================================
-- SECTION 7: KNOWLEDGE MAP CONNECTIONS
-- Support for visual knowledge map
-- ============================================================================

CREATE TYPE connection_type AS ENUM ('contains', 'prerequisite', 'related', 'next', 'builds_upon', 'enables');

-- Course connections (for knowledge map)
CREATE TABLE course_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    to_course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    connection_type connection_type NOT NULL,
    weight INTEGER DEFAULT 1 CHECK (weight >= 1 AND weight <= 10),
    label VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_course_id, to_course_id, connection_type),
    CHECK (from_course_id != to_course_id)
);

-- Chapter connections (within course)
CREATE TABLE chapter_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    to_chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
    connection_type connection_type NOT NULL,
    weight INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_chapter_id, to_chapter_id, connection_type)
);

-- ============================================================================
-- SECTION 8: GAMIFICATION
-- Achievements, streaks, XP
-- ============================================================================

CREATE TYPE achievement_type AS ENUM ('course', 'path', 'streak', 'skill', 'milestone', 'special');

-- Achievement definitions
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    achievement_type achievement_type NOT NULL,
    -- Requirements
    requirement_json JSONB, -- Flexible requirements
    -- Rewards
    xp_reward INTEGER DEFAULT 0,
    badge_url TEXT,
    -- Rarity
    rarity VARCHAR(20) CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    -- Display
    icon VARCHAR(50),
    color VARCHAR(7),
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User achievements
CREATE TABLE user_achievements (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
    -- Progress
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    is_unlocked BOOLEAN DEFAULT FALSE,
    -- Timestamps
    unlocked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, achievement_id)
);

-- User daily activity (for streaks)
CREATE TABLE user_daily_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    -- Activity metrics
    minutes_learned INTEGER DEFAULT 0,
    sections_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    -- Daily goal
    daily_goal_minutes INTEGER DEFAULT 10,
    goal_met BOOLEAN DEFAULT FALSE,
    -- Streak freeze
    freeze_used BOOLEAN DEFAULT FALSE,
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, activity_date)
);

-- ============================================================================
-- SECTION 9: BOOKMARKS & NOTES
-- ============================================================================

-- User bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    -- Bookmarkable entity (polymorphic)
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('course', 'chapter', 'section', 'concept')),
    entity_id UUID NOT NULL,
    -- Content
    note TEXT,
    highlighted_text TEXT,
    tags TEXT[],
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 10: AI-GENERATED PATHS (Career Oracle)
-- Personalized path storage
-- ============================================================================

-- AI-generated personalized paths for users
CREATE TABLE user_generated_paths (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    -- Input context
    goal_description TEXT,
    target_role VARCHAR(255),
    target_industry VARCHAR(100),
    weekly_hours INTEGER,
    target_months INTEGER,
    focus_areas TEXT[],
    current_skills_snapshot JSONB, -- Snapshot of skills at generation time
    constraints_snapshot JSONB, -- Time, preferences, etc.
    -- Generated output
    generated_path JSONB NOT NULL, -- Full path structure with path_id and courses
    path_data JSONB, -- Legacy: Full path structure
    modules JSONB, -- Ordered modules
    milestones JSONB, -- Key milestones
    -- Metrics
    estimated_weeks INTEGER,
    estimated_hours INTEGER,
    confidence_score DECIMAL(3, 2),
    -- AI reasoning
    ai_reasoning TEXT,
    -- Market context
    market_timing_advice JSONB,
    matching_jobs_snapshot JSONB,
    risk_assessment JSONB,
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'superseded')),
    -- Timestamps
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ -- When the path should be regenerated
);

-- ============================================================================
-- SECTION 11: INDEXES
-- Performance optimization
-- ============================================================================

-- Full-text search indexes
CREATE INDEX idx_courses_search ON courses USING GIN(search_vector);
CREATE INDEX idx_skills_search ON skills USING GIN(search_vector);

-- Foreign key indexes (most important ones)
CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_topics_subcategory ON topics(subcategory_id);
CREATE INDEX idx_courses_topic ON courses(topic_id);
CREATE INDEX idx_courses_skill ON courses(primary_skill_id);
CREATE INDEX idx_chapters_course ON chapters(course_id);
CREATE INDEX idx_sections_chapter ON sections(chapter_id);
CREATE INDEX idx_concepts_section ON concepts(section_id);

-- User-related indexes
CREATE INDEX idx_enrollments_user ON enrollments(user_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_section_progress_user ON section_progress(user_id);
CREATE INDEX idx_user_skills_user ON user_skills(user_id);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- Learning path indexes
CREATE INDEX idx_path_courses_path ON learning_path_courses(learning_path_id);
CREATE INDEX idx_path_enrollments_user ON learning_path_enrollments(user_id);

-- Activity indexes
CREATE INDEX idx_daily_activity_user_date ON user_daily_activity(user_id, activity_date DESC);

-- User/AI extension indexes
CREATE INDEX idx_courses_user_created ON courses(is_user_created) WHERE is_user_created = TRUE;
CREATE INDEX idx_courses_ai_generated ON courses(is_ai_generated) WHERE is_ai_generated = TRUE;
CREATE INDEX idx_courses_created_by ON courses(created_by_user_id) WHERE created_by_user_id IS NOT NULL;

-- ============================================================================
-- SECTION 12: FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skills_updated_at BEFORE UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update course search vector
CREATE OR REPLACE FUNCTION update_course_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.subtitle, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.long_description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_course_search BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW EXECUTE FUNCTION update_course_search_vector();

-- Function to update skill search vector
CREATE OR REPLACE FUNCTION update_skill_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(array_to_string(NEW.aliases, ' '), '')), 'A');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_skill_search BEFORE INSERT OR UPDATE ON skills
    FOR EACH ROW EXECUTE FUNCTION update_skill_search_vector();

-- Function to calculate user level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp INTEGER)
RETURNS INTEGER AS $$
BEGIN
    -- Level formula: Level = floor(sqrt(xp / 100)) + 1
    -- Level 1: 0-99 XP
    -- Level 2: 100-399 XP
    -- Level 3: 400-899 XP, etc.
    RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update user level when XP changes
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_level := calculate_level(NEW.total_xp);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_level_trigger BEFORE UPDATE OF total_xp ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_user_level();

-- ============================================================================
-- SECTION 13: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on user tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_generated_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;

-- User profile policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User skills policies
CREATE POLICY "Users can view own skills" ON user_skills
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own skills" ON user_skills
    FOR ALL USING (auth.uid() = user_id);

-- Enrollments policies
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own enrollments" ON enrollments
    FOR ALL USING (auth.uid() = user_id);

-- Section progress policies
CREATE POLICY "Users can view own progress" ON section_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own progress" ON section_progress
    FOR ALL USING (auth.uid() = user_id);

-- User generated paths policies
CREATE POLICY "Users can view own generated paths" ON user_generated_paths
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own generated paths" ON user_generated_paths
    FOR ALL USING (auth.uid() = user_id);

-- Public read access for catalog tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to categories" ON categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to subcategories" ON subcategories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to topics" ON topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to courses" ON courses FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Public read access to chapters" ON chapters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to sections" ON sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to skills" ON skills FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read access to learning_paths" ON learning_paths FOR SELECT TO anon, authenticated USING (status = 'published');

-- Course creation/update policies
CREATE POLICY "Authenticated users can create courses" ON courses
    FOR INSERT TO authenticated
    WITH CHECK (
        created_by_user_id = auth.uid() OR
        created_by_user_id IS NULL
    );

CREATE POLICY "Users can update own courses" ON courses
    FOR UPDATE TO authenticated
    USING (created_by_user_id = auth.uid())
    WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete own courses" ON courses
    FOR DELETE TO authenticated
    USING (created_by_user_id = auth.uid());

-- ============================================================================
-- SECTION 14: VIEWS
-- Convenient views for common queries
-- ============================================================================

-- Course overview with stats
CREATE VIEW course_overview AS
SELECT
    c.id,
    c.slug,
    c.title,
    c.subtitle,
    c.description,
    c.difficulty,
    c.estimated_hours,
    c.thumbnail_url,
    c.avg_rating,
    c.rating_count,
    c.enrollment_count,
    c.is_free,
    c.price_cents,
    c.status,
    c.is_user_created,
    c.is_ai_generated,
    t.name AS topic_name,
    sc.name AS subcategory_name,
    cat.name AS category_name,
    s.name AS primary_skill_name,
    (SELECT COUNT(*) FROM chapters ch WHERE ch.course_id = c.id) AS chapter_count,
    (SELECT COUNT(*) FROM sections sec
     JOIN chapters ch ON sec.chapter_id = ch.id
     WHERE ch.course_id = c.id) AS section_count
FROM courses c
LEFT JOIN topics t ON c.topic_id = t.id
LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
LEFT JOIN categories cat ON sc.category_id = cat.id
LEFT JOIN skills s ON c.primary_skill_id = s.id;

-- User learning summary
CREATE VIEW user_learning_summary AS
SELECT
    up.id AS user_id,
    up.display_name,
    up.total_xp,
    up.current_level,
    up.current_streak,
    (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = up.id AND e.status = 'completed') AS courses_completed,
    (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = up.id AND e.status = 'in_progress') AS courses_in_progress,
    (SELECT COUNT(*) FROM user_skills us WHERE us.user_id = up.id) AS skill_count,
    (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = up.id AND ua.is_unlocked = true) AS achievements_unlocked
FROM user_profiles up;

-- Simplified skill summary (no market data references)
CREATE VIEW skill_summary AS
SELECT
    s.id AS skill_id,
    s.name AS skill_name,
    s.category,
    s.difficulty,
    s.estimated_hours_to_learn,
    (SELECT COUNT(*) FROM course_skills cs WHERE cs.skill_id = s.id) AS course_count,
    (SELECT COUNT(*) FROM skill_prerequisites sp WHERE sp.skill_id = s.id) AS prerequisite_count
FROM skills s;

-- ============================================================================
-- DONE
-- ============================================================================
