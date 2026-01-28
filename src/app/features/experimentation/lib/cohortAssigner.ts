/**
 * Cohort Assigner
 *
 * Deterministic user-to-variant assignment using MurmurHash3.
 * Ensures the same user always gets the same variant for a given experiment.
 */

import type {
    Experiment,
    ExperimentVariant,
    CohortAssignment,
    BucketInfo,
    CachedAssignment,
} from "./types";

// ============================================================================
// MurmurHash3 Implementation
// ============================================================================

/**
 * MurmurHash3 32-bit implementation
 * Produces a uniformly distributed hash for deterministic bucketing
 */
function murmurhash3_32(key: string, seed: number = 0): number {
    const remainder = key.length & 3; // key.length % 4
    const bytes = key.length - remainder;
    let h1 = seed;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;

    while (i < bytes) {
        let k1 =
            (key.charCodeAt(i) & 0xff) |
            ((key.charCodeAt(++i) & 0xff) << 8) |
            ((key.charCodeAt(++i) & 0xff) << 16) |
            ((key.charCodeAt(++i) & 0xff) << 24);
        ++i;

        k1 = Math.imul(k1, c1);
        k1 = (k1 << 15) | (k1 >>> 17);
        k1 = Math.imul(k1, c2);

        h1 ^= k1;
        h1 = (h1 << 13) | (h1 >>> 19);
        h1 = Math.imul(h1, 5) + 0xe6546b64;
    }

    let k1 = 0;

    switch (remainder) {
        case 3:
            k1 ^= (key.charCodeAt(i + 2) & 0xff) << 16;
        // falls through
        case 2:
            k1 ^= (key.charCodeAt(i + 1) & 0xff) << 8;
        // falls through
        case 1:
            k1 ^= key.charCodeAt(i) & 0xff;
            k1 = Math.imul(k1, c1);
            k1 = (k1 << 15) | (k1 >>> 17);
            k1 = Math.imul(k1, c2);
            h1 ^= k1;
    }

    h1 ^= key.length;

    // Finalization
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    return h1 >>> 0; // Convert to unsigned 32-bit integer
}

// ============================================================================
// Cohort Assigner
// ============================================================================

/**
 * Default salt for hash computation
 */
const DEFAULT_SALT = "openforge_experimentation_v1";

/**
 * Assignment cache in memory (per-session)
 */
const assignmentCache = new Map<string, CachedAssignment>();

/**
 * Get cache key for an assignment
 */
function getCacheKey(experimentId: string, userId: string): string {
    return `${experimentId}:${userId}`;
}

/**
 * Compute hash for user+experiment combination
 */
export function computeHash(
    userId: string,
    experimentId: string,
    salt: string = DEFAULT_SALT
): number {
    const key = `${salt}:${experimentId}:${userId}`;
    return murmurhash3_32(key);
}

/**
 * Normalize hash to 0-1 range
 */
export function normalizeHash(hash: number): number {
    return hash / 0xffffffff;
}

/**
 * Build bucket boundaries from variants
 */
export function buildBuckets(
    variants: ExperimentVariant[]
): Array<{ variantId: string; start: number; end: number }> {
    const buckets: Array<{ variantId: string; start: number; end: number }> = [];
    let currentPosition = 0;

    for (const variant of variants) {
        const weight = variant.weight / 100; // Convert percentage to decimal
        buckets.push({
            variantId: variant.id,
            start: currentPosition,
            end: currentPosition + weight,
        });
        currentPosition += weight;
    }

    return buckets;
}

/**
 * Select variant based on normalized hash value
 */
export function selectVariant(
    normalizedValue: number,
    buckets: Array<{ variantId: string; start: number; end: number }>
): string {
    for (const bucket of buckets) {
        if (normalizedValue >= bucket.start && normalizedValue < bucket.end) {
            return bucket.variantId;
        }
    }
    // Fallback to last bucket (handles floating point edge cases)
    return buckets[buckets.length - 1].variantId;
}

/**
 * Check if user is in experiment traffic allocation
 */
export function isInTrafficAllocation(
    userId: string,
    experimentId: string,
    trafficAllocation: number
): boolean {
    if (trafficAllocation >= 100) return true;
    if (trafficAllocation <= 0) return false;

    // Use a different seed for traffic allocation check
    const hash = murmurhash3_32(`traffic:${experimentId}:${userId}`, 42);
    const normalized = normalizeHash(hash);
    return normalized < trafficAllocation / 100;
}

/**
 * Check if user matches targeting rules
 */
