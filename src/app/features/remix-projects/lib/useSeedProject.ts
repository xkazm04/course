"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SeedProject, ProjectDomain, ProjectDifficulty, Assignment } from "./types";
import {
    getAllSeedProjects,
    getSeedProjectById,
    getSeedProjectsByDomain,
    getSeedProjectsByDifficulty,
    getAssignmentsForProject,
} from "./seedProjectTemplates";

interface UseSeedProjectOptions {
    domain?: ProjectDomain;
    difficulty?: ProjectDifficulty;
}

interface UseSeedProjectReturn {
    projects: SeedProject[];
    selectedProject: SeedProject | null;
    projectAssignments: Assignment[];
    isLoading: boolean;
    selectProject: (id: string | null) => void;
    filterByDomain: (domain: ProjectDomain | null) => void;
    filterByDifficulty: (difficulty: ProjectDifficulty | null) => void;
    getProjectFile: (projectId: string, filePath: string) => string | null;
    refresh: () => void;
}

export function useSeedProject(options: UseSeedProjectOptions = {}): UseSeedProjectReturn {
    const { domain: initialDomain, difficulty: initialDifficulty } = options;

    const [allProjects, setAllProjects] = useState<SeedProject[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [domainFilter, setDomainFilter] = useState<ProjectDomain | null>(initialDomain || null);
    const [difficultyFilter, setDifficultyFilter] = useState<ProjectDifficulty | null>(initialDifficulty || null);
    const [isLoading, setIsLoading] = useState(true);

    // Load projects
    const loadProjects = useCallback(() => {
        setIsLoading(true);
        try {
            const projects = getAllSeedProjects();
            setAllProjects(projects);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadProjects();
    }, [loadProjects]);

    // Filtered projects
    const projects = useMemo(() => {
        let filtered = allProjects;

        if (domainFilter) {
            filtered = filtered.filter((p) => p.domain === domainFilter);
        }

        if (difficultyFilter) {
            filtered = filtered.filter((p) => p.difficulty === difficultyFilter);
        }

        return filtered;
    }, [allProjects, domainFilter, difficultyFilter]);

    // Selected project
    const selectedProject = useMemo(() => {
        if (!selectedProjectId) return null;
        return getSeedProjectById(selectedProjectId);
    }, [selectedProjectId]);

    // Assignments for selected project
    const projectAssignments = useMemo(() => {
        if (!selectedProjectId) return [];
        return getAssignmentsForProject(selectedProjectId);
    }, [selectedProjectId]);

    // Actions
    const selectProject = useCallback((id: string | null) => {
        setSelectedProjectId(id);
    }, []);

    const filterByDomain = useCallback((domain: ProjectDomain | null) => {
        setDomainFilter(domain);
    }, []);

    const filterByDifficulty = useCallback((difficulty: ProjectDifficulty | null) => {
        setDifficultyFilter(difficulty);
    }, []);

    // Get specific file content
    const getProjectFile = useCallback((projectId: string, filePath: string): string | null => {
        const project = getSeedProjectById(projectId);
        if (!project) return null;

        const file = project.repository.files.find((f) => f.path === filePath);
        return file?.content || null;
    }, []);

    return {
        projects,
        selectedProject,
        projectAssignments,
        isLoading,
        selectProject,
        filterByDomain,
        filterByDifficulty,
        getProjectFile,
        refresh: loadProjects,
    };
}
