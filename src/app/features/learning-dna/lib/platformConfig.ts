/**
 * Platform Configuration
 *
 * Defines configuration for each supported external platform,
 * including OAuth settings, API endpoints, and scoring weights.
 */

import type { ExternalPlatform, PlatformConnection } from './types';

// ============================================================================
// PLATFORM CONFIGURATION
// ============================================================================

export interface PlatformConfig {
    /** Platform identifier */
    id: ExternalPlatform;
    /** Display name */
    displayName: string;
    /** Platform description */
    description: string;
    /** Icon identifier (Lucide icon name or custom) */
    icon: string;
    /** Brand color (CSS variable or hex) */
    color: string;
    /** Whether OAuth is supported */
    supportsOAuth: boolean;
    /** OAuth configuration if supported */
    oauth?: {
        authUrl: string;
        tokenUrl: string;
        scopes: string[];
        clientIdEnvVar: string;
    };
    /** API configuration */
    api?: {
        baseUrl: string;
        rateLimit: number; // requests per minute
    };
    /** Weight multiplier for DNA score calculation */
    scoreWeight: number;
    /** Skills this platform can validate */
    validatableSkills: string[];
}

/**
 * Configuration for all supported platforms
 */
export const PLATFORM_CONFIGS: Record<ExternalPlatform, PlatformConfig> = {
    github: {
        id: 'github',
        displayName: 'GitHub',
        description: 'Connect to import contributions, repositories, and coding activity',
        icon: 'Github',
        color: '#181717',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scopes: ['read:user', 'repo'],
            clientIdEnvVar: 'GITHUB_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://api.github.com',
            rateLimit: 60,
        },
        scoreWeight: 1.5,
        validatableSkills: [
            'git', 'javascript', 'typescript', 'python', 'rust', 'go',
            'react', 'vue', 'angular', 'node', 'devops', 'ci-cd'
        ],
    },
    stackoverflow: {
        id: 'stackoverflow',
        displayName: 'Stack Overflow',
        description: 'Connect to import reputation, badges, and answered questions',
        icon: 'HelpCircle',
        color: '#F48024',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://stackoverflow.com/oauth',
            tokenUrl: 'https://stackoverflow.com/oauth/access_token',
            scopes: ['read_inbox', 'private_info'],
            clientIdEnvVar: 'STACKOVERFLOW_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://api.stackexchange.com/2.3',
            rateLimit: 30,
        },
        scoreWeight: 1.2,
        validatableSkills: [
            'javascript', 'python', 'java', 'c#', 'sql', 'html', 'css',
            'react', 'angular', 'node', 'docker', 'kubernetes'
        ],
    },
    leetcode: {
        id: 'leetcode',
        displayName: 'LeetCode',
        description: 'Connect to import problem-solving stats and contest rankings',
        icon: 'Code2',
        color: '#FFA116',
        supportsOAuth: false, // LeetCode uses GraphQL API with username
        api: {
            baseUrl: 'https://leetcode.com/graphql',
            rateLimit: 20,
        },
        scoreWeight: 1.3,
        validatableSkills: [
            'algorithms', 'data-structures', 'dynamic-programming',
            'trees', 'graphs', 'arrays', 'strings', 'system-design'
        ],
    },
    coursera: {
        id: 'coursera',
        displayName: 'Coursera',
        description: 'Connect to import completed courses and certifications',
        icon: 'GraduationCap',
        color: '#0056D2',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://accounts.coursera.org/oauth2/v1/auth',
            tokenUrl: 'https://accounts.coursera.org/oauth2/v1/token',
            scopes: ['view_profile'],
            clientIdEnvVar: 'COURSERA_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://api.coursera.org/api',
            rateLimit: 60,
        },
        scoreWeight: 1.0,
        validatableSkills: [
            'machine-learning', 'data-science', 'python', 'deep-learning',
            'cloud-computing', 'business', 'leadership'
        ],
    },
    udemy: {
        id: 'udemy',
        displayName: 'Udemy',
        description: 'Connect to import completed courses and learning hours',
        icon: 'BookOpen',
        color: '#A435F0',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://www.udemy.com/api-2.0/oauth/authorize',
            tokenUrl: 'https://www.udemy.com/api-2.0/oauth/token',
            scopes: ['read'],
            clientIdEnvVar: 'UDEMY_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://www.udemy.com/api-2.0',
            rateLimit: 60,
        },
        scoreWeight: 0.8,
        validatableSkills: [
            'web-development', 'javascript', 'react', 'python',
            'data-science', 'mobile-development', 'design'
        ],
    },
    hackerrank: {
        id: 'hackerrank',
        displayName: 'HackerRank',
        description: 'Connect to import skill certifications and challenge completions',
        icon: 'Trophy',
        color: '#2EC866',
        supportsOAuth: false,
        api: {
            baseUrl: 'https://www.hackerrank.com/rest',
            rateLimit: 30,
        },
        scoreWeight: 1.1,
        validatableSkills: [
            'algorithms', 'data-structures', 'sql', 'python', 'java',
            'problem-solving', 'regex', 'functional-programming'
        ],
    },
    codewars: {
        id: 'codewars',
        displayName: 'Codewars',
        description: 'Connect to import kata completions and honor points',
        icon: 'Swords',
        color: '#B1361E',
        supportsOAuth: false,
        api: {
            baseUrl: 'https://www.codewars.com/api/v1',
            rateLimit: 30,
        },
        scoreWeight: 0.9,
        validatableSkills: [
            'javascript', 'python', 'ruby', 'java', 'c#', 'haskell',
            'functional-programming', 'algorithms'
        ],
    },
    linkedin: {
        id: 'linkedin',
        displayName: 'LinkedIn Learning',
        description: 'Connect to import skill assessments and completed courses',
        icon: 'Linkedin',
        color: '#0A66C2',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
            tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
            scopes: ['r_liteprofile', 'r_emailaddress'],
            clientIdEnvVar: 'LINKEDIN_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://api.linkedin.com/v2',
            rateLimit: 100,
        },
        scoreWeight: 0.9,
        validatableSkills: [
            'project-management', 'leadership', 'communication',
            'marketing', 'sales', 'data-analysis'
        ],
    },
    pluralsight: {
        id: 'pluralsight',
        displayName: 'Pluralsight',
        description: 'Connect to import skill IQ scores and completed paths',
        icon: 'Layers',
        color: '#F15B2A',
        supportsOAuth: true,
        oauth: {
            authUrl: 'https://app.pluralsight.com/oauth/authorize',
            tokenUrl: 'https://app.pluralsight.com/oauth/token',
            scopes: ['user-profile'],
            clientIdEnvVar: 'PLURALSIGHT_CLIENT_ID',
        },
        api: {
            baseUrl: 'https://api.pluralsight.com',
            rateLimit: 60,
        },
        scoreWeight: 1.0,
        validatableSkills: [
            'cloud-computing', 'azure', 'aws', 'security', 'devops',
            'software-development', 'data-professional'
        ],
    },
};

/**
 * Get platform configuration by ID
 */
export function getPlatformConfig(platform: ExternalPlatform): PlatformConfig {
    return PLATFORM_CONFIGS[platform];
}

/**
 * Get all platform configurations
 */
export function getAllPlatformConfigs(): PlatformConfig[] {
    return Object.values(PLATFORM_CONFIGS);
}

/**
 * Create initial platform connection state
 */
export function createInitialPlatformConnection(platform: ExternalPlatform): PlatformConnection {
    const config = getPlatformConfig(platform);
    return {
        platform,
        displayName: config.displayName,
        status: 'disconnected',
        supportsOAuth: config.supportsOAuth,
        icon: config.icon,
        color: config.color,
    };
}

/**
 * Get platforms that support OAuth
 */
export function getOAuthPlatforms(): PlatformConfig[] {
    return getAllPlatformConfigs().filter(p => p.supportsOAuth);
}

/**
 * Get platforms that require manual username entry
 */
export function getManualPlatforms(): PlatformConfig[] {
    return getAllPlatformConfigs().filter(p => !p.supportsOAuth);
}
