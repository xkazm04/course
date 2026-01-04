# Hybrid Architecture: Edge for Speed, Cloud for Heavy Lifting

## Status: PLANNED (Not Implemented)

This document outlines a future architectural enhancement for content generation. **Do not implement** without team discussion and approval.

---

## Overview

A hybrid architecture that combines:
1. **Edge Functions** (Vercel/Cloudflare) - Fast, lightweight operations close to users
2. **Cloud Workers** (Google Cloud Run/Functions) - Heavy AI processing with longer timeouts

This approach provides:
- Sub-second response times for simple operations
- Unlimited processing time for complex AI generation
- Cost optimization through workload distribution
- Better resilience through separation of concerns

---

## Problem Statement

Current architecture limitations:
1. **Vercel Function Timeout**: 60s max (Pro plan), 10s (Hobby) - not enough for AI content generation
2. **Cold Start Latency**: Serverless cold starts add 500ms-2s delay
3. **Resource Constraints**: Limited memory/CPU for large model inference
4. **Cost**: Running expensive operations on edge functions is wasteful

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER REQUEST                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EDGE LAYER (Vercel)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │
│  │ API Routes      │  │ Request Router  │  │ Response Cache          │ │
│  │ - Auth          │  │ - Route to Edge │  │ - SWR caching           │ │
│  │ - Validation    │  │ - Route to Cloud│  │ - KV store              │ │
│  │ - Quick queries │  │ - Load balance  │  │ - CDN invalidation      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
         │                        │                        │
         │ Simple                 │ Heavy                  │ Cached
         │ Operations             │ Operations             │
         ▼                        ▼                        ▼
┌─────────────────┐    ┌─────────────────────┐    ┌─────────────────┐
│ Supabase        │    │ Google Cloud Run    │    │ Vercel KV/Edge  │
│ - Direct reads  │    │ - AI Generation     │    │ Config          │
│ - Simple writes │    │ - Batch processing  │    │ - Feature flags │
│ - Realtime      │    │ - Long-running jobs │    │ - User prefs    │
└─────────────────┘    └─────────────────────┘    └─────────────────┘
```

---

## Component Details

### 1. Edge Layer (Vercel Edge Functions)

**Purpose**: Fast request handling, routing, caching

**Responsibilities**:
- Authentication and authorization
- Request validation
- Route determination (edge vs cloud)
- Response caching
- Simple database operations

**Technology**:
- Vercel Edge Functions
- Vercel KV for caching
- Edge Config for feature flags

**Example Routes**:
```typescript
// Edge-handled routes (fast, simple)
/api/chapters/[id]              // Read chapter data
/api/user/profile               // User profile operations
/api/progress/update            // Progress tracking

// Cloud-routed routes (heavy processing)
/api/content/generate-chapter   // AI content generation
/api/content/batch-generate     // Batch processing
/api/analytics/compute          // Heavy analytics
```

### 2. Request Router

**Decision Logic**:
```typescript
interface RouteDecision {
  destination: 'edge' | 'cloud';
  priority: 'high' | 'normal' | 'low';
  timeout: number;
  retryPolicy: RetryConfig;
}

function routeRequest(request: Request): RouteDecision {
  const path = new URL(request.url).pathname;

  // AI generation routes → Cloud
  if (path.includes('/generate') || path.includes('/batch')) {
    return {
      destination: 'cloud',
      priority: 'normal',
      timeout: 300000, // 5 minutes
      retryPolicy: { maxRetries: 2, backoff: 'exponential' }
    };
  }

  // Everything else → Edge
  return {
    destination: 'edge',
    priority: 'high',
    timeout: 10000, // 10 seconds
    retryPolicy: { maxRetries: 1, backoff: 'none' }
  };
}
```

### 3. Cloud Workers (Google Cloud Run)

**Purpose**: Heavy AI processing, batch operations

**Key Features**:
- **No timeout limits**: Can run for hours if needed
- **Auto-scaling**: 0 to N instances based on load
- **Cost-effective**: Pay per request, scales to zero
- **GPU support**: Available for model inference

**Service Definition**:
```yaml
# cloud-run-service.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: content-generator
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: "0"
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containerConcurrency: 1  # One request per instance
      timeoutSeconds: 900      # 15 minute timeout
      containers:
        - image: gcr.io/project/content-generator
          resources:
            limits:
              memory: 4Gi
              cpu: 2
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: api-keys
                  key: anthropic
