/**
 * Oracle Functional Tests
 * Tests the complete Oracle flow: questions, payload building, path generation, and acceptance
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    DomainId,
    ExperienceLevel,
    getBranchQuestions,
    getExperienceQuestion,
    buildOraclePayload,
    OracleAnswers,
    BEGINNER_QUESTIONS,
    INTERMEDIATE_QUESTIONS,
    ADVANCED_QUESTIONS,
    DOMAIN_QUESTION,
    EXPERIENCE_QUESTIONS,
    COMMITMENT_QUESTION,
} from '@/app/forge/map/lib/oracleQuestions';

// ============================================================================
// ORACLE QUESTIONS TESTS
// ============================================================================

describe('Oracle Questions Configuration', () => {
    describe('Domain Question', () => {
        it('should have all required domains', () => {
            const domainIds = DOMAIN_QUESTION.options?.map(o => o.id) || [];
            expect(domainIds).toContain('frontend');
            expect(domainIds).toContain('backend');
            expect(domainIds).toContain('fullstack');
            expect(domainIds).toContain('mobile');
            expect(domainIds).toContain('data');
            expect(domainIds).toContain('devops');
            expect(domainIds.length).toBe(6);
        });

        it('should have icons and descriptions for all domains', () => {
            DOMAIN_QUESTION.options?.forEach(option => {
                expect(option.icon).toBeTruthy();
                expect(option.label).toBeTruthy();
                expect(option.description).toBeTruthy();
            });
        });
    });

    describe('Experience Questions', () => {
        it('should have experience question for each domain', () => {
            const domains: DomainId[] = ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'devops'];
            domains.forEach(domain => {
                const question = getExperienceQuestion(domain);
                expect(question).toBeDefined();
                expect(question.id).toBe('experience');
                expect(question.options).toBeDefined();
                expect(question.options?.length).toBe(3); // beginner, intermediate, advanced
            });
        });

        it('should have beginner, intermediate, and advanced options for each domain', () => {
            const domains: DomainId[] = ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'devops'];
            domains.forEach(domain => {
                const question = getExperienceQuestion(domain);
                const optionIds = question.options?.map(o => o.id) || [];
                expect(optionIds).toContain('beginner');
                expect(optionIds).toContain('intermediate');
                expect(optionIds).toContain('advanced');
            });
        });
    });

    describe('Branch Questions', () => {
        it('should return beginner questions for beginner experience', () => {
            const questions = getBranchQuestions('beginner');
            expect(questions).toEqual(BEGINNER_QUESTIONS);
            expect(questions.length).toBe(3);
        });

        it('should return intermediate questions for intermediate experience', () => {
            const questions = getBranchQuestions('intermediate');
            expect(questions).toEqual(INTERMEDIATE_QUESTIONS);
            expect(questions.length).toBe(3);
        });

        it('should return advanced questions for advanced experience', () => {
            const questions = getBranchQuestions('advanced');
            expect(questions).toEqual(ADVANCED_QUESTIONS);
            expect(questions.length).toBe(3);
        });

        it('should have unique question IDs within each branch', () => {
            const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
            levels.forEach(level => {
                const questions = getBranchQuestions(level);
                const ids = questions.map(q => q.id);
                const uniqueIds = [...new Set(ids)];
                expect(ids.length).toBe(uniqueIds.length);
            });
        });

        it('should have options for all branch questions', () => {
            const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
            levels.forEach(level => {
                const questions = getBranchQuestions(level);
                questions.forEach(q => {
                    expect(q.options).toBeDefined();
                    expect(q.options!.length).toBeGreaterThan(0);
                });
            });
        });
    });

    describe('Commitment Question', () => {
        it('should have time commitment options', () => {
            expect(COMMITMENT_QUESTION.options).toBeDefined();
            expect(COMMITMENT_QUESTION.options!.length).toBe(4);
            const optionIds = COMMITMENT_QUESTION.options?.map(o => o.id) || [];
            expect(optionIds).toContain('casual');
            expect(optionIds).toContain('part_time');
            expect(optionIds).toContain('dedicated');
            expect(optionIds).toContain('immersive');
        });
    });
});

// ============================================================================
// PAYLOAD BUILDING TESTS
// ============================================================================

describe('Oracle Payload Building', () => {
    it('should build correct payload for beginner', () => {
        const answers: OracleAnswers = {
            domain: 'frontend',
            experience: 'beginner',
            branchAnswers: {
                'beginner_motivation': 'career_change',
                'beginner_learning_style': 'project_based',
                'beginner_concerns': ['time', 'difficulty'],
            },
            commitment: 'part_time',
            freeInput: 'I want to build my own website',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('frontend');
        expect(payload.experience_level).toBe('beginner');
        expect(payload.motivation).toBe('career_change');
        expect(payload.learning_style).toBe('project_based');
        expect(payload.concerns).toEqual(['time', 'difficulty']);
        expect(payload.commitment).toBe('part_time');
        expect(payload.additional_context).toBe('I want to build my own website');
        expect(payload.all_answers).toEqual(answers.branchAnswers);
    });

    it('should build correct payload for intermediate', () => {
        const answers: OracleAnswers = {
            domain: 'backend',
            experience: 'intermediate',
            branchAnswers: {
                'intermediate_situation': 'employed_stuck',
                'intermediate_challenge': 'system_design',
                'intermediate_goal': 'senior_role',
            },
            commitment: 'dedicated',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('backend');
        expect(payload.experience_level).toBe('intermediate');
        expect(payload.motivation).toBe('employed_stuck');
        expect(payload.challenge).toBe('system_design');
        expect(payload.goal).toBe('senior_role');
        expect(payload.commitment).toBe('dedicated');
    });

    it('should build correct payload for advanced', () => {
        const answers: OracleAnswers = {
            domain: 'devops',
            experience: 'advanced',
            branchAnswers: {
                'advanced_direction': 'architecture',
                'advanced_interest': 'ai_integration',
                'advanced_constraint': 'time',
            },
            commitment: 'casual',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('devops');
        expect(payload.experience_level).toBe('advanced');
        expect(payload.motivation).toBe('architecture'); // advanced_direction
        expect(payload.interest).toBe('ai_integration');
        expect(payload.constraint).toBe('time');
        expect(payload.commitment).toBe('casual');
    });

    it('should handle empty optional fields', () => {
        const answers: OracleAnswers = {
            domain: 'mobile',
            experience: 'beginner',
            branchAnswers: {},
            commitment: 'immersive',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('mobile');
        expect(payload.experience_level).toBe('beginner');
        expect(payload.commitment).toBe('immersive');
        expect(payload.additional_context).toBe('');
        expect(payload.all_answers).toEqual({});
    });

    it('should include all raw answers in all_answers', () => {
        const branchAnswers = {
            'some_question': 'answer1',
            'another_question': ['multi', 'select'],
            'third_question': 'single',
        };

        const answers: OracleAnswers = {
            domain: 'data',
            experience: 'intermediate',
            branchAnswers,
            commitment: 'part_time',
        };

        const payload = buildOraclePayload(answers);
        expect(payload.all_answers).toEqual(branchAnswers);
    });
});

// ============================================================================
// PATH STRUCTURE VALIDATION TESTS
// ============================================================================

describe('Oracle Path Structure Validation', () => {
    interface PathNode {
        id: string;
        name: string;
        description?: string;
        level: number;
        parent_id: string | null;
        difficulty?: string;
        estimated_hours?: number;
        order: number;
        is_existing: boolean;
    }

    interface OraclePath {
        id?: string;
        name: string;
        description?: string;
        node_ids: string[];
        nodes?: PathNode[];
        forge_suggestions: Array<{
            name: string;
            description: string;
            parent_slug: string;
        }>;
        estimated_weeks?: number;
        reasoning?: string;
        confidence?: number;
        color?: string;
    }

    function validatePathStructure(path: OraclePath): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check required fields
        if (!path.name || path.name.trim() === '') {
            errors.push('Path must have a name');
        }

        if (!path.nodes || path.nodes.length === 0) {
            errors.push('Path must have at least one node');
        }

        // Validate node structure
        const nodeIds = new Set<string>();
        path.nodes?.forEach((node, index) => {
            if (!node.id) {
                errors.push(`Node at index ${index} is missing an id`);
            } else if (nodeIds.has(node.id)) {
                errors.push(`Duplicate node id: ${node.id}`);
            } else {
                nodeIds.add(node.id);
            }

            if (!node.name || node.name.trim() === '') {
                errors.push(`Node ${node.id || index} is missing a name`);
            }

            if (typeof node.level !== 'number' || node.level < 0 || node.level > 2) {
                errors.push(`Node ${node.id || index} has invalid level: ${node.level}`);
            }

            if (typeof node.order !== 'number') {
                errors.push(`Node ${node.id || index} is missing order`);
            }
        });

        // Validate parent-child relationships
        path.nodes?.forEach(node => {
            if (node.parent_id !== null && !nodeIds.has(node.parent_id)) {
                errors.push(`Node ${node.id} references non-existent parent: ${node.parent_id}`);
            }

            // Level 0 nodes should have no parent
            if (node.level === 0 && node.parent_id !== null) {
                errors.push(`Level 0 node ${node.id} should not have a parent`);
            }

            // Level 1+ nodes should have a parent
            if (node.level > 0 && node.parent_id === null) {
                errors.push(`Level ${node.level} node ${node.id} should have a parent`);
            }
        });

        // Check confidence range
        if (path.confidence !== undefined && (path.confidence < 0 || path.confidence > 1)) {
            errors.push(`Invalid confidence value: ${path.confidence}`);
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    it('should validate a correct path structure', () => {
        const validPath: OraclePath = {
            id: 'path-1',
            name: 'React Fundamentals',
            description: 'Learn React from scratch',
            node_ids: [],
            nodes: [
                {
                    id: 'node-1',
                    name: 'Frontend Development',
                    level: 0,
                    parent_id: null,
                    order: 1,
                    is_existing: false,
                },
                {
                    id: 'node-2',
                    name: 'React Basics',
                    level: 1,
                    parent_id: 'node-1',
                    order: 1,
                    is_existing: false,
                },
                {
                    id: 'node-3',
                    name: 'Components',
                    level: 2,
                    parent_id: 'node-2',
                    order: 1,
                    is_existing: false,
                },
            ],
            forge_suggestions: [],
            estimated_weeks: 8,
            confidence: 0.85,
            color: '#6366f1',
        };

        const result = validatePathStructure(validPath);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('should detect missing path name', () => {
        const invalidPath: OraclePath = {
            name: '',
            node_ids: [],
            nodes: [
                { id: 'n1', name: 'Test', level: 0, parent_id: null, order: 1, is_existing: false },
            ],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path must have a name');
    });

    it('should detect missing nodes', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Path must have at least one node');
    });

    it('should detect duplicate node ids', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [
                { id: 'dup-id', name: 'Node 1', level: 0, parent_id: null, order: 1, is_existing: false },
                { id: 'dup-id', name: 'Node 2', level: 0, parent_id: null, order: 2, is_existing: false },
            ],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Duplicate node id'))).toBe(true);
    });

    it('should detect invalid parent references', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [
                { id: 'n1', name: 'Node 1', level: 0, parent_id: null, order: 1, is_existing: false },
                { id: 'n2', name: 'Node 2', level: 1, parent_id: 'non-existent', order: 1, is_existing: false },
            ],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('non-existent parent'))).toBe(true);
    });

    it('should detect level 0 node with parent', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [
                { id: 'n1', name: 'Node 1', level: 0, parent_id: 'n1', order: 1, is_existing: false },
            ],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('should not have a parent'))).toBe(true);
    });

    it('should detect level 1+ node without parent', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [
                { id: 'n1', name: 'Node 1', level: 1, parent_id: null, order: 1, is_existing: false },
            ],
            forge_suggestions: [],
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('should have a parent'))).toBe(true);
    });

    it('should detect invalid confidence value', () => {
        const invalidPath: OraclePath = {
            name: 'Test Path',
            node_ids: [],
            nodes: [
                { id: 'n1', name: 'Node 1', level: 0, parent_id: null, order: 1, is_existing: false },
            ],
            forge_suggestions: [],
            confidence: 1.5, // Invalid - should be 0-1
        };

        const result = validatePathStructure(invalidPath);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('Invalid confidence'))).toBe(true);
    });
});

// ============================================================================
// PATH ACCEPTANCE LOGIC TESTS
// ============================================================================

describe('Path Acceptance Logic', () => {
    function simulatePathAcceptance(path: any, domain: string) {
        const createdNodes: any[] = [];
        const skippedNodes: any[] = [];
        const generationJobs: any[] = [];

        const nodes = path.nodes || [];
        const nodeIdMap = new Map<string, string>();

        // Sort nodes by level
        const sortedNodes = [...nodes].sort((a: any, b: any) => a.level - b.level);

        for (const node of sortedNodes) {
            if (node.is_existing) {
                skippedNodes.push({
                    path_node_id: node.id,
                    name: node.name,
                    reason: 'Node already exists in the system',
                });
                nodeIdMap.set(node.id, node.id);
                continue;
            }

            if (node.level === 0 || node.level === 1) {
                // Create as course
                const courseId = `course-${node.id}`;
                createdNodes.push({
                    path_node_id: node.id,
                    map_node_id: courseId,
                    name: node.name,
                    type: 'course',
                    course_id: courseId,
                });
                nodeIdMap.set(node.id, courseId);
                generationJobs.push({
                    job_id: `job-${node.id}`,
                    node_id: courseId,
                    node_name: node.name,
                    status: 'pending',
                });
            } else if (node.level === 2) {
                // Create as chapter
                const parentCourseId = node.parent_id ? nodeIdMap.get(node.parent_id) : null;

                if (!parentCourseId) {
                    skippedNodes.push({
                        path_node_id: node.id,
                        name: node.name,
                        reason: 'Parent course not found',
                    });
                    continue;
                }

                const chapterId = `chapter-${node.id}`;
                createdNodes.push({
                    path_node_id: node.id,
                    map_node_id: chapterId,
                    name: node.name,
                    type: 'chapter',
                    chapter_id: chapterId,
                    course_id: parentCourseId,
                });
                nodeIdMap.set(node.id, chapterId);
                generationJobs.push({
                    job_id: `job-${node.id}`,
                    node_id: chapterId,
                    node_name: node.name,
                    status: 'pending',
                });
            }
        }

        return {
            success: true,
            batch_id: 'test-batch',
            path_id: path.id || 'generated-path-id',
            path_name: path.name,
            created_nodes: createdNodes,
            generation_jobs: generationJobs,
            skipped_nodes: skippedNodes,
            total_new_nodes: createdNodes.length,
            total_jobs: generationJobs.length,
        };
    }

    it('should create courses for level 0 and level 1 nodes', () => {
        const path = {
            id: 'test-path',
            name: 'Test Path',
            nodes: [
                { id: 'n1', name: 'Domain', level: 0, parent_id: null, order: 1, is_existing: false },
                { id: 'n2', name: 'Topic', level: 1, parent_id: 'n1', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        expect(result.created_nodes.length).toBe(2);
        expect(result.created_nodes[0].type).toBe('course');
        expect(result.created_nodes[1].type).toBe('course');
    });

    it('should create chapters for level 2 nodes', () => {
        const path = {
            id: 'test-path',
            name: 'Test Path',
            nodes: [
                { id: 'n1', name: 'Domain', level: 0, parent_id: null, order: 1, is_existing: false },
                { id: 'n2', name: 'Topic', level: 1, parent_id: 'n1', order: 1, is_existing: false },
                { id: 'n3', name: 'Subtopic', level: 2, parent_id: 'n2', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        expect(result.created_nodes.length).toBe(3);
        expect(result.created_nodes[2].type).toBe('chapter');
        expect(result.created_nodes[2].course_id).toBe('course-n2');
    });

    it('should skip existing nodes', () => {
        const path = {
            id: 'test-path',
            name: 'Test Path',
            nodes: [
                { id: 'n1', name: 'Existing Domain', level: 0, parent_id: null, order: 1, is_existing: true },
                { id: 'n2', name: 'New Topic', level: 1, parent_id: 'n1', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        expect(result.created_nodes.length).toBe(1);
        expect(result.skipped_nodes.length).toBe(1);
        expect(result.skipped_nodes[0].name).toBe('Existing Domain');
        expect(result.skipped_nodes[0].reason).toContain('already exists');
    });

    it('should skip level 2 nodes without valid parent', () => {
        const path = {
            id: 'test-path',
            name: 'Test Path',
            nodes: [
                { id: 'n1', name: 'Orphan Subtopic', level: 2, parent_id: 'non-existent', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        expect(result.created_nodes.length).toBe(0);
        expect(result.skipped_nodes.length).toBe(1);
        expect(result.skipped_nodes[0].reason).toContain('Parent course not found');
    });

    it('should create generation jobs for all new nodes', () => {
        const path = {
            id: 'test-path',
            name: 'Test Path',
            nodes: [
                { id: 'n1', name: 'Domain', level: 0, parent_id: null, order: 1, is_existing: false },
                { id: 'n2', name: 'Topic', level: 1, parent_id: 'n1', order: 1, is_existing: false },
                { id: 'n3', name: 'Subtopic', level: 2, parent_id: 'n2', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        expect(result.generation_jobs.length).toBe(3);
        expect(result.total_jobs).toBe(3);
        result.generation_jobs.forEach(job => {
            expect(job.status).toBe('pending');
        });
    });

    it('should handle complex path with mixed existing and new nodes', () => {
        const path = {
            id: 'test-path',
            name: 'Complex Path',
            nodes: [
                { id: 'n1', name: 'Domain', level: 0, parent_id: null, order: 1, is_existing: true },
                { id: 'n2', name: 'Topic 1', level: 1, parent_id: 'n1', order: 1, is_existing: false },
                { id: 'n3', name: 'Topic 2', level: 1, parent_id: 'n1', order: 2, is_existing: true },
                { id: 'n4', name: 'Subtopic 1.1', level: 2, parent_id: 'n2', order: 1, is_existing: false },
                { id: 'n5', name: 'Subtopic 2.1', level: 2, parent_id: 'n3', order: 1, is_existing: false },
            ],
        };

        const result = simulatePathAcceptance(path, 'frontend');

        // n1 skipped (existing), n2 created, n3 skipped (existing), n4 created, n5 created
        expect(result.created_nodes.length).toBe(3);
        expect(result.skipped_nodes.length).toBe(2);

        // Check n4 has correct parent (course-n2)
        const n4 = result.created_nodes.find(n => n.path_node_id === 'n4');
        expect(n4?.course_id).toBe('course-n2');

        // Check n5 has n3's id as parent (since n3 is existing)
        const n5 = result.created_nodes.find(n => n.path_node_id === 'n5');
        expect(n5?.course_id).toBe('n3'); // Existing nodes keep their original ID
    });
});

// ============================================================================
// STEPPER STATE MACHINE TESTS
// ============================================================================

describe('Oracle Stepper State Machine', () => {
    type StepId =
        | 'experience'
        | 'branch_1'
        | 'branch_2'
        | 'branch_3'
        | 'commitment'
        | 'free_input'
        | 'generating'
        | 'results';

    const BASE_STEPS: StepId[] = [
        'experience',
        'branch_1',
        'branch_2',
        'branch_3',
        'commitment',
        'free_input',
        'generating',
        'results',
    ];

    function getNextStep(currentStep: StepId): StepId {
        const currentIndex = BASE_STEPS.indexOf(currentStep);
        if (currentIndex < BASE_STEPS.length - 1) {
            return BASE_STEPS[currentIndex + 1];
        }
        return currentStep;
    }

    function getPrevStep(currentStep: StepId): StepId {
        const currentIndex = BASE_STEPS.indexOf(currentStep);
        if (currentIndex > 0) {
            return BASE_STEPS[currentIndex - 1];
        }
        return currentStep;
    }

    it('should progress through steps in correct order', () => {
        let step: StepId = 'experience';

        step = getNextStep(step);
        expect(step).toBe('branch_1');

        step = getNextStep(step);
        expect(step).toBe('branch_2');

        step = getNextStep(step);
        expect(step).toBe('branch_3');

        step = getNextStep(step);
        expect(step).toBe('commitment');

        step = getNextStep(step);
        expect(step).toBe('free_input');

        step = getNextStep(step);
        expect(step).toBe('generating');

        step = getNextStep(step);
        expect(step).toBe('results');
    });

    it('should not go past results', () => {
        const step = getNextStep('results');
        expect(step).toBe('results');
    });

    it('should go back through steps correctly', () => {
        let step: StepId = 'commitment';

        step = getPrevStep(step);
        expect(step).toBe('branch_3');

        step = getPrevStep(step);
        expect(step).toBe('branch_2');

        step = getPrevStep(step);
        expect(step).toBe('branch_1');

        step = getPrevStep(step);
        expect(step).toBe('experience');
    });

    it('should not go before experience', () => {
        const step = getPrevStep('experience');
        expect(step).toBe('experience');
    });

    it('should have exactly 8 steps', () => {
        expect(BASE_STEPS.length).toBe(8);
    });
});

// ============================================================================
// INTEGRATION FLOW TESTS
// ============================================================================

describe('Oracle Complete Flow Integration', () => {
    it('should complete beginner flow correctly', () => {
        // Simulate a complete beginner flow
        const answers: OracleAnswers = {
            domain: 'frontend',
            experience: 'beginner',
            branchAnswers: {
                'beginner_motivation': 'career_change',
                'beginner_learning_style': 'project_based',
                'beginner_concerns': ['time'],
            },
            commitment: 'part_time',
            freeInput: 'I want to become a frontend developer',
        };

        const payload = buildOraclePayload(answers);

        // Verify payload has all required fields
        expect(payload.domain).toBe('frontend');
        expect(payload.experience_level).toBe('beginner');
        expect(payload.commitment).toBe('part_time');
        expect(payload.additional_context).toBe('I want to become a frontend developer');

        // Verify branch-specific fields
        expect(payload.motivation).toBe('career_change');
        expect(payload.learning_style).toBe('project_based');
        expect(payload.concerns).toEqual(['time']);
    });

    it('should complete intermediate flow correctly', () => {
        const answers: OracleAnswers = {
            domain: 'backend',
            experience: 'intermediate',
            branchAnswers: {
                'intermediate_situation': 'employed_growing',
                'intermediate_challenge': 'system_design',
                'intermediate_goal': 'senior_role',
            },
            commitment: 'dedicated',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('backend');
        expect(payload.experience_level).toBe('intermediate');
        expect(payload.challenge).toBe('system_design');
        expect(payload.goal).toBe('senior_role');
    });

    it('should complete advanced flow correctly', () => {
        const answers: OracleAnswers = {
            domain: 'devops',
            experience: 'advanced',
            branchAnswers: {
                'advanced_direction': 'technical_depth',
                'advanced_interest': 'ai_integration',
                'advanced_constraint': 'time',
            },
            commitment: 'casual',
        };

        const payload = buildOraclePayload(answers);

        expect(payload.domain).toBe('devops');
        expect(payload.experience_level).toBe('advanced');
        expect(payload.interest).toBe('ai_integration');
        expect(payload.constraint).toBe('time');
    });

    it('should handle all domains', () => {
        const domains: DomainId[] = ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'devops'];

        domains.forEach(domain => {
            const answers: OracleAnswers = {
                domain,
                experience: 'beginner',
                branchAnswers: {},
                commitment: 'part_time',
            };

            const payload = buildOraclePayload(answers);
            expect(payload.domain).toBe(domain);
        });
    });

    it('should handle all experience levels', () => {
        const levels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];

        levels.forEach(experience => {
            const answers: OracleAnswers = {
                domain: 'frontend',
                experience,
                branchAnswers: {},
                commitment: 'part_time',
            };

            const payload = buildOraclePayload(answers);
            expect(payload.experience_level).toBe(experience);

            // Verify branch questions exist for this level
            const branchQuestions = getBranchQuestions(experience);
            expect(branchQuestions.length).toBe(3);
        });
    });
});
