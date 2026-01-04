# Datadog LLM Observability Setup Guide

This guide covers the manual Datadog configuration steps required to complete the end-to-end observability setup for the Gemini-powered Learning Platform.

## Prerequisites

Before proceeding, ensure:
1. You have a Datadog account with API and App keys
2. The cloud services (Oracle, Content Generator) are deployed with the updated code
3. Environment variables are set correctly in Cloud Run

---

## 1. Environment Variables

Set the following environment variables in your Cloud Run services:

```bash
# Required for all services
DD_API_KEY=<your-datadog-api-key>
DD_SERVICE=oracle                    # or content-generator
DD_ENV=production                    # or development/staging
DD_VERSION=1.0.0

# Enable tracing features
DD_TRACE_ENABLED=true
DD_LOGS_INJECTION=true
DD_TRACE_SAMPLE_RATE=1.0

# Enable DogStatsD for custom metrics (Cloud Run)
DD_DOGSTATSD_NON_LOCAL_TRAFFIC=true
```

### For Agentless Deployment (Cloud Run)

Since Cloud Run doesn't support the Datadog Agent, you'll need to use agentless mode or set up a Datadog Agent sidecar. For custom metrics (`statsd`), configure a Datadog Agent endpoint:

```bash
# Option A: Use Datadog Agent endpoint (if you have one deployed)
DD_DOGSTATSD_URL=udp://<agent-host>:8125

# Option B: Use the Datadog API directly for metrics
# The datadog library will use DD_API_KEY automatically
```

---

## 2. Create Monitors (Detection Rules)

### Option A: Using curl (requires monitors_write scope)

```bash
cd cloud/datadog
DD_API_KEY=xxx DD_APP_KEY=xxx bash create_monitors.sh
```

### Option B: Manual UI Creation

Navigate to **Monitors > New Monitor > Metric** in Datadog and create the following:

### Monitor 1: High LLM Latency

**Type:** Metric Alert

**Query:**
```
avg(last_5m):avg:llm.gemini.request.latency{service:oracle OR service:content-generator} > 10000
```

**Settings:**
- Alert threshold: 10000 (10 seconds)
- Warning threshold: 5000 (5 seconds)
- Name: `[LLM] Gemini Response Latency Critical`

**Message:**
```markdown
## High LLM Response Latency Detected

**Current Latency:** {{value}} ms
**Service:** {{service.name}}
**Threshold:** 10,000ms

### Impact
- User experience degradation
- Potential timeouts for learning path generation
- Content generation jobs may fail

### Runbook
1. Check Gemini API status: https://status.cloud.google.com
2. Review recent deployment changes
3. Check for prompt complexity increases
4. Consider implementing request caching
5. Escalate if persists > 15 minutes

@slack-llm-alerts
```

**Tags:** `service:llm-observability`, `severity:high`, `team:ai-platform`

---

### Monitor 2: LLM Error Rate

**Type:** Metric Alert

**Query:**
```
sum(last_5m):sum:llm.gemini.errors{*}.as_count() / sum:llm.gemini.request.count{*}.as_count() * 100 > 5
```

**Settings:**
- Alert threshold: 5%
- Warning threshold: 2%
- Name: `[LLM] Gemini API Error Rate Elevated`

**Message:**
```markdown
## LLM API Error Rate Above Threshold

**Error Rate:** {{value}}%
**Threshold:** 5%

### Common Error Types
- `rate_limit`: API quota exceeded
- `invalid_response`: Malformed LLM output
- `parse_error`: JSON parsing failure
- `timeout`: Request timeout
- `safety_block`: Content filtered by safety

### Runbook
1. Check error breakdown in APM
2. If rate_limit: Review quota in GCP Console
3. If parse_error: Review prompt engineering
4. If timeout: Check Gemini API latency
5. Contact Vertex AI support if needed

@slack-llm-alerts
```

**Tags:** `service:llm-observability`, `severity:critical`, `team:ai-platform`

---

### Monitor 3: Cost Anomaly

**Type:** Anomaly Detection

**Query:**
```
avg(last_1h):sum:llm.gemini.cost.usd{*}
```

**Settings:**
- Algorithm: Agile
- Deviations: 3
- Name: `[Cost] LLM Token Spend Anomaly`

**Message:**
```markdown
## Unusual LLM Cost Pattern Detected

**Current Hourly Cost:** ${{value}}

### Potential Causes
- Increased user activity
- Prompt regression (excessive tokens)
- Runaway content generation jobs
- Possible abuse or attack

### Runbook
1. Review cost breakdown by operation
2. Check for unusual session patterns
3. Audit recent prompt changes
4. Enable rate limiting if abuse suspected
5. Set budget alerts in GCP

@slack-finops
```

**Tags:** `service:llm-observability`, `team:finops`

---

### Monitor 4: Content Generation Job Failures

**Type:** Metric Alert

