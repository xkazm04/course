#!/bin/bash
# Datadog Monitor Creation Script
# Run with: DD_API_KEY=xxx DD_APP_KEY=xxx bash create_monitors.sh

API_KEY="${DD_API_KEY}"
APP_KEY="${DD_APP_KEY}"
BASE_URL="https://api.datadoghq.com/api/v1/monitor"

if [ -z "$API_KEY" ] || [ -z "$APP_KEY" ]; then
    echo "Error: DD_API_KEY and DD_APP_KEY must be set"
    exit 1
fi

echo "Creating Datadog Monitors..."
echo "=============================="

# Monitor 1: LLM Latency Critical
echo "Creating: [LLM] Gemini Response Latency Critical"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[LLM] Gemini Response Latency Critical",
        "type": "metric alert",
        "query": "avg(last_5m):avg:llm.gemini.request.latency{*} > 10000",
        "message": "High LLM Response Latency Detected\n\nCurrent Latency: {{value}} ms\nThreshold: 10,000ms\n\nRunbook:\n1. Check Gemini API status\n2. Review recent deployment changes\n3. Check for prompt complexity increases\n\n@slack-llm-alerts",
        "tags": ["service:llm-observability", "severity:high", "hackathon:datadog"],
        "priority": 2,
        "options": {
            "thresholds": {
                "critical": 10000,
                "warning": 5000
            },
            "notify_no_data": true,
            "no_data_timeframe": 10
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 2: LLM Error Rate
echo "Creating: [LLM] Gemini API Error Rate Elevated"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[LLM] Gemini API Error Rate Elevated",
        "type": "query alert",
        "query": "sum(last_5m):sum:llm.gemini.errors{*}.as_count() > 10",
        "message": "LLM API Error Rate Above Threshold\n\nError Count: {{value}}\n\nRunbook:\n1. Check error breakdown in APM\n2. Review quota in GCP Console\n3. Check Gemini API latency\n\n@slack-llm-alerts",
        "tags": ["service:llm-observability", "severity:critical", "hackathon:datadog"],
        "priority": 1,
        "options": {
            "thresholds": {
                "critical": 10,
                "warning": 5
            },
            "notify_no_data": false
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 3: Content Generation Failure Rate
echo "Creating: [Jobs] Content Generation Failure Rate"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[Jobs] Content Generation Failure Rate",
        "type": "query alert",
        "query": "sum(last_15m):sum:content.job.failed{*}.as_count() > 5",
        "message": "Content Generation Jobs Failing\n\nFailed Jobs: {{value}}\n\nImpact:\n- Users cannot generate course content\n- Map nodes remain without courses\n\nRunbook:\n1. Check job error messages in logs\n2. Review Gemini API response quality\n3. Verify database connectivity\n\n@slack-content-team",
        "tags": ["service:content-generator", "severity:high", "hackathon:datadog"],
        "priority": 2,
        "options": {
            "thresholds": {
                "critical": 5,
                "warning": 3
            },
            "notify_no_data": false
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 4: Project Scanner Failure Rate
echo "Creating: [Project Scanner] Feature Scan Failure Rate"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[Project Scanner] Feature Scan Failure Rate",
        "type": "query alert",
        "query": "sum(last_15m):sum:project.scan.job.failed{*}.as_count() > 3",
        "message": "Project Scanner Failure Rate High\n\nFailed Scans: {{value}}\n\nImpact:\n- Repository analysis jobs failing\n- Feature decomposition not working\n\nRunbook:\n1. Check scan job error messages\n2. Verify GitHub API rate limits\n3. Review Gemini API response quality\n\n@slack-project-scanner",
        "tags": ["service:project-scanner", "severity:high", "hackathon:datadog"],
        "priority": 2,
        "options": {
            "thresholds": {
                "critical": 3,
                "warning": 2
            },
            "notify_no_data": false
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 5: Scan Latency
echo "Creating: [Project Scanner] Scan Latency Critical"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[Project Scanner] Scan Latency Critical",
        "type": "metric alert",
        "query": "avg(last_5m):avg:project.scan.job.duration{*} > 180000",
        "message": "Project Scan Latency Critical\n\nCurrent Latency: {{value}} ms\nThreshold: 180,000ms (3 minutes)\n\nRunbook:\n1. Check GitHub API latency\n2. Review repository complexity\n3. Check Gemini API latency\n\n@slack-project-scanner",
        "tags": ["service:project-scanner", "severity:high", "hackathon:datadog"],
        "priority": 2,
        "options": {
            "thresholds": {
                "critical": 180000,
                "warning": 120000
            },
            "notify_no_data": false
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 6: GitHub Rate Limit
echo "Creating: [Project Scanner] GitHub API Rate Limit Warning"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[Project Scanner] GitHub API Rate Limit Warning",
        "type": "metric alert",
        "query": "avg(last_5m):avg:project.github.rate_limit.remaining{*} < 100",
        "message": "GitHub API Rate Limit Running Low\n\nRemaining Calls: {{value}}\n\nImpact:\n- Repository scanning will fail if exhausted\n- Feature extraction blocked\n\nRunbook:\n1. Pause non-critical scanning jobs\n2. Consider using GitHub App auth for higher limits\n3. Cache repository data\n\n@slack-project-scanner",
        "tags": ["service:project-scanner", "severity:warning", "hackathon:datadog"],
        "priority": 3,
        "options": {
            "thresholds": {
                "critical": 50,
                "warning": 100
            },
            "notify_no_data": true,
            "no_data_timeframe": 15
        }
    }' | jq -r '.id // .errors'
echo ""

# Monitor 7: Assignment Completion Rate
echo "Creating: [Assignments] Low Completion Rate"
curl -s -X POST "$BASE_URL" \
    -H "Content-Type: application/json" \
    -H "DD-API-KEY: ${API_KEY}" \
    -H "DD-APPLICATION-KEY: ${APP_KEY}" \
    -d '{
        "name": "[Assignments] Low Completion Rate",
        "type": "query alert",
        "query": "sum(last_1d):sum:project.assignment.completed{*}.as_count() < 1",
        "message": "Homework Assignment Completion Rate Low\n\nCompleted in 24h: {{value}}\n\nPotential Causes:\n- Assignments too difficult\n- Poor instructions\n- Technical blockers\n\nRunbook:\n1. Review assignment difficulty distribution\n2. Check for common failure points\n3. Analyze hint usage patterns\n\n@slack-learning-team",
        "tags": ["service:project-scanner", "team:learning", "hackathon:datadog"],
        "priority": 3,
        "options": {
            "thresholds": {
                "critical": 0,
                "warning": 1
            },
            "notify_no_data": false
        }
    }' | jq -r '.id // .errors'
echo ""

echo "=============================="
echo "Monitor creation complete!"
echo "Check https://app.datadoghq.com/monitors/manage for results"
