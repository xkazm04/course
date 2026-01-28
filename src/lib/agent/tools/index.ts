/**
 * Agent Tools Module
 *
 * Exports all tools and the tool registry.
 */

// Registry
export { toolRegistry, defineTool } from './registry';
export type { ToolDefinition } from './registry';

// Virtual Filesystem
export {
  getVirtualFS,
  deleteVirtualFS,
  listVirtualFilesystems,
  VirtualFileSystem,
} from './virtual-fs';
export type { FileEntry, DirectoryEntry, SearchResult } from './virtual-fs';

// File Tools
export {
  readFileTool,
  writeFileTool,
  listFilesTool,
  searchFilesTool,
  deleteFileTool,
  mkdirTool,
  fileTools,
} from './file-tools';

// Command Tools
export { executeCommandTool, commandTools } from './command-tools';

// ============================================================================
// Register all built-in tools on import
// ============================================================================

// This ensures tools are registered when the module is imported
import './file-tools';
import './command-tools';