export function matchesTargeting(
    userId: string,
    targeting: Experiment["targeting"],
    context: {
        courseId?: string;
        domainId?: string;
        isNewUser?: boolean;
        sessionCount?: number;
        cohorts?: string[];
    }
): boolean {
    if (!targeting) return true;

    // User ID whitelist
    if (targeting.userIds && targeting.userIds.length > 0) {
        if (!targeting.userIds.includes(userId)) return false;
    }

    // Course targeting
    if (targeting.courseIds && targeting.courseIds.length > 0) {
        if (!context.courseId || !targeting.courseIds.includes(context.courseId)) {
            return false;
        }
    }

    // Domain targeting
    if (targeting.domainIds && targeting.domainIds.length > 0) {
        if (!context.domainId || !targeting.domainIds.includes(context.domainId)) {
            return false;
        }
    }

    // New users only
    if (targeting.newUsersOnly && !context.isNewUser) {
        return false;
    }

    // Returning users only
    if (targeting.returningUsersOnly && context.isNewUser) {
        return false;
    }

    // Minimum sessions
    if (targeting.minSessions && (context.sessionCount ?? 0) < targeting.minSessions) {
        return false;
    }

    // Cohort matching
    if (targeting.cohorts && targeting.cohorts.length > 0) {
        const userCohorts = context.cohorts ?? [];
        const hasMatch = targeting.cohorts.some((c) => userCohorts.includes(c));
        if (!hasMatch) return false;
    }

    return true;
}

/**
 * Assign user to a variant for an experiment
 *
 * This is the main entry point for cohort assignment.
 * Returns null if user is not eligible for the experiment.
 */
export function assignCohort(
    experiment: Experiment,
    userId: string,
    context: {
        courseId?: string;
        domainId?: string;
        isNewUser?: boolean;
        sessionCount?: number;
        cohorts?: string[];
    } = {}
): CohortAssignment | null {
    // Check experiment status
    if (experiment.status !== "running" && experiment.status !== "rolled_out") {
        return null;
    }

    // Check cache first
    const cacheKey = getCacheKey(experiment.id, userId);
    const cached = assignmentCache.get(cacheKey);
    if (cached && cached.experimentVersion === experiment.version) {
        return {
            experimentId: experiment.id,
            userId,
            variantId: cached.variantId,
            assignedAt: cached.assignedAt,
            hashValue: computeHash(userId, experiment.id),
            cached: true,
        };
    }

    // Check targeting rules
    if (!matchesTargeting(userId, experiment.targeting, context)) {
        return null;
    }

    // Check traffic allocation
    if (!isInTrafficAllocation(userId, experiment.id, experiment.trafficAllocation)) {
        return null;
    }

    // Compute deterministic hash
    const hash = computeHash(userId, experiment.id);
    const normalizedValue = normalizeHash(hash);

    // Build buckets and select variant
    const buckets = buildBuckets(experiment.variants);
    const variantId = selectVariant(normalizedValue, buckets);

    // Cache the assignment
    const assignment: CohortAssignment = {
        experimentId: experiment.id,
        userId,
        variantId,
        assignedAt: new Date().toISOString(),
        hashValue: hash,
        cached: false,
    };

    assignmentCache.set(cacheKey, {
        variantId,
        assignedAt: assignment.assignedAt,
        experimentVersion: experiment.version,
    });

    return assignment;
}

/**
 * Get detailed bucket info for debugging
 */
export function getBucketInfo(
    experiment: Experiment,
    userId: string
): BucketInfo {
    const hash = computeHash(userId, experiment.id);
    const normalizedValue = normalizeHash(hash);
    const buckets = buildBuckets(experiment.variants);
    const selectedVariant = selectVariant(normalizedValue, buckets);

    return {
        hash,
        normalizedValue,
        buckets,
        selectedVariant,
    };
}

/**
 * Clear assignment cache (useful for testing)
 */
export function clearAssignmentCache(): void {
    assignmentCache.clear();
}

/**
 * Get assignment from cache
 */
export function getCachedAssignment(
    experimentId: string,
    userId: string
): CachedAssignment | undefined {
    return assignmentCache.get(getCacheKey(experimentId, userId));
}

/**
 * Preload assignments into cache (from database)
 */
export function preloadAssignments(
    assignments: Array<{
        experimentId: string;
        userId: string;
        variantId: string;
        assignedAt: string;
        experimentVersion: number;
    }>
): void {
    for (const assignment of assignments) {
        const cacheKey = getCacheKey(assignment.experimentId, assignment.userId);
        assignmentCache.set(cacheKey, {
            variantId: assignment.variantId,
            assignedAt: assignment.assignedAt,
            experimentVersion: assignment.experimentVersion,
        });
    }
}

/**
 * Validate variant weights sum to 100
 */
export function validateVariantWeights(variants: ExperimentVariant[]): boolean {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    return Math.abs(totalWeight - 100) < 0.01; // Allow small floating point errors
}

/**
 * Ensure exactly one control variant exists
 */
export function validateControlVariant(variants: ExperimentVariant[]): boolean {
    const controlCount = variants.filter((v) => v.isControl).length;
    return controlCount === 1;
}
