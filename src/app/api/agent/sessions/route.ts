/**
 * Agent Sessions API
 *
 * CRUD operations for agent chat sessions.
 * Note: Using 'as any' bypasses strict Supabase types until migration is applied.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/agent/sessions
 *
 * List user's chat sessions.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query - use 'as any' to bypass strict typing
    let query = (supabase as any)
      .from('agent_sessions')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data: sessions, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    return NextResponse.json({
      sessions,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Sessions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/agent/sessions
 *
 * Create a new chat session.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, title, modelProvider, modelId } = body;

    // Use 'as any' to bypass strict typing
    const { data: session, error } = await (supabase as any)
      .from('agent_sessions')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        title: title || null,
        model_provider: modelProvider || 'anthropic',
        model_id: modelId || 'claude-sonnet-4-20250514',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error('Sessions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/agent/sessions
 *
 * Delete sessions (supports bulk delete via ids array in body).
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Session IDs required' }, { status: 400 });
    }

    // Delete sessions (RLS ensures user can only delete their own) - use 'as any'
    const { error } = await (supabase as any)
      .from('agent_sessions')
      .delete()
      .eq('user_id', user.id)
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete sessions' }, { status: 500 });
    }

    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    console.error('Sessions DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
