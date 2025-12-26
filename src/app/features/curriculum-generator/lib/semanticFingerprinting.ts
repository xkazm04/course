/**
 * Semantic Fingerprinting Module
 *
 * Implements semantic similarity detection for curriculum cache optimization.
 * Maps skills to a shared concept space and enables partial cache hits based
 * on semantic overlap, reducing API calls while maintaining personalization.
 */

import type { CurriculumGenerationRequest, GeneratedCurriculum } from "./types";

// ============================================================================
// CONCEPT EMBEDDINGS
// ============================================================================

/**
 * Concept embedding in a shared semantic space.
 * Values represent affinity to core learning dimensions.
 */
export interface ConceptEmbedding {
    /** Concept/skill name */
    name: string;
    /** Normalized vector representation */
    vector: number[];
    /** Related concepts in the same domain */
    relatedConcepts: string[];
    /** Domain classification */
    domain: ConceptDomain;
}

/**
 * Domains for skill classification
 */
export type ConceptDomain =
    | "frontend"
    | "backend"
    | "database"
    | "devops"
    | "architecture"
    | "testing"
    | "security"
    | "mobile"
    | "ai_ml"
    | "general";

/**
 * Semantic fingerprint for a curriculum request
 */
export interface SemanticFingerprint {
    /** Unique fingerprint identifier */
    id: string;
    /** Combined embedding vector for the request */
    vector: number[];
    /** Skills included in this fingerprint */
    skills: string[];
    /** Domains represented */
    domains: ConceptDomain[];
    /** Difficulty level encoding */
    levelScore: number;
    /** Target role encoding */
    roleVector: number[];
    /** Hash for exact matching fallback */
    exactHash: string;
}

/**
 * Semantic cache match result
 */
export interface SemanticCacheMatch {
    /** Cache key of the matched entry */
    cacheKey: string;
    /** Similarity score (0-1) */
    similarity: number;
    /** Whether this is an exact match */
    isExactMatch: boolean;
    /** Skills that overlap */
    overlappingSkills: string[];
    /** Skills that need delta generation */
    missingSkills: string[];
    /** Skills in cache but not requested */
    extraSkills: string[];
    /** Matched curriculum (if available) */
    curriculum?: GeneratedCurriculum;
}

/**
 * Delta generation request for partial cache hits
 */
export interface DeltaGenerationRequest {
    /** Original request */
    originalRequest: CurriculumGenerationRequest;
    /** Skills to generate new content for */
    missingSkills: string[];
    /** Base curriculum to extend */
    baseCurriculum: GeneratedCurriculum;
    /** Similarity score that led to this delta */
    baseMatchSimilarity: number;
}

// ============================================================================
// CONCEPT EMBEDDING DATABASE
// ============================================================================

/**
 * Embedding dimension count (smaller for efficiency, expandable)
 */
const EMBEDDING_DIMENSIONS = 16;

/**
 * Pre-computed concept embeddings for common software development skills.
 * Vectors are normalized and represent semantic proximity in concept space.
 */
