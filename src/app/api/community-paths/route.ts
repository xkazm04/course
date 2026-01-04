// ============================================================================
// Community Paths API
// GET /api/community-paths - List community learning paths with filters
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Types matching frontend expectations
type PathDomain = "frontend" | "backend" | "fullstack" | "data" | "devops" | "mobile" | "design" | "ai-ml"
type PathDifficulty = "beginner" | "intermediate" | "advanced" | "mixed"
type PathType = "career" | "skill" | "custom" | "ai_generated"

interface CommunityPathChapter {
    id: string
    title: string
    description: string | null
    sortOrder: number
    estimatedMinutes: number
    xpReward: number
}

interface CommunityPathCourse {
    id: string
    title: string
    description: string | null
    sortOrder: number
    estimatedHours: number
    chapterCount: number
    chapters: CommunityPathChapter[]
}

interface CommunityPathCreator {
    id: string
    displayName: string
    avatarUrl: string | null
}

interface CommunityPath {
    id: string
    slug: string
    title: string
    subtitle: string | null
    description: string | null
    domain: PathDomain
    difficulty: PathDifficulty
    pathType: PathType
    estimatedHours: number
    courseCount: number
    chapterCount: number
    enrollmentCount: number
    creator: CommunityPathCreator | null
    courses: CommunityPathCourse[]
    createdAt: string
    isEnrolled: boolean
}

interface CommunityPathsResponse {
    paths: CommunityPath[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// Map database difficulty to frontend difficulty
function mapDifficulty(dbDifficulty: string | null): PathDifficulty {
    const map: Record<string, PathDifficulty> = {
        beginner: "beginner",
        intermediate: "intermediate",
        advanced: "advanced",
        expert: "advanced", // Map expert to advanced
    }
    return map[dbDifficulty || ""] || "mixed"
}

// Map database domain to frontend domain (handles null/missing domain)
function mapDomain(dbDomain: string | null): PathDomain {
    const validDomains: PathDomain[] = ["frontend", "backend", "fullstack", "data", "devops", "mobile", "design", "ai-ml"]
    if (dbDomain && validDomains.includes(dbDomain as PathDomain)) {
        return dbDomain as PathDomain
    }
    return "fullstack" // Default
}

// GET /api/community-paths
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        // Parse query parameters
        const domain = searchParams.get('domain')
        const difficulty = searchParams.get('difficulty')
        const duration = searchParams.get('duration')
        const sort = searchParams.get('sort') || 'popular'
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') || '1', 10)
        const limit = parseInt(searchParams.get('limit') || '20', 10)

        // Check if user is authenticated (for enrollment status)
        const { data: { user } } = await supabase.auth.getUser()

        // Build base query for counting and fetching
        let countQuery = supabase
            .from('learning_paths')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'published')

        let dataQuery = supabase
            .from('learning_paths')
            .select('*')
            .eq('status', 'published')

        // Apply domain filter
        if (domain && domain !== 'all') {
            countQuery = countQuery.eq('domain', domain)
            dataQuery = dataQuery.eq('domain', domain)
        }

        // Apply search filter
        if (search) {
            const searchFilter = `title.ilike.%${search}%,description.ilike.%${search}%,subtitle.ilike.%${search}%`
            countQuery = countQuery.or(searchFilter)
            dataQuery = dataQuery.or(searchFilter)
        }

        // Apply sorting
        switch (sort) {
            case 'popular':
                dataQuery = dataQuery.order('enrollment_count', { ascending: false, nullsFirst: false })
                break
            case 'recent':
                dataQuery = dataQuery.order('created_at', { ascending: false })
                break
            case 'duration_asc':
                dataQuery = dataQuery.order('estimated_hours', { ascending: true, nullsFirst: false })
                break
            case 'duration_desc':
                dataQuery = dataQuery.order('estimated_hours', { ascending: false, nullsFirst: false })
                break
            default:
                dataQuery = dataQuery.order('enrollment_count', { ascending: false, nullsFirst: false })
        }

        // Apply pagination
        const offset = (page - 1) * limit
        dataQuery = dataQuery.range(offset, offset + limit - 1)

