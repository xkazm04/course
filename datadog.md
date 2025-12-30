  New Files:
  | File                           | Purpose                                                            |
  |--------------------------------|--------------------------------------------------------------------|
  | cloud/shared/__init__.py       | Shared module package                                              |
  | cloud/shared/metrics.py        | Custom LLM metrics module (OracleMetrics, ContentGeneratorMetrics) |
  | cloud/datadog/monitors.json    | 5 monitor definitions (API-importable)                             |
  | cloud/datadog/dashboard.json   | Full dashboard configuration                                       |
  | cloud/datadog/setup_datadog.py | Automated setup script                                             |
  | cloud/DATADOG_SETUP.md         | Manual configuration guide                                         |

  Modified Files:
  | File                                     | Changes                                                                   |
  |------------------------------------------|---------------------------------------------------------------------------|
  | cloud/oracle/main.py                     | Added metrics tracking to generate_next_question, generate_learning_paths |
  | cloud/oracle/requirements.txt            | Added datadog>=0.49.0                                                     |
  | cloud/content-generator/main.py          | Added metrics initialization                                              |
  | cloud/content-generator/generator.py     | Added metrics to process_job, _generate_full_course                       |
  | cloud/content-generator/requirements.txt | Added datadog>=0.49.0                                                     |

  Custom Metrics Emitted

  - llm.gemini.request.count - Request counts
  - llm.gemini.request.latency - Latency distribution (ms)
  - llm.gemini.tokens.input/output/total - Token usage
  - llm.gemini.cost.usd - Cost per request
  - llm.gemini.errors - Error counts by type
  - llm.gemini.grounding.used - Google Search grounding usage
  - llm.response.parse_error - JSON parse failures
  - oracle.path.generated - Learning paths created
  - content.job.duration - Job processing time
  - content.course.created - Courses created

  Detection Rules (5 Monitors)

  1. [LLM] Gemini Response Latency Critical - P95 > 10s
  2. [LLM] Gemini API Error Rate Elevated - Error rate > 5%
  3. [Cost] LLM Token Spend Anomaly - Anomaly detection
  4. [Jobs] Content Generation Failure Rate - Failure > 10%
  5. [LLM] JSON Parse Errors Elevated - Parse errors > 10