/**
 * Layout Template System
 *
 * Defines layout templates for each mode. Each template specifies
 * the arrangement of content slots in different regions.
 */

import type {
    LayoutTemplate,
    SlotPlacement,
    ContentSlot,
    VideoSlot,
    CodeSlot,
    KeyPointsSlot,
    QuizSlot,
    NavigationSlot,
    TextSlot,
    ProgressSlot,
    ActionsSlot,
    SectionListSlot,
    PlaygroundSlot,
    HeaderSlot,
} from "./contentSlots";

// ============================================================================
// Slot Builders - Factory functions for common slot configurations
// ============================================================================

const videoSlot = (id: string = "video-main"): VideoSlot => ({
    id,
    type: "video",
    data: {
        currentTime: "8:30",
        totalTime: "25:00",
        progress: 33,
        resolution: "1080p",
    },
});

const codeSlot = (id: string, code: string, filename?: string): CodeSlot => ({
    id,
    type: "code",
    data: {
        code,
        filename,
        language: "typescript",
        showLineNumbers: true,
        showCopy: true,
    },
});

const keyPointsSlot = (id: string, points: string[]): KeyPointsSlot => ({
    id,
    type: "keyPoints",
    data: {
        title: "Key Takeaways",
        points,
        icon: "message",
    },
});

const quizButtonSlot = (id: string, sectionId: string): QuizSlot => ({
    id,
    type: "quiz",
    data: {
        sectionId,
        showButton: true,
    },
});

const quizInlineSlot = (id: string, sectionId: string): QuizSlot => ({
    id,
    type: "quiz",
    data: {
        sectionId,
        inline: true,
    },
});

const navigationSlot = (id: string = "nav-main", compact?: boolean): NavigationSlot => ({
    id,
    type: "navigation",
    data: {
        showPrevious: true,
        showNext: true,
        compact,
    },
});

const textSlot = (id: string, title: string, content: string): TextSlot => ({
    id,
    type: "text",
    data: {
        title,
        content,
        variant: "prose",
    },
});

const progressSidebarSlot = (id: string = "progress-sidebar"): ProgressSlot => ({
    id,
    type: "progress",
    data: {
        variant: "sidebar",
        showSections: true,
        showXp: true,
    },
});

const progressHeaderSlot = (id: string = "progress-header"): ProgressSlot => ({
    id,
    type: "progress",
    data: {
        variant: "header",
        showSections: false,
        showXp: true,
    },
});

const actionsSlot = (
    id: string = "actions-main",
    options?: { showRegenerate?: boolean }
): ActionsSlot => ({
    id,
    type: "actions",
    data: {
        showBookmark: !options?.showRegenerate,
        showLike: !options?.showRegenerate,
        showRegenerate: options?.showRegenerate ?? false,
        variant: "full",
    },
});

const sectionListSlot = (id: string = "sections"): SectionListSlot => ({
    id,
    type: "sectionList",
    data: {
        expandable: true,
        showQuizButtons: true,
    },
});

const playgroundSlot = (id: string, playgroundId: string, title?: string): PlaygroundSlot => ({
    id,
    type: "playground",
    data: {
        playgroundId,
        title,
        showFileExplorer: true,
        height: "700px",
    },
});

const headerSlot = (id: string = "header", variant?: "compact" | "full"): HeaderSlot => ({
    id,
    type: "header",
    data: {
        variant: variant ?? "compact",
    },
});

// ============================================================================
// Default Content Data
// ============================================================================

const defaultCodeExample = `import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function
        ? value(storedValue)
        : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}`;

const defaultKeyPoints = [
    "Always prefix custom hooks with 'use'",
    "Hooks can return any value: primitives, objects, arrays",
    "Custom hooks can call other hooks internally",
];

// ============================================================================
// Classic Mode Layout Template
// ============================================================================

export const classicLayoutTemplate: LayoutTemplate = {
    id: "classic",
    name: "Classic",
    description: "Video player with content layout and sidebar progress",
    dataTestId: "chapter-view-classic",
    wrapperClass: "max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6",
    enableVideoControls: true,
    gridConfig: {
        columns: 3,
        mainSpan: 2,
        sidebarSpan: 1,
    },
    slots: [
        // Main region (left 2/3)
        { slot: videoSlot("video-player"), region: "main", order: 1 },
        { slot: headerSlot("chapter-header", "compact"), region: "main", order: 2 },
        {
            slot: textSlot(
                "intro-text",
                "What are Custom Hooks?",
                "Custom Hooks are JavaScript functions that start with \"use\" and can call other Hooks. They let you extract component logic into reusable functions, making your code more organized and easier to test."
            ),
            region: "main",
            order: 3,
        },
        { slot: codeSlot("code-example", defaultCodeExample, "useLocalStorage.ts"), region: "main", order: 4 },
        { slot: keyPointsSlot("key-points", defaultKeyPoints), region: "main", order: 5 },
        { slot: quizButtonSlot("quiz-button", "building"), region: "main", order: 6 },
        { slot: quizInlineSlot("quiz-inline", "building"), region: "main", order: 7 },

        // Sidebar region (right 1/3)
        { slot: progressSidebarSlot("progress"), region: "sidebar", order: 1 },
        { slot: actionsSlot("actions", { showRegenerate: true }), region: "sidebar", order: 2 },
        { slot: navigationSlot("navigation", true), region: "sidebar", order: 3 },
    ],
};

// ============================================================================
// Expandable Mode Layout Template
// ============================================================================