        // Execute count query
        const { count: totalCount, error: countError } = await countQuery as unknown as { count: number | null; error: any }

        if (countError) {
            console.error('Count query error:', countError)
        }

        // Execute data query
        const { data: pathsData, error: pathsError } = await dataQuery as unknown as {
            data: Array<{
                id: string
                slug: string
                title: string
                subtitle: string | null
                description: string | null
                path_type: string
                domain: string | null
                estimated_hours: number | null
                course_count: number | null
                enrollment_count: number | null
                created_by_user_id: string | null
                created_at: string
            }> | null
            error: any
        }

        if (pathsError) {
            return NextResponse.json(
                { error: 'Failed to fetch paths', details: pathsError.message },
                { status: 500 }
            )
        }

        const paths = pathsData || []
        const pathIds = paths.map(p => p.id)

        // Skip further queries if no paths
        if (pathIds.length === 0) {
            const response: CommunityPathsResponse = {
                paths: [],
                pagination: {
                    page,
                    limit,
                    total: 0,
                    totalPages: 0
                }
            }
            return NextResponse.json(response)
        }

        // Fetch related data in parallel
        const [coursesResult, creatorsResult, enrollmentsResult] = await Promise.all([
            // Courses with chapters
            supabase
                .from('learning_path_courses')
                .select(`
                    learning_path_id,
                    sort_order,
                    course_id
                `)
                .in('learning_path_id', pathIds)
                .order('sort_order') as unknown as Promise<{
                    data: Array<{
                        learning_path_id: string
                        sort_order: number
                        course_id: string
                    }> | null
                    error: any
                }>,

            // Creators
            supabase
                .from('user_profiles')
                .select('id, display_name, avatar_url')
                .in('id', paths.map(p => p.created_by_user_id).filter(Boolean)) as unknown as Promise<{
                    data: Array<{
                        id: string
                        display_name: string | null
                        avatar_url: string | null
                    }> | null
                    error: any
                }>,

            // User enrollments (if authenticated)
            user
                ? supabase
                    .from('learning_path_enrollments')
                    .select('learning_path_id')
                    .eq('user_id', user.id)
                    .in('learning_path_id', pathIds) as unknown as Promise<{
                        data: Array<{ learning_path_id: string }> | null
                        error: any
                    }>
                : Promise.resolve({ data: [], error: null })
        ])

        // Get course IDs and fetch course details + chapters
        const courseIds = Array.from(new Set((coursesResult.data || []).map(c => c.course_id)))

        let coursesData: Array<{
            id: string
            title: string
            description: string | null
            estimated_hours: number | null
            difficulty: string | null
        }> = []
        let chaptersData: Array<{
            id: string
            course_id: string
            title: string
            description: string | null
            sort_order: number
            estimated_minutes: number | null
            xp_reward: number | null
        }> = []

        if (courseIds.length > 0) {
            const [coursesDetailResult, chaptersResult] = await Promise.all([
                supabase
                    .from('courses')
                    .select('id, title, description, estimated_hours, difficulty')
                    .in('id', courseIds) as unknown as Promise<{
                        data: typeof coursesData | null
                        error: any
                    }>,
                supabase
                    .from('chapters')
                    .select('id, course_id, title, description, sort_order, estimated_minutes, xp_reward')
                    .in('course_id', courseIds)
                    .order('sort_order') as unknown as Promise<{
                        data: typeof chaptersData | null
                        error: any
                    }>
            ])

            coursesData = coursesDetailResult.data || []
            chaptersData = chaptersResult.data || []
        }

        // Build creators map
        const creatorsMap = new Map<string, CommunityPathCreator>()
        for (const creator of creatorsResult.data || []) {
            creatorsMap.set(creator.id, {
                id: creator.id,
                displayName: creator.display_name || 'Unknown',
                avatarUrl: creator.avatar_url
            })
        }

        // Build enrolled paths set
        const enrolledPathIds = new Set((enrollmentsResult.data || []).map(e => e.learning_path_id))

