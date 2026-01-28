"use client";

import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { mockProjects, mockChallenges } from "../lib/mockData";
import type { ForgeProject } from "../lib/types";
import {
    CompactProjectSelector,
    ProjectShowcase,
    ProjectTabs,
    ProjectGridModal,
} from "./components";

export default function ProjectsPage() {
    const [selectedProject, setSelectedProject] = useState<ForgeProject>(mockProjects[0]);
    const [isGridModalOpen, setIsGridModalOpen] = useState(false);

    // Get challenges for the selected project
    const projectChallenges = useMemo(
        () => mockChallenges.filter((c) => c.projectId === selectedProject.id),
        [selectedProject.id]
    );

    const handleSelectProject = (id: string) => {
        const project = mockProjects.find((p) => p.id === id);
        if (project) setSelectedProject(project);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            {/* Compact Project Selector */}
            <div className="mb-6">
                <CompactProjectSelector
                    projects={mockProjects}
                    selectedId={selectedProject.id}
                    onSelect={handleSelectProject}
                    onOpenGrid={() => setIsGridModalOpen(true)}
                />
            </div>

            {/* Project Showcase (Hero + Sidebar) */}
            <div className="mb-6">
                <AnimatePresence mode="wait">
                    <ProjectShowcase key={selectedProject.id} project={selectedProject} />
                </AnimatePresence>
            </div>

            {/* Project Tabs (About, Challenges, Features) */}
            <AnimatePresence mode="wait">
                <ProjectTabs
                    key={`tabs-${selectedProject.id}`}
                    project={selectedProject}
                    challenges={projectChallenges}
                />
            </AnimatePresence>

            {/* Grid Modal */}
            <ProjectGridModal
                isOpen={isGridModalOpen}
                projects={mockProjects}
                selectedId={selectedProject.id}
                onSelect={handleSelectProject}
                onClose={() => setIsGridModalOpen(false)}
            />
        </div>
    );
}