const CONCEPT_EMBEDDINGS: Record<string, ConceptEmbedding> = {
    // Frontend
    "react": {
        name: "react",
        vector: [0.9, 0.2, 0.1, 0.8, 0.3, 0.1, 0.0, 0.7, 0.2, 0.4, 0.1, 0.3, 0.8, 0.1, 0.2, 0.6],
        relatedConcepts: ["javascript", "jsx", "hooks", "components", "state management"],
        domain: "frontend"
    },
    "react hooks": {
        name: "react hooks",
        vector: [0.9, 0.2, 0.1, 0.9, 0.4, 0.1, 0.0, 0.8, 0.3, 0.5, 0.1, 0.4, 0.9, 0.1, 0.2, 0.7],
        relatedConcepts: ["react", "useState", "useEffect", "custom hooks"],
        domain: "frontend"
    },
    "usestate": {
        name: "usestate",
        vector: [0.9, 0.2, 0.1, 0.95, 0.4, 0.1, 0.0, 0.85, 0.3, 0.5, 0.1, 0.4, 0.9, 0.1, 0.2, 0.75],
        relatedConcepts: ["react hooks", "state management", "react"],
        domain: "frontend"
    },
    "useeffect": {
        name: "useeffect",
        vector: [0.9, 0.2, 0.1, 0.93, 0.45, 0.1, 0.0, 0.82, 0.35, 0.52, 0.1, 0.42, 0.88, 0.1, 0.22, 0.73],
        relatedConcepts: ["react hooks", "side effects", "lifecycle", "react"],
        domain: "frontend"
    },
    "javascript": {
        name: "javascript",
        vector: [0.8, 0.3, 0.2, 0.6, 0.5, 0.2, 0.1, 0.6, 0.3, 0.5, 0.2, 0.4, 0.7, 0.2, 0.3, 0.5],
        relatedConcepts: ["typescript", "es6", "dom", "async"],
        domain: "frontend"
    },
    "typescript": {
        name: "typescript",
        vector: [0.75, 0.35, 0.25, 0.65, 0.55, 0.25, 0.15, 0.55, 0.35, 0.55, 0.25, 0.45, 0.75, 0.2, 0.35, 0.55],
        relatedConcepts: ["javascript", "types", "interfaces", "generics"],
        domain: "frontend"
    },
    "vue": {
        name: "vue",
        vector: [0.85, 0.25, 0.15, 0.75, 0.35, 0.12, 0.02, 0.72, 0.22, 0.42, 0.12, 0.32, 0.78, 0.12, 0.22, 0.58],
        relatedConcepts: ["javascript", "components", "vuex", "composition api"],
        domain: "frontend"
    },
    "angular": {
        name: "angular",
        vector: [0.82, 0.28, 0.18, 0.72, 0.38, 0.15, 0.05, 0.68, 0.25, 0.45, 0.15, 0.35, 0.75, 0.15, 0.25, 0.55],
        relatedConcepts: ["typescript", "rxjs", "components", "dependency injection"],
        domain: "frontend"
    },
    "css": {
        name: "css",
        vector: [0.7, 0.1, 0.05, 0.5, 0.2, 0.05, 0.0, 0.9, 0.1, 0.2, 0.05, 0.1, 0.6, 0.05, 0.1, 0.8],
        relatedConcepts: ["html", "flexbox", "grid", "responsive design"],
        domain: "frontend"
    },
    "tailwind": {
        name: "tailwind",
        vector: [0.72, 0.12, 0.07, 0.52, 0.22, 0.07, 0.02, 0.88, 0.12, 0.22, 0.07, 0.12, 0.62, 0.07, 0.12, 0.78],
        relatedConcepts: ["css", "utility classes", "responsive design"],
        domain: "frontend"
    },

    // Backend
    "node.js": {
        name: "node.js",
        vector: [0.3, 0.9, 0.4, 0.5, 0.6, 0.3, 0.2, 0.3, 0.5, 0.6, 0.3, 0.5, 0.4, 0.3, 0.4, 0.4],
        relatedConcepts: ["javascript", "express", "npm", "async"],
        domain: "backend"
    },
    "express": {
        name: "express",
        vector: [0.32, 0.88, 0.42, 0.52, 0.58, 0.32, 0.22, 0.32, 0.52, 0.58, 0.32, 0.52, 0.42, 0.32, 0.42, 0.42],
        relatedConcepts: ["node.js", "rest api", "middleware", "routing"],
        domain: "backend"
    },
    "python": {
        name: "python",
        vector: [0.2, 0.8, 0.6, 0.4, 0.7, 0.4, 0.3, 0.2, 0.6, 0.7, 0.4, 0.6, 0.3, 0.5, 0.5, 0.3],
        relatedConcepts: ["django", "flask", "data science", "automation"],
        domain: "backend"
    },
    "django": {
        name: "django",
        vector: [0.22, 0.82, 0.58, 0.42, 0.68, 0.42, 0.32, 0.22, 0.58, 0.68, 0.42, 0.58, 0.32, 0.48, 0.48, 0.32],
        relatedConcepts: ["python", "orm", "rest api", "web framework"],
        domain: "backend"
    },
    "rest api": {
        name: "rest api",
        vector: [0.4, 0.85, 0.3, 0.5, 0.6, 0.3, 0.2, 0.3, 0.4, 0.7, 0.3, 0.5, 0.4, 0.3, 0.5, 0.4],
        relatedConcepts: ["http", "json", "endpoints", "crud"],
        domain: "backend"
    },
    "graphql": {
        name: "graphql",
        vector: [0.45, 0.82, 0.35, 0.55, 0.58, 0.35, 0.25, 0.35, 0.45, 0.68, 0.35, 0.55, 0.45, 0.35, 0.55, 0.45],
        relatedConcepts: ["api", "queries", "mutations", "schema"],
        domain: "backend"
    },

    // Database
    "sql": {
        name: "sql",
        vector: [0.1, 0.5, 0.95, 0.2, 0.4, 0.2, 0.1, 0.1, 0.3, 0.4, 0.2, 0.3, 0.2, 0.2, 0.3, 0.2],
        relatedConcepts: ["database", "queries", "joins", "indexes"],
        domain: "database"
    },
    "postgresql": {
        name: "postgresql",
        vector: [0.12, 0.52, 0.93, 0.22, 0.42, 0.22, 0.12, 0.12, 0.32, 0.42, 0.22, 0.32, 0.22, 0.22, 0.32, 0.22],
        relatedConcepts: ["sql", "database", "relational", "acid"],
        domain: "database"
    },
    "mongodb": {
        name: "mongodb",
        vector: [0.15, 0.55, 0.85, 0.25, 0.45, 0.25, 0.15, 0.15, 0.35, 0.45, 0.25, 0.35, 0.25, 0.25, 0.35, 0.25],
        relatedConcepts: ["nosql", "documents", "aggregation", "schema-less"],
        domain: "database"
    },
    "database design": {
        name: "database design",
        vector: [0.1, 0.5, 0.9, 0.3, 0.5, 0.3, 0.2, 0.1, 0.4, 0.5, 0.3, 0.4, 0.3, 0.3, 0.4, 0.3],
        relatedConcepts: ["normalization", "er diagrams", "schema", "relationships"],
        domain: "database"
    },

    // DevOps
    "docker": {
        name: "docker",
        vector: [0.2, 0.6, 0.3, 0.3, 0.7, 0.9, 0.4, 0.1, 0.5, 0.6, 0.7, 0.5, 0.2, 0.4, 0.6, 0.3],
        relatedConcepts: ["containers", "kubernetes", "devops", "deployment"],
        domain: "devops"
    },
    "kubernetes": {
        name: "kubernetes",
        vector: [0.22, 0.62, 0.32, 0.32, 0.72, 0.88, 0.42, 0.12, 0.52, 0.62, 0.72, 0.52, 0.22, 0.42, 0.62, 0.32],
        relatedConcepts: ["docker", "orchestration", "pods", "services"],
        domain: "devops"
    },
    "ci/cd": {
        name: "ci/cd",
        vector: [0.25, 0.58, 0.28, 0.28, 0.68, 0.85, 0.38, 0.08, 0.48, 0.58, 0.68, 0.48, 0.18, 0.38, 0.58, 0.28],
        relatedConcepts: ["pipelines", "automation", "deployment", "testing"],
        domain: "devops"
    },
    "git": {
        name: "git",
        vector: [0.5, 0.5, 0.2, 0.4, 0.6, 0.7, 0.3, 0.3, 0.4, 0.5, 0.5, 0.4, 0.4, 0.3, 0.5, 0.4],
        relatedConcepts: ["version control", "branching", "merge", "github"],
        domain: "devops"
    },

    // Testing
    "testing": {
        name: "testing",
        vector: [0.4, 0.4, 0.2, 0.3, 0.8, 0.4, 0.9, 0.2, 0.3, 0.5, 0.4, 0.4, 0.4, 0.6, 0.4, 0.3],
        relatedConcepts: ["unit tests", "integration tests", "tdd", "mocking"],
        domain: "testing"
    },
    "jest": {
        name: "jest",
        vector: [0.6, 0.3, 0.15, 0.5, 0.75, 0.35, 0.88, 0.4, 0.25, 0.45, 0.35, 0.35, 0.55, 0.55, 0.35, 0.45],
        relatedConcepts: ["testing", "mocking", "assertions", "javascript"],
        domain: "testing"
    },
    "unit testing": {
        name: "unit testing",
        vector: [0.42, 0.42, 0.22, 0.32, 0.82, 0.42, 0.92, 0.22, 0.32, 0.52, 0.42, 0.42, 0.42, 0.62, 0.42, 0.32],
        relatedConcepts: ["testing", "isolation", "mocking", "assertions"],
        domain: "testing"
    },

    // Architecture
    "system design": {
        name: "system design",
        vector: [0.3, 0.7, 0.5, 0.4, 0.8, 0.5, 0.3, 0.2, 0.6, 0.7, 0.5, 0.6, 0.3, 0.4, 0.7, 0.4],
        relatedConcepts: ["scalability", "microservices", "architecture", "distributed systems"],
        domain: "architecture"
    },
    "microservices": {
        name: "microservices",
        vector: [0.32, 0.72, 0.48, 0.42, 0.78, 0.52, 0.32, 0.22, 0.58, 0.68, 0.52, 0.58, 0.32, 0.42, 0.68, 0.42],
        relatedConcepts: ["system design", "api gateway", "service mesh", "containers"],
        domain: "architecture"
    },
    "design patterns": {
        name: "design patterns",
        vector: [0.5, 0.5, 0.3, 0.6, 0.7, 0.3, 0.4, 0.3, 0.5, 0.6, 0.4, 0.5, 0.5, 0.5, 0.6, 0.5],
        relatedConcepts: ["solid", "factory", "observer", "strategy"],
        domain: "architecture"
    },

    // Security
    "security": {
        name: "security",
        vector: [0.3, 0.5, 0.4, 0.3, 0.6, 0.4, 0.3, 0.2, 0.4, 0.5, 0.4, 0.4, 0.3, 0.3, 0.5, 0.3],
        relatedConcepts: ["authentication", "authorization", "encryption", "owasp"],
        domain: "security"
    },
    "authentication": {
        name: "authentication",
        vector: [0.35, 0.55, 0.45, 0.35, 0.65, 0.45, 0.35, 0.25, 0.45, 0.55, 0.45, 0.45, 0.35, 0.35, 0.55, 0.35],
        relatedConcepts: ["jwt", "oauth", "sessions", "security"],
        domain: "security"
    },

    // AI/ML
    "machine learning": {
        name: "machine learning",
        vector: [0.2, 0.4, 0.5, 0.3, 0.5, 0.3, 0.2, 0.1, 0.4, 0.5, 0.3, 0.4, 0.2, 0.8, 0.4, 0.2],
        relatedConcepts: ["python", "tensorflow", "models", "data science"],
        domain: "ai_ml"
    },
    "data science": {
        name: "data science",
        vector: [0.22, 0.42, 0.52, 0.32, 0.52, 0.32, 0.22, 0.12, 0.42, 0.52, 0.32, 0.42, 0.22, 0.78, 0.42, 0.22],
        relatedConcepts: ["python", "statistics", "visualization", "machine learning"],
        domain: "ai_ml"
    }
};