        // Build courses map
        const coursesMap = new Map<string, typeof coursesData[0]>()
        for (const course of coursesData) {
            coursesMap.set(course.id, course)
        }

        // Build chapters by course map
        const chaptersByCourse = new Map<string, typeof chaptersData>()
        for (const chapter of chaptersData) {
            const existing = chaptersByCourse.get(chapter.course_id) || []
            existing.push(chapter)
            chaptersByCourse.set(chapter.course_id, existing)
        }

        // Build path courses map
        type PathCourseLink = { learning_path_id: string; sort_order: number; course_id: string }
        const pathCoursesMap = new Map<string, PathCourseLink[]>()
        for (const pc of coursesResult.data || []) {
            const existing = pathCoursesMap.get(pc.learning_path_id) || []
            existing.push(pc)
            pathCoursesMap.set(pc.learning_path_id, existing)
        }

        // Transform paths to response format
        let transformedPaths: CommunityPath[] = paths.map(path => {
            const pathCourseLinks = pathCoursesMap.get(path.id) || []

            // Build courses with chapters
            const courses: CommunityPathCourse[] = pathCourseLinks.map(pcl => {
                const course = coursesMap.get(pcl.course_id)
                const chapters = chaptersByCourse.get(pcl.course_id) || []

                return {
                    id: pcl.course_id,
                    title: course?.title || 'Unknown Course',
                    description: course?.description || null,
                    sortOrder: pcl.sort_order,
                    estimatedHours: course?.estimated_hours || 0,
                    chapterCount: chapters.length,
                    chapters: chapters.map(ch => ({
                        id: ch.id,
                        title: ch.title,
                        description: ch.description,
                        sortOrder: ch.sort_order,
                        estimatedMinutes: ch.estimated_minutes || 0,
                        xpReward: ch.xp_reward || 0
                    }))
                }
            })

            // Calculate totals
            const totalHours = courses.reduce((sum, c) => sum + c.estimatedHours, 0)
            const totalChapters = courses.reduce((sum, c) => sum + c.chapterCount, 0)

            // Determine difficulty from courses (if not set at path level)
            let pathDifficulty: PathDifficulty = "mixed"
            const courseDifficulties = courses
                .map(c => {
                    const course = coursesMap.get(c.id)
                    return course?.difficulty
                })
                .filter(Boolean)

            if (courseDifficulties.length > 0) {
                const uniqueDifficulties = Array.from(new Set(courseDifficulties))
                if (uniqueDifficulties.length === 1) {
                    pathDifficulty = mapDifficulty(uniqueDifficulties[0]!)
                }
            }

            return {
                id: path.id,
                slug: path.slug,
                title: path.title,
                subtitle: path.subtitle,
                description: path.description,
                domain: mapDomain(path.domain),
                difficulty: pathDifficulty,
                pathType: (path.path_type || 'custom') as PathType,
                estimatedHours: path.estimated_hours || totalHours,
                courseCount: courses.length,
                chapterCount: totalChapters,
                enrollmentCount: path.enrollment_count || 0,
                creator: path.created_by_user_id ? creatorsMap.get(path.created_by_user_id) || null : null,
                courses,
                createdAt: path.created_at,
                isEnrolled: enrolledPathIds.has(path.id)
            }
        })

        // Apply client-side filters that require computed data
        // Difficulty filter (needs course data to determine)
        if (difficulty && difficulty !== 'all') {
            transformedPaths = transformedPaths.filter(p => p.difficulty === difficulty)
        }

        // Duration filter
        if (duration && duration !== 'any') {
            transformedPaths = transformedPaths.filter(p => {
                switch (duration) {
                    case 'short':
                        return p.estimatedHours < 10
                    case 'medium':
                        return p.estimatedHours >= 10 && p.estimatedHours < 30
                    case 'long':
                        return p.estimatedHours >= 30 && p.estimatedHours < 60
                    case 'extended':
                        return p.estimatedHours >= 60
                    default:
                        return true
                }
            })
        }

        const total = totalCount || transformedPaths.length
        const totalPages = Math.ceil(total / limit)

        const response: CommunityPathsResponse = {
            paths: transformedPaths,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Community Paths GET error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
