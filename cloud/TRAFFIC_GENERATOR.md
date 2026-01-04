# OpenForge Traffic Generator

A traffic generation tool that demonstrates Datadog detection rules by simulating realistic and problematic traffic patterns against the Oracle and Content Generator services.

## Quick Start

```bash
# Install dependencies
pip install aiohttp

# Run demo mode (demonstrates all detection rules)
python traffic_generator.py --mode demo

# Run against production endpoints
python traffic_generator.py --mode demo \
  --oracle-url https://oracle-xxxxx.run.app \
  --content-url https://content-generator-xxxxx.run.app
```

## Traffic Modes

### Normal Mode
Simulates realistic user traffic that should NOT trigger alerts.

```bash
python traffic_generator.py --mode normal --duration 300
```

**Generates:**
- Oracle path generation requests (40%)
- Oracle session flows (20%)
- Content generation jobs (30%)
- Health checks (10%)

### Stress Mode
High-volume traffic to test system under load.

```bash
python traffic_generator.py --mode stress --requests 100 --concurrency 10
```

**May trigger:**
- `[LLM] Gemini Response Latency Critical` - If LLM slows under load
- `[Cost] LLM Token Spend Anomaly` - High token consumption

### Chaos Mode
Injects errors and slow responses to trigger detection rules.

```bash
python traffic_generator.py --mode chaos --duration 120 --error-rate 0.2 --slow-rate 0.1
```

**Triggers:**
- `[LLM] Gemini API Error Rate Elevated` - Via malformed requests
- `[LLM] Gemini Response Latency Critical` - Via simulated delays
- `[LLM] JSON Parse Errors Elevated` - Via invalid payloads
- `[Jobs] Content Generation Failure Rate` - Via failed jobs

### Latency Spike Mode
Generates requests with artificial delays >10s.

```bash
python traffic_generator.py --mode latency --requests 10
```

**Triggers:**
- `[LLM] Gemini Response Latency Critical` - Threshold: >10,000ms

### Error Burst Mode
Generates a burst of bad requests.

```bash
python traffic_generator.py --mode errors --requests 50
```

**Triggers:**
- `[LLM] Gemini API Error Rate Elevated` - Threshold: >5%
- `[LLM] JSON Parse Errors Elevated` - Threshold: >10 in 10min

### Volume Burst Mode
Generates high volume of requests to trigger cost anomaly.

```bash
python traffic_generator.py --mode volume --requests 200
```

**Triggers:**
- `[Cost] LLM Token Spend Anomaly` - Anomaly detection (3σ)

### Demo Mode (Recommended)
Runs all patterns sequentially for comprehensive demonstration.

```bash
python traffic_generator.py --mode demo
```

**Sequence:**
1. Normal traffic (2 min) - Establish baseline
2. Latency spike - Trigger latency alerts
3. Error burst - Trigger error rate alerts
4. High volume - Trigger cost anomaly
5. Recovery - Show return to normal

## Detection Rules Demonstrated

| Rule | Threshold | How It's Triggered |
|------|-----------|-------------------|
| `[LLM] Gemini Response Latency Critical` | >10,000ms | `--mode latency` or `--mode chaos --slow-rate 0.3` |
| `[LLM] Gemini API Error Rate Elevated` | >5% | `--mode errors` or `--mode chaos --error-rate 0.2` |
| `[Cost] LLM Token Spend Anomaly` | 3σ deviation | `--mode volume --requests 200` |
| `[Jobs] Content Generation Failure Rate` | >10% | `--mode chaos --error-rate 0.2` |
| `[LLM] JSON Parse Errors Elevated` | >10 in 10min | `--mode errors --requests 50` |

## CLI Options

```
--mode          Traffic mode: normal, stress, chaos, latency, errors, volume, demo
--oracle-url    Oracle service URL (default: http://localhost:8080)
--content-url   Content Generator URL (default: http://localhost:8081)
--duration      Duration in seconds for normal/chaos modes (default: 300)
--requests      Number of requests for burst modes (default: 100)
--error-rate    Error injection rate 0-1 for chaos mode (default: 0.2)
--slow-rate     Slow request rate 0-1 for chaos mode (default: 0.1)
--concurrency   Concurrent requests for stress mode (default: 10)
```

## Example Scenarios

### Scenario 1: Hackathon Demo
Show all detection rules in action:

```bash
python traffic_generator.py --mode demo \
  --oracle-url https://oracle-prod.run.app \
  --content-url https://content-generator-prod.run.app
```

Then check Datadog:
1. **Monitors** → See alerts firing
2. **Dashboard** → View "LLM Application Health Overview"
3. **APM** → See traces with LLM tags
4. **Logs** → See correlated logs

### Scenario 2: Load Testing
Test system capacity:

```bash
python traffic_generator.py --mode stress \
  --requests 500 \
  --concurrency 20
```

### Scenario 3: Error Rate Testing
Verify error rate alerting:

```bash
# Generate 20% error rate
python traffic_generator.py --mode chaos \
  --duration 300 \
  --error-rate 0.2 \
  --slow-rate 0
```

### Scenario 4: Continuous Baseline
Run in background to maintain baseline metrics:

```bash
nohup python traffic_generator.py --mode normal --duration 3600 &
```

## Output

The generator prints real-time statistics:

```
2024-12-30 12:00:01 - INFO - ✓ generate: 200 (2341ms)
2024-12-30 12:00:03 - INFO - ✗ generate: 400 (156ms)
2024-12-30 12:00:05 - INFO - ✓ health: 200 (23ms)

--- CHAOS TRAFFIC STATS ---
Total Requests: 100
Successful: 78
Failed: 22 (22.0%)
Avg Latency: 3421ms
Errors by Type: {'HTTP_400': 15, 'HTTP_500': 7}
```

## Viewing Results in Datadog

After running the traffic generator:

1. **Monitors** (`Monitors > Manage Monitors`)
   - Look for triggered alerts
   - Check alert history

2. **Dashboard** (`Dashboards > LLM Application Health Overview`)
   - Request count spikes
   - Latency distribution changes
   - Error rate increases
   - Token usage patterns

3. **APM Traces** (`APM > Traces`)
   - Filter by `service:oracle` or `service:content-generator`
   - Look for spans with `error:true`
   - Check LLM tags on spans

4. **Metrics Explorer** (`Metrics > Explorer`)
   - `llm.gemini.request.latency`
   - `llm.gemini.errors`
   - `llm.gemini.cost.usd`
   - `oracle.path.generated`

5. **Logs** (`Logs > Search`)
   - Filter by service
   - Correlate with trace IDs