export const expandableLayoutTemplate: LayoutTemplate = {
    id: "expandable",
    name: "Expandable",
    description: "Scrollable view with collapsible sections",
    wrapperClass: "max-w-5xl mx-auto",
    dataTestId: "chapter-view-expandable",
    enableVideoControls: true,
    responsiveConfig: {
        mobileFullWidth: true,
    },
    gridConfig: {
        columns: 1,
        mainSpan: 1,
        sidebarSpan: 0,
    },
    slots: [
        // Header region
        { slot: headerSlot("chapter-header", "full"), region: "header", order: 1 },
        { slot: progressHeaderSlot("progress-header"), region: "header", order: 2 },

        // Main region (full width)
        { slot: videoSlot("video-player"), region: "main", order: 1 },
        { slot: sectionListSlot("sections"), region: "main", order: 2 },

        // Footer region
        { slot: navigationSlot("navigation", false), region: "footer", order: 1 },
    ],
};

// ============================================================================
// IDE Mode Layout Template
// ============================================================================

export const ideLayoutTemplate: LayoutTemplate = {
    id: "ide",
    name: "IDE",
    description: "Interactive code playground with file explorer",
    wrapperClass: "space-y-6",
    dataTestId: "chapter-view-ide",
    enableVideoControls: false,
    gridConfig: {
        columns: 1,
        mainSpan: 1,
        sidebarSpan: 0,
    },
    slots: [
        // Header region
        {
            slot: textSlot(
                "ide-header",
                "Interactive Code Playground",
                "Edit the code below and click Run to see your changes instantly. Your modifications are automatically saved to localStorage."
            ),
            region: "header",
            order: 1,
        },

        // Main region
        { slot: playgroundSlot("playground", "chapter-demo-toggle", "Toggle Component"), region: "main", order: 1 },

        // Footer region (instructions)
        {
            slot: {
                id: "ide-instructions",
                type: "text",
                data: {
                    title: "Try These Exercises:",
                    content: "1. Change the light bulb colors in App.jsx\n2. Add a brightness slider to control the glow intensity\n3. Implement the Toggle compound component pattern\n4. Add CSS animations when the toggle state changes",
                    variant: "highlight",
                },
            } as TextSlot,
            region: "footer",
            order: 1,
        },
    ],
};

// ============================================================================
// Layout Template Map
// ============================================================================

export const layoutTemplates: Record<string, LayoutTemplate> = {
    classic: classicLayoutTemplate,
    expandable: expandableLayoutTemplate,
    ide: ideLayoutTemplate,
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getLayoutTemplate(templateId: string): LayoutTemplate {
    return layoutTemplates[templateId] ?? classicLayoutTemplate;
}

export function getSlotsForRegion(template: LayoutTemplate, region: string): SlotPlacement[] {
    return template.slots
        .filter((placement) => placement.region === region)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export function getSlotById(template: LayoutTemplate, slotId: string): ContentSlot | undefined {
    const placement = template.slots.find((p) => p.slot.id === slotId);
    return placement?.slot;
}

// ============================================================================
// Custom Layout Builder
// ============================================================================

export interface LayoutBuilderConfig {
    id: string;
    name: string;
    description?: string;
    gridConfig?: LayoutTemplate["gridConfig"];
}

export class LayoutBuilder {
    private config: LayoutBuilderConfig;
    private placements: SlotPlacement[] = [];

    constructor(config: LayoutBuilderConfig) {
        this.config = config;
    }

    addSlot(slot: ContentSlot, region: string, order?: number): LayoutBuilder {
        this.placements.push({ slot, region: region as SlotPlacement["region"], order });
        return this;
    }

    addVideo(region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(videoSlot(), region, order);
    }

    addCode(code: string, filename?: string, region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(codeSlot(`code-${this.placements.length}`, code, filename), region, order);
    }

    addKeyPoints(points: string[], region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(keyPointsSlot(`keypoints-${this.placements.length}`, points), region, order);
    }

    addQuizButton(sectionId: string, region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(quizButtonSlot(`quiz-btn-${this.placements.length}`, sectionId), region, order);
    }

    addNavigation(compact: boolean = false, region: string = "footer", order?: number): LayoutBuilder {
        return this.addSlot(navigationSlot(`nav-${this.placements.length}`, compact), region, order);
    }

    addProgress(variant: "sidebar" | "header" = "sidebar", region: string = "sidebar", order?: number): LayoutBuilder {
        const slot = variant === "header" ? progressHeaderSlot() : progressSidebarSlot();
        return this.addSlot(slot, region, order);
    }

    addActions(region: string = "sidebar", order?: number): LayoutBuilder {
        return this.addSlot(actionsSlot(), region, order);
    }

    addSectionList(region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(sectionListSlot(), region, order);
    }

    addPlayground(playgroundId: string, title?: string, region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(playgroundSlot(`playground-${this.placements.length}`, playgroundId, title), region, order);
    }

    addText(title: string, content: string, region: string = "main", order?: number): LayoutBuilder {
        return this.addSlot(textSlot(`text-${this.placements.length}`, title, content), region, order);
    }

    addHeader(variant: "compact" | "full" = "compact", region: string = "header", order?: number): LayoutBuilder {
        return this.addSlot(headerSlot(`header-${this.placements.length}`, variant), region, order);
    }

    build(): LayoutTemplate {
        return {
            id: this.config.id,
            name: this.config.name,
            description: this.config.description ?? "",
            gridConfig: this.config.gridConfig,
            slots: this.placements,
        };
    }
}

/**
 * Create a new layout builder
 */
export function createLayout(config: LayoutBuilderConfig): LayoutBuilder {
    return new LayoutBuilder(config);
}