**Query:**
```
sum(last_15m):sum:content.job.duration{status:failed}.as_count() / sum:content.job.duration{*}.as_count() * 100 > 10
```

**Settings:**
- Alert threshold: 10%
- Warning threshold: 5%
- Name: `[Jobs] Content Generation Failure Rate`

**Message:**
```markdown
## Content Generation Jobs Failing

**Failure Rate:** {{value}}%
**Threshold:** 10%

### Impact
- Users cannot generate course content
- Map nodes remain without courses
- Platform value proposition degraded

### Runbook
1. Check job error messages in logs
2. Review Gemini API response quality
3. Verify database connectivity
4. Check for prompt format issues
5. Retry failed jobs if transient

@slack-content-team
```

**Tags:** `service:content-generator`, `severity:high`

---

### Monitor 5: Parse Error Rate

**Type:** Metric Alert

**Query:**
```
sum(last_10m):sum:llm.response.parse_error{*}.as_count() > 10
```

**Settings:**
- Alert threshold: 10
- Warning threshold: 5
- Name: `[LLM] JSON Parse Errors Elevated`

**Message:**
```markdown
## LLM Response Parse Errors

**Parse Errors:** {{value}}
**Time Window:** Last 10 minutes

This indicates the LLM is returning malformed JSON responses.

### Runbook
1. Check recent prompt changes
2. Review model temperature settings
3. Audit response format instructions in prompts
4. Consider adding retry logic with stricter prompts
5. Check if Gemini model version changed

@slack-llm-alerts
```

---

## 3. Create SLOs

Navigate to **Service Level Objectives > New SLO**:

### SLO 1: Path Generation Success Rate

**Name:** Oracle Path Generation - 99% Success

**Type:** Metric-based

**Good Events Query:**
```
sum:oracle.path.generated{status:success}.as_count()
```

**Total Events Query:**
```
sum:oracle.path.generated{*}.as_count()
```

**Target:** 99.0%
**Time Window:** 7 days

**Tags:** `service:oracle`, `team:ai-platform`

---

### SLO 2: Content Generation Success Rate

**Name:** Content Generation Jobs - 95% Success

**Type:** Metric-based

**Good Events Query:**
```
sum:content.job.duration{status:completed}.as_count()
```

**Total Events Query:**
```
sum:content.job.duration{*}.as_count()
```

**Target:** 95.0%
**Time Window:** 7 days

**Tags:** `service:content-generator`, `team:ai-platform`

---

### SLO 3: LLM Latency P95

**Name:** LLM Response Time - P95 < 10s

**Type:** Monitor-based (create a monitor first)

Or use Metric-based with:

**Good Events Query:**
```
count:llm.gemini.request.latency{llm.gemini.request.latency<10000}.as_count()
```

**Total Events Query:**
```
count:llm.gemini.request.latency{*}.as_count()
```

**Target:** 95.0%
**Time Window:** 7 days

---

## 4. Create Dashboard

Navigate to **Dashboards > New Dashboard**

### Dashboard: LLM Application Health Overview

Create a dashboard with the following widgets:

#### Row 1: Key Metrics (Query Values)

| Widget | Query | Format |
|--------|-------|--------|
| Total LLM Requests (24h) | `sum:llm.gemini.request.count{*}.as_count()` | Number |
| P95 Latency | `p95:llm.gemini.request.latency{*}` | ms |
| Error Rate | `(sum:llm.gemini.errors{*}/sum:llm.gemini.request.count{*})*100` | % |
| Estimated Cost (24h) | `sum:llm.gemini.cost.usd{*}` | $ |

#### Row 2: Latency Analysis

| Widget | Query |
|--------|-------|
| Request Latency Distribution | `distribution:llm.gemini.request.latency{*}` |
| Latency by Operation (Timeseries) | `avg:llm.gemini.request.latency{*} by {operation}` |

#### Row 3: Token Usage

| Widget | Query |
|--------|-------|
| Tokens Over Time (Timeseries) | `sum:llm.gemini.tokens.input{*}`, `sum:llm.gemini.tokens.output{*}` |
| Token Distribution by Operation (Top List) | `sum:llm.gemini.tokens.total{*} by {operation}` |

#### Row 4: Cost Analysis

| Widget | Query |
|--------|-------|
| Cumulative Cost (Rolling 7d) | `cumsum(sum:llm.gemini.cost.usd{*})` |
| Cost by Service (Pie Chart) | `sum:llm.gemini.cost.usd{*} by {service}` |

#### Row 5: Errors & Issues

| Widget | Query |
|--------|-------|
| Error Rate Over Time | `sum:llm.gemini.errors{*} by {error_type}.as_count()` |
| Parse Errors (Query Value) | `sum:llm.response.parse_error{*}.as_count()` |

#### Row 6: SLO Status

Add SLO widgets for:
- Path Generation SLO (99%)
- Content Generation SLO (95%)

