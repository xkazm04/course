/**
 * Rate Limit Status API
 *
 * Check current rate limit status for the authenticated user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getRateLimitStatus } from '@/lib/agent/rate-limit';

/**
 * GET /api/agent/rate-limit
 *
 * Get current rate limit status.
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
    const provider = searchParams.get('provider') || 'anthropic';

    const status = await getRateLimitStatus(user.id, provider);

    return NextResponse.json({
      provider,
      allowed: status.allowed,
      remaining: status.remaining,
      resetAt: status.resetAt.toISOString(),
      retryAfter: status.retryAfter,
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
