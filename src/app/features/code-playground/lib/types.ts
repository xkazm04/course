export interface CodeFile {
    id: string;
    name: string;
    language: "javascript" | "jsx" | "typescript" | "tsx" | "css" | "html" | "json";
    content: string;
    isEntry?: boolean;
}

export interface PlaygroundConfig {
    files: CodeFile[];
    activeFileId: string;
    title?: string;
    description?: string;
}

export interface PlaygroundState {
    files: CodeFile[];
    activeFileId: string;
    isRunning: boolean;
    consoleOutput: ConsoleMessage[];
    error: string | null;
}

export interface ConsoleMessage {
    type: "log" | "error" | "warn" | "info";
    content: string;
    timestamp: number;
    /** Parsed line number from error message, if available */
    lineNumber?: number;
    /** Parsed column number from error message, if available */
    columnNumber?: number;
}

export interface ErrorLineInfo {
    lineNumber: number;
    columnNumber?: number;
    messageId: string;
}

export type SupportedLanguage = "javascript" | "jsx" | "typescript" | "tsx" | "css" | "html" | "json";

export const LANGUAGE_EXTENSIONS: Record<SupportedLanguage, string> = {
    javascript: "js",
    jsx: "jsx",
    typescript: "ts",
    tsx: "tsx",
    css: "css",
    html: "html",
    json: "json",
};

export const EXTENSION_TO_LANGUAGE: Record<string, SupportedLanguage> = {
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    css: "css",
    html: "html",
    json: "json",
};
