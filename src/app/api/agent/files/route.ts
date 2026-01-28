/**
 * Agent Files API
 *
 * Endpoint for retrieving files from the virtual filesystem.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getVirtualFS, VirtualFileSystem } from '@/lib/agent/tools';

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  size?: number;
}

/**
 * GET /api/agent/files
 *
 * Get the file tree for a project's virtual filesystem.
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project ID from query
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'default';

    // Get virtual filesystem for this project
    const vfs = getVirtualFS(projectId);

    // Build file tree from virtual filesystem
    const files = await buildFileTree(vfs, '/');

    return NextResponse.json({ files });
  } catch (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/agent/files
 *
 * Read a specific file's content.
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId = 'default', path } = body;

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Get virtual filesystem for this project
    const vfs = getVirtualFS(projectId);

    // Read file content
    try {
      const content = await vfs.readFile(path);
      return NextResponse.json({ content });
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Files API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function buildFileTree(vfs: VirtualFileSystem, dirPath: string): Promise<FileNode[]> {
  try {
    const entries = await vfs.readdir(dirPath);
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = dirPath === '/' ? `/${entry.name}` : `${dirPath}/${entry.name}`;

      if (entry.isDirectory) {
        const children = await buildFileTree(vfs, fullPath);
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      } else {
        try {
          const content = await vfs.readFile(fullPath);
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            content,
            size: content.length,
          });
        } catch {
          nodes.push({
            name: entry.name,
            path: fullPath,
            type: 'file',
            size: entry.size || 0,
          });
        }
      }
    }

    // Sort: directories first, then alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return nodes;
  } catch {
    return [];
  }
}