```

### 4. Communication Pattern

**Request Flow**:
```
1. User → Vercel Edge (instant ACK)
2. Edge → Cloud Run (async job submission)
3. Cloud Run → Supabase (job status updates)
4. Supabase → User (Realtime subscription)
```

**Code Example**:
```typescript
// Vercel Edge Function
export async function POST(request: Request) {
  const body = await request.json();

  // Validate and create job record
  const { data: job } = await supabase
    .from('chapter_content_jobs')
    .insert({ chapter_id: body.chapter_id, status: 'pending' })
    .select('id')
    .single();

  // Dispatch to Cloud Run (fire and forget)
  fetch(process.env.CLOUD_RUN_URL!, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getCloudRunToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ job_id: job.id, ...body })
  }).catch(console.error); // Don't await, let Edge return immediately

  // Return immediately with job ID
  return Response.json({
    job_id: job.id,
    status: 'pending',
    message: 'Generation started. Subscribe to realtime updates.'
  }, { status: 202 });
}
```

---

## Migration Plan

### Phase 1: Infrastructure Setup (Week 1-2)
- [ ] Set up Google Cloud project and Cloud Run service
- [ ] Configure service account and IAM permissions
- [ ] Set up secrets management (API keys)
- [ ] Create Docker container for content generator
- [ ] Set up CI/CD pipeline for Cloud Run deployments

### Phase 2: Request Router (Week 2-3)
- [ ] Implement request routing logic in middleware
- [ ] Add route configuration (edge vs cloud)
- [ ] Implement retry and timeout handling
- [ ] Add observability (logging, metrics)

### Phase 3: Cloud Worker Implementation (Week 3-4)
- [ ] Port content generation logic to Cloud Run
- [ ] Implement job queue management
- [ ] Add progress reporting via Supabase
- [ ] Implement error handling and recovery

### Phase 4: Integration & Testing (Week 4-5)
- [ ] End-to-end testing of hybrid flow
- [ ] Load testing and performance validation
- [ ] Failover testing
- [ ] Documentation and runbooks

### Phase 5: Gradual Rollout (Week 5-6)
- [ ] Feature flag for hybrid architecture
- [ ] Canary deployment (10% traffic)
- [ ] Monitor and adjust
- [ ] Full rollout

---

## Cost Analysis

### Current (All Vercel)
- Vercel Pro: ~$20/month base
- Function execution: $0.6/GB-hour
- **Limitation**: 60s timeout, may fail for complex content

### Proposed (Hybrid)
- Vercel Pro: ~$20/month base
- Cloud Run: ~$0.00002400/vCPU-second, $0.00000250/GiB-second
- **Estimate**: 1000 generations/month × 60s × 2vCPU = ~$2.88/month Cloud Run

**Net Impact**: Small cost increase (~$3-5/month) for significantly better reliability and capability.

---

## Rollback Plan

If issues arise:
1. Feature flag to disable cloud routing
2. All requests handled by Edge (current behavior)
3. Monitor and investigate
4. Fix and re-enable gradually

---

## Open Questions

1. **GPU requirement?** - Do we need GPU for model inference, or is CPU sufficient?
2. **Cold start tolerance?** - Cloud Run cold starts can be 2-5s. Acceptable?
3. **Regional deployment?** - Single region or multi-region for Cloud Run?
4. **Queue service?** - Use Cloud Tasks for job queuing, or Supabase-based queue?

---

## Appendix: Alternative Approaches Considered

### Option A: Vercel Background Functions (Not chosen)
- Limited availability
- Still has timeout constraints
- Less control over resources

### Option B: AWS Lambda + SQS (Not chosen)
- More complex setup
- Higher operational overhead
- Team more familiar with GCP

### Option C: Self-hosted Workers (Not chosen)
- Requires infrastructure management
- No auto-scaling without additional setup
- Higher maintenance burden

---

## References

- [Vercel Edge Functions Documentation](https://vercel.com/docs/functions/edge-functions)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