#### Row 7: Business Metrics

| Widget | Query |
|--------|-------|
| Learning Paths Generated | `sum:oracle.path.generated{*} by {domain}.as_count()` |
| Sessions by Domain (Pie) | `sum:oracle.session.created{*} by {domain}.as_count()` |
| Courses Created | `sum:content.course.created{*}.as_count()` |

---

## 5. Configure Incident Management

Navigate to **Incidents > Settings**

### Create Incident Workflow

1. Go to **Workflows > New Workflow**

2. **Trigger:** When monitor triggers

3. **Actions:**
   - Create incident
   - Notify via Slack/PagerDuty
   - Attach related dashboard

### Incident Template

Configure incident template with:

```yaml
Title: "[LLM] {{monitor.name}} - {{service.name}}"
Severity: SEV-2
Commander: @ai-platform-oncall

Fields:
  - Affected Service: {{service.name}}
  - Environment: {{env}}
  - Trigger Time: {{trigger_time}}
  - Current Value: {{value}}
  - Threshold: {{threshold}}

Related Resources:
  - Dashboard: LLM Application Health Overview
  - Runbook: https://runbooks.internal/llm/{{monitor.id}}

Notifications:
  - @slack-llm-incidents
  - @pagerduty-ai-platform
```

---

## 6. Case Management Setup

For non-critical issues, create cases:

Navigate to **Case Management > Settings**

### Create Case Template

**Project:** LLM Platform

**Fields:**
- Issue Type
- First Seen
- Frequency
- Service
- Operation

**Default Assignee:** @ai-platform-team

---

## 7. Verify Metrics Are Flowing

After deploying the updated code, verify metrics are appearing:

### Check APM Traces

1. Go to **APM > Traces**
2. Filter by `service:oracle` or `service:content-generator`
3. Verify spans have LLM tags:
   - `llm.model`
   - `llm.tokens.input`
   - `llm.tokens.output`
   - `llm.cost.usd`
   - `llm.latency_ms`

### Check Custom Metrics

1. Go to **Metrics > Explorer**
2. Search for:
   - `llm.gemini.request.count`
   - `llm.gemini.request.latency`
   - `llm.gemini.tokens.total`
   - `llm.gemini.cost.usd`
   - `oracle.path.generated`
   - `content.course.created`

### Check Logs

1. Go to **Logs > Search**
2. Filter by `service:oracle` or `service:content-generator`
3. Verify trace IDs are injected

---

## 8. Test Detection Rules

### Simulate High Latency

Add artificial delay to test latency monitor:

```python
import time
time.sleep(15)  # 15 second delay
```

### Simulate Errors

Force an error to test error rate monitor:

```python
raise Exception("Test error for monitoring")
```

### Verify Incident Creation

1. Trigger a monitor alert
2. Verify incident is created automatically
3. Check that context is populated correctly

---

## Quick Reference: Custom Metrics

| Metric | Description | Tags |
|--------|-------------|------|
| `llm.gemini.request.count` | Total LLM API calls | service, operation, model, success |
| `llm.gemini.request.latency` | Request latency (ms) | service, operation, model |
| `llm.gemini.tokens.input` | Input tokens per request | service, operation, model |
| `llm.gemini.tokens.output` | Output tokens per request | service, operation, model |
| `llm.gemini.tokens.total` | Total tokens per request | service, operation, model |
| `llm.gemini.cost.usd` | Estimated cost per request | service, operation, model |
| `llm.gemini.errors` | Error count | service, operation, error_type |
| `llm.gemini.grounding.used` | Google Search grounding usage | service, operation |
| `llm.response.parse_error` | JSON parse failures | service, operation |
| `oracle.session.created` | New learning sessions | domain, experience_level |
| `oracle.path.generated` | Learning paths generated | domain, confidence_tier, status |
| `content.job.started` | Content generation jobs started | generation_type |
| `content.job.duration` | Job processing time (ms) | generation_type, status |
| `content.job.completed` | Jobs completed | generation_type, status |
| `content.course.created` | Courses created | domain, difficulty |

---

## Hackathon Requirements Checklist

| Requirement | Implementation | Status |
|-------------|----------------|--------|
| Vertex AI/Gemini | Gemini 2.0 Flash with Google Search grounding | ✅ |
| Telemetry to Datadog | APM traces, custom metrics, logs | ✅ |
| 3+ Detection Rules | 5 monitors defined (latency, errors, cost, jobs, parse) | ✅ |
| Application Health Dashboard | Comprehensive dashboard with KPIs | ✅ |
| SLOs | 3 SLOs defined | ✅ |
| Actionable Records (Incidents/Cases) | Incident and case templates configured | ✅ |

---

## Support

- Datadog Docs: https://docs.datadoghq.com
- Gemini API Status: https://status.cloud.google.com
- Team Slack: #llm-platform