/**
 * Role embeddings for target role matching
 */
const ROLE_EMBEDDINGS: Record<string, number[]> = {
    "frontend developer": [0.95, 0.2, 0.1, 0.8, 0.4, 0.2, 0.3, 0.9, 0.2, 0.3],
    "backend developer": [0.2, 0.95, 0.6, 0.4, 0.6, 0.4, 0.4, 0.2, 0.5, 0.5],
    "full stack developer": [0.7, 0.7, 0.5, 0.6, 0.6, 0.4, 0.5, 0.6, 0.5, 0.5],
    "devops engineer": [0.2, 0.5, 0.4, 0.3, 0.7, 0.95, 0.4, 0.1, 0.6, 0.6],
    "data engineer": [0.15, 0.6, 0.9, 0.3, 0.6, 0.5, 0.3, 0.1, 0.5, 0.4],
    "data scientist": [0.2, 0.5, 0.7, 0.3, 0.5, 0.3, 0.3, 0.1, 0.4, 0.95],
    "software engineer": [0.5, 0.6, 0.4, 0.5, 0.7, 0.4, 0.5, 0.4, 0.5, 0.5],
    "machine learning engineer": [0.25, 0.55, 0.6, 0.35, 0.55, 0.4, 0.35, 0.15, 0.45, 0.9],
    "mobile developer": [0.7, 0.4, 0.2, 0.7, 0.5, 0.3, 0.4, 0.7, 0.3, 0.3],
    "qa engineer": [0.4, 0.4, 0.3, 0.4, 0.7, 0.4, 0.95, 0.3, 0.4, 0.3],
    "default": [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
};

/**
 * Difficulty level scores for encoding
 */
const LEVEL_SCORES: Record<string, number> = {
    "beginner": 0.25,
    "intermediate": 0.5,
    "advanced": 0.75,
    "expert": 1.0
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get or compute embedding for a skill/concept
 */
export function getConceptEmbedding(concept: string): ConceptEmbedding {
    const normalizedConcept = concept.toLowerCase().trim();

    // Direct match
    if (CONCEPT_EMBEDDINGS[normalizedConcept]) {
        return CONCEPT_EMBEDDINGS[normalizedConcept];
    }

    // Partial match - find best matching concept
    const matches = Object.keys(CONCEPT_EMBEDDINGS).filter(key =>
        key.includes(normalizedConcept) || normalizedConcept.includes(key)
    );

    if (matches.length > 0) {
        // Return the best match (shortest difference in length)
        const bestMatch = matches.reduce((best, current) =>
            Math.abs(current.length - normalizedConcept.length) <
            Math.abs(best.length - normalizedConcept.length) ? current : best
        );
        return CONCEPT_EMBEDDINGS[bestMatch];
    }

    // Generate a deterministic embedding for unknown concepts
    return generateFallbackEmbedding(normalizedConcept);
}

/**
 * Generate a deterministic embedding for unknown concepts
 */
function generateFallbackEmbedding(concept: string): ConceptEmbedding {
    // Create deterministic hash-based vector
    const vector: number[] = [];
    for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
        let hash = 0;
        for (let j = 0; j < concept.length; j++) {
            hash = ((hash << 5) - hash + concept.charCodeAt(j) + i) & 0xffffffff;
        }
        vector.push((Math.abs(hash) % 100) / 100);
    }

    // Determine domain based on keywords
    let domain: ConceptDomain = "general";
    const conceptLower = concept.toLowerCase();
    if (conceptLower.includes("react") || conceptLower.includes("vue") || conceptLower.includes("css") || conceptLower.includes("html")) {
        domain = "frontend";
    } else if (conceptLower.includes("api") || conceptLower.includes("server") || conceptLower.includes("node")) {
        domain = "backend";
    } else if (conceptLower.includes("sql") || conceptLower.includes("database") || conceptLower.includes("mongo")) {
        domain = "database";
    } else if (conceptLower.includes("docker") || conceptLower.includes("deploy") || conceptLower.includes("ci")) {
        domain = "devops";
    } else if (conceptLower.includes("test") || conceptLower.includes("jest") || conceptLower.includes("spec")) {
        domain = "testing";
    }

    return {
        name: concept,
        vector,
        relatedConcepts: [],
        domain
    };
}

/**
 * Get role embedding vector
 */
export function getRoleEmbedding(role: string): number[] {
    const normalizedRole = role.toLowerCase().trim();

    // Direct match
    if (ROLE_EMBEDDINGS[normalizedRole]) {
        return ROLE_EMBEDDINGS[normalizedRole];
    }

    // Partial match
    for (const [key, vector] of Object.entries(ROLE_EMBEDDINGS)) {
        if (normalizedRole.includes(key) || key.includes(normalizedRole)) {
            return vector;
        }
    }

    return ROLE_EMBEDDINGS["default"];
}

/**
 * Compute cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
        // Pad shorter vector
        const maxLen = Math.max(vecA.length, vecB.length);
        while (vecA.length < maxLen) vecA.push(0);
        while (vecB.length < maxLen) vecB.push(0);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Combine multiple embeddings into a single vector
 */
export function combineEmbeddings(embeddings: ConceptEmbedding[]): number[] {
    if (embeddings.length === 0) {
        return new Array(EMBEDDING_DIMENSIONS).fill(0);
    }

    const combined = new Array(EMBEDDING_DIMENSIONS).fill(0);

    for (const embedding of embeddings) {
        for (let i = 0; i < EMBEDDING_DIMENSIONS; i++) {
            combined[i] += embedding.vector[i] / embeddings.length;
        }
    }

    // Normalize
    const norm = Math.sqrt(combined.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
        for (let i = 0; i < combined.length; i++) {
            combined[i] /= norm;
        }
    }

    return combined;
}

/**
 * Generate a simple hash for exact matching fallback
 */
function generateHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

// ============================================================================
// SEMANTIC FINGERPRINT GENERATION
// ============================================================================

/**
 * Generate a semantic fingerprint for a curriculum request
 */
export function generateSemanticFingerprint(
    request: CurriculumGenerationRequest
): SemanticFingerprint {
    const { module, userProfile } = request;

    // Get embeddings for all skills
    const skillEmbeddings = module.skills.map(skill => getConceptEmbedding(skill));

    // Combine skill embeddings
    const combinedVector = combineEmbeddings(skillEmbeddings);

    // Get unique domains
    const domains = [...new Set(skillEmbeddings.map(e => e.domain))];

    // Get level score
    const levelScore = LEVEL_SCORES[userProfile.currentLevel] || 0.5;

    // Get role embedding
    const roleVector = getRoleEmbedding(userProfile.targetRole);

    // Generate exact hash for fallback
    const exactHash = generateHash([
        module.id,
        module.title,
        ...module.skills.sort(),
        userProfile.currentLevel,
        userProfile.targetRole,
        userProfile.learningStyle
    ].join("|"));

    return {
        id: `sf-${exactHash}`,
        vector: combinedVector,
        skills: module.skills,
        domains,
        levelScore,
        roleVector,
        exactHash
    };
}

/**
 * Compute similarity between two semantic fingerprints
 */
export function computeFingerprintSimilarity(
    fpA: SemanticFingerprint,
    fpB: SemanticFingerprint
): number {
    // Exact hash match
    if (fpA.exactHash === fpB.exactHash) {
        return 1.0;
    }

    // Weighted similarity components
    const vectorSimilarity = cosineSimilarity(fpA.vector, fpB.vector);
    const roleSimilarity = cosineSimilarity(fpA.roleVector, fpB.roleVector);
    const levelSimilarity = 1 - Math.abs(fpA.levelScore - fpB.levelScore);

    // Skill overlap
    const skillsA = new Set(fpA.skills.map(s => s.toLowerCase()));
    const skillsB = new Set(fpB.skills.map(s => s.toLowerCase()));
    const intersection = [...skillsA].filter(s => skillsB.has(s));
    const union = new Set([...skillsA, ...skillsB]);
    const jaccardSimilarity = union.size > 0 ? intersection.length / union.size : 0;

    // Domain overlap
    const domainsA = new Set(fpA.domains);
    const domainsB = new Set(fpB.domains);
    const domainIntersection = [...domainsA].filter(d => domainsB.has(d));
    const domainUnion = new Set([...domainsA, ...domainsB]);
    const domainSimilarity = domainUnion.size > 0 ? domainIntersection.length / domainUnion.size : 0;

    // Weighted combination
    const weights = {
        vector: 0.35,
        skills: 0.25,
        role: 0.15,
        level: 0.15,
        domain: 0.10
    };

    return (
        weights.vector * vectorSimilarity +
        weights.skills * jaccardSimilarity +
        weights.role * roleSimilarity +
        weights.level * levelSimilarity +
        weights.domain * domainSimilarity
    );
}

// ============================================================================
// SEMANTIC CACHE MATCHING
// ============================================================================

/**
 * Minimum similarity threshold for partial cache hits
 */
export const SEMANTIC_SIMILARITY_THRESHOLD = 0.70;

/**
 * Threshold for considering content fully reusable
 */
export const FULL_REUSE_THRESHOLD = 0.95;

/**
 * Find the best semantic match from cached entries
 */
export function findBestSemanticMatch(
    requestFingerprint: SemanticFingerprint,
    cachedFingerprints: Array<{ fingerprint: SemanticFingerprint; cacheKey: string; curriculum: GeneratedCurriculum }>
): SemanticCacheMatch | null {
    if (cachedFingerprints.length === 0) {
        return null;
    }

    let bestMatch: SemanticCacheMatch | null = null;
    let bestSimilarity = 0;

    for (const cached of cachedFingerprints) {
        const similarity = computeFingerprintSimilarity(
            requestFingerprint,
            cached.fingerprint
        );

        if (similarity >= SEMANTIC_SIMILARITY_THRESHOLD && similarity > bestSimilarity) {
            const requestSkills = new Set(requestFingerprint.skills.map(s => s.toLowerCase()));
            const cachedSkills = new Set(cached.fingerprint.skills.map(s => s.toLowerCase()));

            const overlapping = [...requestSkills].filter(s => cachedSkills.has(s));
            const missing = [...requestSkills].filter(s => !cachedSkills.has(s));
            const extra = [...cachedSkills].filter(s => !requestSkills.has(s));

            bestMatch = {
                cacheKey: cached.cacheKey,
                similarity,
                isExactMatch: similarity >= FULL_REUSE_THRESHOLD,
                overlappingSkills: overlapping,
                missingSkills: missing,
                extraSkills: extra,
                curriculum: cached.curriculum
            };
            bestSimilarity = similarity;
        }
    }

    return bestMatch;
}

/**
 * Determine if a match qualifies for delta regeneration
 */
export function shouldUseDeltaRegeneration(match: SemanticCacheMatch): boolean {
    // Use delta if we have a good match but some skills are missing
    return (
        match.similarity >= SEMANTIC_SIMILARITY_THRESHOLD &&
        !match.isExactMatch &&
        match.missingSkills.length > 0 &&
        match.missingSkills.length <= 3 // Only delta for small gaps
    );
}

/**
 * Create a delta generation request from a partial match
 */
export function createDeltaRequest(
    originalRequest: CurriculumGenerationRequest,
    match: SemanticCacheMatch
): DeltaGenerationRequest | null {
    if (!match.curriculum || !shouldUseDeltaRegeneration(match)) {
        return null;
    }

    return {
        originalRequest,
        missingSkills: match.missingSkills,
        baseCurriculum: match.curriculum,
        baseMatchSimilarity: match.similarity
    };
}

// ============================================================================
// EXPORTS FOR STORAGE INTEGRATION
// ============================================================================

export interface SemanticCacheMetadata {
    fingerprint: SemanticFingerprint;
    createdAt: string;
}

/**
 * Generate semantic metadata for a cache entry
 */
export function generateSemanticCacheMetadata(
    request: CurriculumGenerationRequest
): SemanticCacheMetadata {
    return {
        fingerprint: generateSemanticFingerprint(request),
        createdAt: new Date().toISOString()
    };
}

/**
 * Check if two requests are semantically similar
 */
export function areRequestsSemanticallySimilar(
    requestA: CurriculumGenerationRequest,
    requestB: CurriculumGenerationRequest,
    threshold: number = SEMANTIC_SIMILARITY_THRESHOLD
): boolean {
    const fpA = generateSemanticFingerprint(requestA);
    const fpB = generateSemanticFingerprint(requestB);
    return computeFingerprintSimilarity(fpA, fpB) >= threshold;
}

/**
 * Get semantic similarity score between two requests
 */
export function getRequestSimilarity(
    requestA: CurriculumGenerationRequest,
    requestB: CurriculumGenerationRequest
): number {
    const fpA = generateSemanticFingerprint(requestA);
    const fpB = generateSemanticFingerprint(requestB);
    return computeFingerprintSimilarity(fpA, fpB);
}
