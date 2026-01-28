/**
 * Virtual Filesystem
 *
 * In-memory filesystem for agent tool operations.
 * Each project/session has its own isolated filesystem.
 */

// ============================================================================
// Types
// ============================================================================

export interface FileEntry {
  path: string;
  content: string;
  isDirectory: boolean;
  createdAt: Date;
  updatedAt: Date;
  size: number;
}

export interface DirectoryEntry {
  name: string;
  isDirectory: boolean;
  size: number;
}

export interface SearchResult {
  path: string;
  line: number;
  content: string;
  match: string;
}

// ============================================================================
// Virtual Filesystem Class
// ============================================================================

class VirtualFileSystem {
  private files: Map<string, FileEntry> = new Map();
  private projectId: string;

  constructor(projectId: string) {
    this.projectId = projectId;
    // Initialize with root directory
    this.files.set('/', {
      path: '/',
      content: '',
      isDirectory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 0,
    });
  }

  /**
   * Normalize path (ensure leading slash, no trailing slash except root)
   */
  private normalizePath(path: string): string {
    let normalized = path.startsWith('/') ? path : `/${path}`;
    if (normalized !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  }

  /**
   * Get parent directory path
   */
  private getParentPath(path: string): string {
    const normalized = this.normalizePath(path);
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash === 0 ? '/' : normalized.slice(0, lastSlash);
  }

  /**
   * Ensure parent directories exist
   */
  private ensureParentDirs(path: string): void {
    const normalized = this.normalizePath(path);
    const parts = normalized.split('/').filter(Boolean);
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += `/${parts[i]}`;
      if (!this.files.has(currentPath)) {
        this.files.set(currentPath, {
          path: currentPath,
          content: '',
          isDirectory: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          size: 0,
        });
      }
    }
  }

  /**
   * Read a file
   */
  async readFile(path: string): Promise<string> {
    const normalized = this.normalizePath(path);
    const entry = this.files.get(normalized);

    if (!entry) {
      throw new Error(`File not found: ${path}`);
    }
    if (entry.isDirectory) {
      throw new Error(`Cannot read directory as file: ${path}`);
    }

    return entry.content;
  }

  /**
   * Write a file
   */
  async writeFile(path: string, content: string): Promise<void> {
    const normalized = this.normalizePath(path);
    this.ensureParentDirs(normalized);

    const existing = this.files.get(normalized);
    if (existing?.isDirectory) {
      throw new Error(`Cannot write to directory: ${path}`);
    }

    this.files.set(normalized, {
      path: normalized,
      content,
      isDirectory: false,
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
      size: content.length,
    });
  }

  /**
   * Delete a file or directory
   */
  async delete(path: string): Promise<void> {
    const normalized = this.normalizePath(path);

    if (normalized === '/') {
      throw new Error('Cannot delete root directory');
    }

    const entry = this.files.get(normalized);
    if (!entry) {
      throw new Error(`Path not found: ${path}`);
    }

    // If directory, delete all children
    if (entry.isDirectory) {
      const prefix = normalized + '/';
      for (const key of this.files.keys()) {
        if (key.startsWith(prefix)) {
          this.files.delete(key);
        }
      }
    }

    this.files.delete(normalized);
  }

  /**
   * List directory contents
   */
  async readdir(path: string): Promise<DirectoryEntry[]> {
    const normalized = this.normalizePath(path);
    const entry = this.files.get(normalized);

    if (!entry) {
      throw new Error(`Directory not found: ${path}`);
    }
    if (!entry.isDirectory) {
      throw new Error(`Not a directory: ${path}`);
    }

    const prefix = normalized === '/' ? '/' : `${normalized}/`;
    const entries: DirectoryEntry[] = [];
    const seen = new Set<string>();

    for (const [filePath, fileEntry] of this.files.entries()) {
      if (filePath === normalized) continue;

      if (filePath.startsWith(prefix)) {
        const relativePath = filePath.slice(prefix.length);
        const firstPart = relativePath.split('/')[0];

        if (!seen.has(firstPart)) {
          seen.add(firstPart);
          const fullPath = `${prefix}${firstPart}`;
          const childEntry = this.files.get(fullPath.startsWith('//') ? fullPath.slice(1) : fullPath);

          entries.push({
            name: firstPart,
            isDirectory: childEntry?.isDirectory ?? relativePath.includes('/'),
            size: childEntry?.size ?? 0,
          });
        }
      }
    }

    return entries.sort((a, b) => {
      // Directories first, then alphabetical
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Create a directory
   */
  async mkdir(path: string): Promise<void> {
    const normalized = this.normalizePath(path);
    this.ensureParentDirs(normalized);

    const existing = this.files.get(normalized);
    if (existing) {
      if (existing.isDirectory) {
        return; // Already exists
      }
      throw new Error(`File already exists at path: ${path}`);
    }

    this.files.set(normalized, {
      path: normalized,
      content: '',
      isDirectory: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 0,
    });
  }

  /**
   * Check if path exists
   */
  async exists(path: string): Promise<boolean> {
    const normalized = this.normalizePath(path);
    return this.files.has(normalized);
  }

  /**
   * Get file/directory stats
   */
  async stat(path: string): Promise<FileEntry> {
    const normalized = this.normalizePath(path);
    const entry = this.files.get(normalized);

    if (!entry) {
      throw new Error(`Path not found: ${path}`);
    }

    return { ...entry };
  }

  /**
   * Search for text in files
   */
  async search(
    pattern: string,
    searchPath: string = '/',
    filePattern: string = '*'
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const searchNormalized = this.normalizePath(searchPath);
    const regex = new RegExp(pattern, 'gi');

    // Convert glob pattern to regex
    const fileRegex = new RegExp(
      '^' + filePattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    for (const [filePath, entry] of this.files.entries()) {
      // Skip directories
      if (entry.isDirectory) continue;

      // Check if file is in search path
      if (!filePath.startsWith(searchNormalized === '/' ? '/' : `${searchNormalized}/`) &&
          filePath !== searchNormalized) {
        continue;
      }

      // Check file pattern
      const fileName = filePath.split('/').pop() || '';
      if (!fileRegex.test(fileName)) continue;

      // Search content
      const lines = entry.content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const matches = lines[i].matchAll(regex);
        for (const match of matches) {
          results.push({
            path: filePath,
            line: i + 1,
            content: lines[i].trim(),
            match: match[0],
          });
        }
      }
    }

    return results;
  }

  /**
   * Get all files (for debugging/export)
   */
  getAllFiles(): Map<string, FileEntry> {
    return new Map(this.files);
  }

  /**
   * Import files from an object (for initialization)
   */
  importFiles(files: Record<string, string>): void {
    for (const [path, content] of Object.entries(files)) {
      const normalized = this.normalizePath(path);
      this.ensureParentDirs(normalized);
      this.files.set(normalized, {
        path: normalized,
        content,
        isDirectory: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        size: content.length,
      });
    }
  }
}

// ============================================================================
// Filesystem Store (per project)
// ============================================================================

const filesystemStore = new Map<string, VirtualFileSystem>();

export function getVirtualFS(projectId: string): VirtualFileSystem {
  let fs = filesystemStore.get(projectId);
  if (!fs) {
    fs = new VirtualFileSystem(projectId);
    filesystemStore.set(projectId, fs);
  }
  return fs;
}

export function deleteVirtualFS(projectId: string): void {
  filesystemStore.delete(projectId);
}

export function listVirtualFilesystems(): string[] {
  return Array.from(filesystemStore.keys());
}

// Export the class for testing
export { VirtualFileSystem };
