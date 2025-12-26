// ============================================================================
// Database Types
// Generated from Supabase schema - update using `supabase gen types typescript`
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// Enums
// ============================================================================

export type CourseStatus = 'draft' | 'published' | 'archived'
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type ContentType = 'video' | 'lesson' | 'interactive' | 'exercise' | 'quiz'
export type SkillCategory = 'programming_language' | 'framework' | 'library' | 'database' | 'tool' | 'platform' | 'methodology'
export type ConnectionType = 'prerequisite' | 'related' | 'next'
export type SkillRelation = 'complementary' | 'alternative' | 'subset' | 'superset'
export type PathType = 'career' | 'skill' | 'custom' | 'ai_generated'
export type DemandLevel = 'Low' | 'Medium' | 'High' | 'Very High'
export type Proficiency = 'beginner' | 'intermediate' | 'advanced' | 'expert'
export type AchievementType = 'course' | 'streak' | 'path' | 'skill' | 'special'
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'

// ============================================================================
// Tables
// ============================================================================

export interface Database {
  public: {
    Tables: {
      // Taxonomy
      categories: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          color: string | null
          sort_order: number
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          icon?: string | null
          color?: string | null
          sort_order?: number
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subcategories: {
        Row: {
          id: string
          category_id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          slug: string
          name: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          slug?: string
          name?: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          subcategory_id: string
          slug: string
          name: string
          description: string | null
          icon: string | null
          sort_order: number
          is_trending: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subcategory_id: string
          slug: string
          name: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_trending?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subcategory_id?: string
          slug?: string
          name?: string
          description?: string | null
          icon?: string | null
          sort_order?: number
          is_trending?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // Skills
      skills: {
        Row: {
          id: string
          slug: string
          name: string
          description: string | null
          category: SkillCategory
          icon: string | null
          estimated_hours_to_learn: number | null
          difficulty: Difficulty
          aliases: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description?: string | null
          category: SkillCategory
          icon?: string | null
          estimated_hours_to_learn?: number | null
          difficulty?: Difficulty
          aliases?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string | null
          category?: SkillCategory
          icon?: string | null
          estimated_hours_to_learn?: number | null
          difficulty?: Difficulty
          aliases?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      skill_prerequisites: {
        Row: {
          id: string
          skill_id: string
          prerequisite_skill_id: string
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          prerequisite_skill_id: string
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          prerequisite_skill_id?: string
          is_required?: boolean
          created_at?: string
        }
      }
      skill_relations: {
        Row: {
          id: string
          skill_id: string
          related_skill_id: string
          relation_type: SkillRelation
          strength: number
          created_at: string
        }
        Insert: {
          id?: string
          skill_id: string
          related_skill_id: string
          relation_type: SkillRelation
          strength?: number
          created_at?: string
        }
        Update: {
          id?: string
          skill_id?: string
          related_skill_id?: string
          relation_type?: SkillRelation
          strength?: number
          created_at?: string
        }
      }
      // Courses
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          description: string | null
          long_description: string | null
          topic_id: string | null
          primary_skill_id: string | null
          difficulty: Difficulty
          status: CourseStatus
          estimated_hours: number
          is_free: boolean
          xp_reward: number
          thumbnail_url: string | null
          preview_video_url: string | null
          what_you_will_learn: string[]
          requirements: string[]
          target_audience: string[]
          instructor_name: string | null
          instructor_bio: string | null
          instructor_avatar_url: string | null
          rating_avg: number | null
          rating_count: number
          enrollment_count: number
          // User/AI extension fields
          is_user_created: boolean
          is_ai_generated: boolean
          created_by_user_id: string | null
          ai_generation_prompt: string | null
          ai_confidence_score: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          description?: string | null
          long_description?: string | null
          topic_id?: string | null
          primary_skill_id?: string | null
          difficulty?: Difficulty
          status?: CourseStatus
          estimated_hours?: number
          is_free?: boolean
          xp_reward?: number
          thumbnail_url?: string | null
          preview_video_url?: string | null
          what_you_will_learn?: string[]
          requirements?: string[]
          target_audience?: string[]
          instructor_name?: string | null
          instructor_bio?: string | null
          instructor_avatar_url?: string | null
          rating_avg?: number | null
          rating_count?: number
          enrollment_count?: number
          is_user_created?: boolean
          is_ai_generated?: boolean
          created_by_user_id?: string | null
          ai_generation_prompt?: string | null
          ai_confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          long_description?: string | null
          topic_id?: string | null
          primary_skill_id?: string | null
          difficulty?: Difficulty
          status?: CourseStatus
          estimated_hours?: number
          is_free?: boolean
          xp_reward?: number
          thumbnail_url?: string | null
          preview_video_url?: string | null
          what_you_will_learn?: string[]
          requirements?: string[]
          target_audience?: string[]
          instructor_name?: string | null
          instructor_bio?: string | null
          instructor_avatar_url?: string | null
          rating_avg?: number | null
          rating_count?: number
          enrollment_count?: number
          is_user_created?: boolean
          is_ai_generated?: boolean
          created_by_user_id?: string | null
          ai_generation_prompt?: string | null
          ai_confidence_score?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      chapters: {
        Row: {
          id: string
          course_id: string
          slug: string
          title: string
          description: string | null
          sort_order: number
          estimated_minutes: number
          xp_reward: number
          is_ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          slug: string
          title: string
          description?: string | null
          sort_order?: number
          estimated_minutes?: number
          xp_reward?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          slug?: string
          title?: string
          description?: string | null
          sort_order?: number
          estimated_minutes?: number
          xp_reward?: number
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          chapter_id: string
          slug: string
          title: string
          description: string | null
          content_type: ContentType
          content_url: string | null
          content_data: Json | null
          sort_order: number
          estimated_minutes: number
          xp_reward: number
          is_preview: boolean
          is_ai_generated: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_id: string
          slug: string
          title: string
          description?: string | null
          content_type?: ContentType
          content_url?: string | null
          content_data?: Json | null
          sort_order?: number
          estimated_minutes?: number
          xp_reward?: number
          is_preview?: boolean
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string
          slug?: string
          title?: string
          description?: string | null
          content_type?: ContentType
          content_url?: string | null
          content_data?: Json | null
          sort_order?: number
          estimated_minutes?: number
          xp_reward?: number
          is_preview?: boolean
          is_ai_generated?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      concepts: {
        Row: {
          id: string
          section_id: string
          slug: string
          title: string
          concept_type: string
          content: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          section_id: string
          slug: string
          title: string
          concept_type?: string
          content?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          section_id?: string
          slug?: string
          title?: string
          concept_type?: string
          content?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      course_skills: {
        Row: {
          id: string
          course_id: string
          skill_id: string
          proficiency_gained: Proficiency
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          skill_id: string
          proficiency_gained?: Proficiency
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          skill_id?: string
          proficiency_gained?: Proficiency
          is_primary?: boolean
          created_at?: string
        }
      }
      course_prerequisites: {
        Row: {
          id: string
          course_id: string
          prerequisite_course_id: string
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          prerequisite_course_id: string
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          prerequisite_course_id?: string
          is_required?: boolean
          created_at?: string
        }
      }
      course_connections: {
        Row: {
          id: string
          from_course_id: string
          to_course_id: string
          connection_type: ConnectionType
          weight: number
          label: string | null
          created_at: string
        }
        Insert: {
          id?: string
          from_course_id: string
          to_course_id: string
          connection_type: ConnectionType
          weight?: number
          label?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          from_course_id?: string
          to_course_id?: string
          connection_type?: ConnectionType
          weight?: number
          label?: string | null
          created_at?: string
        }
      }
      // Learning Paths
      learning_paths: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          description: string | null
          path_type: PathType
          status: CourseStatus
          target_role: string | null
          estimated_weeks: number | null
          estimated_hours: number | null
          icon: string | null
          color: string | null
          created_by_user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          subtitle?: string | null
          description?: string | null
          path_type?: PathType
          status?: CourseStatus
          target_role?: string | null
          estimated_weeks?: number | null
          estimated_hours?: number | null
          icon?: string | null
          color?: string | null
          created_by_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          subtitle?: string | null
          description?: string | null
          path_type?: PathType
          status?: CourseStatus
          target_role?: string | null
          estimated_weeks?: number | null
          estimated_hours?: number | null
          icon?: string | null
          color?: string | null
          created_by_user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_path_courses: {
        Row: {
          id: string
          learning_path_id: string
          course_id: string
          sort_order: number
          is_required: boolean
          milestone_title: string | null
          milestone_description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          learning_path_id: string
          course_id: string
          sort_order?: number
          is_required?: boolean
          milestone_title?: string | null
          milestone_description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          learning_path_id?: string
          course_id?: string
          sort_order?: number
          is_required?: boolean
          milestone_title?: string | null
          milestone_description?: string | null
          created_at?: string
        }
      }
      learning_path_skills: {
        Row: {
          id: string
          learning_path_id: string
          skill_id: string
          proficiency_level: Proficiency
          created_at: string
        }
        Insert: {
          id?: string
          learning_path_id: string
          skill_id: string
          proficiency_level: Proficiency
          created_at?: string
        }
        Update: {
          id?: string
          learning_path_id?: string
          skill_id?: string
          proficiency_level?: Proficiency
          created_at?: string
        }
      }
      career_goals: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          avg_salary_min: number | null
          avg_salary_max: number | null
          avg_salary_median: number | null
          demand_level: DemandLevel | null
          job_growth_rate: number | null
          typical_duration_months: number | null
          typical_courses: number | null
          recommended_path_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          avg_salary_min?: number | null
          avg_salary_max?: number | null
          avg_salary_median?: number | null
          demand_level?: DemandLevel | null
          job_growth_rate?: number | null
          typical_duration_months?: number | null
          typical_courses?: number | null
          recommended_path_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          avg_salary_min?: number | null
          avg_salary_max?: number | null
          avg_salary_median?: number | null
          demand_level?: DemandLevel | null
          job_growth_rate?: number | null
          typical_duration_months?: number | null
          typical_courses?: number | null
          recommended_path_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      career_goal_skills: {
        Row: {
          id: string
          career_goal_id: string
          skill_id: string
          proficiency_required: Proficiency
          is_required: boolean
          created_at: string
        }
        Insert: {
          id?: string
          career_goal_id: string
          skill_id: string
          proficiency_required: Proficiency
          is_required?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          career_goal_id?: string
          skill_id?: string
          proficiency_required?: Proficiency
          is_required?: boolean
          created_at?: string
        }
      }
      // User Data
      user_profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          total_xp: number
          current_level: number
          current_streak: number
          longest_streak: number
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          total_xp?: number
          current_level?: number
          current_streak?: number
          longest_streak?: number
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_skills: {
        Row: {
          id: string
          user_id: string
          skill_id: string
          proficiency: Proficiency
          xp_earned: number
          last_practiced: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          skill_id: string
          proficiency?: Proficiency
          xp_earned?: number
          last_practiced?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          skill_id?: string
          proficiency?: Proficiency
          xp_earned?: number
          last_practiced?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: string
          progress_percent: number
          completed_sections: number
          total_sections: number
          last_section_id: string | null
          last_accessed_at: string | null
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: string
          progress_percent?: number
          completed_sections?: number
          total_sections?: number
          last_section_id?: string | null
          last_accessed_at?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: string
          progress_percent?: number
          completed_sections?: number
          total_sections?: number
          last_section_id?: string | null
          last_accessed_at?: string | null
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      section_progress: {
        Row: {
          id: string
          user_id: string
          section_id: string
          status: string
          video_position: number | null
          quiz_score: number | null
          exercise_completed: boolean
          xp_earned: number
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_id: string
          status?: string
          video_position?: number | null
          quiz_score?: number | null
          exercise_completed?: boolean
          xp_earned?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          status?: string
          video_position?: number | null
          quiz_score?: number | null
          exercise_completed?: boolean
          xp_earned?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Gamification
      achievements: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          achievement_type: AchievementType
          xp_reward: number
          rarity: Rarity
          icon: string | null
          color: string | null
          criteria: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          achievement_type: AchievementType
          xp_reward?: number
          rarity?: Rarity
          icon?: string | null
          color?: string | null
          criteria?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          achievement_type?: AchievementType
          xp_reward?: number
          rarity?: Rarity
          icon?: string | null
          color?: string | null
          criteria?: Json | null
          created_at?: string
        }
      }
      user_achievements: {
        Row: {
          id: string
          user_id: string
          achievement_id: string
          earned_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          achievement_id: string
          earned_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          achievement_id?: string
          earned_at?: string
          created_at?: string
        }
      }
      user_daily_activity: {
        Row: {
          id: string
          user_id: string
          activity_date: string
          minutes_learned: number
          sections_completed: number
          xp_earned: number
          streak_maintained: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_date: string
          minutes_learned?: number
          sections_completed?: number
          xp_earned?: number
          streak_maintained?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_date?: string
          minutes_learned?: number
          sections_completed?: number
          xp_earned?: number
          streak_maintained?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          user_id: string
          content_type: string
          content_id: string
          title: string | null
          notes: string | null
          highlighted_text: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          content_type: string
          content_id: string
          title?: string | null
          notes?: string | null
          highlighted_text?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          content_type?: string
          content_id?: string
          title?: string | null
          notes?: string | null
          highlighted_text?: string | null
          created_at?: string
        }
      }
      learning_path_enrollments: {
        Row: {
          id: string
          user_id: string
          learning_path_id: string
          status: string
          progress_percent: number
          current_course_index: number
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          learning_path_id: string
          status?: string
          progress_percent?: number
          current_course_index?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          learning_path_id?: string
          status?: string
          progress_percent?: number
          current_course_index?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_generated_paths: {
        Row: {
          id: string
          user_id: string
          goal_description: string
          weekly_hours: number | null
          target_months: number | null
          focus_areas: string[]
          generated_path: Json | null
          ai_reasoning: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_description: string
          weekly_hours?: number | null
          target_months?: number | null
          focus_areas?: string[]
          generated_path?: Json | null
          ai_reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_description?: string
          weekly_hours?: number | null
          target_months?: number | null
          focus_areas?: string[]
          generated_path?: Json | null
          ai_reasoning?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      course_overview: {
        Row: {
          id: string
          slug: string
          title: string
          subtitle: string | null
          description: string | null
          difficulty: Difficulty
          status: CourseStatus
          estimated_hours: number
          is_free: boolean
          xp_reward: number
          category_name: string | null
          subcategory_name: string | null
          topic_name: string | null
          chapter_count: number | null
          section_count: number | null
        }
      }
      skill_summary: {
        Row: {
          skill_id: string
          skill_name: string
          category: SkillCategory
          difficulty: Difficulty
          estimated_hours_to_learn: number | null
          course_count: number | null
          prerequisite_count: number | null
        }
      }
      user_learning_summary: {
        Row: {
          user_id: string
          display_name: string | null
          total_xp: number
          current_level: number
          current_streak: number
          courses_enrolled: number | null
          courses_completed: number | null
          paths_enrolled: number | null
          paths_completed: number | null
          achievements_earned: number | null
        }
      }
    }
    Functions: {
      calculate_level: {
        Args: { xp: number }
        Returns: number
      }
    }
  }
}

// ============================================================================
// Helper Types
// ============================================================================

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row']

// Common table types
export type Category = Tables<'categories'>
export type Subcategory = Tables<'subcategories'>
export type Topic = Tables<'topics'>
export type Skill = Tables<'skills'>
export type Course = Tables<'courses'>
export type Chapter = Tables<'chapters'>
export type Section = Tables<'sections'>
export type Concept = Tables<'concepts'>
export type LearningPath = Tables<'learning_paths'>
export type CareerGoal = Tables<'career_goals'>
export type UserProfile = Tables<'user_profiles'>
export type Enrollment = Tables<'enrollments'>
export type Achievement = Tables<'achievements'>

// View types
export type CourseOverview = Views<'course_overview'>
export type SkillSummary = Views<'skill_summary'>
export type UserLearningSummary = Views<'user_learning_summary'>
